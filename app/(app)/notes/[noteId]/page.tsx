"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import {
  Download, ExternalLink, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck,
  Share2, Flag, ArrowLeft, FileText, User,
  Calendar, GraduationCap, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Bot, Pencil, X, Check, Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";
import { UserHoverCard } from "@/components/ui/UserHoverCard";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Note = Database["public"]["Tables"]["notes"]["Row"] & {
  profiles?: { id: string; full_name: string; avatar_url: string | null } | null;
  universities?: { short_name: string; slug: string } | null;
};

export default function NoteDetailPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [note,       setNote]       = useState<Note | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [userId,     setUserId]     = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [userVote,   setUserVote]   = useState<1 | -1 | 0>(0);
  const [upvotes,    setUpvotes]    = useState(0);

  // Edit state
  const [editing,     setEditing]    = useState(false);
  const [editTitle,   setEditTitle]  = useState("");
  const [editDesc,    setEditDesc]   = useState("");
  const [editSubject, setEditSubject]= useState("");
  const [editCourse,  setEditCourse] = useState("");
  const [editSemester,setEditSemester]=useState("");
  const [saving,      setSaving]     = useState(false);

  // PDF viewer state
  const [numPages,   setNumPages]   = useState<number>(0);
  const [pageNum,    setPageNum]    = useState(1);
  const [scale,      setScale]      = useState(1.0);
  const [pdfError,   setPdfError]   = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: { user } }, noteRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("notes").select("*").eq("id", noteId).single(),
      ]);

      let noteData: any = noteRes.data;
      if (!noteData) { setLoading(false); return; }

      // Fetch related data separately to avoid FK join failures
      const [uploaderRes, uniRes] = await Promise.all([
        noteData.uploader_id
          ? supabase.from("profiles").select("id, full_name, avatar_url").eq("id", noteData.uploader_id).single()
          : Promise.resolve({ data: null }),
        noteData.university_id
          ? supabase.from("universities").select("short_name, slug").eq("id", noteData.university_id).single()
          : Promise.resolve({ data: null }),
      ]);
      noteData = { ...noteData, profiles: uploaderRes.data, universities: uniRes.data };
      setNote(noteData);
      setUpvotes(noteData.upvotes);
      setUserId(user?.id || null);

      if (user) {
        const [{ data: bm }, { data: vote }] = await Promise.all([
          supabase.from("bookmarks").select("*").eq("user_id", user.id).eq("note_id", noteId).maybeSingle(),
          supabase.from("votes").select("vote").eq("user_id", user.id).eq("note_id", noteId).maybeSingle(),
        ]);
        setBookmarked(!!bm);
        setUserVote((vote?.vote as 1 | -1) || 0);
      }

      // increment download count on view (proxy for interest)
      setLoading(false);
    })();
  }, [noteId]);

  const handleVote = async (v: 1 | -1) => {
    if (!userId || !note) return;
    const newVote = userVote === v ? 0 : v;

    if (userVote === 0) {
      await supabase.from("votes").insert({ user_id: userId, note_id: noteId, vote: v });
      await supabase.from("notes").update({ upvotes: note.upvotes + (v === 1 ? 1 : 0), downvotes: note.downvotes + (v === -1 ? 1 : 0) }).eq("id", noteId);
      setUpvotes(prev => prev + (v === 1 ? 1 : 0));
    } else if (newVote === 0) {
      await supabase.from("votes").delete().eq("user_id", userId).eq("note_id", noteId);
      await supabase.from("notes").update({ upvotes: note.upvotes - (userVote === 1 ? 1 : 0), downvotes: note.downvotes - (userVote === -1 ? 1 : 0) }).eq("id", noteId);
      setUpvotes(prev => prev - (userVote === 1 ? 1 : 0));
    } else {
      await supabase.from("votes").update({ vote: newVote }).eq("user_id", userId).eq("note_id", noteId);
      const delta = v === 1 ? 1 : -1;
      await supabase.from("notes").update({ upvotes: note.upvotes + (delta > 0 ? 1 : -1), downvotes: note.downvotes + (delta < 0 ? 1 : -1) }).eq("id", noteId);
      setUpvotes(prev => prev + (delta > 0 ? 1 : 0));
    }
    setUserVote(newVote as 1 | -1 | 0);
  };

  const handleBookmark = async () => {
    if (!userId || !note) return;
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", userId).eq("note_id", noteId);
    } else {
      await supabase.from("bookmarks").insert({ user_id: userId, note_id: noteId });
    }
    setBookmarked(b => !b);
  };

  const handleDownload = async () => {
    if (!note) return;
    await supabase.from("notes").update({ downloads: note.downloads + 1 }).eq("id", noteId);
    window.open(note.file_url, "_blank");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const handleDeleteNote = async () => {
    if (!note || !userId || note.uploader_id !== userId) return;
    if (!confirm("Delete this note? This cannot be undone.")) return;
    await supabase.from("notes").delete().eq("id", noteId).eq("uploader_id", userId);
    router.push("/notes");
  };

  const openEdit = () => {
    if (!note) return;
    setEditTitle(note.title);
    setEditDesc(note.description || "");
    setEditSubject(note.subject);
    setEditCourse(note.course_code || "");
    setEditSemester(note.semester || "");
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!note || !editTitle.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("notes")
      .update({
        title:       editTitle.trim(),
        description: editDesc.trim() || null,
        subject:     editSubject.trim(),
        course_code: editCourse.trim() || null,
        semester:    editSemester || null,
      })
      .eq("id", noteId);
    setSaving(false);
    if (!error) {
      setNote(n => n ? {
        ...n,
        title:       editTitle.trim(),
        description: editDesc.trim() || null,
        subject:     editSubject.trim(),
        course_code: editCourse.trim() || null,
        semester:    editSemester || null,
      } : n);
      setEditing(false);
    }
  };

  const isPDF = note?.file_type?.includes("pdf");

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="theme-card h-48 animate-pulse" />
        <div className="theme-card h-96 animate-pulse" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="theme-card p-16 text-center">
          <FileText className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
          <p className="text-[rgb(var(--muted-fg))]">Note not found.</p>
          <Link href="/notes" className="mt-4 inline-flex items-center gap-2 text-sm text-[rgb(var(--primary))] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/notes"
        className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All notes
      </Link>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Left: preview */}
        <div className="space-y-4">
          {/* PDF viewer */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="theme-card overflow-hidden"
          >
            {/* Toolbar — PDF only */}
            {isPDF && !pdfError && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border))]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPageNum(p => Math.max(1, p - 1))}
                    disabled={pageNum <= 1}
                    className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[rgb(var(--muted-fg))]">
                    {pageNum} / {numPages || "…"}
                  </span>
                  <button
                    onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
                    disabled={pageNum >= numPages}
                    className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                    className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[rgb(var(--muted-fg))] w-12 text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={() => setScale(s => Math.min(2.5, s + 0.25))}
                    className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Viewer */}
            <div className={cn(
              "overflow-auto bg-[rgb(var(--muted)/0.3)]",
              isPDF && !pdfError ? "min-h-[600px]" : "min-h-64 flex items-center justify-center p-4"
            )}>
              {isPDF && !pdfError ? (
                <div className="flex items-center justify-center p-4">
                  <Document
                    file={note.file_url}
                    onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                    onLoadError={() => setPdfError(true)}
                    loading={
                      <div className="flex flex-col items-center gap-3 py-12">
                        <div className="w-8 h-8 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-[rgb(var(--muted-fg))]">Loading PDF…</p>
                      </div>
                    }
                  >
                    <Page pageNumber={pageNum} scale={scale} renderTextLayer renderAnnotationLayer />
                  </Document>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12">
                  <FileText className="w-16 h-16 text-[rgb(var(--muted-fg))]" />
                  <p className="text-sm font-medium">{note.title}</p>
                  <p className="text-xs text-[rgb(var(--muted-fg))]">
                    {isPDF ? "PDF preview unavailable" : "In-browser preview isn't available for this file type"}
                  </p>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity mt-2"
                  >
                    <Download className="w-4 h-4" /> Open / Download
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right: metadata + actions */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-4"
        >
          {/* Info card */}
          <div className="theme-card p-5 space-y-4">
            <div>
              <h1 className="text-lg font-bold leading-snug mb-2">{note.title}</h1>
              {note.description && (
                <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed">{note.description}</p>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[rgb(var(--muted-fg))]">
                <BookmarkCheck className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-[rgb(var(--fg))]">{note.subject}</span>
              </div>
              {note.course_code && (
                <div className="flex items-center gap-2 text-[rgb(var(--muted-fg))]">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  {note.course_code}
                </div>
              )}
              {note.semester && (
                <div className="flex items-center gap-2 text-[rgb(var(--muted-fg))]">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  {note.semester} Semester
                </div>
              )}
              {note.universities && (
                <div className="flex items-center gap-2 text-[rgb(var(--muted-fg))]">
                  <GraduationCap className="w-4 h-4 flex-shrink-0" />
                  <Link
                    href={`/universities/${note.universities.slug}`}
                    className="text-[rgb(var(--primary))] hover:underline"
                  >
                    {note.universities.short_name}
                  </Link>
                </div>
              )}
              {note.profiles && (
                <div className="flex items-center gap-2 text-[rgb(var(--muted-fg))]">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <UserHoverCard
                    userId={note.profiles.id}
                    name={note.profiles.full_name}
                    avatarUrl={note.profiles.avatar_url}
                    myId={userId}
                  >
                    <span className="hover:text-[rgb(var(--fg))] transition-colors cursor-pointer">
                      {note.profiles.full_name}
                    </span>
                  </UserHoverCard>
                </div>
              )}
              {note.file_size_bytes && (
                <div className="flex items-center gap-2 text-[rgb(var(--muted-fg))]">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  {(note.file_size_bytes / 1024 / 1024).toFixed(1)} MB
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 pt-1 text-sm text-[rgb(var(--muted-fg))]">
              <span className="flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4" /> {upvotes}
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="w-4 h-4" /> {note.downloads}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="theme-card p-4 space-y-2.5">
            {/* View in browser */}
            <a
              href={note.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" /> View
            </a>

            {/* Download */}
            <a
              href={note.file_url}
              download
              onClick={() => note && supabase.from("notes").update({ downloads: note.downloads + 1 }).eq("id", noteId)}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--fg))] text-sm font-semibold hover:bg-[rgb(var(--muted))] transition-colors"
            >
              <Download className="w-4 h-4" /> Download
            </a>

            {/* Vote */}
            <div className="flex gap-2">
              <button
                onClick={() => handleVote(1)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium border transition-all duration-200",
                  userVote === 1
                    ? "bg-[rgb(var(--success)/0.15)] border-[rgb(var(--success)/0.4)] text-[rgb(var(--success))]"
                    : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
                )}
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Upvote
              </button>
              <button
                onClick={() => handleVote(-1)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium border transition-all duration-200",
                  userVote === -1
                    ? "bg-[rgb(var(--destructive)/0.15)] border-[rgb(var(--destructive)/0.4)] text-[rgb(var(--destructive))]"
                    : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
                )}
              >
                <ThumbsDown className="w-3.5 h-3.5" /> Downvote
              </button>
            </div>

            {/* Bookmark + Share */}
            <div className="flex gap-2">
              <button
                onClick={handleBookmark}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium border transition-all duration-200",
                  bookmarked
                    ? "bg-[rgb(var(--accent)/0.15)] border-[rgb(var(--accent)/0.4)] text-[rgb(var(--accent))]"
                    : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
                )}
              >
                {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                {bookmarked ? "Saved" : "Save"}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium border border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>

            {/* Ask AI */}
            <Link href={`/ai?note=${noteId}`} className="block">
              <button className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-medium border border-[rgb(var(--primary)/0.3)] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.08)] transition-colors">
                <Bot className="w-3.5 h-3.5" /> Ask AI about this note
              </button>
            </Link>

            {/* Edit / Delete (uploader only) */}
            {userId && note.uploader_id === userId && (
              <div className="flex gap-2">
                <button
                  onClick={openEdit}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors border border-[rgb(var(--border))]"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={handleDeleteNote}
                  className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs text-[rgb(var(--destructive))] hover:bg-red-500/10 transition-colors border border-[rgb(var(--border))]"
                  title="Delete note"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Report */}
            <button className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--destructive))] transition-colors">
              <Flag className="w-3 h-3" /> Report
            </button>
          </div>
        </motion.div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Edit note details</h2>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1">Title *</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  maxLength={120}
                  className="w-full h-10 px-3 rounded-xl text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={3}
                  maxLength={400}
                  className="w-full px-3 py-2 rounded-xl text-sm resize-none bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1">Subject</label>
                  <input
                    value={editSubject}
                    onChange={e => setEditSubject(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1">Course code</label>
                  <input
                    value={editCourse}
                    onChange={e => setEditCourse(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1">Semester</label>
                <select
                  value={editSemester}
                  onChange={e => setEditSemester(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                >
                  <option value="">No semester</option>
                  {["1st","2nd","3rd","4th","5th","6th","7th","8th"].map(s => (
                    <option key={s} value={s}>{s} Semester</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 h-10 rounded-xl text-sm font-medium border border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editTitle.trim()}
                className="flex-1 h-10 rounded-xl text-sm font-semibold bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-[rgb(var(--primary-fg))] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Check className="w-4 h-4" /> Save</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
