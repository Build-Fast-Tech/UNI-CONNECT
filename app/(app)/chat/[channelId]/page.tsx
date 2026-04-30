"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import dynamic from "next/dynamic";
import { Send, Paperclip, Globe, Building2, MessageCircle, Smile, Menu, Trash2, Reply, X as XIcon, Plus, ImageIcon, Loader2 } from "lucide-react";
import { filterProfanity } from "@/lib/utils/profanity";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime, formatTypingNames } from "@/lib/utils";
import { UserHoverCard } from "@/components/ui/UserHoverCard";
import { useChatShell } from "@/components/chat/ChatShell";

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

interface Channel {
  id: string;
  type: string;
  name: string | null;
}

interface GifResult  { id: string; url: string; preview: string; }
interface CustomPack { id: string; name: string; stickers: string[]; }

const STICKER_TABS = [
  { id: "trending", label: "🔥 Hot" },
  { id: "happy",    label: "😊 Happy" },
  { id: "love",     label: "❤️ Love" },
  { id: "funny",    label: "😂 Funny" },
  { id: "sad",      label: "😢 Sad" },
  { id: "custom",   label: "⭐ Mine" },
];

const GIPHY_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "dc6zaTOxFJmzC";
const CUSTOM_PACKS_KEY = (uid: string) => `uc_sticker_packs_${uid}`;

