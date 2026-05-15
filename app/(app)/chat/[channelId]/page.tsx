"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Send, Globe, Building2, MessageCircle, Smile,
  Menu, Trash2, Reply, X as XIcon, Plus, Sticker, Loader2,
  Search, BarChart2, Copy, ChevronDown,
  FileText, ImageIcon, Camera, Music, Mic,
} from "lucide-react";
import { filterProfanity } from "@/lib/utils/profanity";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime, formatTypingNames } from "@/lib/utils";
import { UserHoverCard } from "@/components/ui/UserHoverCard";
import { useChatShell } from "@/components/chat/ChatShell";
import { CameraModal } from "@/components/chat/CameraModal";

const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  full_name: string;
  avatar_url: string | null;
  username: string | null;
  branch: { name: string } | null;
  universities: { short_name: string } | null;
}

interface ReplyPreview {
  id: string;
  content: string;
  sender: { full_name: string } | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: Profile | null;
  reply_to_id?: string | null;
  replied_msg?: ReplyPreview | null;
  gif_url?: string | null;
  sticker_id?: string | null;
  poll_data?: { question: string; options: string[] } | null;
}

interface Channel {
  id: string;
  type: string;
  name: string | null;
}

interface GifResult { id: string; url: string; preview: string; }
interface CustomPack { id: string; name: string; stickers: string[]; }

// reactions: { messageId -> { emoji -> userId[] } }
type ReactionsMap = Record<string, Record<string, string[]>>;
// poll votes: { messageId -> optionIndex }
type PollVotesMap = Record<string, number>;

// ─── Constants ────────────────────────────────────────────────────────────────

