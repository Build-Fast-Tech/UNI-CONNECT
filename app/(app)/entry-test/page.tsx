"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  ClipboardList, Search, Upload, FileText, Video, BookOpen,
  ChevronDown, X, Building2, Download, Eye, GraduationCap,
  FileQuestion, ListChecks, Layers,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const PdfPreviewModal = dynamic(() => import("@/app/(app)/notes/PdfPreviewModal"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

interface Note {
  id: string;
  title: string;
  subject: string;
  category: string;
  file_url: string | null;
  file_type: string | null;
  department: string | null;
  semester: string | null;
  university_id: string | null;
  created_at: string;
  views: number;
  uploader_id: string;
  profiles?: { full_name: string; avatar_url: string | null } | null;
  universities?: { short_name: string } | null;
}

interface University { id: string; name: string; short_name: string; }

// ── Content type tabs ─────────────────────────────────────────────────────────

const TYPES = [
  { key: "all",        label: "All",          icon: Layers,       color: "text-[rgb(var(--primary))]" },
  { key: "past_paper", label: "Past Papers",  icon: FileQuestion, color: "text-[rgb(var(--warning))]" },
  { key: "notes",      label: "Notes",        icon: BookOpen,     color: "text-[rgb(var(--hue-a))]" },
  { key: "lecture",    label: "Lectures",     icon: Video,        color: "text-[rgb(var(--hue-e))]" },
  { key: "mcqs",       label: "MCQs",         icon: ListChecks,   color: "text-[rgb(var(--success))]" },
  { key: "book",       label: "Books",        icon: FileText,     color: "text-[rgb(var(--hue-d))]" },
  { key: "other",      label: "Other",        icon: Layers,       color: "text-[rgb(var(--muted-fg))]" },
] as const;

const TYPE_KEYS = TYPES.map(t => t.key);
type TypeKey = typeof TYPE_KEYS[number];

// ── Searchable combobox (reused pattern) ─────────────────────────────────────

function UniCombobox({ universities, value, onChange }: { universities: University[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState("");
  const ref             = useRef<HTMLDivElement>(null);
  const selected        = universities.find(u => u.id === value);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = universities.filter(u =>
    u.name.toLowerCase().includes(q.toLowerCase()) || u.short_name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={cn("flex items-center gap-2 h-9 pl-3 pr-2 rounded-xl text-sm border transition-colors min-w-[150px]",
          "bg-[rgb(var(--input))] border-[rgb(var(--border))] hover:border-[rgb(var(--primary)/0.4)]",
          value && "border-[rgb(var(--primary)/0.5)] text-[rgb(var(--primary))]")}>
        <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-[rgb(var(--muted-fg))]" />
        <span className="flex-1 text-left truncate">{selected ? selected.short_name : "University"}</span>
        {value
          ? <X className="w-3 h-3 flex-shrink-0" onClick={e => { e.stopPropagation(); onChange(""); setQ(""); }} />
          : <ChevronDown className="w-3 h-3 flex-shrink-0 text-[rgb(var(--muted-fg))]" />}
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-64 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-[rgb(var(--border))]">
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
              className="w-full bg-[rgb(var(--muted))] rounded-xl px-3 py-1.5 text-sm outline-none placeholder:text-[rgb(var(--muted-fg))]" />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            <button onClick={() => { onChange(""); setOpen(false); setQ(""); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">All universities</button>
            {filtered.map(u => (
              <button key={u.id} onClick={() => { onChange(u.id); setOpen(false); setQ(""); }}
                className={cn("w-full px-3 py-2 text-left text-sm hover:bg-[rgb(var(--muted))]", value === u.id && "text-[rgb(var(--primary))] font-medium")}>
                {u.short_name} — {u.name}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-3 text-sm text-[rgb(var(--muted-fg))] text-center">No match</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Upload modal ──────────────────────────────────────────────────────────────

function UploadModal({ universities, onClose, onUploaded }: {
  universities: University[];
  onClose: () => void;
  onUploaded: () => void;
}) {
  const supabase = createClient();
  const fileRef  = useRef<HTMLInputElement>(null);
  const [file,       setFile]       = useState<File | null>(null);
  const [title,      setTitle]      = useState("");
  const [subject,    setSubject]    = useState("");
  const [department, setDepartment] = useState("");
  const [uniId,      setUniId]      = useState("");
  const [year,       setYear]       = useState("");
  const [category,   setCategory]   = useState<string>("past_paper");
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState("");

  const years = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i));

  const submit = async () => {
    if (!file || !title.trim() || !subject.trim() || !uniId) {
      setError("File, title, subject and university are required."); return;
    }
    setUploading(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not logged in."); setUploading(false); return; }
      const ext  = file.name.split(".").pop();
      const path = `entry-test/${user.id}/${Date.now()}.${ext}`;
      const { data: up, error: upErr } = await supabase.storage.from("notes").upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) { setError("Upload failed: " + upErr.message); setUploading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("notes").getPublicUrl(up.path);
      await (supabase.from("notes") as any).insert({
        title: title.trim(),
        subject: subject.trim(),
        department: department.trim() || null,
        university_id: uniId,
        category,
        semester: year || null,
        file_url: publicUrl,
        file_type: file.type,
        uploader_id: user.id,
        is_entry_test: true,
      });
      onUploaded();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-md bg-[rgb(var(--card))] rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Upload Entry Test Material</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]"><X className="w-4 h-4" /></button>
        </div>

        {/* File drop */}
        <div onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[rgb(var(--border))] rounded-2xl p-6 text-center cursor-pointer hover:border-[rgb(var(--primary)/0.4)] transition-colors">
          <input ref={fileRef} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.png,.jpg,.jpeg,.zip"
            onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
          {file
            ? <p className="text-sm font-medium truncate">{file.name}</p>
            : <>
                <Upload className="w-7 h-7 text-[rgb(var(--muted-fg))] mx-auto mb-2" />
                <p className="text-sm text-[rgb(var(--muted-fg))]">Click to select file</p>
                <p className="text-[11px] text-[rgb(var(--muted-fg))] mt-0.5">PDF, Word, PPT, Video, Image, ZIP</p>
              </>}
        </div>

        {/* Type */}
        <div>
          <label className="text-xs font-semibold text-[rgb(var(--muted-fg))] mb-1.5 block">Content Type</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.filter(t => t.key !== "all").map(t => (
              <button key={t.key} onClick={() => setCategory(t.key)}
                className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                  category === t.key
                    ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] border-transparent"
                    : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]")}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fields */}
        {[
          { label: "Title *", value: title,      set: setTitle,      placeholder: "e.g. FAST Entry Test 2023" },
          { label: "Subject *", value: subject,  set: setSubject,    placeholder: "e.g. Mathematics, Physics" },
          { label: "Department", value: department, set: setDepartment, placeholder: "e.g. CS, EE, Business" },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label}>
            <label className="text-xs font-semibold text-[rgb(var(--muted-fg))] mb-1.5 block">{label}</label>
            <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
              className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[rgb(var(--primary))]" />
          </div>
        ))}

        {/* University */}
        <div>
          <label className="text-xs font-semibold text-[rgb(var(--muted-fg))] mb-1.5 block">University *</label>
          <select value={uniId} onChange={e => setUniId(e.target.value)}
            className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[rgb(var(--primary))]">
            <option value="">Select university</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.short_name} — {u.name}</option>)}
          </select>
        </div>

        {/* Year */}
        <div>
          <label className="text-xs font-semibold text-[rgb(var(--muted-fg))] mb-1.5 block">Year</label>
          <select value={year} onChange={e => setYear(e.target.value)}
            className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[rgb(var(--primary))]">
            <option value="">Select year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {error && <p className="text-xs text-[rgb(var(--destructive))]">{error}</p>}

        <button onClick={submit} disabled={uploading}
          className="w-full py-3 rounded-2xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-bold disabled:opacity-50 transition-opacity">
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
    </div>
  );
}

// ── Content card ──────────────────────────────────────────────────────────────

function ContentCard({ note, onView }: { note: Note; onView: (n: Note) => void }) {
  const typeInfo = TYPES.find(t => t.key === note.category) ?? TYPES[0];
  const Icon     = typeInfo.icon;
  const isVideo  = note.file_type?.startsWith("video/");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="theme-card p-4 flex flex-col gap-3 hover:border-[rgb(var(--primary)/0.3)] transition-all duration-200 h-full">
        {/* Type badge + uni */}
        <div className="flex items-center justify-between gap-2">
          <span className={cn("flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg bg-[rgb(var(--muted))]", typeInfo.color)}>
            <Icon className="w-3 h-3" />
            {typeInfo.label}
          </span>
          {note.universities && (
            <span className="text-[10px] text-[rgb(var(--primary))] font-medium truncate">{note.universities.short_name}</span>
          )}
        </div>

        {/* Title */}
        <div className="flex-1">
          <p className="text-sm font-semibold leading-snug line-clamp-2">{note.title}</p>
          <p className="text-[11px] text-[rgb(var(--muted-fg))] mt-0.5">{note.subject}</p>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 text-[10px] text-[rgb(var(--muted-fg))]">
          {note.department && (
            <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{note.department}</span>
          )}
          {note.semester && (
            <span className="px-1.5 py-0.5 rounded bg-[rgb(var(--muted))]">{note.semester}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-[rgb(var(--border))]">
          <span className="text-[10px] text-[rgb(var(--muted-fg))] flex items-center gap-1 flex-1">
            <Eye className="w-3 h-3" />{note.views ?? 0}
          </span>
          {note.file_url && !isVideo && (
            <button onClick={() => onView(note)}
              className="flex items-center gap-1 text-xs text-[rgb(var(--primary))] hover:underline font-medium">
              <Eye className="w-3.5 h-3.5" /> View
            </button>
          )}
          {note.file_url && (
            <a href={note.file_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors">
              <Download className="w-3.5 h-3.5" />
              {isVideo ? "Watch" : "Download"}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EntryTestPage() {
  const supabase = createClient();

  const [notes,        setNotes]        = useState<Note[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments,  setDepartments]  = useState<string[]>([]);
  const [subjects,     setSubjects]     = useState<string[]>([]);
  const [loading,      setLoading]      = useState(true);

  const [activeType,   setActiveType]   = useState<TypeKey>("all");
  const [uniFilter,    setUniFilter]    = useState("");
  const [deptFilter,   setDeptFilter]   = useState("");
  const [subjectFilter,setSubjectFilter]= useState("");
  const [yearFilter,   setYearFilter]   = useState("");
  const [search,       setSearch]       = useState("");

  const [showUpload,   setShowUpload]   = useState(false);
  const [previewNote,  setPreviewNote]  = useState<Note | null>(null);

  const years = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i));

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("notes")
      .select("*, profiles!uploader_id(full_name, avatar_url), universities!university_id(short_name)")
      .eq("is_entry_test", true)
      .order("created_at", { ascending: false })
      .limit(200);

    if (activeType !== "all") q = q.eq("category", activeType);
    if (uniFilter)            q = q.eq("university_id", uniFilter);
    if (deptFilter)           q = q.eq("department", deptFilter);
    if (subjectFilter)        q = q.eq("subject", subjectFilter);
    if (yearFilter)           q = q.eq("semester", yearFilter);
    if (search.trim())        q = q.ilike("title", `%${search.trim()}%`);

    const { data } = await q;
    setNotes((data as Note[]) ?? []);
    setLoading(false);
  }, [activeType, uniFilter, deptFilter, subjectFilter, yearFilter, search]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    Promise.all([
      supabase.from("universities").select("id, name, short_name").order("short_name"),
      (supabase as any).from("notes").select("department").eq("is_entry_test", true).not("department", "is", null),
      (supabase as any).from("notes").select("subject").eq("is_entry_test", true),
    ]).then(([unis, depts, subs]) => {
      setUniversities((unis.data as University[]) ?? []);
      const uniqueDepts = [...new Set(((depts.data ?? []) as { department: string }[]).map(r => r.department))].sort();
      setDepartments(uniqueDepts);
      const uniqueSubs  = [...new Set(((subs.data  ?? []) as { subject: string  }[]).map(r => r.subject ))].sort();
      setSubjects(uniqueSubs);
    });
  }, []);

  const activeFilters = [uniFilter, deptFilter, subjectFilter, yearFilter, search.trim()].filter(Boolean).length;

  const clearAll = () => { setUniFilter(""); setDeptFilter(""); setSubjectFilter(""); setYearFilter(""); setSearch(""); };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgb(var(--primary)), rgb(var(--accent)))",
              }}
            >
              <ClipboardList className="w-4 h-4" style={{ color: "rgb(var(--primary-fg))" }} />
            </div>
            <h1 className="text-2xl font-bold">Entry Test Prep</h1>
          </div>
          <p className="text-sm text-[rgb(var(--muted-fg))]">
            Past papers, notes, lectures and MCQs for university entry tests — sorted by university, department, subject and year.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <Upload className="w-4 h-4" /> Upload Material
        </button>
      </motion.div>

      {/* Type tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TYPES.map(t => {
          const Icon = t.icon;
          const active = activeType === t.key;
          return (
            <button key={t.key} onClick={() => setActiveType(t.key as TypeKey)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border flex-shrink-0",
                active
                  ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] border-transparent shadow-sm"
                  : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              )}>
              <Icon className={cn("w-4 h-4", active ? "text-[rgb(var(--primary-fg))]" : t.color)} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* University */}
        <UniCombobox universities={universities} value={uniFilter} onChange={setUniFilter} />

        {/* Department */}
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="h-9 pl-3 pr-8 rounded-xl text-sm border bg-[rgb(var(--input))] border-[rgb(var(--border))] focus:outline-none focus:border-[rgb(var(--primary)/0.5)] appearance-none"
          style={{ backgroundImage: "none" }}>
          <option value="">All departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Subject */}
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
          className="h-9 pl-3 pr-8 rounded-xl text-sm border bg-[rgb(var(--input))] border-[rgb(var(--border))] focus:outline-none focus:border-[rgb(var(--primary)/0.5)] appearance-none"
          style={{ backgroundImage: "none" }}>
          <option value="">All subjects</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Year */}
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
          className="h-9 pl-3 pr-8 rounded-xl text-sm border bg-[rgb(var(--input))] border-[rgb(var(--border))] focus:outline-none focus:border-[rgb(var(--primary)/0.5)] appearance-none"
          style={{ backgroundImage: "none" }}>
          <option value="">All years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--muted-fg))]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title…"
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] focus:outline-none focus:border-[rgb(var(--primary)/0.5)]" />
        </div>

        {activeFilters > 0 && (
          <button onClick={clearAll}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))] transition-colors">
            <X className="w-3 h-3" /> Clear ({activeFilters})
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgb(var(--muted-fg))]">
          {loading ? "Loading…" : `${notes.length} item${notes.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="theme-card p-4 h-44 animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="theme-card p-16 text-center">
          <ClipboardList className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-40" />
          <p className="font-semibold mb-1">No material found</p>
          <p className="text-sm text-[rgb(var(--muted-fg))] mb-4">
            {activeFilters > 0 ? "Try clearing some filters." : "Be the first to upload entry test material!"}
          </p>
          <button onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-medium hover:opacity-90 transition-opacity">
            <Upload className="w-4 h-4" /> Upload Material
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map(n => <ContentCard key={n.id} note={n} onView={setPreviewNote} />)}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          universities={universities}
          onClose={() => setShowUpload(false)}
          onUploaded={fetchNotes}
        />
      )}

      {/* PDF preview */}
      {previewNote?.file_url && (
        <PdfPreviewModal
          note={{ title: previewNote.title, file_url: previewNote.file_url, file_type: previewNote.file_type }}
          onClose={() => setPreviewNote(null)}
        />
      )}
    </div>
  );
}
