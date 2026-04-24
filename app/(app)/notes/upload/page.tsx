"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, X, CheckCircle, AlertCircle,
  BookOpen, ArrowLeft, CloudUpload,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn, mergeSubjects } from "@/lib/utils";

const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const CATEGORIES = [
  { value: "notes",      label: "Notes" },
  { value: "quiz",       label: "Quiz" },
  { value: "assignment", label: "Assignment" },
  { value: "sessional1", label: "Sessional I" },
  { value: "sessional2", label: "Sessional II" },
  { value: "final",      label: "Final Exam" },
  { value: "textbook",   label: "Textbook / Solution" },
  { value: "other",      label: "Other" },
];

const CURRENT_YEAR = new Date().getFullYear();
const EARLIEST_YEAR = 2000;
const YEARS = Array.from(
  { length: CURRENT_YEAR - EARLIEST_YEAR + 1 },
  (_, i) => CURRENT_YEAR - i,
);

const NO_YEAR_REQUIRED = ["textbook", "other"];
const MAX_SIZE  = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
];
const ALLOWED_EXT = [".pdf", ".docx", ".pptx", ".zip"];

export default function UploadNotePage() {
  const router  = useRouter();
  const supabase = createClient();
  const dropRef  = useRef<HTMLDivElement>(null);

  const [subjects,  setSubjects]  = useState<string[]>([]);
  const [uniName,   setUniName]   = useState("");
  const [uniId,     setUniId]     = useState<string | null>(null);

  // form fields
  const [title,      setTitle]      = useState("");
  const [description,setDescription]= useState("");
  const [subject,    setSubject]    = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [semester,   setSemester]   = useState("");
  const [year,       setYear]       = useState<string>(String(CURRENT_YEAR));
  const [category,   setCategory]   = useState("notes");
  const [file,       setFile]       = useState<File | null>(null);

  // upload state
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);
  const [noteId,    setNoteId]    = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: subjectsData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("university_id, universities(name)")
          .eq("id", user.id)
          .single(),
        supabase.from("subjects").select("name").order("name"),
      ]);

      if (profile?.university_id) {
        setUniId(profile.university_id);
        const uni = (profile as { universities?: { name: string } | null }).universities;
        setUniName(uni?.name || "");
      }
      setSubjects(mergeSubjects((subjectsData || []).map(s => s.name)));
    })();
  }, []);

  const validateFile = (f: File): string => {
    if (f.size > MAX_SIZE) return "File too large (max 50 MB).";
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return "Only PDF, DOCX, PPTX, and ZIP files are allowed.";
    return "";
  };

  const handleFileSelect = (f: File) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError("");
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setError("");

    const finalSubject = subject === "__custom__" ? customSubject.trim() : subject;
    const yearRequired = !NO_YEAR_REQUIRED.includes(category);
    if (!title.trim())               { setError("Title is required."); return; }
    if (!finalSubject)               { setError("Subject is required."); return; }
    if (yearRequired && !year)       { setError("Year is required."); return; }

    setUploading(true);
    setProgress(10);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated."); setUploading(false); return; }

    // Upload file to Supabase Storage
    const ext      = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    setProgress(30);

    const { error: storageErr } = await supabase.storage
      .from("notes")
      .upload(filePath, file, { contentType: file.type, upsert: false });

    if (storageErr) {
      setError(storageErr.message);
      setUploading(false);
      return;
    }

    setProgress(70);

    const { data: urlData } = supabase.storage.from("notes").getPublicUrl(filePath);

    // Insert note record
    const { data: note, error: dbErr } = await (supabase as any)
      .from("notes")
      .insert({
        uploader_id:     user.id,
        title:           title.trim(),
        description:     description.trim() || null,
        subject:         finalSubject,
        course_code:     courseCode.trim() || null,
        semester:        semester || null,
        year:            year ? parseInt(year) : null,
        category:        category,
        university_id:   uniId,
        file_url:        urlData.publicUrl,
        file_type:       file.type,
        file_size_bytes: file.size,
        status:          "published",
      })
      .select()
      .single();

    setProgress(100);

    if (dbErr) {
      setError(dbErr.message);
      setUploading(false);
      return;
    }

    setNoteId(note.id);
    setDone(true);
    setUploading(false);
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="theme-card p-10 text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-[rgb(var(--success)/0.15)] flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-[rgb(var(--success))]" />
          </div>
          <h2 className="text-2xl font-bold">Notes uploaded!</h2>
          <p className="text-sm text-[rgb(var(--muted-fg))]">
            Your notes are now live and discoverable by students across Pakistan.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="md" className="flex-1" onClick={() => router.push("/notes")}>
              Browse notes
            </Button>
            <Button variant="primary" size="md" className="flex-1" onClick={() => router.push(`/notes/${noteId}`)}>
              View your note
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/notes"
          className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to notes
        </Link>
        <h1 className="text-2xl font-bold mb-1">Upload notes</h1>
        <p className="text-sm text-[rgb(var(--muted-fg))]">
          Share your notes with students across Pakistan. PDF, DOCX, PPTX or ZIP — max 50 MB.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="theme-card p-6 space-y-5"
      >
        {/* Drop zone */}
        <div
          ref={dropRef}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
            dragging
              ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.05)]"
              : file
              ? "border-[rgb(var(--success)/0.5)] bg-[rgb(var(--success)/0.05)]"
              : "border-[rgb(var(--border))] hover:border-[rgb(var(--primary)/0.5)]"
          )}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx,.pptx,.zip"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />

          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-xl bg-[rgb(var(--success)/0.15)] flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[rgb(var(--success))]" />
                </div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-[rgb(var(--muted-fg))]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="flex items-center gap-1 text-xs text-[rgb(var(--destructive))] hover:underline mt-1"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <CloudUpload className="w-10 h-10 text-[rgb(var(--muted-fg))]" />
                <p className="text-sm font-medium">Drop file here or click to browse</p>
                <p className="text-xs text-[rgb(var(--muted-fg))]">PDF · DOCX · PPTX · ZIP — max 50 MB</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Title <span className="text-[rgb(var(--destructive))]">*</span></label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Complete Data Structures Notes — Midterm"
            maxLength={120}
            className={cn(
              "w-full h-11 px-4 rounded-xl text-sm",
              "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
              "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
              "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
            )}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What topics are covered? Any useful context for other students…"
            rows={2}
            maxLength={400}
            className={cn(
              "w-full px-4 py-3 rounded-xl text-sm resize-none",
              "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
              "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
              "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
            )}
          />
        </div>

        {/* Subject + Course Code */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Subject <span className="text-[rgb(var(--destructive))]">*</span></label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className={cn(
                "w-full h-11 px-3 rounded-xl text-sm",
                "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                "text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
              )}
            >
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="__custom__">Other (type below)</option>
            </select>
            {subject === "__custom__" && (
              <input
                type="text"
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                placeholder="Enter subject name"
                className={cn(
                  "w-full h-9 px-3 rounded-lg text-sm mt-2",
                  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                  "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                )}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Course code</label>
            <input
              type="text"
              value={courseCode}
              onChange={e => setCourseCode(e.target.value)}
              placeholder="e.g. CS-201"
              className={cn(
                "w-full h-11 px-4 rounded-xl text-sm",
                "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
              )}
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">Category <span className="text-[rgb(var(--destructive))]">*</span></label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                  category === c.value
                    ? "bg-[rgb(var(--primary))] text-white border-transparent"
                    : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Year + Semester + University */}
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Year */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Year {!NO_YEAR_REQUIRED.includes(category) && <span className="text-[rgb(var(--destructive))]">*</span>}
            </label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className={cn(
                "w-full h-11 px-3 rounded-xl text-sm",
                "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                "text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
              )}
            >
              {NO_YEAR_REQUIRED.includes(category) && <option value="">N/A</option>}
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Semester</label>
            <select
              value={semester}
              onChange={e => setSemester(e.target.value)}
              className={cn(
                "w-full h-11 px-3 rounded-xl text-sm",
                "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                "text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
              )}
            >
              <option value="">Select semester</option>
              {SEMESTERS.map(s => <option key={s} value={s}>{s} Semester</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">University</label>
            <div className={cn(
              "w-full h-11 px-4 rounded-xl text-sm flex items-center gap-2",
              "bg-[rgb(var(--muted)/0.5)] border border-[rgb(var(--border))]",
              "text-[rgb(var(--muted-fg))]"
            )}>
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{uniName || "No university set"}</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.1)] px-4 py-3 rounded-xl"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Progress bar */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="h-1.5 bg-[rgb(var(--muted))] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[rgb(var(--primary))] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="text-xs text-[rgb(var(--muted-fg))] text-center">Uploading… {progress}%</p>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!file || !title.trim()}
          loading={uploading}
          onClick={handleUpload}
        >
          <Upload className="w-4 h-4" /> Upload notes
        </Button>
      </motion.div>
    </div>
  );
}