const STICKER_TABS = [
  { id: "trending", label: "🔥 Hot" },
  { id: "happy",    label: "😊 Happy" },
  { id: "love",     label: "❤️ Love" },
  { id: "funny",    label: "😂 Funny" },
  { id: "sad",      label: "😢 Sad" },
  { id: "custom",   label: "⭐ Mine" },
];

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const CUSTOM_PACKS_KEY = (uid: string) => `uc_sticker_packs_${uid}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadCustomPacks(uid: string): CustomPack[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PACKS_KEY(uid));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveCustomPacks(uid: string, packs: CustomPack[]) {
  try { localStorage.setItem(CUSTOM_PACKS_KEY(uid), JSON.stringify(packs)); } catch {}
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dateSeparatorLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function showDateSeparator(messages: Message[], i: number): boolean {
  if (i === 0) return true;
  const prev = new Date(messages[i - 1].created_at);
  const cur  = new Date(messages[i].created_at);
  return prev.toDateString() !== cur.toDateString();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

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

// ─── Context menu ─────────────────────────────────────────────────────────────

interface ContextMenuProps {
  x: number;
  y: number;
  isOwn: boolean;
  onReply: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onClose: () => void;
}

function ContextMenu({ x, y, isOwn, onReply, onDelete, onCopy, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Clamp to viewport
  const style: React.CSSProperties = {
    position: "fixed",
    top: Math.min(y, window.innerHeight - 200),
    left: Math.min(x, window.innerWidth - 160),
    zIndex: 9999,
  };

  return (
    <div
      ref={ref}
      style={style}
      className="w-40 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl overflow-hidden py-1"
    >
      <button
        onClick={() => { onReply(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[rgb(var(--muted))] transition-colors text-left"
      >
        <Reply className="w-4 h-4 text-[rgb(var(--muted-fg))]" /> Reply
      </button>
      <button
        onClick={() => { onCopy(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[rgb(var(--muted))] transition-colors text-left"
      >
        <Copy className="w-4 h-4 text-[rgb(var(--muted-fg))]" /> Copy
      </button>
      {isOwn && (
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-500 transition-colors text-left"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      )}
    </div>
  );
}

// ─── Poll creator modal ───────────────────────────────────────────────────────

interface PollCreatorProps {
  onClose: () => void;
  onSubmit: (question: string, options: string[]) => void;
}

function PollCreator({ onClose, onSubmit }: PollCreatorProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => { if (options.length < 6) setOptions(o => [...o, ""]); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(o => o.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, val: string) => setOptions(o => o.map((v, idx) => idx === i ? val : v));

  const canSubmit = question.trim() && options.filter(o => o.trim()).length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-[rgb(var(--card))] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Create Poll</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Poll question…"
          className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[rgb(var(--primary))] placeholder:text-[rgb(var(--muted-fg))]"
        />
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] placeholder:text-[rgb(var(--muted-fg))]"
              />
              {options.length > 2 && (
                <button onClick={() => removeOption(i)} className="p-1.5 text-[rgb(var(--muted-fg))] hover:text-red-500">
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button onClick={addOption} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[rgb(var(--border))] text-xs text-[rgb(var(--muted-fg))] hover:border-[rgb(var(--primary)/0.5)] hover:text-[rgb(var(--primary))] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add option
            </button>
          )}
        </div>
        <button
          disabled={!canSubmit}
          onClick={() => { if (canSubmit) onSubmit(question.trim(), options.filter(o => o.trim())); }}
          className="w-full py-3 rounded-2xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-bold disabled:opacity-40 transition-opacity"
        >
          Create Poll
        </button>
      </div>
    </div>
  );
}

// ─── Poll card ────────────────────────────────────────────────────────────────

interface PollCardProps {
  messageId: string;
  pollData: { question: string; options: string[] };
  votes: Record<string, string[]>; // optionIndex (as string key) -> userId[]
  myVote: number | undefined;
  onVote: (messageId: string, optionIndex: number) => void;
  isOwn: boolean;
}

function PollCard({ messageId, pollData, votes, myVote, onVote, isOwn }: PollCardProps) {
  const totalVotes = Object.values(votes).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-sm font-bold leading-snug">{pollData.question}</p>
      <div className="flex flex-col gap-1.5">
        {pollData.options.map((opt, i) => {
          const count = (votes[i] ?? []).length;
          const pct   = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const voted = myVote === i;
          return (
            <button
              key={i}
              onClick={() => onVote(messageId, i)}
              className={cn(
                "relative w-full rounded-xl px-3 py-2 text-left text-xs font-medium overflow-hidden border transition-all",
                voted
                  ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.5)] hover:bg-[rgb(var(--muted))]"
              )}
            >
              {/* progress bar */}
              <span
                className={cn("absolute inset-y-0 left-0 rounded-xl transition-all duration-500", voted ? "bg-[rgb(var(--primary)/0.2)]" : "bg-[rgb(var(--muted))]")}
                style={{ width: `${pct}%` }}
              />
              <span className="relative flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  {voted && <span className="text-[rgb(var(--primary))]">✓</span>}
                  {opt}
                </span>
                <span className="opacity-60">{pct}%</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] opacity-50">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = use(params);
  const supabase  = createClient();
  const chatShell = useChatShell();

  // ── Core state ──────────────────────────────────────────────────────────────
  const [messages, setMessages]         = useState<Message[]>([]);
  const [channel, setChannel]           = useState<Channel | null>(null);
  const [input, setInput]               = useState("");
  const [sending, setSending]           = useState(false);
  const [readCounts, setReadCounts]     = useState<Record<string, number>>({});
  const [userId, setUserId]             = useState<string | null>(null);
  const [myName, setMyName]             = useState<string>("");
  const [myAvatar, setMyAvatar]         = useState<string | null>(null);
  const [typingNames, setTypingNames]   = useState<string[]>([]);
  const [onlineCount, setOnlineCount]   = useState(0);
  const [loading, setLoading]           = useState(true);
  const [sendError, setSendError]       = useState("");
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  // ── Search ──────────────────────────────────────────────────────────────────
  const [showSearch, setShowSearch]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Reactions ───────────────────────────────────────────────────────────────
  const [reactions, setReactions]         = useState<ReactionsMap>({});
  const [hoveredMsgId, setHoveredMsgId]   = useState<string | null>(null);
  const hoverTimeoutRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Polls ───────────────────────────────────────────────────────────────────
  const [showPollCreator, setShowPollCreator] = useState(false);
  // pollVotes: { messageId -> optionIndex } for the current user
  const [myPollVotes, setMyPollVotes]         = useState<PollVotesMap>({});
  // allPollVotes: { messageId -> { optionIndex -> userId[] } }
  const [allPollVotes, setAllPollVotes]       = useState<Record<string, Record<string, string[]>>>({});

  // ── Context menu ─────────────────────────────────────────────────────────────
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; msg: Message } | null>(null);

  // ── Swipe-to-reply (mobile) ──────────────────────────────────────────────────
  const [swipeMsgId,  setSwipeMsgId]  = useState<string | null>(null);
  const [swipeDelta,  setSwipeDelta]  = useState(0);
  const swipeTouchX   = useRef(0);

  // ── @mention ─────────────────────────────────────────────────────────────────
  const [mentionQuery,   setMentionQuery]   = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<Array<{ id: string; full_name: string; username: string | null; avatar_url: string | null }>>([]);
  const [mentionIndex,   setMentionIndex]   = useState(0);

  // ── GIF picker ───────────────────────────────────────────────────────────────
  const [showGifPicker,     setShowGifPicker]     = useState(false);
  const [gifSearch,         setGifSearch]         = useState("");
  const [gifResults,        setGifResults]        = useState<GifResult[]>([]);
  const [gifLoading,        setGifLoading]        = useState(false);
  const [gifSetupRequired,  setGifSetupRequired]  = useState(false);

  // ── Sticker picker ───────────────────────────────────────────────────────────
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [activeStickerTab,  setActiveStickerTab]  = useState("trending");
  const [stickerResults,    setStickerResults]    = useState<GifResult[]>([]);
  const [stickerLoading,    setStickerLoading]    = useState(false);
  const [customPacks,       setCustomPacks]       = useState<CustomPack[]>([]);
  const [activeCustomPack,  setActiveCustomPack]  = useState(0);

  // ── Add custom pack modal ────────────────────────────────────────────────────
  const [showAddPack,      setShowAddPack]      = useState(false);
  const [newPackName,      setNewPackName]      = useState("");
  const [newPackFiles,     setNewPackFiles]     = useState<File[]>([]);
  const [newPackPreviews,  setNewPackPreviews]  = useState<string[]>([]);
  const [packUploading,    setPackUploading]    = useState(false);

  // ── Media upload ─────────────────────────────────────────────────────────────
  const [mediaPreview,   setMediaPreview]   = useState<{ file: File; url: string } | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const docFileRef      = useRef<HTMLInputElement>(null);
  const audioFileRef    = useRef<HTMLInputElement>(null);
  const stickerFileRef  = useRef<HTMLInputElement>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachMenuRef   = useRef<HTMLDivElement>(null);
  const [showCamera,    setShowCamera]    = useState(false);

  // Voice recording
  const [isRecording,   setIsRecording]   = useState(false);
  const [recordSecs,    setRecordSecs]    = useState(0);
  const [audioBlob,     setAudioBlob]     = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [voiceSending,  setVoiceSending]  = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef        = useRef<Blob[]>([]);

  // ── Emoji ─────────────────────────────────────────────────────────────────────
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emojiData, setEmojiData] = useState<any>(null);
  useEffect(() => { import("@emoji-mart/data").then(mod => setEmojiData(mod.default)); }, []);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────────
  const bottomRef      = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const typingTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceRef    = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subRef         = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reactSubRef    = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollSubRef     = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimers   = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const profileCache   = useRef<Map<string, Profile>>(new Map());
  const gifSearchRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStateRef = useRef(false);

  // ─── Derived: filtered messages ──────────────────────────────────────────────
  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // ─── Mention sound ────────────────────────────────────────────────────────────
  const playMentionSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      [660, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.35, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.12); osc.stop(now + i * 0.12 + 0.4);
      });
    } catch {}
  };

  // ─── @Mention search ──────────────────────────────────────────────────────────
  const searchMentions = useCallback(async (query: string) => {
    if (query.length < 1) { setMentionResults([]); return; }
    const { data } = await supabase.from("profiles").select("id, full_name, username, avatar_url")
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`).limit(6);
    setMentionResults((data as any[]) ?? []);
    setMentionIndex(0);
  }, [supabase]);

  // ─── Close pickers on outside click ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Emoji ────────────────────────────────────────────────────────────────────
  const insertEmoji = (emoji: { native: string }) => {
    setInput(prev => prev + emoji.native);
    textareaRef.current?.focus();
    resizeTextarea();
  };
  const toggleEmojiPicker = () => { setShowEmojiPicker(p => !p); setShowAttachMenu(false); };

  // ─── Attach-menu outside click ────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) setShowAttachMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ─── Voice recording ──────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg" });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
    } catch {
      setSendError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    chunksRef.current = [];
    setIsRecording(false); setRecordSecs(0);
    setAudioBlob(null);
    if (audioPreviewUrl) { URL.revokeObjectURL(audioPreviewUrl); setAudioPreviewUrl(null); }
  };

  const sendVoiceNote = async () => {
    if (!audioBlob || !userId || voiceSending) return;
    setVoiceSending(true);
    const ext = audioBlob.type.includes("webm") ? "webm" : "ogg";
    const path = `voice/${userId}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from("chat-media").upload(path, audioBlob, { contentType: audioBlob.type, upsert: false });
    if (error) { setSendError("Failed to upload voice note."); setVoiceSending(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(data.path);
    await (supabase as any).from("messages").insert({
      channel_id: channelId, sender_id: userId, content: "🎤 Voice note",
      gif_url: publicUrl, reply_to_id: replyToMessage?.id ?? null,
    });
    setReplyToMessage(null);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioBlob(null); setAudioPreviewUrl(null); setRecordSecs(0);
    setVoiceSending(false);
  };

  const sendCameraPhoto = async (blob: Blob) => {
    if (!userId) return;
    const path = `media/${userId}/${Date.now()}_camera.jpg`;
    const { data, error } = await supabase.storage.from("chat-media").upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) { setSendError("Failed to upload photo."); throw error; }
    const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(data.path);
    await (supabase as any).from("messages").insert({
      channel_id: channelId, sender_id: userId, content: "📷 Photo",
      gif_url: publicUrl, reply_to_id: replyToMessage?.id ?? null,
    });
    setReplyToMessage(null);
  };

  // ─── GIF ──────────────────────────────────────────────────────────────────────
  const fetchGifs = useCallback(async (query: string) => {
    setGifLoading(true);
    try {
      const p = new URLSearchParams({ type: "gif", limit: "9" });
      if (query.trim()) p.set("q", query.trim());
      const res  = await fetch(`/api/gifs?${p}`);
      const data = await res.json();
      setGifSetupRequired(!!data.setup_required);
      setGifResults(data.results ?? []);
    } catch { setGifResults([]); }
    setGifLoading(false);
  }, []);

  const handleGifSearchChange = (val: string) => {
    setGifSearch(val);
    if (gifSearchRef.current) clearTimeout(gifSearchRef.current);
    gifSearchRef.current = setTimeout(() => fetchGifs(val), 400);
  };

  useEffect(() => {
    if (showGifPicker && gifResults.length === 0) fetchGifs("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGifPicker]);

  // ─── Stickers ─────────────────────────────────────────────────────────────────
  const fetchStickers = useCallback(async (tab: string) => {
    if (tab === "custom") return;
    setStickerLoading(true);
    try {
      const query = tab === "trending" ? "cute" : tab;
      const p = new URLSearchParams({ type: "sticker", q: query, limit: "16" });
      const res  = await fetch(`/api/gifs?${p}`);
      const data = await res.json();
      setStickerResults(data.results ?? []);
    } catch { setStickerResults([]); }
    setStickerLoading(false);
  }, []);

  useEffect(() => {
    if (showStickerPicker) fetchStickers(activeStickerTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStickerPicker, activeStickerTab]);

  useEffect(() => {
    if (userId) setCustomPacks(loadCustomPacks(userId));
  }, [userId]);

  // ─── Custom sticker pack ──────────────────────────────────────────────────────
  const handlePackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 20);
    setNewPackFiles(files);
    setNewPackPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSavePack = async () => {
    if (!userId || !newPackName.trim() || newPackFiles.length === 0) return;
    setPackUploading(true);
    const uploaded: string[] = [];
    for (const file of newPackFiles) {
      const path = `stickers/${userId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const { data, error } = await supabase.storage.from("chat-media").upload(path, file, { contentType: file.type, upsert: false });
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(data.path);
        uploaded.push(publicUrl);
      } else {
        const b64 = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        uploaded.push(b64);
      }
    }
    const newPack: CustomPack = { id: `pack_${Date.now()}`, name: newPackName.trim(), stickers: uploaded };
    const updated = [...customPacks, newPack];
    setCustomPacks(updated);
    saveCustomPacks(userId, updated);
    setNewPackName(""); setNewPackFiles([]); setNewPackPreviews([]);
    if (stickerFileRef.current) stickerFileRef.current.value = "";
    setShowAddPack(false);
    setActiveStickerTab("custom");
    setActiveCustomPack(updated.length - 1);
    setPackUploading(false);
  };

  const handleDeletePack = (packId: string) => {
    if (!userId) return;
    const updated = customPacks.filter(p => p.id !== packId);
    setCustomPacks(updated);
    saveCustomPacks(userId, updated);
    setActiveCustomPack(0);
  };

  // ─── Media upload ─────────────────────────────────────────────────────────────
  const makeFileHandler = (kind: "photo" | "audio" | "doc") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      // Enforce type per kind
      if (kind === "photo" && !file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        setSendError("Only image or video files allowed here."); return;
      }
      if (kind === "audio" && !file.type.startsWith("audio/")) {
        setSendError("Only audio files allowed here."); return;
      }
      if (kind === "doc" && (file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type.startsWith("video/"))) {
        setSendError("Use Photos or Audio attachment for media files."); return;
      }

      if (file.size > 20 * 1024 * 1024) { setSendError("Max file size is 20 MB"); return; }
      setMediaPreview({ file, url: URL.createObjectURL(file) });
    };

  const handlePhotoSelect = makeFileHandler("photo");
  const handleAudioSelect = makeFileHandler("audio");
  const handleDocSelect   = makeFileHandler("doc");

  const sendMedia = async () => {
    if (!mediaPreview || !userId || mediaUploading) return;
    setMediaUploading(true);
    const { file } = mediaPreview;

    // Upload to the correct subfolder based on file type
    let folder = "media";
    if (file.type.startsWith("audio/")) folder = "audio";
    else if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) folder = "docs";

    const path = `${folder}/${userId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { data, error } = await supabase.storage.from("chat-media").upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      setSendError("Failed to upload file. Make sure the 'chat-media' storage bucket exists in Supabase.");
      setMediaUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(data.path);

    let content = "📎 File";
    if (file.type.startsWith("image/"))  content = "📷 Photo";
    else if (file.type.startsWith("video/")) content = "🎥 Video";
    else if (file.type.startsWith("audio/")) content = "🎵 Audio";
    else if (file.name.match(/\.pdf$/i)) content = "📄 PDF";
    else if (file.name.match(/\.(doc|docx)$/i)) content = "📝 Document";
    else if (file.name.match(/\.(ppt|pptx)$/i)) content = "📊 Presentation";
    else if (file.name.match(/\.(xls|xlsx)$/i)) content = "📊 Spreadsheet";

    await (supabase as any).from("messages").insert({
      channel_id: channelId, sender_id: userId,
      content,
      gif_url: publicUrl,
      reply_to_id: replyToMessage?.id ?? null,
    });
    setReplyToMessage(null);
    setMediaPreview(null);
    setMediaUploading(false);
  };

  const cancelMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview.url);
    setMediaPreview(null);
  };

  // ─── Send GIF ─────────────────────────────────────────────────────────────────
  const sendGif = async (url: string) => {
    if (!userId || sending) return;
    setSending(true); setShowGifPicker(false);
    await (supabase as any).from("messages").insert({
      channel_id: channelId, sender_id: userId, content: "📷 GIF",
      gif_url: url, reply_to_id: replyToMessage?.id ?? null,
    });
    setReplyToMessage(null); setSending(false);
  };

  // ─── Send sticker ─────────────────────────────────────────────────────────────
  const sendSticker = async (stickerUrl: string) => {
    if (!userId || sending) return;
    setSending(true); setShowStickerPicker(false);
    await (supabase as any).from("messages").insert({
      channel_id: channelId, sender_id: userId, content: "🎭 Sticker",
      sticker_id: stickerUrl, reply_to_id: replyToMessage?.id ?? null,
    });
    setReplyToMessage(null); setSending(false);
  };

  // ─── Send poll ────────────────────────────────────────────────────────────────
  const sendPoll = async (question: string, options: string[]) => {
    if (!userId || sending) return;
    setSending(true); setShowPollCreator(false);
    await (supabase as any).from("messages").insert({
      channel_id: channelId, sender_id: userId, content: `📊 Poll: ${question}`,
      poll_data: { question, options },
      reply_to_id: replyToMessage?.id ?? null,
    });
    setReplyToMessage(null); setSending(false);
  };

  // ─── Poll vote ────────────────────────────────────────────────────────────────
  const handlePollVote = async (messageId: string, optionIndex: number) => {
    if (!userId) return;
    const existing = myPollVotes[messageId];

    if (existing === optionIndex) {
      // Toggle off — delete
      await (supabase as any).from("poll_votes").delete()
        .eq("message_id", messageId).eq("user_id", userId);
      setMyPollVotes(prev => { const n = { ...prev }; delete n[messageId]; return n; });
      setAllPollVotes(prev => {
        const n = { ...prev };
        if (n[messageId]?.[optionIndex]) {
          n[messageId][optionIndex] = n[messageId][optionIndex].filter(u => u !== userId);
        }
        return n;
      });
    } else {
      // Upsert
      await (supabase as any).from("poll_votes").upsert({ message_id: messageId, user_id: userId, option_index: optionIndex }, { onConflict: "message_id,user_id" });
      setMyPollVotes(prev => ({ ...prev, [messageId]: optionIndex }));
      setAllPollVotes(prev => {
        const n = { ...prev, [messageId]: { ...(prev[messageId] ?? {}) } };
        // Remove from old option
        if (existing !== undefined && n[messageId][existing]) {
          n[messageId][existing] = n[messageId][existing].filter(u => u !== userId);
        }
        n[messageId][optionIndex] = [...(n[messageId][optionIndex] ?? []), userId];
        return n;
      });
    }
  };

  // ─── Reactions ────────────────────────────────────────────────────────────────
  const handleReact = async (messageId: string, emoji: string) => {
    if (!userId) return;
    const existing = reactions[messageId]?.[emoji] ?? [];
    const hasReacted = existing.includes(userId);

    if (hasReacted) {
      await (supabase as any).from("message_reactions").delete()
        .eq("message_id", messageId).eq("user_id", userId).eq("emoji", emoji);
      setReactions(prev => {
        const n = { ...prev, [messageId]: { ...prev[messageId] } };
        n[messageId][emoji] = (n[messageId][emoji] ?? []).filter(u => u !== userId);
        if (n[messageId][emoji].length === 0) delete n[messageId][emoji];
        return n;
      });
    } else {
      await (supabase as any).from("message_reactions").insert({ message_id: messageId, user_id: userId, emoji });
      setReactions(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          [emoji]: [...(prev[messageId]?.[emoji] ?? []), userId],
        },
      }));
    }
    setHoveredMsgId(null);
  };

  // ─── Load reactions for displayed messages ────────────────────────────────────
  const loadReactions = useCallback(async (msgIds: string[]) => {
    if (msgIds.length === 0) return;
    const { data } = await (supabase as any).from("message_reactions")
      .select("message_id, user_id, emoji")
      .in("message_id", msgIds);
    if (!data) return;
    const map: ReactionsMap = {};
    for (const row of data as { message_id: string; user_id: string; emoji: string }[]) {
      if (!map[row.message_id]) map[row.message_id] = {};
      if (!map[row.message_id][row.emoji]) map[row.message_id][row.emoji] = [];
      map[row.message_id][row.emoji].push(row.user_id);
    }
    setReactions(map);
  }, [supabase]);

  // ─── Load poll votes ──────────────────────────────────────────────────────────
  const loadPollVotes = useCallback(async (msgIds: string[]) => {
    if (msgIds.length === 0) return;
    const { data } = await (supabase as any).from("poll_votes")
      .select("message_id, user_id, option_index")
      .in("message_id", msgIds);
    if (!data) return;
    const myVotes: PollVotesMap = {};
    const allVotes: Record<string, Record<string, string[]>> = {};
    for (const row of data as { message_id: string; user_id: string; option_index: number }[]) {
      if (!allVotes[row.message_id]) allVotes[row.message_id] = {};
      if (!allVotes[row.message_id][row.option_index]) allVotes[row.message_id][row.option_index] = [];
      allVotes[row.message_id][row.option_index].push(row.user_id);
      if (row.user_id === userId) myVotes[row.message_id] = row.option_index;
    }
    setAllPollVotes(allVotes);
    setMyPollVotes(myVotes);
  }, [supabase, userId]);

  // ─── Load read counts for own messages ───────────────────────────────────────
  const loadReadCounts = useCallback(async (myMsgIds: string[], uid: string) => {
    if (myMsgIds.length === 0) return;
    const { data } = await (supabase as any).from("message_reads")
      .select("message_id")
      .in("message_id", myMsgIds)
      .neq("user_id", uid);
    if (!data) return;
    const counts: Record<string, number> = {};
    for (const row of data as { message_id: string }[]) {
      counts[row.message_id] = (counts[row.message_id] ?? 0) + 1;
    }
    setReadCounts(counts);
  }, [supabase]);

  // ─── Auto-resize textarea ──────────────────────────────────────────────────────
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  };

  const scrollToBottom  = useCallback((smooth = true) => { bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" }); }, []);
  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlight-msg");
      setTimeout(() => el.classList.remove("highlight-msg"), 2000);
    }
  };

  // ─── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: profile }, { data: chan }, { data: msgs }] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
        supabase.from("channels").select("id, type, name").eq("id", channelId).single(),
        (supabase as any).from("messages").select(`
          id, content, created_at, sender_id, gif_url, sticker_id, poll_data, reply_to_id,
          sender:profiles!sender_id(full_name, avatar_url, username, branch:branches!branch_id(name), universities!university_id(short_name)),
          replied_msg:messages!reply_to_id(id, content, sender:profiles!sender_id(full_name))
        `).eq("channel_id", channelId).eq("is_deleted", false).order("created_at", { ascending: true }).limit(60),
      ]);

      if (profile) { setMyName(profile.full_name); setMyAvatar(profile.avatar_url); }
      if (chan) setChannel(chan);
      if (msgs) {
        const typed = msgs as unknown as Message[];
        setMessages(typed);
        typed.forEach(m => {
          if (m.sender_id && m.sender && !profileCache.current.has(m.sender_id))
            profileCache.current.set(m.sender_id, m.sender);
        });
        const ids = typed.map(m => m.id);
        const pollIds = typed.filter(m => m.poll_data).map(m => m.id);
        const ownIds  = typed.filter(m => m.sender_id === user.id).map(m => m.id);
        await Promise.all([loadReactions(ids), loadPollVotes(pollIds), loadReadCounts(ownIds, user.id)]);
        // Mark all visible messages as read
        if (ids.length > 0) {
          (supabase as any).from("message_reads")
            .upsert(ids.map(id => ({ message_id: id, user_id: user.id })), { onConflict: "message_id,user_id", ignoreDuplicates: true })
            .then(() => {});
        }
      }
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => { if (!loading) scrollToBottom(false); }, [loading]);

  // Scroll to first search match
  useEffect(() => {
    if (searchQuery && filteredMessages.length > 0) {
      scrollToMessage(filteredMessages[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // ─── Realtime: messages ───────────────────────────────────────────────────────
  useEffect(() => {
    const sub = supabase.channel(`chat:${channelId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const row = payload.new as { id: string; content: string; created_at: string; sender_id: string; is_deleted?: boolean; gif_url?: string; sticker_id?: string; poll_data?: any; reply_to_id?: string };
          if (row.is_deleted) return;
          let sender = profileCache.current.get(row.sender_id) ?? null;
          if (!sender) {
            const { data } = await supabase.from("profiles").select("full_name, avatar_url, username, branch:branches!branch_id(name), universities!university_id(short_name)").eq("id", row.sender_id).single();
            if (data) { sender = data as unknown as Profile; profileCache.current.set(row.sender_id, sender); }
          }
          // Fetch the replied-to message if present (realtime payload has no joins)
          let replied_msg: ReplyPreview | null = null;
          if (row.reply_to_id) {
            const { data: rm } = await (supabase as any).from("messages")
              .select("id, content, sender:profiles!sender_id(full_name)")
              .eq("id", row.reply_to_id)
              .single();
            if (rm) replied_msg = rm as ReplyPreview;
          }
          const newMsg: Message = { id: row.id, content: row.content, created_at: row.created_at, sender_id: row.sender_id, sender, gif_url: row.gif_url, sticker_id: row.sticker_id, poll_data: row.poll_data, reply_to_id: row.reply_to_id, replied_msg };
          if (myName && row.sender_id !== userId && row.content?.toLowerCase().includes(`@${myName.split(" ")[0].toLowerCase()}`)) playMentionSound();
          setMessages(prev => { if (prev.some(m => m.id === row.id)) return prev; return [...prev, newMsg]; });
          // Mark incoming message as read
          if (userId && row.sender_id !== userId) {
            (supabase as any).from("message_reads")
              .upsert([{ message_id: row.id, user_id: userId }], { onConflict: "message_id,user_id", ignoreDuplicates: true })
              .then(() => {});
          }
          setTimeout(() => scrollToBottom(), 80);
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        (payload) => { const row = payload.new as { id: string; is_deleted?: boolean }; if (row.is_deleted) setMessages(prev => prev.filter(m => m.id !== row.id)); }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const data = payload.payload as { userId: string; name: string; typing: boolean };
        const tid = data.userId; const firstName = (data.name ?? "").split(" ")[0];
        if (typingTimers.current.has(tid)) { clearTimeout(typingTimers.current.get(tid)!); typingTimers.current.delete(tid); }
        if (data.typing) {
          setTypingNames(prev => prev.includes(firstName) ? prev : [...prev, firstName]);
          const t = setTimeout(() => { setTypingNames(prev => prev.filter(n => n !== firstName)); typingTimers.current.delete(tid); }, 5000);
          typingTimers.current.set(tid, t);
        } else {
          setTypingNames(prev => prev.filter(n => n !== firstName));
        }
      })
      .subscribe();
    subRef.current = sub;
    return () => { supabase.removeChannel(sub); subRef.current = null; typingTimers.current.forEach(t => clearTimeout(t)); typingTimers.current.clear(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  // ─── Realtime: reactions ──────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return;
    const ids = messages.map(m => m.id);
    const reactSub = supabase.channel(`reactions:${channelId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_reactions" },
        (payload) => {
          const row = payload.new as { message_id: string; user_id: string; emoji: string };
          if (!ids.includes(row.message_id)) return;
          setReactions(prev => ({
            ...prev,
            [row.message_id]: {
              ...prev[row.message_id],
              [row.emoji]: [...(prev[row.message_id]?.[row.emoji] ?? []), row.user_id],
            },
          }));
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "message_reactions" },
        (payload) => {
          const row = payload.old as { message_id: string; user_id: string; emoji: string };
          setReactions(prev => {
            if (!prev[row.message_id]) return prev;
            const n = { ...prev, [row.message_id]: { ...prev[row.message_id] } };
            n[row.message_id][row.emoji] = (n[row.message_id][row.emoji] ?? []).filter(u => u !== row.user_id);
            if (n[row.message_id][row.emoji].length === 0) delete n[row.message_id][row.emoji];
            return n;
          });
        }
      )
      .subscribe();
    reactSubRef.current = reactSub;
    return () => { supabase.removeChannel(reactSub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length > 0, channelId]);

  // ─── Realtime: poll votes ─────────────────────────────────────────────────────
  useEffect(() => {
    const pollMsgIds = messages.filter(m => m.poll_data).map(m => m.id);
    if (pollMsgIds.length === 0) return;
    const pollSub = supabase.channel(`polls:${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" },
        async () => { await loadPollVotes(pollMsgIds); }
      )
      .subscribe();
    pollSubRef.current = pollSub;
    return () => { supabase.removeChannel(pollSub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.filter(m => m.poll_data).length, channelId]);

  // ─── Realtime: read receipts ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || messages.length === 0) return;
    const ownMsgIds = messages.filter(m => m.sender_id === userId).map(m => m.id);
    if (ownMsgIds.length === 0) return;
    const readSub = supabase.channel(`reads:${channelId}:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_reads" },
        (payload) => {
          const row = payload.new as { message_id: string; user_id: string };
          if (!ownMsgIds.includes(row.message_id) || row.user_id === userId) return;
          setReadCounts(prev => ({ ...prev, [row.message_id]: (prev[row.message_id] ?? 0) + 1 }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(readSub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, messages.length, channelId]);

  // ─── Presence ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !myName) return;
    const presenceChan = supabase.channel(`presence:${channelId}`, { config: { presence: { key: userId } } });
    presenceRef.current = presenceChan;
    presenceChan
      .on("presence", { event: "sync" }, () => {
        const state = presenceChan.presenceState<{ name: string; typing: boolean; userId: string }>();
        setOnlineCount(Object.values(state).map(s => s[0]).filter(Boolean).length);
      })
      .subscribe(async (status) => { if (status === "SUBSCRIBED") await presenceChan.track({ name: myName, userId }); });
    return () => { supabase.removeChannel(presenceChan); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, userId, myName]);

  // ─── Typing broadcast ─────────────────────────────────────────────────────────
  const broadcastTyping = (isTyping: boolean) => {
    if (!userId || !myName || !subRef.current) return;
    typingStateRef.current = isTyping;
    subRef.current.send({ type: "broadcast", event: "typing", payload: { userId, name: myName, typing: isTyping } });
  };

  // ─── @Mention insert ──────────────────────────────────────────────────────────
  const insertMention = (name: string) => {
    const at = input.lastIndexOf("@");
    if (at === -1) return;
    setInput(`${input.slice(0, at)}@${name} ${input.slice(at).replace(/^@\S*/, "")}`);
    setMentionQuery(null); setMentionResults([]);
    textareaRef.current?.focus(); resizeTextarea();
  };

  // ─── Input change ─────────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val); resizeTextarea();
    const cursorPos = e.target.selectionStart ?? val.length;
    const match = val.slice(0, cursorPos).match(/@(\w*)$/);
    if (match) { setMentionQuery(match[1]); searchMentions(match[1]); }
    else { setMentionQuery(null); setMentionResults([]); }
    if (val.trim().length > 0) {
      if (!typingStateRef.current) broadcastTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => broadcastTyping(false), 3000);
    } else {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      broadcastTyping(false);
    }
  };

  // ─── Send text ────────────────────────────────────────────────────────────────
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || !userId || sending) return;
    setInput(""); setSending(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    broadcastTyping(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    const filteredContent = (channel?.type === "global" || channel?.type === "university") ? filterProfanity(content) : content;
    const savedReply = replyToMessage;
    const { data: inserted, error } = await (supabase as any).from("messages")
      .insert({ channel_id: channelId, sender_id: userId, content: filteredContent, reply_to_id: savedReply?.id ?? null })
      .select("id, content, created_at, sender_id").single();
    setReplyToMessage(null);
    if (error) { setSendError(error.message); }
    else if (inserted) {
      const selfProfile = profileCache.current.get(userId) ?? { full_name: myName, avatar_url: myAvatar, username: null, branch: null, universities: null };
      setMessages(prev => {
        if (prev.some(m => m.id === inserted.id)) return prev;
        return [...prev, {
          id: inserted.id,
          content: inserted.content ?? content,
          created_at: inserted.created_at,
          sender_id: inserted.sender_id,
          sender: selfProfile as Profile,
          reply_to_id: savedReply?.id ?? null,
          replied_msg: savedReply ? { id: savedReply.id, content: savedReply.content, sender: savedReply.sender } : null,
        }];
      });
      setTimeout(() => scrollToBottom(), 50);
    }
    setSending(false); textareaRef.current?.focus();
  };

  const handleDelete = async (msgId: string) => {
    await supabase.from("messages").update({ is_deleted: true }).eq("id", msgId).eq("sender_id", userId ?? "");
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionResults.length > 0 && mentionQuery !== null) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, mentionResults.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) { e.preventDefault(); const m = mentionResults[mentionIndex]; if (m) insertMention(m.full_name); return; }
      if (e.key === "Escape") { setMentionQuery(null); setMentionResults([]); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Is this message the first in a visual group (new sender or >5 min gap)
  const showGroupHeader = (i: number, msgs: Message[]) => {
    if (i === 0) return true;
    const prev = msgs[i - 1]; const cur = msgs[i];
    if (prev.sender_id !== cur.sender_id) return true;
    return new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;
  };

  const channelIcon = channel?.type === "global"
    ? <Globe className="w-4 h-4 text-[rgb(var(--primary))]" />
    : <Building2 className="w-4 h-4 text-[rgb(var(--primary))]" />;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Poll creator modal */}
      {showPollCreator && (
        <PollCreator onClose={() => setShowPollCreator(false)} onSubmit={sendPoll} />
      )}

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          isOwn={ctxMenu.msg.sender_id === userId}
          onReply={() => setReplyToMessage(ctxMenu.msg)}
          onDelete={() => handleDelete(ctxMenu.msg.id)}
          onCopy={() => navigator.clipboard?.writeText(ctxMenu.msg.content)}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
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

        {showSearch ? (
          /* Search bar replaces title */
          <div className="flex-1 flex items-center gap-2 bg-[rgb(var(--muted))] rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-[rgb(var(--muted-fg))] flex-shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[rgb(var(--muted-fg))]"
            />
            {searchQuery && (
              <span className="text-[10px] text-[rgb(var(--muted-fg))]">
                {filteredMessages.length} result{filteredMessages.length !== 1 ? "s" : ""}
              </span>
            )}
            <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold leading-tight truncate">{channel?.name ?? "Loading…"}</h2>
              <p className="text-xs text-[rgb(var(--muted-fg))]">{onlineCount > 0 ? `${onlineCount} online` : ""}</p>
            </div>
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-xl hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors flex-shrink-0"
              title="Search messages"
            >
              <Search className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {loading && (
          <div className="space-y-4 animate-pulse px-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "justify-start" : "justify-end")}>
                {i % 2 === 0 && <div className="w-8 h-8 rounded-full bg-[rgb(var(--muted))]" />}
                <div className={cn("rounded-2xl h-10 bg-[rgb(var(--muted))]", i % 2 === 0 ? "w-48" : "w-36")} />
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

        {filteredMessages.map((msg, i) => {
          const isOwn        = msg.sender_id === userId;
          const groupHeader  = showGroupHeader(i, filteredMessages);
          const isHighlighted = searchQuery.trim() && msg.content.toLowerCase().includes(searchQuery.toLowerCase());
          const msgReactions  = reactions[msg.id] ?? {};
          const hasReactions  = Object.keys(msgReactions).length > 0;

          return (
            <div key={msg.id}>
              {/* Date separator */}
              {showDateSeparator(filteredMessages, i) && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-[rgb(var(--border))]" />
                  <span className="text-[10px] font-semibold text-[rgb(var(--muted-fg))] px-2 py-0.5 rounded-full bg-[rgb(var(--muted))]">
                    {dateSeparatorLabel(msg.created_at)}
                  </span>
                  <div className="flex-1 h-px bg-[rgb(var(--border))]" />
                </div>
              )}

              {/* Message row */}
              <div
                id={`msg-${msg.id}`}
                className={cn(
                  "flex items-end gap-2 transition-colors relative",
                  isOwn ? "flex-row-reverse" : "flex-row",
                  groupHeader ? "mt-3" : "mt-0.5",
                  isHighlighted && "bg-yellow-400/10 rounded-2xl px-1"
                )}
                onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, msg }); }}
                onTouchStart={e => { swipeTouchX.current = e.touches[0].clientX; setSwipeMsgId(msg.id); setSwipeDelta(0); }}
                onTouchMove={e => { const d = e.touches[0].clientX - swipeTouchX.current; if (d > 0 && d <= 80) setSwipeDelta(d); }}
                onTouchEnd={() => { if (swipeDelta > 50) setReplyToMessage(msg); setSwipeMsgId(null); setSwipeDelta(0); }}
              >
                {/* Swipe reply hint icon */}
                {swipeMsgId === msg.id && swipeDelta > 20 && (
                  <div className={cn("absolute top-1/2 -translate-y-1/2 flex items-center justify-center", isOwn ? "right-full mr-2" : "left-full ml-2")} style={{ opacity: Math.min(swipeDelta / 60, 1) }}>
                    <div className="w-7 h-7 rounded-full bg-[rgb(var(--primary)/0.15)] flex items-center justify-center">
                      <Reply className="w-3.5 h-3.5 text-[rgb(var(--primary))]" />
                    </div>
                  </div>
                )}
                {/* Avatar (others only, first in group) */}
                {!isOwn && (
                  <div className="w-8 flex-shrink-0 self-end mb-1">
                    {groupHeader ? (
                      <UserHoverCard userId={msg.sender_id} name={msg.sender?.full_name ?? "Unknown"} avatarUrl={msg.sender?.avatar_url} uniShort={(msg.sender?.universities as any)?.short_name} myId={userId}>
                        <button><Avatar name={msg.sender?.full_name} url={msg.sender?.avatar_url} /></button>
                      </UserHoverCard>
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                )}

                {/* Bubble + reactions column */}
                <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start", "max-w-[72%] sm:max-w-[60%]")}>

                  {/* Sender name (others only, first in group) */}
                  {!isOwn && groupHeader && (
                    <div className="flex items-center gap-1.5 px-1">
                      <UserHoverCard userId={msg.sender_id} name={msg.sender?.full_name ?? "Unknown"} avatarUrl={msg.sender?.avatar_url} uniShort={(msg.sender?.universities as any)?.short_name} myId={userId}>
                        <span className="text-xs font-semibold text-[rgb(var(--primary))] cursor-pointer hover:underline">
                          {msg.sender?.full_name ?? "Unknown"}
                        </span>
                      </UserHoverCard>
                      {msg.sender?.universities && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] leading-tight">
                          {(msg.sender.universities as any).short_name}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Reaction bar (hover) */}
                  <div
                    className="relative"
                    style={swipeMsgId === msg.id && swipeDelta > 0 ? { transform: `translateX(${swipeDelta * 0.5}px)`, transition: "none" } : { transition: "transform 0.2s" }}
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                      setHoveredMsgId(msg.id);
                    }}
                    onMouseLeave={() => {
                      hoverTimeoutRef.current = setTimeout(() => setHoveredMsgId(null), 300);
                    }}
                  >
                    {hoveredMsgId === msg.id && (
                      <div className={cn(
                        "absolute -top-10 z-20 flex items-center gap-0.5 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-full shadow-lg px-2 py-1",
                        isOwn ? "right-0" : "left-0"
                      )}>
                        {QUICK_REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(msg.id, emoji)}
                            className="text-lg leading-none hover:scale-125 transition-transform px-0.5"
                          >
                            {emoji}
                          </button>
                        ))}
                        <div className="w-px h-4 bg-[rgb(var(--border))] mx-0.5" />
                        <button
                          onClick={() => { setReplyToMessage(msg); setHoveredMsgId(null); }}
                          className="p-1 rounded-full hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--primary))] transition-colors"
                          title="Reply"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* The bubble */}
                    <div
                      className={cn(
                        "relative px-3 py-2 rounded-2xl shadow-sm",
                        isOwn
                          ? "bg-[rgb(var(--primary)/0.85)] text-[rgb(var(--primary-fg))] rounded-tr-sm"
                          : "bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] rounded-tl-sm"
                      )}
                    >
                      {/* Reply preview inside bubble */}
                      {msg.reply_to_id && (
                        <button
                          onClick={() => scrollToMessage(msg.reply_to_id!)}
                          className={cn(
                            "flex flex-col mb-2 pl-2 border-l-2 text-left w-full",
                            isOwn ? "border-white/50" : "border-[rgb(var(--primary))]"
                          )}
                        >
                          <span className={cn("text-[10px] font-semibold leading-tight", isOwn ? "opacity-80" : "text-[rgb(var(--primary))]")}>
                            {msg.replied_msg?.sender?.full_name ?? "Message"}
                          </span>
                          <span className={cn("text-[11px] truncate max-w-[180px]", isOwn ? "opacity-70" : "opacity-60")}>
                            {msg.replied_msg?.content
                              ? msg.replied_msg.content.slice(0, 60) + (msg.replied_msg.content.length > 60 ? "…" : "")
                              : "Original message"}
                          </span>
                        </button>
                      )}

                      {/* Poll card */}
                      {msg.poll_data ? (
                        <PollCard
                          messageId={msg.id}
                          pollData={msg.poll_data}
                          votes={allPollVotes[msg.id] ?? {}}
                          myVote={myPollVotes[msg.id]}
                          onVote={handlePollVote}
                          isOwn={isOwn}
                        />
                      ) : msg.sticker_id ? (
                        msg.sticker_id.startsWith("http") || msg.sticker_id.startsWith("data:") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={msg.sticker_id} alt="sticker" loading="lazy" className="w-28 h-28 object-contain rounded-xl" />
                        ) : (
                          <span className="text-5xl">{msg.sticker_id}</span>
                        )
                      ) : msg.gif_url ? (
                        msg.content === "🎤 Voice note" ? (
                          <div className="flex items-center gap-2 py-1">
                            <Mic className="w-4 h-4 opacity-70 flex-shrink-0" />
                            <audio src={msg.gif_url} controls className="h-8" style={{ maxWidth: "220px" }} />
                          </div>
                        ) : msg.content === "📎 Photo" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={msg.gif_url} alt="photo" loading="lazy" className="max-w-xs max-h-64 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.gif_url!, "_blank")} />
                        ) : msg.content === "🎥 Video" ? (
                          <video src={msg.gif_url} controls className="max-w-xs max-h-64 rounded-xl" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={msg.gif_url} alt="GIF" loading="lazy" className="max-w-[240px] max-h-[180px] rounded-xl object-cover" />
                        )
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content.split(/(@\S+)/g).map((part, pi) =>
                            part.startsWith("@") ? (
                              <span
                                key={pi}
                                className={cn(
                                  "font-semibold px-1 rounded",
                                  myName && part.slice(1).toLowerCase() === myName.split(" ")[0].toLowerCase()
                                    ? isOwn ? "bg-white/20" : "bg-[rgb(var(--primary)/0.2)] text-[rgb(var(--primary))]"
                                    : isOwn ? "opacity-80" : "text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.08)]"
                                )}
                              >
                                {part}
                              </span>
                            ) : part
                          )}
                        </p>
                      )}

                      {/* Timestamp + read ticks */}
                      <div className={cn("flex items-center gap-1 mt-1", isOwn ? "justify-end" : "justify-end")}>
                        <span className="text-[10px] opacity-60">{formatTime(msg.created_at)}</span>
                        {isOwn && (
                          <span className="text-[11px] font-bold leading-none tracking-tighter" style={{
                            color: (readCounts[msg.id] ?? 0) > 0 ? "#53BDEB" : "rgba(255,255,255,0.38)",
                          }}>
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reaction pills below bubble */}
                  {hasReactions && (
                    <div className={cn("flex flex-wrap gap-1 px-1", isOwn ? "justify-end" : "justify-start")}>
                      {Object.entries(msgReactions)
                        .filter(([, users]) => users.length > 0)
                        .map(([emoji, users]) => {
                          const iMine = userId ? users.includes(userId) : false;
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleReact(msg.id, emoji)}
                              className={cn(
                                "flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-all",
                                iMine
                                  ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]"
                                  : "border-[rgb(var(--border))] bg-[rgb(var(--muted))] text-[rgb(var(--fg))]"
                              )}
                            >
                              <span>{emoji}</span>
                              <span className="font-semibold">{users.length}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 pl-12 mt-2 text-xs text-[rgb(var(--muted-fg))]">
            <div className="flex gap-0.5 items-end bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl rounded-tl-sm px-3 py-2">
              {[0, 150, 300].map(delay => (
                <span key={delay} className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--muted-fg))] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
            <span>{formatTypingNames(typingNames)}</span>
          </div>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* ── Input area ──────────────────────────────────────────────────────── */}
      <div className="p-3 flex-shrink-0 border-t border-[rgb(var(--border))] relative">

        {/* Hidden file inputs */}
        <input ref={fileInputRef}   type="file" accept="image/*,video/*" className="hidden" onChange={handlePhotoSelect} />
        <input ref={stickerFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePackFileSelect} />

        {/* Emoji picker */}
        {showEmojiPicker && emojiData && (
          <div ref={emojiPickerRef} className="absolute bottom-full right-3 mb-2 z-50">
            <EmojiPicker data={emojiData} onEmojiSelect={insertEmoji} theme="auto" previewPosition="none" skinTonePosition="none" />
          </div>
        )}

        {/* GIF picker */}
        {showGifPicker && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl z-40 overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b border-[rgb(var(--border))]">
              <span className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted-fg))] flex-shrink-0">GIF</span>
              <input
                value={gifSearch}
                onChange={e => handleGifSearchChange(e.target.value)}
                placeholder="Search GIFs…"
                className="flex-1 bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[rgb(var(--primary))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]"
              />
              <button onClick={() => setShowGifPicker(false)} className="p-1 rounded-lg hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]"><XIcon className="w-4 h-4" /></button>
            </div>
            <div className="p-3">
              {gifLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[rgb(var(--muted-fg))]" /></div>
              ) : gifSetupRequired ? (
                <div className="text-center py-6 px-2">
                  <p className="text-xs font-semibold text-[rgb(var(--fg))] mb-1">API key needed</p>
                  <p className="text-[11px] text-[rgb(var(--muted-fg))] leading-relaxed">
                    Get a free key at{" "}
                    <a href="https://developers.giphy.com" target="_blank" rel="noreferrer" className="text-[rgb(var(--primary))] underline">developers.giphy.com</a>
                    {" "}then add to <code className="bg-[rgb(var(--muted))] px-1 rounded">.env.local</code>:
                  </p>
                  <code className="block mt-2 text-[11px] bg-[rgb(var(--muted))] px-3 py-1.5 rounded-lg text-[rgb(var(--primary))] text-left">
                    GIPHY_API_KEY=your_key_here
                  </code>
                </div>
              ) : gifResults.length === 0 ? (
                <p className="text-center text-xs text-[rgb(var(--muted-fg))] py-6">No GIFs found</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {gifResults.map(gif => (
                    <button key={gif.id} onClick={() => sendGif(gif.url)} className="rounded-xl overflow-hidden aspect-video hover:opacity-80 transition-opacity bg-[rgb(var(--muted))]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={gif.preview} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sticker picker */}
        {showStickerPicker && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl z-40 overflow-hidden">
            {showAddPack && (
              <div className="absolute inset-0 bg-[rgb(var(--card))] z-10 rounded-2xl flex flex-col">
                <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
                  <p className="font-semibold text-sm">New Sticker Pack</p>
                  <button onClick={() => { setShowAddPack(false); setNewPackFiles([]); setNewPackPreviews([]); setNewPackName(""); }} className="p-1 rounded-lg hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]"><XIcon className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3 min-h-0">
                  <input
                    value={newPackName}
                    onChange={e => setNewPackName(e.target.value)}
                    placeholder="Pack name (e.g. My Memes)"
                    className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]"
                  />
                  <button
                    onClick={() => stickerFileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[rgb(var(--border))] text-sm text-[rgb(var(--muted-fg))] hover:border-[rgb(var(--primary)/0.5)] hover:text-[rgb(var(--primary))] transition-colors"
                  >
                    <Sticker className="w-4 h-4" />
                    {newPackFiles.length > 0 ? `${newPackFiles.length} images selected` : "Choose sticker images (up to 20)"}
                  </button>
                  {newPackPreviews.length > 0 && (
                    <div className="grid grid-cols-5 gap-1.5">
                      {newPackPreviews.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={url} alt="" className="w-full aspect-square object-contain rounded-lg bg-[rgb(var(--muted))]" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 flex-shrink-0 border-t border-[rgb(var(--border))]">
                  <button
                    onClick={handleSavePack}
                    disabled={!newPackName.trim() || newPackFiles.length === 0 || packUploading}
                    className="w-full py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {packUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : "Save Pack"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-0.5 px-2 pt-2 border-b border-[rgb(var(--border))] overflow-x-auto scrollbar-none">
              {STICKER_TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveStickerTab(tab.id)}
                  className={cn("px-3 py-1.5 rounded-t-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
                    activeStickerTab === tab.id ? "bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] border-b-2 border-[rgb(var(--primary))]" : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]")}>
                  {tab.label}
                </button>
              ))}
              <button onClick={() => setShowStickerPicker(false)} className="ml-auto p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] flex-shrink-0"><XIcon className="w-4 h-4" /></button>
            </div>

            <div className="p-3">
              {activeStickerTab === "custom" ? (
                <div>
                  {customPacks.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-[rgb(var(--muted-fg))] mb-3">No sticker packs yet</p>
                      <button onClick={() => setShowAddPack(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold mx-auto">
                        <Plus className="w-4 h-4" /> Add Sticker Pack
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 mb-3 overflow-x-auto scrollbar-none">
                        {customPacks.map((pack, i) => (
                          <button key={pack.id} onClick={() => setActiveCustomPack(i)}
                            className={cn("px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors",
                              activeCustomPack === i ? "bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]" : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]")}>
                            {pack.name}
                          </button>
                        ))}
                        <button onClick={() => setShowAddPack(true)} className="flex-shrink-0 p-1 rounded-lg text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--primary))]" title="Add pack"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                      {customPacks[activeCustomPack] && (
                        <>
                          <div className="grid grid-cols-5 gap-1.5">
                            {customPacks[activeCustomPack].stickers.map((url, i) => (
                              <button key={i} onClick={() => sendSticker(url)} className="aspect-square rounded-xl overflow-hidden bg-[rgb(var(--muted))] hover:opacity-80 transition-opacity p-0.5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="" loading="lazy" className="w-full h-full object-contain" />
                              </button>
                            ))}
                          </div>
                          <button onClick={() => handleDeletePack(customPacks[activeCustomPack].id)} className="mt-2 text-[10px] text-[rgb(var(--destructive))] hover:underline w-full text-center">
                            Delete "{customPacks[activeCustomPack].name}"
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              ) : (
                stickerLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[rgb(var(--muted-fg))]" /></div>
                ) : stickerResults.length === 0 ? (
                  <p className="text-center text-xs text-[rgb(var(--muted-fg))] py-6">No stickers found</p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                    {stickerResults.map(s => (
                      <button key={s.id} onClick={() => sendSticker(s.url)} className="aspect-square rounded-xl overflow-hidden bg-[rgb(var(--muted))] hover:opacity-80 transition-opacity p-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.preview} alt="" loading="lazy" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* @Mention dropdown */}
        {mentionQuery !== null && mentionResults.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl overflow-hidden shadow-xl z-40">
            {mentionResults.map((u, i) => (
              <button key={u.id} onMouseDown={e => { e.preventDefault(); insertMention(u.full_name); }}
                className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors", i === mentionIndex ? "bg-[rgb(var(--primary)/0.1)]" : "hover:bg-[rgb(var(--muted))]")}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" /> : u.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name}</p>
                  {u.username && <p className="text-xs text-[rgb(var(--muted-fg))]">@{u.username}</p>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Media preview */}
        {mediaPreview && (
          <div className="mb-2 p-2 bg-[rgb(var(--muted))] rounded-xl flex items-center gap-3">
            {mediaPreview.file.type.startsWith("video/") ? (
              <video src={mediaPreview.url} className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaPreview.url} alt="" className="w-16 h-16 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{mediaPreview.file.name}</p>
              <p className="text-[11px] text-[rgb(var(--muted-fg))]">{(mediaPreview.file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button onClick={sendMedia} disabled={mediaUploading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-xs font-semibold disabled:opacity-50">
              {mediaUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {mediaUploading ? "Sending…" : "Send"}
            </button>
            <button onClick={cancelMedia} className="p-1.5 rounded-lg hover:bg-[rgb(var(--border))] text-[rgb(var(--muted-fg))]"><XIcon className="w-4 h-4" /></button>
          </div>
        )}

        {/* Reply preview */}
        {replyToMessage && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-[rgb(var(--muted))] rounded-xl text-xs border-l-2 border-[rgb(var(--primary))]">
            <Reply className="w-3.5 h-3.5 text-[rgb(var(--primary))] flex-shrink-0" />
            <span className="text-[rgb(var(--muted-fg))] truncate flex-1">
              Replying to <strong>{replyToMessage.sender?.full_name ?? "Unknown"}</strong>: {replyToMessage.content.slice(0, 60)}
            </span>
            <button onClick={() => setReplyToMessage(null)} className="flex-shrink-0 text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"><XIcon className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {sendError && <p className="text-xs text-[rgb(var(--destructive))] mb-2 px-1">{sendError}</p>}

        {/* Hidden file inputs */}
        <input ref={docFileRef}   type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip" className="hidden" onChange={handleDocSelect} />
        <input ref={audioFileRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioSelect} />

        {/* ── WhatsApp-style attachment menu ─────────────────────────────────── */}
        {showAttachMenu && (
          <div ref={attachMenuRef}
            className="absolute bottom-full left-2 mb-3 z-50 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl overflow-hidden w-52 py-1">
            {[
              { label: "Document",        icon: FileText,   color: "#7F66FF", action: () => docFileRef.current?.click() },
              { label: "Photos & videos", icon: ImageIcon,  color: "#EB3D44", action: () => fileInputRef.current?.click() },
              { label: "Camera",          icon: Camera,     color: "#AA66EE", action: () => setShowCamera(true) },
              { label: "Audio",           icon: Music,      color: "#EF6034", action: () => audioFileRef.current?.click() },
              { label: "Poll",            icon: BarChart2,  color: "#0288D1", action: () => { setShowPollCreator(true); setShowGifPicker(false); setShowStickerPicker(false); } },
              { label: "Sticker",         icon: Sticker,    color: "#00A884", action: () => { setShowStickerPicker(p => !p); setShowGifPicker(false); } },
              { label: "GIF",             icon: Smile,      color: "#FF6B35", action: () => { setShowGifPicker(p => !p); setShowStickerPicker(false); } },
            ].map(({ label, icon: Icon, color, action }) => (
              <button key={label} type="button"
                onClick={() => { action(); setShowAttachMenu(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[rgb(var(--muted))] transition-colors text-left">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-[rgb(var(--fg))]">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Voice note preview ─────────────────────────────────────────────── */}
        {audioPreviewUrl && !isRecording && (
          <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-[rgb(var(--muted))] rounded-xl">
            <audio src={audioPreviewUrl} controls className="h-8 flex-1 min-w-0" style={{ maxWidth: "100%" }} />
            <span className="text-xs text-[rgb(var(--muted-fg))] flex-shrink-0">{recordSecs}s</span>
            <button onClick={sendVoiceNote} disabled={voiceSending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-xs font-semibold disabled:opacity-50 flex-shrink-0">
              {voiceSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {voiceSending ? "Sending…" : "Send"}
            </button>
            <button onClick={cancelRecording} className="p-1.5 rounded-lg hover:bg-[rgb(var(--border))] text-[rgb(var(--muted-fg))] flex-shrink-0">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend}>
          <div className="flex items-end gap-2">
            {/* + attach button */}
            <button type="button"
              onClick={() => { setShowAttachMenu(p => !p); setShowEmojiPicker(false); setShowGifPicker(false); setShowStickerPicker(false); }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                showAttachMenu
                  ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]"
                  : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--border))]"
              )}>
              <Plus className={cn("w-5 h-5 transition-transform duration-200", showAttachMenu && "rotate-45")} />
            </button>

            {/* Input bubble — hidden while recording */}
            {isRecording ? (
              <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <span className="text-sm font-mono text-red-400 flex-1">
                  {String(Math.floor(recordSecs / 60)).padStart(2, "0")}:{String(recordSecs % 60).padStart(2, "0")}
                </span>
                <span className="text-xs text-red-400/70">Recording…</span>
                <button type="button" onClick={cancelRecording}
                  className="text-xs text-[rgb(var(--muted-fg))] hover:text-red-400 transition-colors px-2">
                  Cancel
                </button>
              </div>
            ) : (
              <div className={cn(
                "flex-1 flex items-end gap-2 rounded-2xl border px-3 py-2 transition-all duration-200",
                "bg-[rgb(var(--input))] border-[rgb(var(--border))]",
                "focus-within:border-[rgb(var(--primary)/0.4)]"
              )}>
                {/* Emoji */}
                <button type="button"
                  onClick={() => { toggleEmojiPicker(); setShowGifPicker(false); setShowStickerPicker(false); setShowAttachMenu(false); }}
                  className={cn("flex-shrink-0 mb-0.5 transition-colors", showEmojiPicker ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--primary))]")}>
                  <Smile className="w-5 h-5" />
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

                {/* Sticker */}
                <button type="button"
                  onClick={() => { setShowStickerPicker(p => !p); setShowGifPicker(false); setShowEmojiPicker(false); setShowAttachMenu(false); }}
                  className={cn("flex-shrink-0 mb-0.5 transition-colors", showStickerPicker ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--primary))]")}>
                  <Sticker className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Send / Stop-recording / Mic */}
            {isRecording ? (
              <button type="button" onClick={stopRecording}
                className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0 hover:bg-red-600 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button type={input.trim() ? "submit" : "button"}
                onClick={!input.trim() ? startRecording : undefined}
                disabled={sending || !!audioPreviewUrl}
                className="w-10 h-10 rounded-full bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-opacity disabled:opacity-50">
                {input.trim() ? <Send className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Camera modal */}
      {showCamera && (
        <CameraModal
          onClose={() => setShowCamera(false)}
          onSend={sendCameraPhoto}
        />
      )}
    </>
  );
}
