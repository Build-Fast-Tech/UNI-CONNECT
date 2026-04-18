"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { Send, Paperclip, Globe, Building2, MessageCircle, Smile } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Profile {
  full_name: string;
  avatar_url: string | null;
  username: string | null;
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

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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
        .select("id, content, created_at, sender_id, sender:profiles!sender_id(full_name, avatar_url, username)")
        .eq("channel_id", channelId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(60);

      if (msgs) setMessages(msgs as unknown as Message[]);
      setLoading(false);
    };

    init();
  }, [channelId]);

  // Scroll to bottom after initial load
  useEffect(() => {
    if (!loading) scrollToBottom(false);
  }, [loading]);

  // Realtime: new messages
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
          const { data: msg } = await supabase
            .from("messages")
            .select("id, content, created_at, sender_id, sender:profiles!sender_id(full_name, avatar_url, username)")
            .eq("id", payload.new.id)
            .single();
          if (msg) {
            setMessages(prev => [...prev, msg as unknown as Message]);
            setTimeout(() => scrollToBottom(), 80);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [channelId]);

  // Presence: online count + typing
  useEffect(() => {
    if (!userId || !myName) return;

    const presenceChan = supabase.channel(`presence:${channelId}`, {
      config: { presence: { key: userId } },
    });
    presenceRef.current = presenceChan;

    presenceChan
      .on("presence", { event: "sync" }, () => {
        const state = presenceChan.presenceState<{ name: string; typing: boolean }>();
        const entries = Object.values(state).flat();
        setOnlineCount(entries.length);
        setTypingNames(
          entries
            .filter(e => e.typing && e.name !== myName)
            .map(e => e.name.split(" ")[0])
        );
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChan.track({ name: myName, typing: false });
        }
      });

    return () => { supabase.removeChannel(presenceChan); };
  }, [channelId, userId, myName]);

  const broadcastTyping = async (isTyping: boolean) => {
    await presenceRef.current?.track({ name: myName, typing: isTyping });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    resizeTextarea();

    broadcastTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => broadcastTyping(false), 2000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || !userId || sending) return;

    setInput("");
    setSending(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    broadcastTyping(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await supabase.from("messages").insert({
      channel_id: channelId,
      sender_id: userId,
      content,
    });

    setSending(false);
    textareaRef.current?.focus();
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
              <Avatar name={msg.sender?.full_name} url={msg.sender?.avatar_url} />
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
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className={cn(
                    "text-sm font-semibold",
                    msg.sender_id === userId ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--fg))]"
                  )}>
                    {msg.sender_id === userId ? "You" : (msg.sender?.full_name ?? "Unknown")}
                  </span>
                  <span className="text-xs text-[rgb(var(--muted-fg))]">
                    {formatRelativeTime(msg.created_at)}
                  </span>
                </div>
              )}
              <p className="text-sm text-[rgb(var(--fg))] leading-relaxed whitespace-pre-wrap break-words">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
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
            <span>
              {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing…
            </span>
          </div>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="p-3 flex-shrink-0 border-t border-[rgb(var(--border))]">
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
              className="flex-shrink-0 mb-0.5 text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
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
