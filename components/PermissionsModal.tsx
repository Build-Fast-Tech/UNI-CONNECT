"use client";

import { useEffect, useState } from "react";
import { Camera, Mic, Bell, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "uc_perms_asked";

type PermResult = "idle" | "asking" | "granted" | "blocked" | "unavailable";

interface PermState {
  camera: PermResult;
  mic: PermResult;
  notifications: PermResult;
}

async function tryGetMedia(constraints: MediaStreamConstraints): Promise<"granted" | "blocked" | "unavailable"> {
  if (!navigator.mediaDevices?.getUserMedia) return "unavailable";
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach(t => t.stop());
    return "granted";
  } catch (err) {
    if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
      return "blocked";
    }
    return "unavailable";
  }
}

export function PermissionsModal() {
  const [visible, setVisible] = useState(false);
  const [perms, setPerms] = useState<PermState>({ camera: "idle", mic: "idle", notifications: "idle" });

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {}
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setVisible(false);
  };

  const requestCamera = async () => {
    setPerms(p => ({ ...p, camera: "asking" }));
    const result = await tryGetMedia({ video: true });
    setPerms(p => ({ ...p, camera: result }));
  };

  const requestMic = async () => {
    setPerms(p => ({ ...p, mic: "asking" }));
    const result = await tryGetMedia({ audio: true });
    setPerms(p => ({ ...p, mic: result }));
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) { setPerms(p => ({ ...p, notifications: "unavailable" })); return; }
    setPerms(p => ({ ...p, notifications: "asking" }));
    try {
      const result = await Notification.requestPermission();
      setPerms(p => ({
        ...p,
        notifications: result === "granted" ? "granted" : result === "denied" ? "blocked" : "unavailable",
      }));
    } catch {
      setPerms(p => ({ ...p, notifications: "unavailable" }));
    }
  };

  if (!visible) return null;

  const items = [
    { key: "camera" as const,        icon: Camera, bg: "bg-violet-500", label: "Camera",        desc: "Take photos and share in chat",      onAllow: requestCamera },
    { key: "mic" as const,           icon: Mic,    bg: "bg-orange-500", label: "Microphone",    desc: "Send voice notes in conversations",  onAllow: requestMic },
    { key: "notifications" as const, icon: Bell,   bg: "bg-blue-500",   label: "Notifications", desc: "Get notified about new messages",    onAllow: requestNotifications },
  ];

  const allGranted = items.every(i => perms[i.key] === "granted");
  const anyBlocked = items.some(i => perms[i.key] === "blocked");

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[rgb(var(--card))] rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 flex flex-col gap-5">

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold">Enable features</h2>
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">Allow the permissions below to use all features</p>
          </div>
          <button onClick={dismiss} className="p-1.5 rounded-xl hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {items.map(({ key, icon: Icon, bg, label, desc, onAllow }) => {
            const state = perms[key];
            return (
              <div key={key} className={cn(
                "flex items-center gap-3 rounded-2xl p-3 transition-colors",
                state === "blocked" ? "bg-red-500/8 border border-red-500/20" : "bg-[rgb(var(--muted)/0.4)]"
              )}>
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0", bg)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-[11px] text-[rgb(var(--muted-fg))] leading-snug">
                    {state === "blocked"
                      ? "Blocked — tap the lock icon in your browser's address bar, then reset this permission"
                      : desc}
                  </p>
                </div>

                {state === "idle" && (
                  <button onClick={onAllow} className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-xs font-semibold hover:opacity-90 transition-opacity">
                    Allow
                  </button>
                )}
                {state === "asking" && (
                  <span className="flex-shrink-0 text-[11px] text-[rgb(var(--muted-fg))] animate-pulse">Waiting…</span>
                )}
                {state === "granted" && (
                  <span className="flex-shrink-0 text-xs font-bold text-green-500">✓</span>
                )}
                {state === "blocked" && (
                  <button onClick={onAllow} title="Try again after resetting in browser settings" className="flex-shrink-0 p-2 rounded-xl bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] transition-colors">
                    <RefreshCw className="w-3.5 h-3.5 text-[rgb(var(--muted-fg))]" />
                  </button>
                )}
                {state === "unavailable" && (
                  <span className="flex-shrink-0 text-[11px] text-[rgb(var(--muted-fg))]">N/A</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Reset guide */}
        {anyBlocked && (
          <div className="rounded-2xl bg-[rgb(var(--muted))] px-4 py-3">
            <p className="text-xs font-semibold mb-1.5">How to unblock a permission:</p>
            <ol className="text-[11px] text-[rgb(var(--muted-fg))] space-y-1 list-none">
              <li>1. Click the <strong className="text-[rgb(var(--fg))]">🔒 lock icon</strong> in the browser address bar</li>
              <li>2. Open <strong className="text-[rgb(var(--fg))]">Site settings</strong> or <strong className="text-[rgb(var(--fg))]">Permissions</strong></li>
              <li>3. Find the blocked permission and set it to <strong className="text-[rgb(var(--fg))]">Allow</strong></li>
              <li>4. Come back and tap the <strong className="text-[rgb(var(--fg))]">↻ retry button</strong></li>
            </ol>
          </div>
        )}

        <button
          onClick={dismiss}
          className={cn(
            "w-full py-3 rounded-2xl text-sm font-bold transition-all",
            allGranted
              ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]"
              : "bg-[rgb(var(--muted))] text-[rgb(var(--fg))]"
          )}
        >
          {allGranted ? "All set!" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
