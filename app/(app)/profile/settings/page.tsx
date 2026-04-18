"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, Lock, Bell, Trash2, Eye, EyeOff, CheckCircle,
  AlertTriangle, User, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "midnight",   label: "Midnight",   bg: "#0A0A0F", primary: "#6366F1", desc: "Late-night study sessions" },
  { id: "daylight",   label: "Daylight",   bg: "#FAFAFA", primary: "#4F46E5", desc: "Clean, library, Sunday morning" },
  { id: "monochrome", label: "Monochrome", bg: "#000000", primary: "#FFFFFF", desc: "Minimalist, pure focus" },
] as const;

type ThemeId = typeof THEMES[number]["id"];

const SECTIONS = [
  { id: "appearance", label: "Appearance",  icon: Palette },
  { id: "security",   label: "Security",    icon: Lock },
  { id: "account",    label: "Account",     icon: User },
];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeSection, setActiveSection] = useState("appearance");
  const [currentTheme, setCurrentTheme] = useState<ThemeId>("midnight");

  // Security
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState("");

  // Account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const saved = (document.documentElement.dataset.theme as ThemeId) || "midnight";
    setCurrentTheme(saved);
  }, []);

  const applyTheme = async (theme: ThemeId) => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
    setCurrentTheme(theme);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ theme }).eq("id", user.id);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    if (newPass.length < 10) { setPassError("New password must be at least 10 characters."); return; }
    if (newPass !== confirmPass) { setPassError("Passwords do not match."); return; }

    setPassLoading(true);
    // Re-authenticate then update
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setPassError("Could not verify session."); setPassLoading(false); return; }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPass,
    });
    if (signInErr) { setPassError("Current password is incorrect."); setPassLoading(false); return; }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPass });
    if (updateErr) { setPassError(updateErr.message); setPassLoading(false); return; }

    setPassSuccess(true);
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
    setPassLoading(false);
    setTimeout(() => setPassSuccess(false), 3000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleteLoading(true);
    // Cascade delete via Supabase (profiles row deletes cascade to auth)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      router.push("/");
    }
    setDeleteLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">Manage your account preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-44 flex-shrink-0 space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                activeSection === id
                  ? "bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}

          <div className="pt-4 border-t border-[rgb(var(--border))]">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[rgb(var(--destructive))] hover:bg-[rgb(var(--destructive)/0.08)] transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* ── Appearance ── */}
            {activeSection === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="theme-card p-6"
              >
                <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[rgb(var(--primary))]" />
                  Theme
                </h2>
                <p className="text-sm text-[rgb(var(--muted-fg))] mb-5">
                  Choose your vibe. Changes apply instantly and are saved to your account.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => applyTheme(theme.id)}
                      className={cn(
                        "relative p-3 rounded-xl border-2 text-left transition-all duration-200",
                        currentTheme === theme.id
                          ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.06)]"
                          : "border-[rgb(var(--border))] hover:border-[rgb(var(--primary)/0.4)]"
                      )}
                    >
                      {/* Swatch */}
                      <div
                        className="w-full h-12 rounded-lg mb-2 flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: theme.bg }}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                        <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: theme.primary, opacity: 0.6 }} />
                      </div>
                      <p className="text-xs font-semibold">{theme.label}</p>
                      <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5 leading-tight">{theme.desc}</p>
                      {currentTheme === theme.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-4 h-4 text-[rgb(var(--primary))]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Security ── */}
            {activeSection === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="theme-card p-6"
              >
                <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[rgb(var(--primary))]" />
                  Change password
                </h2>
                <p className="text-sm text-[rgb(var(--muted-fg))] mb-5">
                  Min. 10 characters with at least one letter and one number.
                </p>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {[
                    { label: "Current password", value: currentPass, set: setCurrentPass },
                    { label: "New password",      value: newPass,     set: setNewPass },
                    { label: "Confirm new password", value: confirmPass, set: setConfirmPass },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <label className="block text-sm font-medium mb-1.5">{label}</label>
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          value={value}
                          onChange={e => set(e.target.value)}
                          required
                          className={cn(
                            "w-full h-10 pl-4 pr-10 rounded-xl text-sm",
                            "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                            "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                            "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-fg))]"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {passError && (
                    <p className="text-sm text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.1)] px-3 py-2 rounded-lg">
                      {passError}
                    </p>
                  )}
                  {passSuccess && (
                    <p className="text-sm text-[rgb(var(--success))] bg-[rgb(var(--success)/0.1)] px-3 py-2 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Password updated successfully.
                    </p>
                  )}

                  <Button type="submit" variant="primary" size="md" loading={passLoading}>
                    Update password
                  </Button>
                </form>
              </motion.div>
            )}

            {/* ── Account ── */}
            {activeSection === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="theme-card p-6">
                  <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[rgb(var(--primary))]" />
                    Notifications
                  </h2>
                  <p className="text-sm text-[rgb(var(--muted-fg))] mb-4">
                    Notification preferences coming soon.
                  </p>
                  <div className="text-xs text-[rgb(var(--muted-fg))] bg-[rgb(var(--muted))] px-3 py-2 rounded-lg">
                    Email notifications for job applications, DMs, and note activity will be configurable here.
                  </div>
                </div>

                {/* Danger zone */}
                <div className="theme-card p-6 border border-[rgb(var(--destructive)/0.2)]">
                  <h2 className="text-base font-semibold mb-1 flex items-center gap-2 text-[rgb(var(--destructive))]">
                    <AlertTriangle className="w-4 h-4" />
                    Danger zone
                  </h2>
                  <p className="text-sm text-[rgb(var(--muted-fg))] mb-4">
                    Permanently delete your account and all data. This cannot be undone.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                    className="border-[rgb(var(--destructive)/0.4)] text-[rgb(var(--destructive))] hover:bg-[rgb(var(--destructive)/0.08)]"
                  >
                    <Trash2 className="w-4 h-4" /> Delete my account
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="theme-card p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[rgb(var(--destructive)/0.15)] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[rgb(var(--destructive))]" />
                </div>
                <h3 className="text-lg font-bold">Delete account</h3>
              </div>
              <p className="text-sm text-[rgb(var(--muted-fg))] mb-4">
                This will permanently delete your profile, notes, messages, and all data. Type{" "}
                <strong className="text-[rgb(var(--fg))]">DELETE</strong> to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE to confirm"
                className={cn(
                  "w-full h-10 px-4 rounded-xl text-sm mb-4",
                  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                  "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--destructive))]"
                )}
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="md"
                  loading={deleteLoading}
                  disabled={deleteConfirm !== "DELETE"}
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-[rgb(var(--destructive))] text-white hover:opacity-90 disabled:opacity-40"
                >
                  Delete forever
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
