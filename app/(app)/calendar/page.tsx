"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, X,
  Clock, Calendar, Trash2, CalendarPlus,
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

interface ScheduleBlock {
  title: string;
  start_time: string;
  end_time: string;
  color: string;
}

const COLORS = ["#6366f1","#10b981","#f97316","#ef4444","#8b5cf6","#3b82f6","#ec4899","#eab308"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const EMPTY_BLOCK = (): ScheduleBlock => ({ title: "", start_time: "", end_time: "", color: COLORS[0] });

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
  const [qEnd,   setQEnd]   = useState("");
  const [adding, setAdding] = useState(false);

  // Manual schedule builder
  const [showBuilder,   setShowBuilder]   = useState(false);
  const [buildDate,     setBuildDate]     = useState(today.toISOString().split("T")[0]);
  const [buildBlocks,   setBuildBlocks]   = useState<ScheduleBlock[]>([EMPTY_BLOCK()]);
  const [buildSaving,   setBuildSaving]   = useState(false);

  const year  = current.getFullYear();
  const month = current.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
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
      start_time: qTime || null, end_time: qEnd || null, color,
    }).select().single();
    if (data) { setEvents(p => [...p, data as unknown as CalEvent]); setQTitle(""); setQTime(""); setQEnd(""); }
    setAdding(false);
  };

  const deleteEvent = async (id: string) => {
    await (supabase as any).from("calendar_events").delete().eq("id", id);
    setEvents(p => p.filter(e => e.id !== id));
  };

  // Schedule builder helpers
  const updateBlock = (i: number, field: keyof ScheduleBlock, val: string) =>
    setBuildBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b));

  const removeBlock = (i: number) =>
    setBuildBlocks(prev => prev.filter((_, idx) => idx !== i));

  const saveSchedule = async () => {
    if (!userId) return;
    const valid = buildBlocks.filter(b => b.title.trim());
    if (!valid.length) return;
    setBuildSaving(true);
    const rows = valid.map(b => ({
      user_id: userId, title: b.title.trim(), date: buildDate,
      start_time: b.start_time || null, end_time: b.end_time || null, color: b.color,
    }));
    const { data } = await (supabase as any).from("calendar_events").insert(rows).select();
    if (data) setEvents(p => [...p, ...(data as unknown as CalEvent[])]);
    setBuildBlocks([EMPTY_BLOCK()]);
    setShowBuilder(false);
    setBuildSaving(false);
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
          <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">Plan your schedule and track your week</p>
        </div>
        <button
          onClick={() => setShowBuilder(p => !p)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <CalendarPlus className="w-4 h-4" /> Plan Day
        </button>
      </header>

      {/* Manual Schedule Builder */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="theme-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4 text-[rgb(var(--primary))]" /> Plan Your Day
                </p>
                <button onClick={() => setShowBuilder(false)} className="text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Date for the schedule */}
              <div>
                <label className="text-xs text-[rgb(var(--muted-fg))] mb-1 block">Schedule date</label>
                <input type="date" value={buildDate} onChange={e => setBuildDate(e.target.value)}
                  className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] w-40" />
              </div>

              {/* Time blocks */}
              <div className="space-y-2">
                <label className="text-xs text-[rgb(var(--muted-fg))] block">Time blocks</label>
                {buildBlocks.map((block, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Color dot */}
                    <div className="relative flex-shrink-0">
                      <select
                        value={block.color}
                        onChange={e => updateBlock(i, "color", e.target.value)}
                        className="w-8 h-9 opacity-0 absolute inset-0 cursor-pointer"
                      >
                        {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="w-8 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: block.color + "33" }}>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: block.color }} />
                      </div>
                    </div>

                    <input
                      value={block.title}
                      onChange={e => updateBlock(i, "title", e.target.value)}
                      placeholder="Event title…"
                      className="flex-1 min-w-[100px] bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]"
                    />
                    <input type="time" value={block.start_time}
                      onChange={e => updateBlock(i, "start_time", e.target.value)}
                      className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-2 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] w-28 flex-shrink-0" />
                    <span className="text-xs text-[rgb(var(--muted-fg))] flex-shrink-0">–</span>
                    <input type="time" value={block.end_time}
                      onChange={e => updateBlock(i, "end_time", e.target.value)}
                      className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-2 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] w-28 flex-shrink-0" />
                    {buildBlocks.length > 1 && (
                      <button onClick={() => removeBlock(i)}
                        className="p-2 rounded-xl text-[rgb(var(--muted-fg))] hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => setBuildBlocks(p => [...p, EMPTY_BLOCK()])}
                  className="flex items-center gap-1.5 text-xs text-[rgb(var(--primary))] hover:underline mt-1"
                >
                  <Plus className="w-3 h-3" /> Add another block
                </button>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={saveSchedule}
                  disabled={buildSaving || !buildBlocks.some(b => b.title.trim())}
                  className="flex-1 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
                  {buildSaving ? "Saving…" : `Add ${buildBlocks.filter(b => b.title.trim()).length} event${buildBlocks.filter(b => b.title.trim()).length !== 1 ? "s" : ""} to Calendar`}
                </button>
                <button onClick={() => setShowBuilder(false)}
                  className="px-4 py-2.5 rounded-xl bg-[rgb(var(--muted))] text-sm hover:bg-[rgb(var(--border))] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Schedule Builder */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="theme-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4 text-[rgb(var(--primary))]" /> Plan Your Day
                </p>
                <button onClick={() => setShowBuilder(false)} className="text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Date for the schedule */}
              <div>
                <label className="text-xs text-[rgb(var(--muted-fg))] mb-1 block">Schedule date</label>
                <input type="date" value={buildDate} onChange={e => setBuildDate(e.target.value)}
                  className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] w-40" />
              </div>

              {/* Time blocks */}
              <div className="space-y-2">
                <label className="text-xs text-[rgb(var(--muted-fg))] block">Time blocks</label>
                {buildBlocks.map((block, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Color dot */}
                    <div className="relative flex-shrink-0">
                      <select
                        value={block.color}
                        onChange={e => updateBlock(i, "color", e.target.value)}
                        className="w-8 h-9 opacity-0 absolute inset-0 cursor-pointer"
                      >
                        {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="w-8 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: block.color + "33" }}>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: block.color }} />
                      </div>
                    </div>

                    <input
                      value={block.title}
                      onChange={e => updateBlock(i, "title", e.target.value)}
                      placeholder="Event title…"
                      className="flex-1 min-w-[100px] bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]"
                    />
                    <input type="time" value={block.start_time}
                      onChange={e => updateBlock(i, "start_time", e.target.value)}
                      className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-2 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] w-28 flex-shrink-0" />
                    <span className="text-xs text-[rgb(var(--muted-fg))] flex-shrink-0">–</span>
                    <input type="time" value={block.end_time}
                      onChange={e => updateBlock(i, "end_time", e.target.value)}
                      className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-2 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] w-28 flex-shrink-0" />
                    {buildBlocks.length > 1 && (
                      <button onClick={() => removeBlock(i)}
                        className="p-2 rounded-xl text-[rgb(var(--muted-fg))] hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => setBuildBlocks(p => [...p, EMPTY_BLOCK()])}
                  className="flex items-center gap-1.5 text-xs text-[rgb(var(--primary))] hover:underline mt-1"
                >
                  <Plus className="w-3 h-3" /> Add another block
                </button>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={saveSchedule}
                  disabled={buildSaving || !buildBlocks.some(b => b.title.trim())}
                  className="flex-1 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
                  {buildSaving ? "Saving…" : `Add ${buildBlocks.filter(b => b.title.trim()).length} event${buildBlocks.filter(b => b.title.trim()).length !== 1 ? "s" : ""} to Calendar`}
                </button>
                <button onClick={() => setShowBuilder(false)}
                  className="px-4 py-2.5 rounded-xl bg-[rgb(var(--muted))] text-sm hover:bg-[rgb(var(--border))] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Grid */}
      <div className="theme-card overflow-hidden">
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

        <div className="grid grid-cols-7 border-b border-[rgb(var(--border))]">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted-fg))]">{d}</div>
          ))}
        </div>

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
                      isToday ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] font-bold" : "text-[rgb(var(--fg))]"
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
                {new Date(selected + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              {events.filter(e => e.date === selected).length === 0 ? (
                <p className="text-sm text-[rgb(var(--muted-fg))]">No events — use Quick Add below or Plan Day above.</p>
              ) : (
                <div className="space-y-2">
                  {events
                    .filter(e => e.date === selected)
                    .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""))
                    .map(ev => (
                      <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--muted))]">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{ev.title}</p>
                          {ev.start_time && (
                            <p className="text-xs text-[rgb(var(--muted-fg))]">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {ev.start_time}{ev.end_time ? ` – ${ev.end_time}` : ""}
                            </p>
                          )}
                        </div>
                        <button onClick={() => deleteEvent(ev.id)}
                          className="p-1.5 rounded-lg text-[rgb(var(--muted-fg))] hover:text-red-400 hover:bg-red-500/10 transition-colors">
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
            placeholder="Start"
            className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] w-28 flex-shrink-0" />
          <input type="time" value={qEnd} onChange={e => setQEnd(e.target.value)}
            placeholder="End"
            className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] w-28 flex-shrink-0" />
          <button onClick={addEvent} disabled={!qTitle.trim() || adding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold disabled:opacity-40 flex-shrink-0">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
    </section>
  );
}
