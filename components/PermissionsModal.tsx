"use client";

import { useEffect, useState } from "react";
import { Camera, Mic, Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "uc_perms_asked";

type PermResult = "idle" | "granted" | "blocked" | "unavailable";

interface PermState {
  camera: PermResult;
  mic: PermResult;
  notifications: PermResult;
}

// Returns "blocked" only when the user explicitly denied in the browser dialog.
// Returns "unavailable" for missing hardware, non-HTTPS, or other errors.
function classifyError(err: unknown): "blocked" | "unavailable" {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") return "blocked";
  }
  return "unavailable";
}

async function askMedia(constraints: MediaStreamConstraints): Promise<PermResult> {
  if (!navigator.mediaDevices?.getUserMedia) return "unavailable";
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach(t => t.stop());
    return "granted";
  } catch (err) {
    return classifyError(err);
  }
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
    const result = await askMedia({ video: true });
    setPerms(p => ({ ...p, camera: result }));
  };

  const requestMic = async () => {
    const result = await askMedia({ audio: true });
    setPerms(p => ({ ...p, mic: result }));
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      setPerms(p => ({ ...p, notifications: "unavailable" }));
      return;
    }
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

  const allAnswered = perms.camera !== "idle" && perms.mic !== "idle" && perms.notifications !== "idle";
  const allGranted  = perms.camera === "granted" && perms.mic === "granted" && perms.notifications === "granted";

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

  function StatusBadge({ state, onRetry }: { state: PermResult; onRetry: () => void }) {
    if (state === "idle") {
      return (
        <button
          onClick={onRetry}
          className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-xs font-semibold transition-opacity hover:opacity-90"
        >
          Allow
        </button>
      );
    }
    if (state === "granted") {
      return <span className="flex-shrink-0 text-xs font-semibold text-green-500">✓ Allowed</span>;
    }
    if (state === "blocked") {
      return (
        <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
          <span className="text-[11px] font-semibold text-red-400">Blocked</span>
          <span className="text-[10px] text-[rgb(var(--muted-fg))] text-right leading-tight">
            Allow in browser<br />site settings
          </span>
        </div>
      );
    }
    // unavailable
    return (
      <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
        <span className="text-[11px] font-semibold text-[rgb(var(--muted-fg))]">Not available</span>
      </div>
    );
  }

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
        <div className="flex flex-col gap-4">
          {items.map(({ key, icon: Icon, bg, label, desc, onAllow }) => (
            <div key={key} className="flex items-center gap-3">
              <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0", bg)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{label}</p>
                <p className="text-[11px] text-[rgb(var(--muted-fg))] leading-snug">{desc}</p>
              </div>
              <StatusBadge state={perms[key]} onRetry={onAllow} />
            </div>
          ))}
        </div>

        {/* Done button */}
        <button
          onClick={dismiss}
          className={cn(
            "w-full py-3 rounded-2xl text-sm font-bold transition-all",
            allGranted
              ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]"
              : allAnswered
                ? "bg-[rgb(var(--muted))] text-[rgb(var(--fg))]"
                : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]"
          )}
        >
          {allGranted ? "Done" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
