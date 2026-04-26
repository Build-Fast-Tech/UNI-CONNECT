"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import dynamic from "next/dynamic";
import { Send, Paperclip, Globe, Building2, MessageCircle, Smile, Menu, Trash2, Reply, X as XIcon } from "lucide-react";
import { filterProfanity } from "@/lib/utils/profanity";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime, formatTypingNames } from "@/lib/utils";
import { UserHoverCard } from "@/components/ui/UserHoverCard";
import { useChatShell } from "@/components/chat/ChatShell";

// Emoji picker is ~200KB + its data file is ~180KB. Load both only when the
// user actually opens the picker.
const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

interface Profile {
  full_name: string;
  avatar_url: string | null;
  username: string | null;
  branch: { name: string } | null;
  universities: { short_name: string } | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: Profile | null;
  reply_to_id?: string | null;
  gif_url?: string | null;
  sticker_id?: string | null;
}

const STICKER_PACKS = [
  { name: "Happy",       stickers: ["😊","😄","🥳","😎","🤩","😍","🥰","😂"] },
  { name: "Study",       stickers: ["📚","✏️","🎓","💡","🔬","📝","🧠","⏰"] },
  { name: "Celebration", stickers: ["🎉","🎊","🏆","🌟","✨","🎆","🎇","🥂"] },
  { name: "Reactions",   stickers: ["👍","👎","❤️","💔","🔥","💯","👏","🤔"] },
  { name: "Animals",     stickers: ["🐼","🦊","🐸","🦁","🐯","🦄","🐨","🦋"] },
];

interface Channel {
  id: string;
  type: string;
  name: string | null;
}

