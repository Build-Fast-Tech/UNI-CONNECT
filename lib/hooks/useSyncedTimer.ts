"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type TimerPhase = "work" | "break";

export interface TimerState {
  phase: TimerPhase;
  secondsLeft: number;
  isRunning: boolean;
  completedPomodoros: number;
}

export interface LiveSession {
  userId: string;
  fullName: string;
  subjectName: string;
  secondsLeft: number;
  phase: TimerPhase;
  sessionCode: string | null;
}

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export function useSyncedTimer(sessionCode: string | null) {
  const [state, setState] = useState<TimerState>({
    phase: "work",
    secondsLeft: WORK_SECONDS,
    isRunning: false,
    completedPomodoros: 0,
  });

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const isGroupMode = !!sessionCode;

  useEffect(() => {
    if (!sessionCode) return;
    const supabase = createClient();
    const channel = supabase.channel(`study-group:${sessionCode}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "timer-sync" }, ({ payload }: { payload: { state: TimerState } }) => {
        setState(payload.state);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionCode]);

  const broadcast = useCallback((newState: TimerState) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "timer-sync",
      payload: { state: newState },
    });
  }, []);

  useEffect(() => {
    if (!state.isRunning) return;
    const tick = setInterval(() => {
      setState(prev => {
        if (prev.secondsLeft <= 1) {
          const nextPhase: TimerPhase = prev.phase === "work" ? "break" : "work";
          const next: TimerState = {
            phase: nextPhase,
            secondsLeft: nextPhase === "work" ? WORK_SECONDS : BREAK_SECONDS,
            isRunning: false,
            completedPomodoros:
              prev.phase === "work" ? prev.completedPomodoros + 1 : prev.completedPomodoros,
          };
          broadcast(next);
          return next;
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [state.isRunning, broadcast]);

  const start = useCallback(() => {
    setState(prev => {
      const next = { ...prev, isRunning: true };
      broadcast(next);
      return next;
    });
  }, [broadcast]);

  const pause = useCallback(() => {
    setState(prev => {
      const next = { ...prev, isRunning: false };
      broadcast(next);
      return next;
    });
  }, [broadcast]);

  const reset = useCallback(() => {
    setState(prev => {
      const next: TimerState = {
        ...prev,
        isRunning: false,
        secondsLeft: prev.phase === "work" ? WORK_SECONDS : BREAK_SECONDS,
      };
      broadcast(next);
      return next;
    });
  }, [broadcast]);

  const skip = useCallback(() => {
    setState(prev => {
      const nextPhase: TimerPhase = prev.phase === "work" ? "break" : "work";
      const next: TimerState = {
        phase: nextPhase,
        secondsLeft: nextPhase === "work" ? WORK_SECONDS : BREAK_SECONDS,
        isRunning: false,
        completedPomodoros:
          prev.phase === "work" ? prev.completedPomodoros + 1 : prev.completedPomodoros,
      };
      broadcast(next);
      return next;
    });
  }, [broadcast]);

  return { state, start, pause, reset, skip, isGroupMode };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function generateSessionCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
