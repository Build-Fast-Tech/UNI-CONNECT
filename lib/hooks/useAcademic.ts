"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface AcademicState {
  semesterEndDate: string | null;   // ISO date string
  daysLeft: number | null;
  loading: boolean;
}

export function useAcademic(userId: string | null) {
  const [state, setState] = useState<AcademicState>({
    semesterEndDate: null,
    daysLeft: null,
    loading: true,
  });

  useEffect(() => {
    if (!userId) { setState(s => ({ ...s, loading: false })); return; }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("semester_end_date")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        const endDate = data?.semester_end_date ?? null;
        const daysLeft = endDate
          ? Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
          : null;
        setState({ semesterEndDate: endDate, daysLeft, loading: false });
      });
  }, [userId]);

  const setSemesterEnd = useCallback(async (date: string) => {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("profiles").update({ semester_end_date: date }).eq("id", userId);
    const daysLeft = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    setState({ semesterEndDate: date, daysLeft, loading: false });
  }, [userId]);

  return { ...state, setSemesterEnd };
}