function loadCustomPacks(uid: string): CustomPack[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PACKS_KEY(uid));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveCustomPacks(uid: string, packs: CustomPack[]) {
  try { localStorage.setItem(CUSTOM_PACKS_KEY(uid), JSON.stringify(packs)); } catch {}
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

  const [messages, setMessages]         = useState<Message[]>([]);
  const [channel, setChannel]           = useState<Channel | null>(null);
  const [input, setInput]               = useState("");
  const [sending, setSending]           = useState(false);
  const [userId, setUserId]             = useState<string | null>(null);
  const [myName, setMyName]             = useState<string>("");
  const [myAvatar, setMyAvatar]         = useState<string | null>(null);
  const [typingNames, setTypingNames]   = useState<string[]>([]);
  const [onlineCount, setOnlineCount]   = useState(0);
  const [loading, setLoading]           = useState(true);
  const [sendError, setSendError]       = useState("");
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  // @mention
  const [mentionQuery,   setMentionQuery]   = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<Array<{ id: string; full_name: string; username: string | null; avatar_url: string | null }>>([]);
  const [mentionIndex,   setMentionIndex]   = useState(0);

  // GIF picker
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch,     setGifSearch]     = useState("");
  const [gifResults,    setGifResults]    = useState<GifResult[]>([]);
  const [gifLoading,    setGifLoading]    = useState(false);

  // Sticker picker
  const [showStickerPicker,  setShowStickerPicker]  = useState(false);
  const [activeStickerTab,   setActiveStickerTab]   = useState("trending");
  const [stickerResults,     setStickerResults]     = useState<GifResult[]>([]);
  const [stickerLoading,     setStickerLoading]     = useState(false);
  const [customPacks,        setCustomPacks]        = useState<CustomPack[]>([]);
  const [activeCustomPack,   setActiveCustomPack]   = useState(0);

  // Add custom pack modal
  const [showAddPack,    setShowAddPack]    = useState(false);
  const [newPackName,    setNewPackName]    = useState("");
  const [newPackFiles,   setNewPackFiles]   = useState<File[]>([]);
  const [newPackPreviews, setNewPackPreviews] = useState<string[]>([]);
  const [packUploading,  setPackUploading]  = useState(false);

  // Media upload
  const [mediaPreview,   setMediaPreview]   = useState<{ file: File; url: string } | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const stickerFileRef   = useRef<HTMLInputElement>(null);

  // Emoji
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emojiData, setEmojiData] = useState<any>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const bottomRef       = useRef<HTMLDivElement>(null);
  const textareaRef     = useRef<HTMLTextAreaElement>(null);
  const typingTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceRef     = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subRef          = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimers    = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const profileCache    = useRef<Map<string, Profile>>(new Map());
  const gifSearchRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Mention sound ────────────────────────────────────────────────────────
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

  // ─── @Mention search ──────────────────────────────────────────────────────
  const searchMentions = useCallback(async (query: string) => {
    if (query.length < 1) { setMentionResults([]); return; }
    const { data } = await supabase.from("profiles").select("id, full_name, username, avatar_url")
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`).limit(6);
    setMentionResults((data as any[]) ?? []);
    setMentionIndex(0);
  }, [supabase]);

  // ─── Close pickers on outside click ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Emoji ────────────────────────────────────────────────────────────────
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

  // ─── GIF ──────────────────────────────────────────────────────────────────
  const fetchGifs = useCallback(async (query: string) => {
    setGifLoading(true);
    try {
      const endpoint = query.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=9&rating=pg-13`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=9&rating=pg-13`;
      const res  = await fetch(endpoint);
      const data = await res.json();
      setGifResults((data.data ?? []).map((g: any) => ({
        id: g.id, url: g.images.original.url, preview: g.images.fixed_height_small.url,
      })));
    } catch { setGifResults([]); }
    setGifLoading(false);
  }, []);

  const handleGifSearchChange = (val: string) => {
    setGifSearch(val);
    if (gifSearchRef.current) clearTimeout(gifSearchRef.current);
    gifSearchRef.current = setTimeout(() => fetchGifs(val), 400);
  };

  // Load trending GIFs when picker opens
  useEffect(() => {
    if (showGifPicker && gifResults.length === 0) fetchGifs("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGifPicker]);

  // ─── Stickers ─────────────────────────────────────────────────────────────
  const fetchStickers = useCallback(async (tab: string) => {
    if (tab === "custom") return;
    setStickerLoading(true);
    try {
      const endpoint = tab === "trending"
        ? `https://api.giphy.com/v1/stickers/trending?api_key=${GIPHY_KEY}&limit=16&rating=g`
        : `https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(tab)}&limit=16&rating=g`;
      const res  = await fetch(endpoint);
      const data = await res.json();
      setStickerResults((data.data ?? []).map((g: any) => ({
        id: g.id,
        url: g.images.original.url,
        preview: g.images.fixed_height_small.url,
      })));
    } catch { setStickerResults([]); }
    setStickerLoading(false);
  }, []);

  // Load stickers when picker opens or tab changes
  useEffect(() => {
    if (showStickerPicker) fetchStickers(activeStickerTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStickerPicker, activeStickerTab]);

  // Load custom packs from localStorage when user is known
  useEffect(() => {
    if (userId) setCustomPacks(loadCustomPacks(userId));
  }, [userId]);

  // ─── Custom sticker pack ──────────────────────────────────────────────────
  const handlePackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 20);
    setNewPackFiles(files);
    const previews = files.map(f => URL.createObjectURL(f));
    setNewPackPreviews(previews);
  };

  const handleSavePack = async () => {
    if (!userId || !newPackName.trim() || newPackFiles.length === 0) return;
    setPackUploading(true);

    const uploaded: string[] = [];
    for (const file of newPackFiles) {
      const path = `stickers/${userId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const { data, error } = await supabase.storage.from("chat-media").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(data.path);
        uploaded.push(publicUrl);
      } else {
        // Fall back to base64 if storage unavailable
        const b64 = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        uploaded.push(b64);
      }
    }

    const newPack: CustomPack = {
      id: `pack_${Date.now()}`,
      name: newPackName.trim(),
      stickers: uploaded,
    };
    const updated = [...customPacks, newPack];
    setCustomPacks(updated);
    saveCustomPacks(userId, updated);

    // Reset
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

  // ─── Media upload ─────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setSendError("Max file size is 10 MB"); return; }
    const url = URL.createObjectURL(file);
    setMediaPreview({ file, url });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMedia = async () => {
    if (!mediaPreview || !userId || mediaUploading) return;
    setMediaUploading(true);
    const { file } = mediaPreview;
    const path = `media/${userId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { data, error } = await supabase.storage.from("chat-media").upload(path, file, {
      contentType: file.type, upsert: false,
    });
    if (error) {
      setSendError("Failed to upload file. Make sure the 'chat-media' storage bucket exists in Supabase.");
      setMediaUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(data.path);
    const isVideo = file.type.startsWith("video/");
    await (supabase as any).from("messages").insert({
      channel_id: channelId, sender_id: userId,
      content: isVideo ? "🎥 Video" : "📎 Photo",
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

  // ─── Send GIF ─────────────────────────────────────────────────────────────
  const sendGif = async (url: string) => {
    if (!userId || sending) return;
    setSending(true); setShowGifPicker(false);
    await (supabase as any).from("messages").insert({
      channel_id: channelId, sender_id: userId, content: "📷 GIF",
      gif_url: url, reply_to_id: replyToMessage?.id ?? null,
    });
    setReplyToMessage(null); setSending(false);
  };

  // ─── Send sticker ─────────────────────────────────────────────────────────
  const sendSticker = async (stickerUrl: string) => {
    if (!userId || sending) return;
    setSending(true); setShowStickerPicker(false);
    await (supabase as any).from("messages").insert({
      channel_id: channelId, sender_id: userId, content: "🎭 Sticker",
      sticker_id: stickerUrl, reply_to_id: replyToMessage?.id ?? null,
    });
    setReplyToMessage(null); setSending(false);
  };

  // ─── Auto-resize textarea ──────────────────────────────────────────────────
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

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: profile }, { data: chan }, { data: msgs }] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
        supabase.from("channels").select("id, type, name").eq("id", channelId).single(),
        (supabase as any).from("messages").select(`
          id, content, created_at, sender_id,
          sender:profiles!sender_id(full_name, avatar_url, username, branch:branches!branch_id(name), universities!university_id(short_name))
        `).eq("channel_id", channelId).eq("is_deleted", false).order("created_at", { ascending: true }).limit(60),
      ]);

      if (profile) { setMyName(profile.full_name); setMyAvatar(profile.avatar_url); }
      if (chan) setChannel(chan);
      if (msgs) {
        const typed = msgs as unknown as Message[];
        setMessages(typed);
        typed.forEach(m => { if (m.sender_id && m.sender && !profileCache.current.has(m.sender_id)) profileCache.current.set(m.sender_id, m.sender); });
      }
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => { if (!loading) scrollToBottom(false); }, [loading]);

  // ─── Realtime: new messages ────────────────────────────────────────────────
  useEffect(() => {
    const sub = supabase.channel(`chat:${channelId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const row = payload.new as { id: string; content: string; created_at: string; sender_id: string; is_deleted?: boolean; gif_url?: string; sticker_id?: string; };
          if (row.is_deleted) return;
          let sender = profileCache.current.get(row.sender_id) ?? null;
          if (!sender) {
            const { data } = await supabase.from("profiles").select("full_name, avatar_url, username, branch:branches!branch_id(name), universities!university_id(short_name)").eq("id", row.sender_id).single();
            if (data) { sender = data as unknown as Profile; profileCache.current.set(row.sender_id, sender); }
          }
          const newMsg: Message = { id: row.id, content: row.content, created_at: row.created_at, sender_id: row.sender_id, sender, gif_url: row.gif_url, sticker_id: row.sticker_id };
          if (myName && row.sender_id !== userId && row.content?.toLowerCase().includes(`@${myName.split(" ")[0].toLowerCase()}`)) playMentionSound();
          setMessages(prev => { if (prev.some(m => m.id === row.id)) return prev; return [...prev, newMsg]; });
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

  // ─── Presence ─────────────────────────────────────────────────────────────
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

  // ─── Typing broadcast ─────────────────────────────────────────────────────
  const typingStateRef = useRef(false);
  const broadcastTyping = (isTyping: boolean) => {
    if (!userId || !myName || !subRef.current) return;
    typingStateRef.current = isTyping;
    subRef.current.send({ type: "broadcast", event: "typing", payload: { userId, name: myName, typing: isTyping } });
  };

  // ─── @Mention insert ──────────────────────────────────────────────────────
  const insertMention = (name: string) => {
    const at = input.lastIndexOf("@");
    if (at === -1) return;
    setInput(`${input.slice(0, at)}@${name} ${input.slice(at).replace(/^@\S*/, "")}`);
    setMentionQuery(null); setMentionResults([]);
    textareaRef.current?.focus(); resizeTextarea();
  };

  // ─── Input change ─────────────────────────────────────────────────────────
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

  // ─── Send text ────────────────────────────────────────────────────────────
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || !userId || sending) return;
    setInput(""); setSending(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    broadcastTyping(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    const filteredContent = (channel?.type === "global" || channel?.type === "university") ? filterProfanity(content) : content;
    const { data: inserted, error } = await (supabase as any).from("messages")
      .insert({ channel_id: channelId, sender_id: userId, content: filteredContent, reply_to_id: replyToMessage?.id ?? null })
      .select("id, content, created_at, sender_id").single();
    setReplyToMessage(null);
    if (error) { setSendError(error.message); }
    else if (inserted) {
      const selfProfile = profileCache.current.get(userId) ?? { full_name: myName, avatar_url: myAvatar, username: null, branch: null, universities: null };
      setMessages(prev => { if (prev.some(m => m.id === inserted.id)) return prev; return [...prev, { id: inserted.id, content: inserted.content ?? content, created_at: inserted.created_at, sender_id: inserted.sender_id, sender: selfProfile as Profile }]; });
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

  const showHeader = (i: number) => {
    if (i === 0) return true;
    const prev = messages[i - 1]; const cur = messages[i];
    if (prev.sender_id !== cur.sender_id) return true;
    return new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;
  };

  const channelIcon = channel?.type === "global"
    ? <Globe className="w-4 h-4 text-[rgb(var(--primary))]" />
    : <Building2 className="w-4 h-4 text-[rgb(var(--primary))]" />;

  return (
    <>
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--card)/0.6)] backdrop-blur-sm flex-shrink-0">
        {chatShell && (
          <button onClick={chatShell.openChannels} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors flex-shrink-0" aria-label="Open channels">
            <Menu className="w-5 h-5" />
          </button>
        )}
        {channelIcon}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold leading-tight truncate">{channel?.name ?? "Loading…"}</h2>
          <p className="text-xs text-[rgb(var(--muted-fg))]">{onlineCount > 0 ? `${onlineCount} online` : ""}</p>
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
          <div key={msg.id} id={`msg-${msg.id}`} className={cn("flex gap-3 group transition-colors", showHeader(i) ? "mt-4 first:mt-0" : "mt-0.5")}>
            {showHeader(i) ? (
              <UserHoverCard userId={msg.sender_id} name={msg.sender?.full_name ?? "Unknown"} avatarUrl={msg.sender?.avatar_url} uniShort={(msg.sender?.universities as any)?.short_name} myId={userId}>
                <button className="flex-shrink-0"><Avatar name={msg.sender?.full_name} url={msg.sender?.avatar_url} /></button>
              </UserHoverCard>
            ) : (
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                <span className="text-[10px] text-[rgb(var(--muted-fg))] opacity-0 group-hover:opacity-100 transition-opacity">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              {showHeader(i) && (
                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mb-0.5">
                  <UserHoverCard userId={msg.sender_id} name={msg.sender?.full_name ?? "Unknown"} avatarUrl={msg.sender?.avatar_url} uniShort={(msg.sender?.universities as any)?.short_name} myId={userId}>
                    <span className={cn("text-sm font-semibold leading-tight cursor-pointer hover:underline", msg.sender_id === userId ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--fg))]")}>
                      {msg.sender_id === userId ? "You" : (msg.sender?.full_name ?? "Unknown")}
                    </span>
                  </UserHoverCard>
                  {msg.sender?.universities && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] leading-tight">{(msg.sender.universities as any).short_name}</span>}
                  {msg.sender?.branch && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] leading-tight">{(msg.sender.branch as any).name}</span>}
                  <span className="text-xs text-[rgb(var(--muted-fg))]">{formatRelativeTime(msg.created_at)}</span>
                </div>
              )}
              {msg.reply_to_id && (
                <button onClick={() => scrollToMessage(msg.reply_to_id!)} className="mb-1 pl-3 border-l-2 border-[rgb(var(--primary)/0.4)] text-[10px] text-[rgb(var(--muted-fg))] truncate hover:text-[rgb(var(--primary))] transition-colors block text-left">
                  ↩ Click to view original message
                </button>
              )}
              {/* Message body */}
              {msg.sticker_id ? (
                msg.sticker_id.startsWith("http") || msg.sticker_id.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.sticker_id} alt="sticker" loading="lazy" className="w-28 h-28 object-contain rounded-xl" />
                ) : (
                  <span className="text-5xl">{msg.sticker_id}</span>
                )
              ) : msg.gif_url ? (
                msg.content === "📎 Photo" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.gif_url} alt="photo" loading="lazy" className="max-w-xs max-h-64 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.gif_url!, "_blank")} />
                ) : msg.content === "🎥 Video" ? (
                  <video src={msg.gif_url} controls className="max-w-xs max-h-64 rounded-xl" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.gif_url} alt="GIF" loading="lazy" className="max-w-[240px] max-h-[180px] rounded-xl object-cover" />
                )
              ) : (
                <p className="text-sm text-[rgb(var(--fg))] leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content.split(/(@\S+)/g).map((part, pi) =>
                    part.startsWith("@") ? (
                      <span key={pi} className={cn("font-semibold px-1 rounded", myName && part.slice(1).toLowerCase() === myName.split(" ")[0].toLowerCase() ? "bg-[rgb(var(--primary)/0.2)] text-[rgb(var(--primary))]" : "text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.08)]")}>
                        {part}
                      </span>
                    ) : part
                  )}
                </p>
              )}
            </div>
            <div className="flex items-start gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all self-start mt-0.5">
              <button onClick={() => setReplyToMessage(msg)} className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
              {msg.sender_id === userId && <button onClick={() => handleDelete(msg.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-[rgb(var(--muted-fg))]" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          </div>
        ))}
        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 mt-2 text-xs text-[rgb(var(--muted-fg))]">
            <div className="flex gap-0.5 items-end">
              {[0, 150, 300].map(delay => <span key={delay} className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--muted-fg))] animate-bounce" style={{ animationDelay: `${delay}ms` }} />)}
            </div>
            <span>{formatTypingNames(typingNames)}</span>
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* ── Input area ────────────────────────────────────────────────────────── */}
      <div className="p-3 flex-shrink-0 border-t border-[rgb(var(--border))] relative">

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
        <input ref={stickerFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePackFileSelect} />

        {/* ── Emoji picker ──────────────────────────────────────────────────── */}
        {showEmojiPicker && emojiData && (
          <div ref={emojiPickerRef} className="absolute bottom-full right-3 mb-2 z-50">
            <EmojiPicker data={emojiData} onEmojiSelect={insertEmoji} theme="auto" previewPosition="none" skinTonePosition="none" />
          </div>
        )}

        {/* ── GIF picker ────────────────────────────────────────────────────── */}
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
              <p className="text-[10px] text-[rgb(var(--muted-fg))] text-center mt-2">Powered by GIPHY</p>
            </div>
          </div>
        )}

        {/* ── Sticker picker ────────────────────────────────────────────────── */}
        {showStickerPicker && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl z-40 overflow-hidden">

            {/* Add custom pack modal (overlay inside sticker picker) */}
            {showAddPack && (
              <div className="absolute inset-0 bg-[rgb(var(--card))] z-10 p-4 flex flex-col gap-3 rounded-2xl">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">New Sticker Pack</p>
                  <button onClick={() => { setShowAddPack(false); setNewPackFiles([]); setNewPackPreviews([]); setNewPackName(""); }} className="p-1 rounded-lg hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]"><XIcon className="w-4 h-4" /></button>
                </div>
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
                  <ImageIcon className="w-4 h-4" />
                  {newPackFiles.length > 0 ? `${newPackFiles.length} images selected` : "Choose sticker images (up to 20)"}
                </button>
                {newPackPreviews.length > 0 && (
                  <div className="grid grid-cols-5 gap-1.5 max-h-28 overflow-y-auto">
                    {newPackPreviews.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={url} alt="" className="w-full aspect-square object-contain rounded-lg bg-[rgb(var(--muted))]" />
                    ))}
                  </div>
                )}
                <button
                  onClick={handleSavePack}
                  disabled={!newPackName.trim() || newPackFiles.length === 0 || packUploading}
                  className="w-full py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {packUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : "Save Pack"}
                </button>
              </div>
            )}

            {/* Sticker tab bar */}
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
              {/* Custom tab */}
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
                      {/* Pack selector */}
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
                      {/* Custom stickers grid */}
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
                /* Giphy stickers grid */
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

        {/* ── @Mention dropdown ─────────────────────────────────────────────── */}
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

        {/* ── Media preview ─────────────────────────────────────────────────── */}
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

        {/* ── Reply preview ─────────────────────────────────────────────────── */}
        {replyToMessage && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-[rgb(var(--muted))] rounded-xl text-xs">
            <Reply className="w-3.5 h-3.5 text-[rgb(var(--primary))] flex-shrink-0" />
            <span className="text-[rgb(var(--muted-fg))] truncate flex-1">
              Replying to <strong>{replyToMessage.sender?.full_name ?? "Unknown"}</strong>: {replyToMessage.content.slice(0, 60)}
            </span>
            <button onClick={() => setReplyToMessage(null)} className="flex-shrink-0 text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"><XIcon className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {sendError && <p className="text-xs text-[rgb(var(--destructive))] mb-2 px-1">{sendError}</p>}

        <form onSubmit={handleSend}>
          <div className={cn("flex items-end gap-2 rounded-2xl border px-3 py-2.5 transition-all duration-200", "bg-[rgb(var(--input))] border-[rgb(var(--border))]", "focus-within:border-[rgb(var(--primary)/0.4)] focus-within:ring-1 focus-within:ring-[rgb(var(--ring)/0.3)]")}>
            {/* Media upload */}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 mb-0.5 text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors" title="Send photo or video">
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

            {/* GIF */}
            <button type="button" onClick={() => { setShowGifPicker(p => !p); setShowStickerPicker(false); setShowEmojiPicker(false); }}
              className={cn("flex-shrink-0 mb-0.5 px-1.5 py-0.5 rounded-lg text-xs font-bold transition-colors",
                showGifPicker ? "text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.1)]" : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]")}>
              GIF
            </button>

            {/* Stickers */}
            <button type="button" onClick={() => { setShowStickerPicker(p => !p); setShowGifPicker(false); setShowEmojiPicker(false); }}
              className={cn("flex-shrink-0 mb-0.5 transition-colors text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]", showStickerPicker && "text-[rgb(var(--primary))]")}
              title="Stickers">
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Emoji */}
            <button type="button" onClick={() => { toggleEmojiPicker(); setShowGifPicker(false); setShowStickerPicker(false); }}
              className={cn("flex-shrink-0 mb-0.5 transition-colors", showEmojiPicker ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]")}>
              <Smile className="w-4 h-4" />
            </button>

            {/* Send */}
            <button type="submit" disabled={!input.trim() || sending}
              className={cn("flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                input.trim() ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90" : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] cursor-not-allowed")}>
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
