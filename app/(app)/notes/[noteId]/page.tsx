"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import {
  Download, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck,
  Share2, Flag, ArrowLeft, FileText, User,
  Calendar, GraduationCap, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Bot,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

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

  // PDF viewer state
  const [numPages,   setNumPages]   = useState<number>(0);
  const [pageNum,    setPageNum]    = useState(1);
  const [scale,      setScale]      = useState(1.0);
  const [pdfError,   setPdfError]   = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: { user } }, { data: noteData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("notes")
          .select("*, profiles!uploader_id(id, full_name, avatar_url), universities!university_id(short_name, slug)")
          .eq("id", noteId)
          .single(),
      ]);

      if (!noteData) { setLoading(false); return; }
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
            {/* Toolbar */}
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

            {/* PDF or fallback */}
            <div className="min-h-64 flex items-center justify-center overflow-auto bg-[rgb(var(--muted)/0.3)] p-4">
              {isPDF && !pdfError ? (
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
                  <Page
                    pageNumber={pageNum}
                    scale={scale}
                    renderTextLayer
                    renderAnnotationLayer
                  />
                </Document>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12">
                  <FileText className="w-16 h-16 text-[rgb(var(--muted-fg))]" />
                  <p className="text-sm font-medium">{note.title}</p>
                  <p className="text-xs text-[rgb(var(--muted-fg))]">
                    {isPDF ? "PDF preview unavailable" : "Preview not available for this file type"}
                  </p>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity mt-2"
                  >
                    <Download className="w-4 h-4" /> Download to view
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
                  <Link href={`/profile/${note.profiles.id}`} className="hover:text-[rgb(var(--fg))] transition-colors">
                    {note.profiles.full_name}
                  </Link>
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
            {/* Download */}
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" /> Download
            </button>

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

            {/* Report */}
            <button className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--destructive))] transition-colors">
              <Flag className="w-3 h-3" /> Report
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
