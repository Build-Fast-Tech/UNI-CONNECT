"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Upload, BookOpen, Download, ThumbsUp,
  Filter, X, FileText, FileImage, Archive,
  ClipboardList, GraduationCap, PenLine, ScrollText, Trash2,
  ChevronDown, Building2,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { cn, mergeSubjects } from "@/lib/utils";
import type { Database } from "@/types/database";

const PdfPreviewModal = dynamic(() => import("./PdfPreviewModal"), { ssr: false });

type Note = Database["public"]["Tables"]["notes"]["Row"] & {
  profiles?: { full_name: string; avatar_url: string | null; university_id: string | null } | null;
  universities?: { short_name: string } | null;
};

interface University {
  id: string;
  name: string;
  short_name: string;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf:  FileText,
  docx: FileText,
  pptx: FileImage,
  zip:  Archive,
};

const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const CATEGORIES = [
  { id: "all",        label: "All",          icon: BookOpen },
  { id: "notes",      label: "Notes",        icon: FileText },
  { id: "quiz",       label: "Quizzes",      icon: PenLine },
  { id: "assignment", label: "Assignments",  icon: ClipboardList },
  { id: "sessional1", label: "Sessional I",  icon: ScrollText },
  { id: "sessional2", label: "Sessional II", icon: ScrollText },
  { id: "final",      label: "Finals",       icon: GraduationCap },
  { id: "textbook",   label: "Textbooks",    icon: BookOpen },
  { id: "other",      label: "Other",        icon: Archive },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"];

const CATEGORY_COLORS: Record<string, string> = {
  notes:      "bg-blue-500/10 text-blue-500",
  quiz:       "bg-purple-500/10 text-purple-500",
  assignment: "bg-orange-500/10 text-orange-500",
  sessional1: "bg-yellow-500/10 text-yellow-600",
  sessional2: "bg-amber-500/10 text-amber-600",
  final:      "bg-red-500/10 text-red-500",
  textbook:   "bg-green-500/10 text-green-600",
  other:      "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]",
};

const PAGE_SIZE = 48;

const selectCls = cn(
  "w-full h-9 px-3 rounded-lg text-sm",
  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
  "text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
);

export default function NotesPage() {
  const supabase = createClient();
  const [notes, setNotes]               = useState<Note[]>([]);
  const [total, setTotal]               = useState(0);
  const [subjects, setSubjects]         = useState<string[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments]   = useState<string[]>([]);
  const [loading, setLoading]           = useState(true);
  const [userId, setUserId]             = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [showFilters, setShowFilters]   = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");

  // filters
  const [filterUniversity, setFilterUniversity] = useState("");   // UUID
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterSubject,    setFilterSubject]    = useState("");
  const [filterSemester,   setFilterSemester]   = useState("");
  const [filterType,       setFilterType]       = useState("");

  // university combobox
  const [uniSearch,  setUniSearch]  = useState("");   // text typed by user
  const [uniLabel,   setUniLabel]   = useState("");   // display label for selected uni
  const [uniOpen,    setUniOpen]    = useState(false);
  const uniRef = useRef<HTMLDivElement>(null);

  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // close combobox on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (uniRef.current && !uniRef.current.contains(e.target as Node)) {
        setUniOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // load reference data once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));

    supabase.from("subjects").select("name").order("name").then(({ data }) => {
      setSubjects(mergeSubjects((data || []).map(s => s.name)));
    });

    supabase.from("universities").select("id, name, short_name").order("short_name").then(({ data }) => {
      setUniversities((data as University[]) ?? []);
    });

    (supabase as any)
      .from("notes")
      .select("department")
      .eq("status", "published")
      .not("department", "is", null)
      .then(({ data }: { data: { department: string }[] | null }) => {
        const unique = [...new Set((data ?? []).map(r => r.department))].sort();
        setDepartments(unique);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotes = useCallback(async (searchVal: string) => {
    setLoading(true);

    let q = supabase
      .from("notes")
      .select("*, profiles!uploader_id(full_name, avatar_url, university_id), universities!university_id(short_name)", { count: "exact" })
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (activeCategory !== "all") q = (q as any).eq("category", activeCategory);
    if (filterUniversity) q = q.eq("university_id", filterUniversity);
    if (filterDepartment) q = (q as any).eq("department", filterDepartment);
    if (filterSubject)    q = q.eq("subject", filterSubject);
    if (filterSemester)   q = q.eq("semester", filterSemester);
    if (filterType)       q = q.ilike("file_type", `%${filterType}%`);
    if (searchVal.trim()) {
      q = q.or(`title.ilike.%${searchVal.trim()}%,subject.ilike.%${searchVal.trim()}%,course_code.ilike.%${searchVal.trim()}%`);
    }

    const { data, count } = await q;
    setNotes((data as Note[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, filterUniversity, filterDepartment, filterSubject, filterSemester, filterType]);

  useEffect(() => {
    fetchNotes(search);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchNotes]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchNotes(val), 350);
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id).eq("uploader_id", userId ?? "");
    setNotes(prev => prev.filter(n => n.id !== id));
    setTotal(prev => prev - 1);
  };

  const clearFilters = () => {
    setFilterUniversity(""); setUniSearch(""); setUniLabel("");
    setFilterDepartment(""); setFilterSubject("");
    setFilterSemester(""); setFilterType("");
  };

  const selectUniversity = (u: University) => {
    setFilterUniversity(u.id);
    setUniLabel(`${u.short_name} — ${u.name}`);
    setUniSearch("");
    setUniOpen(false);
    setFilterDepartment("");
    setFilterSubject("");
  };

  const clearUniversity = () => {
    setFilterUniversity(""); setUniLabel(""); setUniSearch("");
    setFilterDepartment(""); setFilterSubject("");
  };

  const filteredUnis = universities.filter(u =>
    uniSearch.trim() === "" ||
    u.short_name.toLowerCase().includes(uniSearch.toLowerCase()) ||
    u.name.toLowerCase().includes(uniSearch.toLowerCase())
  );

  const activeFilters = [filterUniversity, filterDepartment, filterSubject, filterSemester, filterType].filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Notes</h1>
          <p className="text-[rgb(var(--muted-fg))]">
            {total > 0 ? `${total} files` : "Global notes library"} — shared by students across Pakistan.
          </p>
        </div>
        <Link href="/notes/upload">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </Link>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const active = activeCategory === id;
          return (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={cn(
                "flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium flex-shrink-0 transition-all duration-150 border",
                active
                  ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] border-transparent"
                  : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted))]"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Search + filter bar */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
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
              "flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-medium border transition-all duration-150",
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

        {showFilters && (
          <div className="theme-card p-4 space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* ── University combobox ── */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> University
                </label>
                <div ref={uniRef} className="relative">
                  {/* Input row */}
                  <div className={cn(
                    "flex items-center h-9 rounded-lg border text-sm overflow-hidden",
                    "bg-[rgb(var(--input))] border-[rgb(var(--border))]",
                    uniOpen && "ring-2 ring-[rgb(var(--ring))]"
                  )}>
                    <Search className="w-3.5 h-3.5 ml-2.5 flex-shrink-0 text-[rgb(var(--muted-fg))]" />
                    <input
                      type="text"
                      value={uniOpen ? uniSearch : (uniLabel || uniSearch)}
                      onChange={e => { setUniSearch(e.target.value); setUniOpen(true); }}
                      onFocus={() => setUniOpen(true)}
                      placeholder="Search university…"
                      className="flex-1 min-w-0 px-2 py-1 bg-transparent text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] focus:outline-none text-sm"
                    />
                    {filterUniversity ? (
                      <button
                        onClick={clearUniversity}
                        className="p-1.5 mr-0.5 rounded hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    ) : (
                      <ChevronDown className={cn("w-3.5 h-3.5 mr-2 flex-shrink-0 text-[rgb(var(--muted-fg))] transition-transform", uniOpen && "rotate-180")} />
                    )}
                  </div>

                  {/* Dropdown */}
                  {uniOpen && (
                    <div className={cn(
                      "absolute z-50 top-full mt-1 w-full rounded-xl border border-[rgb(var(--border))]",
                      "bg-[rgb(var(--card))] shadow-xl overflow-hidden"
                    )}>
                      <div className="max-h-52 overflow-y-auto">
                        {/* All option */}
                        <button
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { clearUniversity(); setUniOpen(false); }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm transition-colors",
                            !filterUniversity
                              ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-medium"
                              : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]"
                          )}
                        >
                          All universities
                        </button>

                        {filteredUnis.length === 0 ? (
                          <p className="px-3 py-4 text-xs text-center text-[rgb(var(--muted-fg))]">No universities found</p>
                        ) : (
                          filteredUnis.map(u => (
                            <button
                              key={u.id}
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => selectUniversity(u)}
                              className={cn(
                                "w-full text-left px-3 py-2 text-sm transition-colors",
                                filterUniversity === u.id
                                  ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-medium"
                                  : "text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted))]"
                              )}
                            >
                              <span className="font-medium">{u.short_name}</span>
                              <span className="text-[rgb(var(--muted-fg))] ml-1.5 text-xs">{u.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Department ── */}
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1.5">Department</label>
                <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} className={selectCls}>
                  <option value="">All departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* ── Subject ── */}
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1.5">Subject</label>
                <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className={selectCls}>
                  <option value="">All subjects</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* ── Semester ── */}
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1.5">Semester</label>
                <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className={selectCls}>
                  <option value="">All semesters</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s} Semester</option>)}
                </select>
              </div>

              {/* ── File type ── */}
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--muted-fg))] mb-1.5">File type</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectCls}>
                  <option value="">All types</option>
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                  <option value="pptx">PPTX</option>
                  <option value="zip">ZIP</option>
                </select>
              </div>
            </div>

            {activeFilters > 0 && (
              <div className="flex justify-end pt-1 border-t border-[rgb(var(--border))]">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs text-[rgb(var(--destructive))] hover:underline"
                >
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="theme-card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-[rgb(var(--muted))] rounded w-3/4" />
              <div className="h-3 bg-[rgb(var(--muted))] rounded w-1/2" />
              <div className="h-3 bg-[rgb(var(--muted))] rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="theme-card p-16 text-center">
          <BookOpen className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
          <p className="font-semibold mb-1">No files found</p>
          <p className="text-sm text-[rgb(var(--muted-fg))] mb-4">
            Try different filters or search terms.
          </p>
          <Link href="/notes/upload">
            <button className="px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity">
              Upload now
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} userId={userId} onDelete={deleteNote} onPreview={setPreviewNote} />
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewNote && (
        <PdfPreviewModal note={previewNote} onClose={() => setPreviewNote(null)} />
      )}
    </div>
  );
}

