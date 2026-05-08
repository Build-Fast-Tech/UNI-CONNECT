"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, Lock, Bell, Trash2, Eye, EyeOff, CheckCircle,
  AlertTriangle, User, LogOut, AtSign, Loader2, Sun, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { Pill } from "@/components/ui/Pill";
import { Field } from "@/components/ui/Field";
import { useTheme } from "@/components/providers/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import type { ThemeId } from "@/lib/utils";
import { cn } from "@/lib/utils";

const THEME_CARDS: { id: ThemeId; label: string; desc: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", desc: "Paper cream, ink, restraint.", icon: Sun },
  { id: "dark",  label: "Dark",  desc: "Inky charcoal, lifted moss.",  icon: Moon },
];

const SECTIONS = [
  { id: "username",   label: "Username",   icon: AtSign },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security",   label: "Security",   icon: Lock },
  { id: "account",    label: "Account",    icon: User },
];

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { theme: currentTheme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("username");

  // Username
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

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
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyUserId(user.id);
      const { data } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      if (data?.username) {
        setCurrentUsername(data.username);
        setUsernameInput(data.username);
      }
    })();
  }, []);

  const handleUsernameInput = async (value: string) => {
    const lower = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsernameInput(lower);
    setUsernameError("");
    setUsernameAvailable(null);
    setUsernameSuccess(false);

    if (!lower || lower === currentUsername) return;

    if (!USERNAME_REGEX.test(lower)) {
      setUsernameError("3–20 chars, only lowercase letters, numbers, and underscores.");
      return;
    }

    setUsernameChecking(true);
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", lower)
      .single();
    setUsernameChecking(false);
    setUsernameAvailable(!data);
    if (data) setUsernameError("That username is already taken.");
  };

  const handleSaveUsername = async () => {
    if (!myUserId || !usernameInput) return;
    if (!USERNAME_REGEX.test(usernameInput)) return;
    if (usernameInput === currentUsername) return;
    if (!usernameAvailable) return;

    setUsernameSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: usernameInput })
      .eq("id", myUserId);
    setUsernameSaving(false);

    if (error) {
      setUsernameError(error.message.includes("unique") ? "That username is already taken." : error.message);
    } else {
      setCurrentUsername(usernameInput);
      setUsernameAvailable(null);
      setUsernameSuccess(true);
      setTimeout(() => setUsernameSuccess(false), 3000);
    }
  };

  const applyTheme = async (theme: ThemeId) => {
    setTheme(theme);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Best-effort persistence; ignore the error if the column was dropped/migrated.
      await (supabase.from("profiles") as any).update({ theme }).eq("id", user.id);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    if (newPass.length < 10) { setPassError("New password must be at least 10 characters."); return; }
    if (newPass !== confirmPass) { setPassError("Passwords do not match."); return; }

    setPassLoading(true);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      router.push("/");
    }
    setDeleteLoading(false);
  };

  const usernameSuffix = (() => {
    if (usernameChecking) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (usernameAvailable === true && usernameInput) return <CheckCircle className="w-4 h-4 text-[rgb(var(--positive))]" />;
    if (usernameAvailable === false) return <AlertTriangle className="w-4 h-4 text-[rgb(var(--destructive))]" />;
    return null;
  })();

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10">
        <p className="eyebrow mb-3">Account</p>
        <h1 className="font-display text-[44px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
          Settings.
        </h1>
        <p className="mt-3 text-[15px] text-[rgb(var(--fg-2))]">Manage your account preferences.</p>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <nav className="col-span-12 md:col-span-3 space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-[var(--dur-quick)]",
                activeSection === id
                  ? "bg-[rgb(var(--primary)/0.10)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--fg-2))] hover:bg-[rgb(var(--bg-sunk))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.7} />
              {label}
            </button>
          ))}

          <div className="pt-4 mt-3 border-t border-[rgb(var(--line))]">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[rgb(var(--destructive))] hover:bg-[rgb(var(--destructive)/0.08)] transition-colors duration-[var(--dur-quick)]"
            >
              <LogOut className="w-[18px] h-[18px]" strokeWidth={1.7} />
              Sign out
            </button>
          </div>
        </nav>

        <div className="col-span-12 md:col-span-9 min-w-0">
          <AnimatePresence mode="wait">
            {/* Username */}
            {activeSection === "username" && (
              <motion.div
                key="username"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.22 }}
              >
                <Surface tone="default" radius="lg" elevation="low" className="p-7 space-y-6">
                  <div>
                    <h2 className="font-display text-2xl tracking-tight text-[rgb(var(--fg))]">Your username</h2>
                    <p className="text-sm text-[rgb(var(--fg-2))] mt-1.5 leading-relaxed">
                      Pick a unique handle. Others can search for you by this name. 3–20 characters, lowercase letters, numbers, and underscores.
                    </p>
                  </div>

                  {currentUsername && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgb(var(--bg-sunk))] border border-[rgb(var(--line))] text-sm">
                      <span className="text-[rgb(var(--fg-3))]">Current</span>
                      <span className="font-mono font-semibold text-[rgb(var(--primary))]">@{currentUsername}</span>
                    </div>
                  )}

                  <Field
                    label="New username"
                    name="username"
                    value={usernameInput}
                    onChange={(e) => handleUsernameInput(e.target.value)}
                    maxLength={20}
                    placeholder="your_username"
                    className="font-mono"
                    prefix={<AtSign className="w-4 h-4" />}
                    suffix={usernameSuffix}
                    error={usernameError || null}
                    hint={
                      usernameSuccess
                        ? "Username saved."
                        : usernameAvailable && usernameInput
                          ? `@${usernameInput} is available.`
                          : undefined
                    }
                  />

                  <Button
                    variant="primary"
                    size="md"
                    shape="pill"
                    loading={usernameSaving}
                    disabled={
                      !usernameInput ||
                      usernameInput === currentUsername ||
                      !usernameAvailable ||
                      usernameSaving
                    }
                    onClick={handleSaveUsername}
                  >
                    Save username
                  </Button>

                  <div className="pt-2 border-t border-[rgb(var(--line))]">
                    <p className="text-xs text-[rgb(var(--fg-3))] leading-relaxed">
                      Your username is how people find you in search. Appears as{" "}
                      <span className="font-mono text-[rgb(var(--fg))]">@{usernameInput || "you"}</span> across the platform.
                    </p>
                  </div>
                </Surface>
              </motion.div>
            )}

            {/* Appearance */}
            {activeSection === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.22 }}
              >
                <Surface tone="default" radius="lg" elevation="low" className="p-7 space-y-6">
                  <div>
                    <h2 className="font-display text-2xl tracking-tight text-[rgb(var(--fg))]">Appearance</h2>
                    <p className="text-sm text-[rgb(var(--fg-2))] mt-1.5 leading-relaxed">
                      Two modes. The platform decides nothing about you — pick whichever feels right.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {THEME_CARDS.map((theme) => {
                      const active = currentTheme === theme.id;
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => applyTheme(theme.id)}
                          className={cn(
                            "relative p-4 rounded-2xl border-2 text-left transition-colors duration-[var(--dur-quick)]",
                            active
                              ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.06)]"
                              : "border-[rgb(var(--line))] hover:border-[rgb(var(--line-strong))]"
                          )}
                        >
                          <div
                            className="w-full h-14 rounded-xl mb-3 flex items-center justify-center gap-2"
                            style={{
                              background:
                                theme.id === "light"
                                  ? "linear-gradient(135deg, rgb(var(--bg)), rgb(var(--bg-elev)))"
                                  : "linear-gradient(135deg, rgb(var(--bg)), rgb(var(--bg-elev)))",
                            }}
                          >
                            <Icon
                              className="w-4 h-4"
                              style={{ color: "rgb(var(--primary))" }}
                            />
                            <span
                              className="w-6 h-1.5 rounded-full"
                              style={{
                                background: "rgb(var(--primary))",
                                opacity: 0.7,
                              }}
                            />
                          </div>
                          <p className="text-sm font-semibold tracking-tight text-[rgb(var(--fg))]">
                            {theme.label}
                          </p>
                          <p className="text-xs text-[rgb(var(--fg-3))] mt-0.5 leading-tight">
                            {theme.desc}
                          </p>
                          {active && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle className="w-4 h-4 text-[rgb(var(--primary))]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Surface>
              </motion.div>
            )}

            {/* Security */}
            {activeSection === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.22 }}
              >
                <Surface tone="default" radius="lg" elevation="low" className="p-7">
                  <div className="mb-6">
                    <h2 className="font-display text-2xl tracking-tight text-[rgb(var(--fg))]">Change password</h2>
                    <p className="text-sm text-[rgb(var(--fg-2))] mt-1.5 leading-relaxed">
                      Min. 10 characters with at least one letter and one number.
                    </p>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-5">
                    {[
                      { label: "Current password",     value: currentPass, set: setCurrentPass },
                      { label: "New password",         value: newPass,     set: setNewPass     },
                      { label: "Confirm new password", value: confirmPass, set: setConfirmPass },
                    ].map(({ label, value, set }) => (
                      <Field
                        key={label}
                        label={label}
                        name={label}
                        type={showPass ? "text" : "password"}
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        required
                        prefix={<Lock className="w-4 h-4" />}
                        suffix={
                          label === "Current password" ? (
                            <button
                              type="button"
                              onClick={() => setShowPass((s) => !s)}
                              className="hover:text-[rgb(var(--fg))] transition-colors"
                              aria-label={showPass ? "Hide passwords" : "Show passwords"}
                            >
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          ) : null
                        }
                      />
                    ))}

                    {passError && (
                      <div className="text-sm text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.08)] border border-[rgb(var(--destructive)/0.20)] px-3.5 py-2.5 rounded-xl">
                        {passError}
                      </div>
                    )}
                    {passSuccess && (
                      <div className="text-sm text-[rgb(var(--positive))] bg-[rgb(var(--positive)/0.10)] border border-[rgb(var(--positive)/0.20)] px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Password updated successfully.
                      </div>
                    )}

                    <Button type="submit" variant="primary" size="md" shape="pill" loading={passLoading}>
                      Update password
                    </Button>
                  </form>
                </Surface>
              </motion.div>
            )}

            {/* Account */}
            {activeSection === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <Surface tone="default" radius="lg" elevation="low" className="p-7">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-4 h-4 text-[rgb(var(--primary))]" />
                    <h2 className="font-display text-2xl tracking-tight text-[rgb(var(--fg))]">Notifications</h2>
                  </div>
                  <p className="text-sm text-[rgb(var(--fg-2))] mb-4 leading-relaxed">
                    Notification preferences coming soon.
                  </p>
                  <div className="text-xs text-[rgb(var(--fg-3))] bg-[rgb(var(--bg-sunk))] border border-[rgb(var(--line))] px-3.5 py-2.5 rounded-xl">
                    Email notifications for job applications, DMs, and note activity will be configurable here.
                  </div>
                </Surface>

                <Surface tone="default" radius="lg" elevation="low" className="p-7 border-[rgb(var(--destructive)/0.30)]">
                  <div className="flex items-center gap-2 text-[rgb(var(--destructive))] mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <h2 className="font-display text-2xl tracking-tight">Danger zone</h2>
                  </div>
                  <p className="text-sm text-[rgb(var(--fg-2))] mb-4 leading-relaxed">
                    Permanently delete your account and all data. This cannot be undone.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    shape="pill"
                    onClick={() => setShowDeleteModal(true)}
                    className="border-[rgb(var(--destructive)/0.40)] text-[rgb(var(--destructive))] hover:bg-[rgb(var(--destructive)/0.08)]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete my account
                  </Button>
                </Surface>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgb(var(--fg)/0.50)] backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Surface tone="default" radius="lg" elevation="high" className="p-7">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-full bg-[rgb(var(--destructive)/0.12)] text-[rgb(var(--destructive))] flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <h3 className="font-display text-xl tracking-tight text-[rgb(var(--fg))]">Delete account</h3>
                </div>
                <p className="text-sm text-[rgb(var(--fg-2))] mb-4 leading-relaxed">
                  This will permanently delete your profile, notes, messages, and all data. Type{" "}
                  <strong className="text-[rgb(var(--fg))] font-mono">DELETE</strong> to confirm.
                </p>
                <Field
                  name="confirm-delete"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="font-mono"
                />
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    size="md"
                    shape="pill"
                    className="flex-1"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="md"
                    shape="pill"
                    loading={deleteLoading}
                    disabled={deleteConfirm !== "DELETE"}
                    onClick={handleDeleteAccount}
                    className="flex-1"
                  >
                    Delete forever
                  </Button>
                </div>
              </Surface>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
