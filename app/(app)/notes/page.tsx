"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Upload, BookOpen, Download, ThumbsUp,
  Filter, X, FileText, FileImage, Archive,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Note = Database["public"]["Tables"]["notes"]["Row"] & {
  profiles?: { full_name: string; avatar_url: string | null; university_id: string | null } | null;
  universities?: { short_name: string } | null;
};

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf:  FileText,
  docx: FileText,
  pptx: FileImage,
  zip:  Archive,
};

const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export default function NotesPage() {
  const supabase = createClient();
  const [notes, setNotes]       = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // filters
  const [filterSubject,  setFilterSubject]  = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterType,     setFilterType]     = useState("");

  useEffect(() => {
    Promise.all([
      supabase
        .from("notes")
        .select("*, profiles(full_name, avatar_url, university_id), universities(short_name)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("subjects").select("name").order("name"),
    ]).then(([{ data: notesData }, { data: subjectsData }]) => {
      setNotes(notesData || []);
      setSubjects((subjectsData || []).map(s => s.name));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return notes.filter(n => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        (n.course_code || "").toLowerCase().includes(q) ||
        (n.description || "").toLowerCase().includes(q);
      const matchSubject   = !filterSubject  || n.subject === filterSubject;
      const matchSemester  = !filterSemester || n.semester === filterSemester;
      const matchType      = !filterType     || (n.file_type || "").includes(filterType);
      return matchSearch && matchSubject && matchSemester && matchType;
    });
  }, [notes, search, filterSubject, filterSemester, filterType]);

  const activeFilters = [filterSubject, filterSemester, filterType].filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-1">Notes</h1>
          <p className="text-[rgb(var(--muted-fg))]">
            {notes.length > 0 ? `${notes.length} notes` : "Global notes library"} — shared by students across Pakistan.
          </p>
        </div>
        <Link href="/notes/upload">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </Link>
      </motion.div>

      {/* Search + filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-3"
      >
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, subject, course code…"
              className={cn(
                "w-full h-11 pl-10 pr-4 rounded-xl text-sm",
                "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] transition-shadow"
              )}
            />
          </div>
          <button
            onClick={() => setShowFilters(s => !s)}
            className={cn(
              "flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-medium border transition-all duration-200",
              showFilters || activeFilters > 0
                ? "bg-[rgb(var(--primary)/0.1)] border-[rgb(var(--primary)/0.4)] text-[rgb(var(--primary))]"
                : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-xs flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="theme-card p-4 grid sm:grid-cols-3 gap-4"
          >
            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1.5">Subject</label>
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className={cn(
                  "w-full h-9 px-3 rounded-lg text-sm",
                  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                  "text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                )}
              >
                <option value="">All subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1.5">Semester</label>
              <select
                value={filterSemester}
                onChange={e => setFilterSemester(e.target.value)}
                className={cn(
                  "w-full h-9 px-3 rounded-lg text-sm",
                  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                  "text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                )}
              >
                <option value="">All semesters</option>
                {SEMESTERS.map(s => <option key={s} value={s}>{s} Semester</option>)}
              </select>
            </div>

            {/* File type */}
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1.5">File type</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className={cn(
                  "w-full h-9 px-3 rounded-lg text-sm",
                  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                  "text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                )}
              >
                <option value="">All types</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="pptx">PPTX</option>
                <option value="zip">ZIP</option>
              </select>
            </div>

            {activeFilters > 0 && (
              <div className="sm:col-span-3 flex justify-end">
                <button
                  onClick={() => { setFilterSubject(""); setFilterSemester(""); setFilterType(""); }}
                  className="flex items-center gap-1.5 text-xs text-[rgb(var(--destructive))] hover:underline"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="theme-card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-[rgb(var(--muted))] rounded w-3/4" />
              <div className="h-3 bg-[rgb(var(--muted))] rounded w-1/2" />
              <div className="h-3 bg-[rgb(var(--muted))] rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="theme-card p-16 text-center">
          <BookOpen className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
          <p className="font-semibold mb-1">No notes found</p>
          <p className="text-sm text-[rgb(var(--muted-fg))] mb-4">
            {notes.length === 0 ? "Be the first to upload notes!" : "Try different search terms or filters."}
          </p>
          <Link href="/notes/upload">
            <button className="px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity">
              Upload notes
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note, i) => (
            <NoteCard key={note.id} note={note} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, index }: { note: Note; index: number }) {
  const ext = (note.file_type || "pdf").replace("application/", "").replace("vnd.openxmlformats-officedocument.", "").split(".").pop() || "pdf";
  const Icon = FILE_ICONS[ext] || FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
    >
      <Link
        href={`/notes/${note.id}`}
        className="theme-card p-5 flex flex-col gap-3 h-full hover:border-[rgb(var(--primary)/0.3)] hover:shadow-lg transition-all duration-200 group"
      >
        {/* File type badge + subject */}
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-[rgb(var(--primary))]" />
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] truncate max-w-[60%]">
            {note.subject}
          </span>
        </div>

        {/* Title */}
        <div className="flex-1">
          <h3 className="font-semibold text-sm leading-snug group-hover:text-[rgb(var(--primary))] transition-colors line-clamp-2">
            {note.title}
          </h3>
          {note.course_code && (
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-1">{note.course_code}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-[rgb(var(--muted-fg))]">
          <div className="flex items-center gap-2">
            {note.universities?.short_name && (
              <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--primary)/0.08)] text-[rgb(var(--primary))] font-medium">
                {note.universities.short_name}
              </span>
            )}
            {note.semester && <span>{note.semester} sem</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" /> {note.upvotes}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" /> {note.downloads}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