function Avatar({ name, url, size = "sm" }: { name?: string; url?: string | null; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (url) {
    return <img src={url} alt={name} className={cn("rounded-full object-cover flex-shrink-0", dim)} />;
  }
  return (
    <div className={cn("rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center font-bold text-white flex-shrink-0", dim)}>
      {name?.charAt(0).toUpperCase() ?? "?"}
    </div>
  );
}

export default function ChatChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = use(params);
  const supabase = createClient();
  const chatShell = useChatShell();

  const [messages, setMessages] = useState<Message[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>("");
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState("");
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  // @mention
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<Array<{ id: string; full_name: string; username: string | null; avatar_url: string | null }>>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState<Array<{ id: string; url: string; preview: string }>>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [activeStickerPack, setActiveStickerPack] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // The @emoji-mart/data JSON shape is not exported as a type; `any` is the
  // type the Picker itself expects for its `data` prop.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emojiData, setEmojiData] = useState<any>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subRef      = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const profileCache = useRef<Map<string, Profile>>(new Map());

  // Mention notification sound
  const playMentionSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      [660, 880].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.35, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.4);
      });
    } catch {}
  };

  // Search profiles for @mention dropdown
  const searchMentions = useCallback(async (query: string) => {
    if (query.length < 1) { setMentionResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(6);
    setMentionResults((data as any[]) ?? []);
    setMentionIndex(0);
  }, [supabase]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const insertEmoji = (emoji: { native: string }) => {
    setInput(prev => prev + emoji.native);
    textareaRef.current?.focus();
    resizeTextarea();
  };

  const toggleEmojiPicker = async () => {
    if (!showEmojiPicker && !emojiData) {
      const mod = await import("@emoji-mart/data");
      setEmojiData(mod.default);
    }
    setShowEmojiPicker(p => !p);
  };

  // Auto-resize textarea
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  };

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();
      if (profile) {
        setMyName(profile.full_name);
        setMyAvatar(profile.avatar_url);
      }

      const { data: chan } = await supabase
        .from("channels")
        .select("id, type, name")
        .eq("id", channelId)
        .single();
      if (chan) setChannel(chan);

      const { data: msgs } = await supabase
        .from("messages")
        .select(`
          id, content, created_at, sender_id,
          sender:profiles!sender_id(
            full_name, avatar_url, username,
            branch:branches!branch_id(name),
            universities!university_id(short_name)
          )
        `)
        .eq("channel_id", channelId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(60);

      if (msgs) {
        const typed = msgs as unknown as Message[];
        setMessages(typed);
        // Seed profile cache so realtime inserts don't need to re-join profiles.
        typed.forEach(m => {
          if (m.sender_id && m.sender && !profileCache.current.has(m.sender_id)) {
            profileCache.current.set(m.sender_id, m.sender);
          }
        });
      }
      setLoading(false);
    };

    init();
  }, [channelId]);

  // Scroll to bottom after initial load
  useEffect(() => {
    if (!loading) scrollToBottom(false);
  }, [loading]);

  // Realtime: new messages.
  // Uses payload.new for the row fields and a cached profile to avoid a 4-table
  // re-join on every incoming message. Only fetches a profile when we have never
  // seen this sender on this channel before.
  useEffect(() => {
    const sub = supabase
      .channel(`chat:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            content: string;
            created_at: string;
            sender_id: string;
            is_deleted?: boolean;
          };
          if (row.is_deleted) return;

          let sender = profileCache.current.get(row.sender_id) ?? null;
          if (!sender) {
            const { data } = await supabase
              .from("profiles")
              .select("full_name, avatar_url, username, branch:branches!branch_id(name), universities!university_id(short_name)")
              .eq("id", row.sender_id)
              .single();
            if (data) {
              sender = data as unknown as Profile;
              profileCache.current.set(row.sender_id, sender);
            }
          }

          const newMsg: Message = {
            id: row.id,
            content: row.content,
            created_at: row.created_at,
            sender_id: row.sender_id,
            sender,
          };

          // Play mention sound if the current user is @mentioned and didn't send it
          if (
            myName &&
            row.sender_id !== userId &&
            row.content &&
            row.content.toLowerCase().includes(`@${myName.split(" ")[0].toLowerCase()}`)
          ) {
            playMentionSound();
          }

          setMessages(prev => {
            // Dedupe: ignore if we already appended optimistically.
            if (prev.some(m => m.id === row.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => scrollToBottom(), 80);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const row = payload.new as { id: string; is_deleted?: boolean };
          if (row.is_deleted) setMessages(prev => prev.filter(m => m.id !== row.id));
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const data = payload.payload as { userId: string; name: string; typing: boolean };
        const tid = data.userId;
        const firstName = (data.name ?? "").split(" ")[0];

        // Clear any existing auto-expire timer for this user
        if (typingTimers.current.has(tid)) {
          clearTimeout(typingTimers.current.get(tid)!);
          typingTimers.current.delete(tid);
        }

        if (data.typing) {
          setTypingNames(prev => prev.includes(firstName) ? prev : [...prev, firstName]);
          // Auto-expire after 5 s in case the false broadcast is missed
          const t = setTimeout(() => {
            setTypingNames(prev => prev.filter(n => n !== firstName));
            typingTimers.current.delete(tid);
          }, 5000);
          typingTimers.current.set(tid, t);
        } else {
          setTypingNames(prev => prev.filter(n => n !== firstName));
        }
      })
      .subscribe();

    subRef.current = sub;
    return () => {
      supabase.removeChannel(sub);
      subRef.current = null;
      typingTimers.current.forEach(t => clearTimeout(t));
      typingTimers.current.clear();
    };
  }, [channelId]);

  // Presence: online count + Discord-style typing. We key presence on userId
  // so duplicate tabs for the same user collapse into a single entry, and we
  // filter by userId instead of name so people with matching names still see
  // each other typing.
  useEffect(() => {
    if (!userId || !myName) return;

    const presenceChan = supabase.channel(`presence:${channelId}`, {
      config: { presence: { key: userId } },
    });
    presenceRef.current = presenceChan;

    presenceChan
      .on("presence", { event: "sync" }, () => {
        const state = presenceChan.presenceState<{ name: string; typing: boolean; userId: string }>();
        // One entry per userId key — prevents multi-tab overcounting
        const entries = Object.values(state).map(subs => subs[0]).filter(Boolean);
        setOnlineCount(entries.length);
        // Typing is now handled via Broadcast, not Presence
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChan.track({ name: myName, userId });
        }
      });

    return () => { supabase.removeChannel(presenceChan); };
  }, [channelId, userId, myName]);

  // Coalesce typing broadcasts — only send `track()` when the state actually
  // changes, instead of once per keystroke.
  const typingStateRef = useRef(false);
  // Uses Broadcast (not Presence) — fire-and-forget, no sync delay.
  const broadcastTyping = (isTyping: boolean) => {
    if (!userId || !myName || !subRef.current) return;
    typingStateRef.current = isTyping;
    subRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId, name: myName, typing: isTyping },
    });
  };

  const insertMention = (name: string) => {
    // Replace the @query at the cursor with @FullName
    const at = input.lastIndexOf("@");
    if (at === -1) return;
    const before = input.slice(0, at);
    const after  = input.slice(at).replace(/^@\S*/, "");
    const newVal = `${before}@${name} ${after}`;
    setInput(newVal);
    setMentionQuery(null);
    setMentionResults([]);
    textareaRef.current?.focus();
    resizeTextarea();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    resizeTextarea();

    // Detect @mention
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursorPos);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      const q = match[1];
      setMentionQuery(q);
      searchMentions(q);
    } else {
      setMentionQuery(null);
      setMentionResults([]);
    }

    if (val.trim().length > 0) {
      if (!typingStateRef.current) broadcastTyping(true); // only broadcast on first keystroke
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => broadcastTyping(false), 3000);
    } else {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      broadcastTyping(false); // always fires — broadcastTyping no longer has an early-return guard
    }
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) return;
    setGifLoading(true);
    try {
      const key = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "dc6zaTOxFJmzC";
      const res  = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(query)}&limit=9&rating=pg-13`);
      const data = await res.json();
      setGifResults((data.data ?? []).map((g: any) => ({
        id: g.id, url: g.images.original.url, preview: g.images.fixed_height_small.url,
      })));
    } catch { setGifResults([]); }
    setGifLoading(false);
  };

  const sendGif = async (url: string) => {
    if (!userId || sending) return;
    setSending(true); setShowGifPicker(false);
    await (supabase as any).from("messages").insert({
      channel_id: channelId, sender_id: userId, content: "📷 GIF",
      gif_url: url, reply_to_id: replyToMessage?.id ?? null,
    });
    setReplyToMessage(null); setSending(false);
  };

  const sendSticker = async (stickerId: string) => {
    if (!userId || sending) return;
    setSending(true); setShowStickerPicker(false);
    await (supabase as any).from("messages").insert({
      channel_id: channelId, sender_id: userId, content: stickerId,
      sticker_id: stickerId, reply_to_id: replyToMessage?.id ?? null,
    });
    setReplyToMessage(null); setSending(false);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || !userId || sending) return;

    setInput("");
    setSending(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    broadcastTyping(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const filteredContent = (channel?.type === "global" || channel?.type === "university")
      ? filterProfanity(content)
      : content;

    const { data: inserted, error } = await (supabase as any)
      .from("messages")
      .insert({
        channel_id: channelId,
        sender_id: userId,
        content: filteredContent,
        reply_to_id: replyToMessage?.id ?? null,
      })
      .select("id, content, created_at, sender_id")
      .single();

    setReplyToMessage(null);

    if (error) {
      setSendError(error.message);
    } else if (inserted) {
      // Optimistic append with cached self profile so the message appears
      // without waiting for realtime echo. The realtime handler dedupes by id.
      const selfProfile = profileCache.current.get(userId) ?? {
        full_name: myName,
        avatar_url: myAvatar,
        username: null,
        branch: null,
        universities: null,
      };
      setMessages(prev => {
        if (prev.some(m => m.id === inserted.id)) return prev;
        return [...prev, {
          id: inserted.id,
          content: inserted.content ?? content,
          created_at: inserted.created_at,
          sender_id: inserted.sender_id,
          sender: selfProfile as Profile,
        }];
      });
      setTimeout(() => scrollToBottom(), 50);
    }

    setSending(false);
    textareaRef.current?.focus();
  };

  const handleDelete = async (msgId: string) => {
    await supabase.from("messages").update({ is_deleted: true }).eq("id", msgId).eq("sender_id", userId ?? "");
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Navigate / select mention dropdown
    if (mentionResults.length > 0 && mentionQuery !== null) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, mentionResults.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        const m = mentionResults[mentionIndex];
        if (m) insertMention(m.full_name);
        return;
      }
      if (e.key === "Escape") { setMentionQuery(null); setMentionResults([]); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const channelIcon = channel?.type === "global"
    ? <Globe className="w-4 h-4 text-[rgb(var(--primary))]" />
    : <Building2 className="w-4 h-4 text-[rgb(var(--primary))]" />;

  // Group messages: show header if sender changed or >5 min gap
  const showHeader = (i: number) => {
    if (i === 0) return true;
    const prev = messages[i - 1];
    const cur = messages[i];
    if (prev.sender_id !== cur.sender_id) return true;
    return new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;
  };

  return (
    <>
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--card)/0.6)] backdrop-blur-sm flex-shrink-0">
        {chatShell && (
          <button
            onClick={chatShell.openChannels}
            className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors flex-shrink-0"
            aria-label="Open channels"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {channelIcon}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold leading-tight truncate">
            {channel?.name ?? "Loading…"}
          </h2>
          <p className="text-xs text-[rgb(var(--muted-fg))]">
            {onlineCount > 0 ? `${onlineCount} online` : ""}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading && (
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[rgb(var(--muted))]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 rounded bg-[rgb(var(--muted))]" />
                  <div className="h-3 w-48 rounded bg-[rgb(var(--muted))]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[rgb(var(--muted-fg))]">
            <MessageCircle className="w-10 h-10 opacity-30" />
            <p className="text-sm">Be the first to say something!</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={cn("flex gap-3 group", showHeader(i) ? "mt-4 first:mt-0" : "mt-0.5")}
          >
            {/* Avatar column */}
            {showHeader(i) ? (
              <UserHoverCard
                userId={msg.sender_id}
                name={msg.sender?.full_name ?? "Unknown"}
                avatarUrl={msg.sender?.avatar_url}
                uniShort={(msg.sender?.universities as any)?.short_name}
                myId={userId}
              >
                <button className="flex-shrink-0">
                  <Avatar name={msg.sender?.full_name} url={msg.sender?.avatar_url} />
                </button>
              </UserHoverCard>
            ) : (
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                <span className="text-[10px] text-[rgb(var(--muted-fg))] opacity-0 group-hover:opacity-100 transition-opacity">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              {showHeader(i) && (
                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mb-0.5">
                  <UserHoverCard
                    userId={msg.sender_id}
                    name={msg.sender?.full_name ?? "Unknown"}
                    avatarUrl={msg.sender?.avatar_url}
                    uniShort={(msg.sender?.universities as any)?.short_name}
                    myId={userId}
                  >
                    <span className={cn(
                      "text-sm font-semibold leading-tight cursor-pointer hover:underline",
                      msg.sender_id === userId ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--fg))]"
                    )}>
                      {msg.sender_id === userId ? "You" : (msg.sender?.full_name ?? "Unknown")}
                    </span>
                  </UserHoverCard>
                  {msg.sender?.universities && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] leading-tight">
                      {(msg.sender.universities as any).short_name}
                    </span>
                  )}
                  {msg.sender?.branch && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] leading-tight">
                      {(msg.sender.branch as any).name}
                    </span>
                  )}
                  <span className="text-xs text-[rgb(var(--muted-fg))]">
                    {formatRelativeTime(msg.created_at)}
                  </span>
                </div>
              )}
              {/* Reply-to context */}
              {msg.reply_to_id && (
                <div className="mb-1 pl-3 border-l-2 border-[rgb(var(--primary)/0.4)] text-xs text-[rgb(var(--muted-fg))] truncate">
                  ↩ Replied to a message
                </div>
              )}
              {/* Message body */}
              {msg.gif_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={msg.gif_url} alt="GIF" loading="lazy" className="max-w-[240px] max-h-[180px] rounded-xl object-cover" />
              ) : msg.sticker_id ? (
                <span className="text-5xl">{msg.sticker_id}</span>
              ) : (
                <p className="text-sm text-[rgb(var(--fg))] leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content.split(/(@\S+)/g).map((part, pi) =>
                    part.startsWith("@") ? (
                      <span key={pi}
                        className={cn(
                          "font-semibold px-1 rounded",
                          myName && part.slice(1).toLowerCase() === myName.split(" ")[0].toLowerCase()
                            ? "bg-[rgb(var(--primary)/0.2)] text-[rgb(var(--primary))]"
                            : "text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.08)]"
                        )}>
                        {part}
                      </span>
                    ) : part
                  )}
                </p>
              )}
            </div>
            <div className="flex items-start gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all self-start mt-0.5">
              <button
                onClick={() => setReplyToMessage(msg)}
                className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
                title="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
              {msg.sender_id === userId && (
                <button
                  onClick={() => handleDelete(msg.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-[rgb(var(--muted-fg))]"
                  title="Delete message"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator — Discord-style grouping */}
        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 mt-2 text-xs text-[rgb(var(--muted-fg))]">
            <div className="flex gap-0.5 items-end">
              {[0, 150, 300].map(delay => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--muted-fg))] animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
            <span>{formatTypingNames(typingNames)}</span>
          </div>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="p-3 flex-shrink-0 border-t border-[rgb(var(--border))] relative">
        {/* Emoji picker */}
        {showEmojiPicker && emojiData && (
          <div ref={emojiPickerRef} className="absolute bottom-full right-3 mb-2 z-50">
            <EmojiPicker
              data={emojiData}
              onEmojiSelect={insertEmoji}
              theme="auto"
              previewPosition="none"
              skinTonePosition="none"
            />
          </div>
        )}
        {/* GIF picker */}
        {showGifPicker && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-2xl p-3 shadow-xl z-40">
            <div className="flex gap-2 mb-3">
              <input value={gifSearch} onChange={e => setGifSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchGifs(gifSearch)}
                placeholder="Search GIFs…"
                className="flex-1 bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[rgb(var(--primary))]" />
              <button onClick={() => searchGifs(gifSearch)} className="px-3 py-1.5 rounded-xl bg-[rgb(var(--primary))] text-white text-sm">Search</button>
            </div>
            {gifLoading ? (
              <p className="text-center text-xs text-[rgb(var(--muted-fg))] py-4">Loading…</p>
            ) : gifResults.length === 0 ? (
              <p className="text-center text-xs text-[rgb(var(--muted-fg))] py-4">Search for GIFs above</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {gifResults.map(gif => (
                  <button key={gif.id} onClick={() => sendGif(gif.url)} className="rounded-xl overflow-hidden aspect-video hover:opacity-80 transition-opacity">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={gif.preview} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Sticker picker */}
        {showStickerPicker && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-2xl p-3 shadow-xl z-40">
            <div className="flex gap-1 mb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {STICKER_PACKS.map((pack, i) => (
                <button key={pack.name} onClick={() => setActiveStickerPack(i)}
                  className={cn("px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
                    activeStickerPack === i ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]" : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]")}>
                  {pack.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-1">
              {STICKER_PACKS[activeStickerPack].stickers.map(sticker => (
                <button key={sticker} onClick={() => sendSticker(sticker)}
                  className="text-2xl p-1.5 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors text-center">
                  {sticker}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* @Mention dropdown */}
        {mentionQuery !== null && mentionResults.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-2xl overflow-hidden shadow-xl z-40">
            {mentionResults.map((u, i) => (
              <button key={u.id} onMouseDown={e => { e.preventDefault(); insertMention(u.full_name); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  i === mentionIndex ? "bg-[rgb(var(--primary)/0.1)]" : "hover:bg-[rgb(var(--muted))]"
                )}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                  {u.avatar_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    : u.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name}</p>
                  {u.username && <p className="text-xs text-[rgb(var(--muted-fg))]">@{u.username}</p>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Reply preview */}
        {replyToMessage && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-[rgb(var(--muted))] rounded-xl text-xs">
            <Reply className="w-3.5 h-3.5 text-[rgb(var(--primary))] flex-shrink-0" />
            <span className="text-[rgb(var(--muted-fg))] truncate flex-1">
              Replying to <strong>{replyToMessage.sender?.full_name ?? "Unknown"}</strong>: {replyToMessage.content.slice(0, 60)}
            </span>
            <button onClick={() => setReplyToMessage(null)} className="flex-shrink-0 text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {sendError && (
          <p className="text-xs text-[rgb(var(--destructive))] mb-2 px-1">{sendError}</p>
        )}
        <form onSubmit={handleSend}>
          <div className={cn(
            "flex items-end gap-2 rounded-2xl border px-3 py-2.5 transition-all duration-200",
            "bg-[rgb(var(--input))] border-[rgb(var(--border))]",
            "focus-within:border-[rgb(var(--primary)/0.4)] focus-within:ring-1 focus-within:ring-[rgb(var(--ring)/0.3)]"
          )}>
            <button
              type="button"
              className="flex-shrink-0 mb-0.5 text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${channel?.name ?? "…"}`}
              rows={1}
              className="flex-1 bg-transparent text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] resize-none focus:outline-none leading-relaxed"
              style={{ minHeight: "1.5rem", maxHeight: "8rem" }}
            />

            {/* GIF button */}
            <button type="button" onClick={() => { setShowGifPicker(p => !p); setShowStickerPicker(false); }}
              className={cn("flex-shrink-0 mb-0.5 px-1.5 rounded-lg text-xs font-bold transition-colors",
                showGifPicker ? "text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.1)]" : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]")}>
              GIF
            </button>
            {/* Sticker button */}
            <button type="button" onClick={() => { setShowStickerPicker(p => !p); setShowGifPicker(false); }}
              className="flex-shrink-0 mb-0.5 text-base leading-none transition-opacity hover:opacity-70">
              🎭
            </button>

            <button
              type="button"
              onClick={toggleEmojiPicker}
              className={cn(
                "flex-shrink-0 mb-0.5 transition-colors",
                showEmojiPicker
                  ? "text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <Smile className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={!input.trim() || sending}
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                input.trim()
                  ? "bg-[rgb(var(--primary))] text-white hover:opacity-90"
                  : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-[rgb(var(--muted-fg))] mt-1.5 px-1">
            Press <kbd className="px-1 py-0.5 rounded bg-[rgb(var(--muted))] font-mono text-[9px]">Enter</kbd> to send,{" "}
            <kbd className="px-1 py-0.5 rounded bg-[rgb(var(--muted))] font-mono text-[9px]">Shift+Enter</kbd> for new line
          </p>
        </form>
      </div>
    </>
  );
}
