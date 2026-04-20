"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquarePlus, CheckCircle, Lightbulb, Bug, Megaphone, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "suggestion", label: "Suggestion",  icon: Lightbulb,        desc: "An idea to improve UniConnect" },
  { value: "bug",        label: "Bug Report",  icon: Bug,              desc: "Something isn't working right" },
  { value: "feature",    label: "Feature",     icon: Megaphone,        desc: "A new feature you'd like to see" },
  { value: "other",      label: "Other",       icon: HelpCircle,       desc: "Anything else on your mind" },
];

export default function FeedbackPage() {
  const [type, setType]       = useState("suggestion");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async () => {
    if (!message.trim()) { setError("Please write your message."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="theme-card p-12 text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-[rgb(var(--success)/0.15)] flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-[rgb(var(--success))]" />
          </div>
          <h2 className="text-2xl font-bold">Thank you!</h2>
          <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed">
            Your feedback has been sent to the UniConnect team. We read every single message.
          </p>
          <Button variant="outline" size="md" onClick={() => { setDone(false); setMessage(""); }}>
            Send another
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center">
            <MessageSquarePlus className="w-5 h-5 text-[rgb(var(--primary))]" />
          </div>
          <h1 className="text-2xl font-bold">Share your opinion</h1>
        </div>
        <p className="text-sm text-[rgb(var(--muted-fg))] ml-[52px]">
          Suggestions, bugs, ideas — all go straight to the founder.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="theme-card p-6 space-y-5"
      >
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium mb-3">What kind of feedback?</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200",
                  type === value
                    ? "bg-[rgb(var(--primary)/0.08)] border-[rgb(var(--primary)/0.4)] text-[rgb(var(--primary))]"
                    : "border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]"
                )}
              >
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium leading-none mb-0.5">{label}</p>
                  <p className="text-xs text-[rgb(var(--muted-fg))]">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium mb-2">Your message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Tell us what's on your mind…"
            rows={5}
            maxLength={1000}
            className={cn(
              "w-full px-4 py-3 rounded-xl text-sm resize-none",
              "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
              "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
              "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
            )}
          />
          <p className="text-xs text-[rgb(var(--muted-fg))] text-right mt-1">{message.length}/1000</p>
        </div>

        {error && (
          <p className="text-sm text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.1)] px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={!message.trim()}
          onClick={handleSubmit}
        >
          Send feedback
        </Button>
      </motion.div>
    </div>
  );
}
