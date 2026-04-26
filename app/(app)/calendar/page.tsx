"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, X, Sparkles,
  Clock, Calendar, Trash2, Bot, Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

interface CalEvent {
  id: string;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  color: string;
  user_id: string;
}

interface AIBlock {
  time: string;
  subject: string;
  duration: string;
  type: "study" | "break";
}

const COLORS = ["#6366f1","#10b981","#f97316","#ef4444","#8b5cf6","#3b82f6","#ec4899","#eab308"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function CalendarPage() {
  const { userId } = useCurrentUser();
  const supabase = createClient();
  const today = new Date();

  const [current, setCurrent]   = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents]     = useState<CalEvent[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [color, setColor]       = useState(COLORS[0]);

  // Quick-add bar
  const [qTitle, setQTitle] = useState("");
  const [qDate,  setQDate]  = useState(today.toISOString().split("T")[0]);
  const [qTime,  setQTime]  = useState("");
  const [adding, setAdding] = useState(false);

  // AI Scheduler
  const [showAI,    setShowAI]    = useState(false);
  const [aiHours,   setAiHours]   = useState("6");
  const [aiSubjs,   setAiSubjs]   = useState("");
  const [aiBreaks,  setAiBreaks]  = useState("15");
  const [aiLoad,    setAiLoad]    = useState(false);
  const [aiSchedule,setAiSched]   = useState<AIBlock[]>([]);
  const [aiErr,     setAiErr]     = useState("");

  const year  = current.getFullYear();
  const month = current.getMonth();
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  useEffect(() => {
    if (!userId) return;
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const end   = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    (supabase as any).from("calendar_events")
      .select("*").eq("user_id", userId).gte("date", start).lte("date", end)
      .then(({ data }: { data: CalEvent[] | null }) => setEvents(data ?? []));
  }, [userId, year, month]);

  const fmt = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const eventsOn = (d: number) => events.filter(e => e.date === fmt(d));

  const addEvent = async () => {
    if (!qTitle.trim() || !userId) return;
    setAdding(true);
    const { data } = await (supabase as any).from("calendar_events").insert({
      user_id: userId, title: qTitle.trim(), date: qDate,
      start_time: qTime || null, color,
    }).select().single();
    if (data) { setEvents(p => [...p, data as unknown as CalEvent]); setQTitle(""); setQTime(""); }
    setAdding(false);
  };

  const deleteEvent = async (id: string) => {
    await (supabase as any).from("calendar_events").delete().eq("id", id);
    setEvents(p => p.filter(e => e.id !== id));
  };

  const generateSchedule = async () => {
    if (!aiSubjs.trim()) { setAiErr("Enter at least one subject."); return; }
    setAiErr(""); setAiLoad(true); setAiSched([]);
    try {
      const res  = await fetch("/api/ai-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: aiHours, subjects: aiSubjs, breakMins: aiBreaks }),
      });
      const json = await res.json();
      if (json.schedule) setAiSched(json.schedule);
      else setAiErr(json.error ?? "Failed to generate schedule.");
    } catch { setAiErr("Network error. Please try again."); }
    setAiLoad(false);
  };

  const applySchedule = async () => {
    if (!userId || aiSchedule.length === 0) return;
    const rows = aiSchedule.filter(b => b.type === "study").map(b => ({
      user_id: userId, title: b.subject, date: qDate, start_time: b.time,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    const { data } = await (supabase as any).from("calendar_events").insert(rows).select();
    if (data) setEvents(p => [...p, ...(data as unknown as CalEvent[])]);
    setShowAI(false); setAiSched([]);
  };

  const todayStr = today.toISOString().split("T")[0];

  return (
    <section className="min-h-screen pb-24 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[rgb(var(--primary))]" /> Calendar
          </h1>
          <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">Manage your schedule and study plan</p>
        </div>
        <button
          onClick={() => setShowAI(p => !p)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--accent))] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-4 h-4" /> Generate AI Schedule
        </button>
      </header>

      {/* AI Scheduler Panel */}
      <AnimatePresence>
        {showAI && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="theme-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[rgb(var(--primary))]" /> AI Study Schedule Generator
                </p>
                <button onClick={() => setShowAI(false)}><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-[rgb(var(--muted-fg))] mb-1 block">Study hours</label>
                  <input type="number" min={1} max={16} value={aiHours} onChange={e => setAiHours(e.target.value)}
                    className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted-fg))] mb-1 block">Break (mins)</label>
                  <input type="number" min={5} max={60} value={aiBreaks} onChange={e => setAiBreaks(e.target.value)}
                    className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted-fg))] mb-1 block">Apply to date</label>
                  <input type="date" value={qDate} onChange={e => setQDate(e.target.value)}
                    className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]" />
                </div>
              </div>

              <div>
                <label className="text-xs text-[rgb(var(--muted-fg))] mb-1 block">Subjects (comma-separated)</label>
                <input value={aiSubjs} onChange={e => setAiSubjs(e.target.value)}
                  placeholder="e.g. Algorithms, Linear Algebra, Physics"
                  className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]" />
              </div>

              {aiErr && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-xl">{aiErr}</p>}

              <button onClick={generateSchedule} disabled={aiLoad}
                className="w-full py-2.5 rounded-xl bg-[rgb(var(--primary))] text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {aiLoad ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Schedule</>}
              </button>

              {aiSchedule.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Generated Schedule:</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {aiSchedule.map((blk, i) => (
                      <div key={i} className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl text-sm",
                        blk.type === "break" ? "bg-emerald-500/10 text-emerald-400" : "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                      )}>
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-mono text-xs flex-shrink-0">{blk.time}</span>
                        <span className="flex-1 font-medium">{blk.subject}</span>
                        <span className="text-xs opacity-70">{blk.duration}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={applySchedule}
                    className="w-full py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:opacity-90">
                    Add to Calendar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Grid */}
      <div className="theme-card overflow-hidden">
        {/* Navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--border))]">
          <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="p-2 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="font-bold">{MONTHS[month]} {year}</p>
            <button onClick={() => setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="text-xs text-[rgb(var(--primary))] hover:underline mt-0.5">Today</button>
          </div>
          <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="p-2 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[rgb(var(--border))]">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted-fg))]">{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dateStr   = day ? fmt(day) : null;
            const dayEvents = day ? eventsOn(day) : [];
            const isToday   = dateStr === todayStr;
            const isSel     = dateStr === selected;
            return (
              <div key={i}
                onClick={() => day && setSelected(isSel ? null : dateStr)}
                className={cn(
                  "min-h-[80px] p-1.5 border-b border-r border-[rgb(var(--border))] transition-colors",
                  day ? "cursor-pointer hover:bg-[rgb(var(--muted)/0.5)]" : "opacity-0 pointer-events-none",
                  isSel && "bg-[rgb(var(--primary)/0.05)]",
                  i % 7 === 6 && "border-r-0",
                )}
              >
                {day && (
                  <>
                    <div className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 mx-auto",
                      isToday ? "bg-[rgb(var(--primary))] text-white font-bold" : "text-[rgb(var(--fg))]"
                    )}>{day}</div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(ev => (
                        <div key={ev.id} className="text-[10px] truncate px-1.5 py-0.5 rounded-md font-medium text-white"
                          style={{ backgroundColor: ev.color }}>
                          {ev.start_time && <span className="opacity-80">{ev.start_time} </span>}{ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[10px] text-[rgb(var(--muted-fg))] pl-1">+{dayEvents.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <div className="theme-card p-4">
              <p className="font-semibold text-sm mb-3">
                Events on {new Date(selected + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              {events.filter(e => e.date === selected).length === 0 ? (
                <p className="text-sm text-[rgb(var(--muted-fg))]">No events — use Quick Add below.</p>
              ) : (
                <div className="space-y-2">
                  {events.filter(e => e.date === selected).map(ev => (
                    <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--muted))]">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{ev.title}</p>
                        {ev.start_time && <p className="text-xs text-[rgb(var(--muted-fg))]">{ev.start_time}{ev.end_time ? ` – ${ev.end_time}` : ""}</p>}
                      </div>
                      <button onClick={() => deleteEvent(ev.id)} className="p-1.5 rounded-lg text-[rgb(var(--muted-fg))] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add — fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[rgb(var(--bg)/0.95)] backdrop-blur-md border-t border-[rgb(var(--border))] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={cn("w-5 h-5 rounded-full transition-transform", color === c && "scale-125 ring-2 ring-white ring-offset-1 ring-offset-[rgb(var(--bg))]")}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <input
            value={qTitle} onChange={e => setQTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addEvent()}
            placeholder="Quick Add: Event title…"
            className="flex-1 min-w-[140px] bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]"
          />
          <input type="date" value={qDate} onChange={e => setQDate(e.target.value)}
            className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] w-36 flex-shrink-0" />
          <input type="time" value={qTime} onChange={e => setQTime(e.target.value)}
            className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] w-28 flex-shrink-0" />
          <button onClick={addEvent} disabled={!qTitle.trim() || adding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-white text-sm font-semibold disabled:opacity-40 flex-shrink-0">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
    </section>
  );
}
