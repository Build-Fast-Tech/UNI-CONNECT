"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CurrentUser {
  userId: string | null;
  fullName: string;
  initials: string;
  avatarUrl: string | null;
  email: string | null;
  role: "student" | "employer" | "moderator" | "admin";
  universityId: string | null;
  username: string | null;
  loaded: boolean;
}

const DEFAULT_STATE: CurrentUser = {
  userId: null,
  fullName: "",
  initials: "U",
  avatarUrl: null,
  email: null,
  role: "student",
  universityId: null,
  username: null,
  loaded: false,
};

const UserContext = createContext<CurrentUser>(DEFAULT_STATE);

export function useCurrentUser() {
  return useContext(UserContext);
}

function computeInitials(name: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .map(n => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CurrentUser>(DEFAULT_STATE);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setState({ ...DEFAULT_STATE, loaded: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role, university_id, username")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      const fullName = profile?.full_name ?? "";
      setState({
        userId: user.id,
        fullName,
        initials: computeInitials(fullName),
        avatarUrl: profile?.avatar_url ?? null,
        email: user.email ?? null,
        role: (profile?.role as CurrentUser["role"]) ?? "student",
        universityId: profile?.university_id ?? null,
        username: profile?.username ?? null,
        loaded: true,
      });
    })();

    return () => { cancelled = true; };
  }, []);

  return <UserContext.Provider value={state}>{children}</UserContext.Provider>;
}
