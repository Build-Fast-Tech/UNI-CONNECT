"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type TimerMode = "pomodoro" | "short_break" | "long_break";

export interface TimerConfig {
  pomodoro: number;      // seconds
  short_break: number;
  long_break: number;
  longBreakInterval: number; // pomodoros before long break
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

const DEFAULT_CONFIG: TimerConfig = {
  pomodoro: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
};

export interface TimerState {
  mode: TimerMode;
  secondsLeft: number;
  isRunning: boolean;
  completedPomodoros: number;
}

export function useTimer(sessionCode: string | null, config: Partial<TimerConfig> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const [state, setState] = useState<TimerState>({
    mode: "pomodoro",
    secondsLeft: cfg.pomodoro,
    isRunning: false,
    completedPomodoros: 0,
  });

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const onCompleteRef = useRef<((mode: TimerMode) => void) | null>(null);

  useEffect(() => {
    if (!sessionCode) return;
    const supabase = createClient();
    const ch = supabase.channel(`timer:${sessionCode}`, {
      config: { broadcast: { self: false } },
    });
    ch.on("broadcast", { event: "timer-sync" }, ({ payload }: { payload: { state: TimerState } }) => {
      setState(payload.state);
    }).subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); channelRef.current = null; };
  }, [sessionCode]);

  const broadcast = useCallback((s: TimerState) => {
    channelRef.current?.send({ type: "broadcast", event: "timer-sync", payload: { state: s } });
  }, []);

  const totalSeconds = useCallback((mode: TimerMode) => {
    if (mode === "pomodoro") return cfg.pomodoro;
    if (mode === "short_break") return cfg.short_break;
    return cfg.long_break;
  }, [cfg.pomodoro, cfg.short_break, cfg.long_break]);

  // Ticker
  useEffect(() => {
    if (!state.isRunning) return;
    const tick = setInterval(() => {
      setState(prev => {
        if (prev.secondsLeft > 1) return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        // Phase complete
        const newPomodoros = prev.mode === "pomodoro" ? prev.completedPomodoros + 1 : prev.completedPomodoros;
        if (onCompleteRef.current) onCompleteRef.current(prev.mode);
        let nextMode: TimerMode;
        if (prev.mode === "pomodoro") {
          nextMode = newPomodoros % cfg.longBreakInterval === 0 ? "long_break" : "short_break";
        } else {
          nextMode = "pomodoro";
        }
        const next: TimerState = {
          mode: nextMode,
          secondsLeft: totalSeconds(nextMode),
          isRunning: cfg.autoStartBreaks || cfg.autoStartPomodoros,
          completedPomodoros: newPomodoros,
        };
        broadcast(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [state.isRunning, broadcast, cfg.longBreakInterval, cfg.autoStartBreaks, cfg.autoStartPomodoros, totalSeconds]);

  const setMode = useCallback((mode: TimerMode) => {
    setState(prev => {
      const next: TimerState = { ...prev, mode, secondsLeft: totalSeconds(mode), isRunning: false };
      broadcast(next);
      return next;
    });
  }, [broadcast, totalSeconds]);

  const start = useCallback(() => {
    setState(prev => { const n = { ...prev, isRunning: true }; broadcast(n); return n; });
  }, [broadcast]);

  const pause = useCallback(() => {
    setState(prev => { const n = { ...prev, isRunning: false }; broadcast(n); return n; });
  }, [broadcast]);

  const reset = useCallback(() => {
    setState(prev => {
      const n: TimerState = { ...prev, isRunning: false, secondsLeft: totalSeconds(prev.mode) };
      broadcast(n);
      return n;
    });
  }, [broadcast, totalSeconds]);

  const onComplete = useCallback((cb: (mode: TimerMode) => void) => {
    onCompleteRef.current = cb;
  }, []);

  const progress = state.secondsLeft / totalSeconds(state.mode);

  return { state, setMode, start, pause, reset, onComplete, progress, isGroupMode: !!sessionCode };
}

export function formatTime(s: number): string {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
