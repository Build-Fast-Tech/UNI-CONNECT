"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AtSign, CheckCircle, AlertTriangle, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const PROMPTED_KEY = (uid: string) => `uc_u_prompted_${uid}`;

interface Props {
  userId: string;
  onDone: (username: string) => void;
}

export function UsernameSetupModal({ userId, onDone }: Props) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Show once — if already prompted, skip
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(PROMPTED_KEY(userId))) {
      setVisible(true);
    }
  }, [userId]);

  const dismiss = () => {
    localStorage.setItem(PROMPTED_KEY(userId), "1");
    setVisible(false);
  };

  const handleChange = (raw: string) => {
    const v = raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setValue(v);
    setAvailable(null);
    setError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v) return;

    if (!USERNAME_REGEX.test(v)) {
      setError("3–20 chars, only lowercase letters, numbers, underscores.");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setChecking(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", v)
        .single();
      setChecking(false);
      setAvailable(!data);
      if (data) setError("That username is already taken.");
    }, 400);
  };

  const handleSave = async () => {
    if (!value || !USERNAME_REGEX.test(value) || !available) return;
    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({ username: value })
      .eq("id", userId);
    setSaving(false);
    if (err) {
      setError(err.message.includes("unique") ? "That username is already taken." : err.message);
      return;
    }
    localStorage.setItem(PROMPTED_KEY(userId), "1");
    onDone(value);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="theme-card w-full max-w-md p-7 relative"
          >
            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--primary)/0.12)] flex items-center justify-center mb-5">
              <AtSign className="w-6 h-6 text-[rgb(var(--primary))]" />
            </div>

            <h2 className="text-xl font-bold mb-1">Choose your username</h2>
            <p className="text-sm text-[rgb(var(--muted-fg))] mb-6 leading-relaxed">
              Your unique handle on UniConnect. Others can search and find you by this name.
              Only lowercase letters, numbers, and underscores. 3–20 characters.
            </p>

            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-fg))] font-mono text-sm select-none">
                  @
                </span>
                <input
                  autoFocus
                  type="text"
                  value={value}
                  onChange={e => handleChange(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
                  maxLength={20}
                  placeholder="your_username"
                  className="w-full h-11 pl-7 pr-10 rounded-xl text-sm font-mono bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checking && <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--muted-fg))]" />}
                  {!checking && available === true && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {!checking && available === false && <AlertTriangle className="w-4 h-4 text-red-400" />}
                </span>
              </div>

              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {error}
                </p>
              )}
              {available && !error && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 flex-shrink-0" /> @{value} is available!
                </p>
              )}

              <button
                onClick={handleSave}
                disabled={!value || !available || saving || !!error}
                className={cn(
                  "w-full h-11 rounded-xl font-semibold text-sm transition-all",
                  "bg-[rgb(var(--primary))] text-white",
                  "hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                {saving ? "Saving…" : "Set Username"}
              </button>

              <button
                onClick={dismiss}
                className="w-full text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors py-1"
              >
                I&apos;ll set it later in Settings
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
