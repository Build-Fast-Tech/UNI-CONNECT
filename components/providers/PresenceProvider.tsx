"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "./UserProvider";

/**
 * App-wide online presence.
 *
 * The user is tracked on a single "presence:app" channel from here — the
 * AppShell, which is mounted for the whole authenticated app. That means a user
 * shows as online as soon as they are logged in with the app open, regardless
 * of which section they are on (previously presence was only tracked inside the
 * chat ChannelSidebar, so people only appeared online while in Chat).
 *
 * Centralising it here also guarantees exactly ONE "presence:app" subscription
 * per client — subscribing to the same realtime topic twice throws.
 */
const OnlineUsersContext = createContext<Set<string>>(new Set());

export function useOnlineUsers() {
  return useContext(OnlineUsersContext);
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useCurrentUser();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const pres = supabase.channel("presence:app", {
      config: { presence: { key: userId } },
    });

    pres
      .on("presence", { event: "sync" }, () => {
        const state = pres.presenceState<{ userId: string }>();
        const ids = new Set<string>();
        Object.values(state).forEach((subs) =>
          subs.forEach((s) => { if (s?.userId) ids.add(s.userId); })
        );
        setOnlineUsers(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await pres.track({ userId });
      });

    return () => { supabase.removeChannel(pres); };
  }, [userId]);

  return (
    <OnlineUsersContext.Provider value={onlineUsers}>
      {children}
    </OnlineUsersContext.Provider>
  );
}
