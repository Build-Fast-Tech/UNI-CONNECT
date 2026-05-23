"use client";

import { useEffect, useState } from "react";
import { Camera, Mic, Bell, X, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "uc_perms_asked";

type PermResult = "idle" | "asking" | "granted" | "blocked" | "inuse" | "nohardware" | "insecure" | "error";

interface PermState {
  camera: PermResult;
  mic: PermResult;
  notifications: PermResult;
}

function errorLabel(state: PermResult): string {
  switch (state) {
    case "blocked":    return "Denied in browser — click the 🔒 lock in the address bar → Permissions → Allow";
    case "inuse":      return "In use by another app — close other apps using camera/mic, then retry";
    case "nohardware": return "No device found — check your camera/mic is connected";
    case "insecure":   return "Requires HTTPS — open the site over https:// to use camera/mic";
    case "error":      return "Could not access — check OS privacy settings (Windows: Settings → Privacy → Camera/Microphone)";
    default:           return "";
  }
}

async function tryGetMedia(constraints: MediaStreamConstraints): Promise<PermResult> {
  if (!window.isSecureContext) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia) return "insecure";
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach(t => t.stop());
    return "granted";
  } catch (err) {
    if (err instanceof DOMException) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") return "blocked";
      if (err.name === "NotReadableError" || err.name === "TrackStartError")      return "inuse";
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError")    return "nohardware";
    }
    return "error";
  }
}

const BAD_STATES: PermResult[] = ["blocked", "inuse", "nohardware", "insecure", "error"];

export function PermissionsModal() {
  const [visible, setVisible] = useState(false);
  const [perms, setPerms] = useState<PermState>({ camera: "idle", mic: "idle", notifications: "idle" });

  useEffect(() => {
    try {
      // Already dismissed before — never show again
      if (localStorage.getItem(STORAGE_KEY)) return;

      // Check if all permissions are already granted by the browser.
      // If so, silently mark as done and skip the modal entirely.
      const checkExisting = async () => {
        if (!navigator.permissions) { setVisible(true); return; }
        try {
          const [cam, mic, notif] = await Promise.all([
            navigator.permissions.query({ name: "camera" as PermissionName }),
            navigator.permissions.query({ name: "microphone" as PermissionName }),
            "Notification" in window
              ? Promise.resolve({ state: Notification.permission })
              : Promise.resolve({ state: "denied" }),
          ]);
          if (cam.state === "granted" && mic.state === "granted" && notif.state === "granted") {
            localStorage.setItem(STORAGE_KEY, "1");
            return;
          }
        } catch {}
        setVisible(true);
      };

      checkExisting();
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
    if (!("Notification" in window)) { setPerms(p => ({ ...p, notifications: "nohardware" })); return; }
    setPerms(p => ({ ...p, notifications: "asking" }));
    try {
      const r = await Notification.requestPermission();
      setPerms(p => ({ ...p, notifications: r === "granted" ? "granted" : r === "denied" ? "blocked" : "error" }));
    } catch {
      setPerms(p => ({ ...p, notifications: "error" }));
    }
  };

  // Move allGranted + auto-dismiss BEFORE the early return so hook count is stable
  const allGranted = perms.camera === "granted" && perms.mic === "granted" && perms.notifications === "granted";

  useEffect(() => {
    if (allGranted) {
      const t = setTimeout(dismiss, 1000);
      return () => clearTimeout(t);
    }
  }, [allGranted]);

  if (!visible) return null;

  const items = [
    { key: "camera" as const,        icon: Camera, bg: "bg-violet-500", label: "Camera",        desc: "Take and send photos in chat",      onAllow: requestCamera },
    { key: "mic" as const,           icon: Mic,    bg: "bg-orange-500", label: "Microphone",    desc: "Send voice notes in conversations", onAllow: requestMic },
    { key: "notifications" as const, icon: Bell,   bg: "bg-blue-500",   label: "Notifications", desc: "Get notified about new messages",   onAllow: requestNotifications },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[rgb(var(--card))] rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 flex flex-col gap-4">

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold">Enable features</h2>
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">Grant permissions to use all features</p>
          </div>
          <button onClick={dismiss} className="p-1.5 rounded-xl hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {items.map(({ key, icon: Icon, bg, label, desc, onAllow }) => {
            const state = perms[key];
            const isBad = BAD_STATES.includes(state);
            return (
              <div key={key} className={cn(
                "rounded-2xl p-3 transition-colors border",
                isBad
                  ? "border-red-500/30 bg-red-500/5"
                  : state === "granted"
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.3)]"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0", bg)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[11px] text-[rgb(var(--muted-fg))]">{desc}</p>
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
                    <CheckCircle2 className="flex-shrink-0 w-5 h-5 text-green-500" />
                  )}
                  {isBad && (
                    <button onClick={onAllow} title="Retry" className="flex-shrink-0 p-2 rounded-xl bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] transition-colors">
                      <RefreshCw className="w-3.5 h-3.5 text-[rgb(var(--muted-fg))]" />
                    </button>
                  )}
                </div>

                {/* Inline error explanation */}
                {isBad && (
                  <p className="mt-2 text-[11px] text-red-400 leading-snug pl-1">
                    ⚠ {errorLabel(state)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

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
