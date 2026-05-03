"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Trash2, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const STARTERS = [
  "Explain Big O notation with examples",
  "Help me study for my OS exam",
  "What's the difference between TCP and UDP?",
  "How do I write a good SOP for grad school?",
  "Explain database normalization simply",
  "Tips for a CS internship interview",
];

function AIChat() {
  const searchParams = useSearchParams();
  const noteId = searchParams.get("note");
  const supabase = createClient();

  const STORAGE_KEY = noteId ? `uc_ai_msgs_note_${noteId}` : "uc_ai_msgs";

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(noteId ? `uc_ai_msgs_note_${noteId}` : "uc_ai_msgs");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [noteContext, setNoteContext] = useState<string>("");
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [limitReached, setLimitReached] = useState(false);
  const [usage, setUsage] = useState<{
    used: number;
    remaining: number;
    limit: number;
    unlimited: boolean;
  } | null>(null);

  const refreshUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/usage", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setUsage(data);
      if (!data.unlimited && data.remaining <= 0) setLimitReached(true);
    } catch {}
  }, []);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length === 0) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages, STORAGE_KEY]);

  useEffect(() => {
    if (!noteId) return;
    (async () => {
      const { data: note } = await supabase
        .from("notes")
        .select("title, description, subject, course_code, ocr_text")
        .eq("id", noteId)
        .single();
      if (note) {
        setNoteTitle(note.title);
        setNoteContext(
          [note.title, note.subject, note.course_code, note.description, note.ocr_text]
            .filter(Boolean)
            .join("\n")
        );
        setMessages([{
          id: "system-note",
          role: "assistant",
          content: `I've loaded **${note.title}** — ask me anything about it!`,
        }]);
      }
    })();
  }, [noteId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role === "user" || (m.role === "assistant" && m.content && !m.streaming))
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content }],
          noteContext: noteContext || undefined,
        }),
      });

      if (res.status === 429) {
        setLimitReached(true);
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: "Daily limit reached (3 messages). Come back tomorrow!", streaming: false }
            : m
        ));
        setLoading(false);
        refreshUsage();
        return;
      }

      if (res.status === 503) {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: "AI is not available yet — the API key hasn't been configured.", streaming: false }
            : m
        ));
        setLoading(false);
        return;
      }

      if (!res.ok || !res.body) {
        const errText = await res.text();
        throw new Error(errText || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snap = accumulated;
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: snap, streaming: true } : m
        ));
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, streaming: false } : m
      ));
    } catch (err: any) {
      console.error("AI chat error:", err);
      const errMsg = err?.message && err.message !== "Request failed"
        ? `Error: ${err.message}`
        : "Sorry, something went wrong. Please try again.";
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: errMsg, streaming: false }
          : m
      ));
    }
    setLoading(false);
    refreshUsage();
  }, [input, messages, loading, noteContext, refreshUsage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] -mx-4 sm:-mx-6 -my-4 sm:-my-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--card)/0.6)] backdrop-blur-sm flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-sm leading-tight">UniConnect AI</h1>
          <p className="text-xs text-[rgb(var(--muted-fg))] truncate">
            {noteTitle ? `Context: ${noteTitle}` : "Your 24/7 study companion"}
          </p>
        </div>
        {usage && (
          <div
            className={cn(
              "hidden sm:flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full text-[11px] font-medium",
              usage.unlimited
                ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                : usage.remaining <= 5
                  ? "bg-[rgb(var(--destructive)/0.1)] text-[rgb(var(--destructive))]"
                  : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]"
            )}
            title={
              usage.unlimited
                ? "Unlimited usage"
                : `${usage.used} used · ${usage.remaining} left today`
            }
          >
            {usage.unlimited ? (
              <>Unlimited</>
            ) : (
              <>
                {usage.used}/{usage.limit} · {usage.remaining} left
              </>
            )}
          </div>
        )}
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setLimitReached(false); try { localStorage.removeItem(STORAGE_KEY); } catch {} }}
            className="ml-auto text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg mb-1">Ask me anything</h2>
              <p className="text-sm text-[rgb(var(--muted-fg))] max-w-xs">
                Powered by Gemini — I can help with your coursework, exams, and career questions.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 w-full max-w-md">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className={cn(
                    "px-3 py-2.5 rounded-xl text-left text-sm border transition-all duration-200",
                    "border-[rgb(var(--border))] hover:border-[rgb(var(--primary)/0.3)] hover:bg-[rgb(var(--muted)/0.4)]",
                    "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
                  )}
                >
                  <Zap className="w-3 h-3 inline mr-1.5 text-[rgb(var(--primary))]" />
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-blue-500 to-violet-500"
                  : "bg-[rgb(var(--muted))]"
              )}>
                {msg.role === "assistant"
                  ? <Bot className="w-4 h-4 text-white" />
                  : <User className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
                }
              </div>

              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] rounded-tr-sm"
                  : "bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] rounded-tl-sm"
              )}>
                {msg.content ? (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                ) : msg.streaming ? (
                  <span className="flex items-end gap-0.5 h-5">
                    {[0, 150, 300].map(d => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))] animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </span>
                ) : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 sm:px-6 py-3 border-t border-[rgb(var(--border))] flex-shrink-0">
        {limitReached ? (
          <div className="text-center text-sm text-[rgb(var(--muted-fg))] py-2">
            Daily limit of 3 messages reached. Resets at midnight.
          </div>
        ) : (
          <div className={cn(
            "flex items-end gap-2 rounded-2xl border px-3 py-2.5 transition-all duration-200",
            "bg-[rgb(var(--input))] border-[rgb(var(--border))]",
            "focus-within:border-[rgb(var(--primary)/0.4)] focus-within:ring-1 focus-within:ring-[rgb(var(--ring)/0.3)]"
          )}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); resizeTextarea(); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your studies…"
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] resize-none focus:outline-none leading-relaxed disabled:opacity-50"
              style={{ minHeight: "1.5rem", maxHeight: "7.5rem" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                input.trim() && !loading
                  ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white hover:opacity-90"
                  : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <p className="text-[10px] text-[rgb(var(--muted-fg))] mt-1.5 px-1 text-center">
          Powered by Gemini ·{" "}
          {usage
            ? usage.unlimited
              ? "Unlimited messages"
              : `${usage.used}/${usage.limit} used · ${usage.remaining} remaining`
            : "3 messages/day"}
          {" "}· Enter to send
        </p>
      </div>
    </div>
  );
}

export default function AIPage() {
  return (
    <Suspense>
      <AIChat />
    </Suspense>
  );
}
