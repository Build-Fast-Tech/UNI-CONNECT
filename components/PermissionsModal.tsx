"use client";

import { useEffect, useState } from "react";
import { Camera, Mic, Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "uc_perms_asked";

interface PermState {
  camera: "idle" | "granted" | "denied";
  mic: "idle" | "granted" | "denied";
  notifications: "idle" | "granted" | "denied";
}

export function PermissionsModal() {
  const [visible, setVisible] = useState(false);
  const [perms, setPerms] = useState<PermState>({
    camera: "idle",
    mic: "idle",
    notifications: "idle",
  });

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setPerms(p => ({ ...p, camera: "granted" }));
    } catch {
      setPerms(p => ({ ...p, camera: "denied" }));
    }
  };

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setPerms(p => ({ ...p, mic: "granted" }));
    } catch {
      setPerms(p => ({ ...p, mic: "denied" }));
    }
  };

  const requestNotifications = async () => {
    try {
      const result = await Notification.requestPermission();
      setPerms(p => ({ ...p, notifications: result === "granted" ? "granted" : "denied" }));
    } catch {
      setPerms(p => ({ ...p, notifications: "denied" }));
    }
  };

  const allDone = perms.camera !== "idle" && perms.mic !== "idle" && perms.notifications !== "idle";

  if (!visible) return null;

  const items = [
    {
      key: "camera" as const,
      icon: Camera,
      bg: "bg-violet-500",
      label: "Camera",
      desc: "Take photos and share them in chat",
      onAllow: requestCamera,
    },
    {
      key: "mic" as const,
      icon: Mic,
      bg: "bg-orange-500",
      label: "Microphone",
      desc: "Send voice notes in conversations",
      onAllow: requestMic,
    },
    {
      key: "notifications" as const,
      icon: Bell,
      bg: "bg-blue-500",
      label: "Notifications",
      desc: "Get notified about new messages",
      onAllow: requestNotifications,
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[rgb(var(--card))] rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold">Enable features</h2>
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">
              UniConnect needs a few permissions to work best
            </p>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-xl hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Permission rows */}
        <div className="flex flex-col gap-3">
          {items.map(({ key, icon: Icon, bg, label, desc, onAllow }) => {
            const state = perms[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0", bg)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-[11px] text-[rgb(var(--muted-fg))] leading-snug">{desc}</p>
                </div>
                {state === "idle" ? (
                  <button
                    onClick={onAllow}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-xs font-semibold transition-opacity hover:opacity-90"
                  >
                    Allow
                  </button>
                ) : state === "granted" ? (
                  <span className="flex-shrink-0 text-xs font-semibold text-green-500">✓ Allowed</span>
                ) : (
                  <span className="flex-shrink-0 text-xs font-semibold text-[rgb(var(--muted-fg))]">Denied</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Done button */}
        <button
          onClick={dismiss}
          className={cn(
            "w-full py-3 rounded-2xl text-sm font-bold transition-all",
            allDone
              ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]"
              : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]"
          )}
        >
          {allDone ? "Done" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
