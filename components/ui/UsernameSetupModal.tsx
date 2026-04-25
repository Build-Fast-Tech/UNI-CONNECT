"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { AtSign, CheckCircle, AlertTriangle, Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

interface Props {
  userId: string;
  onDone: (username: string) => void;
}

export function UsernameSetupModal({ userId, onDone }: Props) {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (raw: string) => {
    const v = raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setValue(v);
    setAvailable(null);
    setError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v) return;

    if (!USERNAME_REGEX.test(v)) {
      setError("3–20 chars — lowercase letters, numbers, and underscores only.");
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
      if (data) setError("That username is already taken — try another.");
    }, 400);
  };

  const handleSave = async () => {
    if (!value || !USERNAME_REGEX.test(value) || !available || saving) return;
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
    onDone(value);
  };

  const canSave = !!value && available === true && !error && !saving;

  return (
    // Backdrop — pointer-events-none so clicking it does nothing (mandatory)
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="theme-card w-full max-w-md p-8"
        // Stop any accidental propagation
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--primary)/0.12)] flex items-center justify-center flex-shrink-0">
            <AtSign className="w-6 h-6 text-[rgb(var(--primary))]" />
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">Choose your username</h2>
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Required to continue
            </p>
          </div>
        </div>

        <p className="text-sm text-[rgb(var(--muted-fg))] mb-5 leading-relaxed">
          Your unique handle on UniConnect. Others search for you by this name.
          You can change it later in Settings.
        </p>

        <div className="space-y-3">
          {/* Input */}
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
              className={cn(
                "w-full h-11 pl-7 pr-10 rounded-xl text-sm font-mono",
                "bg-[rgb(var(--input))] border text-[rgb(var(--fg))]",
                "placeholder:text-[rgb(var(--muted-fg))]",
                "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                error ? "border-red-500/50" : "border-[rgb(var(--border))]"
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {checking && (
                <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--muted-fg))]" />
              )}
              {!checking && available === true && (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              )}
              {!checking && available === false && (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
            </span>
          </div>

          {/* Feedback */}
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {error}
            </p>
          )}
          {!error && available === true && value && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 flex-shrink-0" /> @{value} is available!
            </p>
          )}
          {!error && !available && !checking && value && USERNAME_REGEX.test(value) && (
            <p className="text-xs text-[rgb(var(--muted-fg))]">Checking availability…</p>
          )}

          <p className="text-xs text-[rgb(var(--muted-fg))]">
            Rules: 3–20 characters · lowercase letters, numbers, underscores · no spaces
          </p>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              "w-full h-11 rounded-xl font-semibold text-sm transition-all mt-1",
              "bg-[rgb(var(--primary))] text-white",
              canSave
                ? "hover:opacity-90 active:scale-[0.98]"
                : "opacity-40 cursor-not-allowed"
            )}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </span>
            ) : (
              "Claim Username & Continue →"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