function NoteCard({ note, userId, onDelete, onPreview }: { note: Note; userId: string | null; onDelete: (id: string) => void; onPreview: (n: Note) => void }) {
  const ext = (note.file_type || "pdf").replace("application/", "").replace("vnd.openxmlformats-officedocument.", "").split(".").pop() || "pdf";
  const Icon = FILE_ICONS[ext] || FileText;
  const category = (note as any).category as string | undefined;
  const categoryLabel = CATEGORIES.find(c => c.id === category)?.label;
  const categoryColor = CATEGORY_COLORS[category || "other"];

  return (
    <div className="relative group theme-card overflow-hidden flex flex-col hover:border-[rgb(var(--primary)/0.3)] hover:shadow-lg transition-all duration-150">
      {/* Clickable card body — navigates to detail */}
      <Link href={`/notes/${note.id}`} className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-[rgb(var(--primary))]" />
          </div>
          <div className="flex flex-col items-end gap-1">
            {categoryLabel && category !== "notes" && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", categoryColor)}>
                {categoryLabel}
              </span>
            )}
            <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] truncate max-w-[120px]">
              {note.subject}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-sm leading-snug group-hover:text-[rgb(var(--primary))] transition-colors line-clamp-2">
            {note.title}
          </h3>
          {note.course_code && (
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-1">{note.course_code}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-[rgb(var(--muted-fg))]">
          <div className="flex items-center gap-2">
            {note.universities?.short_name && (
              <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--primary)/0.08)] text-[rgb(var(--primary))] font-medium">
                {note.universities.short_name}
              </span>
            )}
            {(note as any).department && (
              <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
                {(note as any).department}
              </span>
            )}
            {(note as any).year && <span>{(note as any).year}</span>}
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

      {/* View button — separate row, never overlaps the Link */}
      <button
        onClick={() => onPreview(note)}
        className="w-full py-2 text-xs font-semibold text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.06)] hover:bg-[rgb(var(--primary)/0.13)] transition-colors border-t border-[rgb(var(--border))]"
      >
        View
      </button>

      {/* Delete — uploader only */}
      {note.uploader_id === userId && (
        <button
          onClick={() => onDelete(note.id)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-[rgb(var(--card))] border border-[rgb(var(--border))] hover:bg-red-500/10 hover:text-red-500 text-[rgb(var(--muted-fg))] opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"
          title="Delete note"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
