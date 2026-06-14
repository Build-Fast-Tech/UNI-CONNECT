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
  /** true if the profile row fetch failed — components should not make
   *  routing decisions based on universityId when this is true */
  profileError: boolean;
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
  profileError: false,
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

    // Safety net: never let the app hang with `loaded === false`. If auth or the
    // profile fetch stalls (slow / lost connection), flip to a loaded-but-error
    // state after a timeout so the UI renders instead of showing a blank screen.
    const watchdog = setTimeout(() => {
      if (cancelled) return;
      setState((prev) =>
        prev.loaded ? prev : { ...DEFAULT_STATE, loaded: true, profileError: true }
      );
    }, 8000);

    (async () => {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (cancelled) return;

        if (userErr || !user) {
          setState({ ...DEFAULT_STATE, loaded: true });
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, role, university_id, username")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (profileError) {
          // Network / DB error — mark loaded so the UI doesn't spin forever,
          // but set profileError so OnboardingGuard skips routing decisions.
          setState({
            ...DEFAULT_STATE,
            userId: user.id,
            email: user.email ?? null,
            loaded: true,
            profileError: true,
          });
          return;
        }

        const fullName = profile?.full_name ?? user.user_metadata?.full_name ?? "";
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
          profileError: false,
        });
      } catch (err) {
        // Unexpected throw (e.g. network failure) — render the app anyway.
        if (cancelled) return;
        console.error("UserProvider load failed:", err);
        setState({ ...DEFAULT_STATE, loaded: true, profileError: true });
      } finally {
        clearTimeout(watchdog);
      }
    })();

    return () => { cancelled = true; clearTimeout(watchdog); };
  }, []);

  return <UserContext.Provider value={state}>{children}</UserContext.Provider>;
}
