"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import dynamic from "next/dynamic";
import { Send, Paperclip, Globe, Building2, MessageCircle, Smile, Menu, Trash2 } from "lucide-react";
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
}

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    resizeTextarea();

    if (e.target.value.trim().length > 0) {
      if (!typingStateRef.current) broadcastTyping(true); // only broadcast on first keystroke
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => broadcastTyping(false), 3000);
    } else {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      broadcastTyping(false); // always fires — broadcastTyping no longer has an early-return guard
    }
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

    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        channel_id: channelId,
        sender_id: userId,
        content,
      })
      .select("id, content, created_at, sender_id")
      .single();

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
              <p className="text-sm text-[rgb(var(--fg))] leading-relaxed whitespace-pre-wrap break-words">
                {msg.content}
              </p>
            </div>
            {msg.sender_id === userId && (
              <button
                onClick={() => handleDelete(msg.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-[rgb(var(--muted-fg))] transition-all self-start mt-0.5 flex-shrink-0"
                title="Delete message"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
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
