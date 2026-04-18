"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Building2, Plus, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  type: string;
  name: string | null;
  meta?: string;
  avatarChar?: string;
}

function ChannelItem({ channel, icon, label }: { channel: Channel; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  const active = pathname === `/chat/${channel.id}`;

  return (
    <Link
      href={`/chat/${channel.id}`}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200",
        active
          ? "bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]"
          : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function ChannelSidebar() {
  const supabase = createClient();
  const [globalChannel, setGlobalChannel] = useState<Channel | null>(null);
  const [uniChannels, setUniChannels] = useState<Channel[]>([]);
  const [dmChannels, setDmChannels] = useState<Channel[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Global channel
      const { data: global } = await supabase
        .from("channels")
        .select("id, type, name")
        .eq("type", "global")
        .single();
      if (global) setGlobalChannel(global);

      // Profile → university
      const { data: profile } = await supabase
        .from("profiles")
        .select("university_id, universities(short_name)")
        .eq("id", user.id)
        .single();

      if (profile?.university_id) {
        // Try to find existing university channel
        let { data: existing } = await supabase
          .from("channels")
          .select("id, type, name")
          .eq("type", "university")
          .eq("university_id", profile.university_id)
          .single();

        if (!existing) {
          const uniName = (profile.universities as any)?.short_name ?? "University";
          const { data: created } = await supabase
            .from("channels")
            .insert({
              type: "university",
              university_id: profile.university_id,
              name: `${uniName} General`,
            })
            .select("id, type, name")
            .single();
          existing = created;
        }

        if (existing) {
          const uniShort = (profile.universities as any)?.short_name ?? "";
          setUniChannels([{ ...existing, meta: uniShort }]);
        }
      }

      // DM channels
      const { data: dms } = await supabase
        .from("channels")
        .select("id, type, dm_user_a, dm_user_b")
        .eq("type", "dm")
        .or(`dm_user_a.eq.${user.id},dm_user_b.eq.${user.id}`)
        .limit(15);

      if (dms && dms.length > 0) {
        const otherIds = dms.map(d => d.dm_user_a === user.id ? d.dm_user_b : d.dm_user_a).filter(Boolean);
        const { data: dmProfiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", otherIds as string[]);

        const profileMap = new Map(dmProfiles?.map(p => [p.id, p]) ?? []);

        setDmChannels(dms.map(d => {
          const otherId = d.dm_user_a === user.id ? d.dm_user_b : d.dm_user_a;
          const otherProfile = profileMap.get(otherId ?? "");
          return {
            id: d.id,
            type: "dm",
            name: otherProfile?.full_name ?? "Unknown",
            avatarChar: otherProfile?.full_name?.charAt(0).toUpperCase() ?? "?",
          };
        }));
      }
    };

    init();
  }, []);

  return (
    <div className="w-56 flex-shrink-0 border-r border-[rgb(var(--border))] flex flex-col overflow-hidden bg-[rgb(var(--card))]">
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted-fg))]">
          Channels
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {globalChannel && (
          <ChannelItem
            channel={globalChannel}
            icon={<Globe className="w-4 h-4" />}
            label={globalChannel.name ?? "All-Pakistan Chat"}
          />
        )}

        {uniChannels.length > 0 && (
          <div className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted-fg))] px-3 mb-1">
              My University
            </p>
            {uniChannels.map(ch => (
              <ChannelItem
                key={ch.id}
                channel={ch}
                icon={<Building2 className="w-4 h-4" />}
                label={ch.name ?? ch.meta ?? "University"}
              />
            ))}
          </div>
        )}

        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted-fg))]">
              Direct Messages
            </p>
            <button
              className="text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
              title="New DM"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {dmChannels.length === 0 && (
            <p className="text-xs text-[rgb(var(--muted-fg))] px-3 py-1.5">
              No conversations yet
            </p>
          )}

          {dmChannels.map(ch => (
            <ChannelItem
              key={ch.id}
              channel={ch}
              icon={
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-[8px] font-bold text-white">
                  {ch.avatarChar ?? <User className="w-3 h-3" />}
                </div>
              }
              label={ch.name ?? "Unknown"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
