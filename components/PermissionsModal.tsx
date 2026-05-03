"use client";

import { useEffect, useState } from "react";
import { Camera, Mic, Bell, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "uc_perms_asked";

type PermResult = "idle" | "granted" | "blocked" | "unavailable";

interface PermState {
  camera: PermResult;
  mic: PermResult;
  notifications: PermResult;
}

async function queryPermission(name: PermissionName): Promise<PermissionState | null> {
  try {
    const status = await navigator.permissions.query({ name });
    return status.state;
  } catch {
    return null;
  }
}

async function requestMediaPermission(constraints: MediaStreamConstraints, permName: PermissionName): Promise<PermResult> {
  if (!navigator.mediaDevices?.getUserMedia) return "unavailable";

  // Check current state first so we know if the browser will even show a dialog
  const current = await queryPermission(permName);
  if (current === "granted") return "granted";
  if (current === "denied") return "blocked"; // browser won't re-prompt; must reset in settings

  // state is "prompt" (or Permissions API unsupported) — getUserMedia will show the browser dialog
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

  // Pre-fill states for already-granted permissions so users don't re-click
  useEffect(() => {
    if (!visible) return;
    (async () => {
      const [camState, micState] = await Promise.all([
        queryPermission("camera" as PermissionName),
        queryPermission("microphone" as PermissionName),
      ]);
      setPerms(p => ({
        ...p,
        camera: camState === "granted" ? "granted" : camState === "denied" ? "blocked" : "idle",
        mic:    micState === "granted" ? "granted" : micState === "denied" ? "blocked" : "idle",
        notifications:
          "Notification" in window && Notification.permission === "granted"
            ? "granted"
            : Notification.permission === "denied"
            ? "blocked"
            : "idle",
      }));
    })();
  }, [visible]);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setVisible(false);
  };

  const requestCamera = async () => {
    const result = await requestMediaPermission({ video: true }, "camera" as PermissionName);
    setPerms(p => ({ ...p, camera: result }));
  };

  const requestMic = async () => {
    const result = await requestMediaPermission({ audio: true }, "microphone" as PermissionName);
    setPerms(p => ({ ...p, mic: result }));
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) { setPerms(p => ({ ...p, notifications: "unavailable" })); return; }
    if (Notification.permission === "denied") { setPerms(p => ({ ...p, notifications: "blocked" })); return; }
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
    { key: "camera" as const,        icon: Camera, bg: "bg-violet-500", label: "Camera",       desc: "Take photos and share them in chat",       onAllow: requestCamera },
    { key: "mic" as const,           icon: Mic,    bg: "bg-orange-500", label: "Microphone",   desc: "Send voice notes in conversations",        onAllow: requestMic },
    { key: "notifications" as const, icon: Bell,   bg: "bg-blue-500",   label: "Notifications", desc: "Get notified about new messages",         onAllow: requestNotifications },
  ];

  const allGranted  = items.every(i => perms[i.key] === "granted");
  const allAnswered = items.every(i => perms[i.key] !== "idle");

  function StatusCell({ state, onAllow }: { state: PermResult; onAllow: () => void }) {
    if (state === "idle") {
      return (
        <button onClick={onAllow} className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-xs font-semibold hover:opacity-90 transition-opacity">
          Allow
        </button>
      );
    }
    if (state === "granted") return <span className="flex-shrink-0 text-xs font-semibold text-green-500">✓ Allowed</span>;
    if (state === "blocked") {
      return (
        <div className="flex-shrink-0 flex flex-col items-end gap-0.5 max-w-[90px]">
          <span className="text-[11px] font-semibold text-amber-500">Blocked</span>
          <span className="text-[10px] text-[rgb(var(--muted-fg))] text-right leading-tight">Reset in browser<br/>site settings</span>
        </div>
      );
    }
    return <span className="flex-shrink-0 text-[11px] text-[rgb(var(--muted-fg))]">Not available</span>;
  }

  const anyBlocked = items.some(i => perms[i.key] === "blocked");

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[rgb(var(--card))] rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 flex flex-col gap-5">

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold">Enable features</h2>
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">UniConnect needs a few permissions to work best</p>
          </div>
          <button onClick={dismiss} className="p-1.5 rounded-xl hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

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
              <StatusCell state={perms[key]} onAllow={onAllow} />
            </div>
          ))}
        </div>

        {/* Help text when something is blocked */}
        {anyBlocked && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-start gap-2">
            <span className="text-amber-500 text-sm mt-0.5">⚠</span>
            <p className="text-xs text-[rgb(var(--muted-fg))] leading-relaxed">
              A permission was blocked by your browser. Click the <strong className="text-[rgb(var(--fg))]">lock icon</strong> in the address bar → <strong className="text-[rgb(var(--fg))]">Site settings</strong> → reset the blocked permission, then refresh and try again.
            </p>
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
          {allGranted ? "Done" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
