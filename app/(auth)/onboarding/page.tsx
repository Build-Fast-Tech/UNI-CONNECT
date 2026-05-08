"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronRight, Upload, CheckCircle, ArrowLeft, ArrowUpRight, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/Pill";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type University = Database["public"]["Tables"]["universities"]["Row"];
type Branch = Database["public"]["Tables"]["branches"]["Row"];

const DEPARTMENTS = [
  "Artificial Intelligence", "Computer Science", "Software Engineering", "Electrical Engineering",
  "Mechanical Engineering", "Civil Engineering", "Business Administration",
  "Economics", "Mathematics", "Physics", "Chemistry", "Biology",
  "Medical Sciences", "Law", "Architecture", "Media Studies", "Psychology",
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate"];

const STEP_LABELS = ["University", "Details", "Profile"];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [universities, setUniversities] = useState<University[]>([]);
  const [uniSearch, setUniSearch] = useState("");
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");

  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    supabase
      .from("universities")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("name")
      .then(({ data }) => setUniversities(data || []));
  }, []);

  useEffect(() => {
    if (!selectedUni) return;
    supabase
      .from("branches")
      .select("*")
      .eq("university_id", selectedUni.id)
      .order("name")
      .then(({ data }) => setBranches(data || []));
  }, [selectedUni]);

  const filteredUnis = universities.filter((u) =>
    u.name.toLowerCase().includes(uniSearch.toLowerCase()) ||
    u.short_name.toLowerCase().includes(uniSearch.toLowerCase()) ||
    (u.city || "").toLowerCase().includes(uniSearch.toLowerCase())
  );

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleComplete = async () => {
    setError("");
    if (!avatarFile && !avatarPreview) { setError("Please upload a profile picture."); return; }
    if (!bio.trim()) { setError("Please write a short bio."); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    let avatar_url: string | undefined;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }
    }

    const { error: updateError } = await (supabase.from("profiles") as any).upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? "",
      university_id: selectedUni?.id,
      branch_id: selectedBranch?.id ?? null,
      department: department || null,
      year_of_study: year ? YEARS.indexOf(year) + 1 : null,
      bio: bio || null,
      avatar_url: avatar_url ?? null,
    }, { onConflict: "id" });

    if (updateError) {
      const msg = updateError.message ?? JSON.stringify(updateError);
      setError(msg);
      setLoading(false);
      return;
    }

    document.cookie = "uc_onboarded=1; path=/; max-age=31536000; SameSite=Lax";
    router.push("/feed");
  };

  const slideVariants = {
    enter:  { x: 32, opacity: 0 },
    center: { x: 0,  opacity: 1 },
    exit:   { x: -32, opacity: 0 },
  };

  return (
    <div className="w-full max-w-[480px]">
      {/* Editorial step indicator */}
      <header className="mb-10">
        <p className="eyebrow mb-3">Setting up · Step {String(step).padStart(2, "0")} of 03</p>
        <h1 className="font-display text-[40px] sm:text-[44px] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
          {step === 1 && <>Pick your <em className="italic text-[rgb(var(--accent))]">campus.</em></>}
          {step === 2 && <>Tell us your <em className="italic text-[rgb(var(--accent))]">details.</em></>}
          {step === 3 && <>Make it <em className="italic text-[rgb(var(--accent))]">yours.</em></>}
        </h1>
      </header>

      {/* Progress rule */}
      <div className="mb-10 flex items-center gap-3">
        {STEP_LABELS.map((label, i) => {
          const idx = i + 1;
          const past = step > idx;
          const current = step === idx;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <span
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full font-mono text-[11px] tracking-tight transition-colors duration-[var(--dur-base)]",
                  past
                    ? "bg-[rgb(var(--positive))] text-white border border-[rgb(var(--positive))]"
                    : current
                    ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] border border-[rgb(var(--fg))]"
                    : "bg-transparent text-[rgb(var(--fg-3))] border border-[rgb(var(--line))]"
                )}
              >
                {past ? <CheckCircle className="w-3.5 h-3.5" /> : String(idx).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "text-[12px] font-mono tracking-tight hidden sm:inline",
                  current ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--fg-3))]"
                )}
              >
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <span className="flex-1 h-px bg-[rgb(var(--line))] mx-1" />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {/* Step 1: University */}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 0.68, 0.32, 1] }}
          >
            <p className="text-[15px] text-[rgb(var(--fg-2))] mb-6 leading-relaxed">
              This sets your campus identity across UniConnect. You can change it later.
            </p>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--fg-3))]" />
              <input
                type="text"
                value={uniSearch}
                onChange={(e) => setUniSearch(e.target.value)}
                placeholder="Search NUST, LUMS, FAST…"
                className={cn(
                  "w-full h-11 pl-11 pr-4 rounded-xl text-sm",
                  "bg-[rgb(var(--field))] border border-[rgb(var(--field-line))]",
                  "text-[rgb(var(--field-fg))] placeholder:text-[rgb(var(--fg-3))]",
                  "focus:outline-none focus:border-[rgb(var(--ring))] focus:shadow-[0_0_0_4px_rgb(var(--ring)/0.14)]",
                  "transition-[border-color,box-shadow]"
                )}
              />
            </div>

            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 -mr-1">
              {filteredUnis.length === 0 && (
                <p className="text-center text-sm text-[rgb(var(--fg-3))] py-10">
                  No universities matched.
                </p>
              )}
              {filteredUnis.map((uni) => {
                const active = selectedUni?.id === uni.id;
                return (
                  <button
                    key={uni.id}
                    type="button"
                    onClick={() => setSelectedUni(uni)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors duration-[var(--dur-quick)] border",
                      active
                        ? "bg-[rgb(var(--primary)/0.08)] border-[rgb(var(--primary)/0.30)] text-[rgb(var(--fg))]"
                        : "border-transparent hover:bg-[rgb(var(--bg-sunk))] text-[rgb(var(--fg-2))]"
                    )}
                  >
                    <span className="w-9 h-9 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--line))] flex items-center justify-center font-mono text-[11px] tracking-tight text-[rgb(var(--fg-2))] flex-shrink-0">
                      {uni.short_name.slice(0, 3).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-[rgb(var(--fg))]">{uni.name}</p>
                      <p className="text-[11px] text-[rgb(var(--fg-3))] font-mono tracking-tight">
                        {uni.short_name}{uni.city ? ` · ${uni.city}` : ""}
                      </p>
                    </div>
                    {active && <CheckCircle className="w-4 h-4 text-[rgb(var(--primary))] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <Button
              variant="primary"
              size="lg"
              shape="pill"
              className="w-full mt-8 group"
              disabled={!selectedUni}
              onClick={() => setStep(2)}
            >
              Continue
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 0.68, 0.32, 1] }}
          >
            <p className="text-[15px] text-[rgb(var(--fg-2))] mb-1 leading-relaxed">
              You picked <strong className="text-[rgb(var(--fg))]">{selectedUni?.name}</strong>.
            </p>
            <p className="text-[13px] text-[rgb(var(--fg-3))] mb-6 font-mono tracking-tight">
              {selectedUni?.short_name}{selectedUni?.city ? ` · ${selectedUni.city}` : ""}
            </p>

            {branches.length > 0 && (
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2 tracking-tight">Campus / Branch</label>
                <select
                  value={selectedBranch?.id || ""}
                  onChange={(e) => {
                    const b = branches.find((br) => br.id === e.target.value);
                    setSelectedBranch(b || null);
                  }}
                  className={cn(
                    "w-full h-11 px-4 rounded-xl text-sm",
                    "bg-[rgb(var(--field))] border border-[rgb(var(--field-line))]",
                    "text-[rgb(var(--field-fg))]",
                    "focus:outline-none focus:border-[rgb(var(--ring))] focus:shadow-[0_0_0_4px_rgb(var(--ring)/0.14)]",
                    "transition-[border-color,box-shadow]"
                  )}
                >
                  <option value="">Select campus</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-medium mb-2 tracking-tight">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={cn(
                  "w-full h-11 px-4 rounded-xl text-sm",
                  "bg-[rgb(var(--field))] border border-[rgb(var(--field-line))]",
                  "text-[rgb(var(--field-fg))]",
                  "focus:outline-none focus:border-[rgb(var(--ring))] focus:shadow-[0_0_0_4px_rgb(var(--ring)/0.14)]",
                  "transition-[border-color,box-shadow]"
                )}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="mb-7">
              <label className="block text-sm font-medium mb-2 tracking-tight">Year of study</label>
              <div className="grid grid-cols-3 gap-2">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className={cn(
                      "h-10 rounded-full text-[12px] font-medium transition-colors duration-[var(--dur-quick)] border",
                      year === y
                        ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] border-[rgb(var(--fg))]"
                        : "bg-transparent text-[rgb(var(--fg-2))] border-[rgb(var(--line))] hover:border-[rgb(var(--line-strong))]"
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" shape="pill" className="flex-1" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                shape="pill"
                className="flex-1 group"
                disabled={!department || !year || (branches.length > 0 && !selectedBranch)}
                onClick={() => setStep(3)}
              >
                Continue
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Profile */}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 0.68, 0.32, 1] }}
          >
            <p className="text-[15px] text-[rgb(var(--fg-2))] mb-7 leading-relaxed">
              A photo and a one-line bio. Other students will see this.
            </p>

            <div className="flex items-center gap-5 mb-7">
              <label htmlFor="avatar-upload" className="cursor-pointer group">
                <div
                  className={cn(
                    "w-24 h-24 rounded-full overflow-hidden flex items-center justify-center",
                    "bg-[rgb(var(--bg-sunk))] border border-dashed border-[rgb(var(--line-strong))]",
                    "group-hover:border-[rgb(var(--primary))] transition-colors"
                  )}
                >
                  {avatarPreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-[rgb(var(--fg-3))]" strokeWidth={1.4} />
                  )}
                </div>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div>
                <p className="text-sm font-medium text-[rgb(var(--fg))] tracking-tight">Profile photo</p>
                <p className="text-xs text-[rgb(var(--fg-3))] mt-0.5">JPG, PNG · max 4MB</p>
                <label htmlFor="avatar-upload">
                  <span className="inline-flex items-center gap-1.5 mt-2 text-xs text-[rgb(var(--primary))] cursor-pointer link-grow">
                    <Upload className="w-3 h-3" />
                    {avatarPreview ? "Replace" : "Upload"}
                  </span>
                </label>
              </div>
            </div>

            <div className="mb-7">
              <label className="block text-sm font-medium mb-2 tracking-tight">
                One-line bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short line about you for fellow students…"
                rows={3}
                maxLength={160}
                className={cn(
                  "w-full px-4 py-3 rounded-xl text-sm resize-none",
                  "bg-[rgb(var(--field))] border border-[rgb(var(--field-line))]",
                  "text-[rgb(var(--field-fg))] placeholder:text-[rgb(var(--fg-3))]",
                  "focus:outline-none focus:border-[rgb(var(--ring))] focus:shadow-[0_0_0_4px_rgb(var(--ring)/0.14)]",
                  "transition-[border-color,box-shadow]"
                )}
              />
              <p className="text-[11px] font-mono tracking-tight text-[rgb(var(--fg-3))] text-right mt-1">
                {bio.length}/160
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.08)] border border-[rgb(var(--destructive)/0.20)] px-3.5 py-2.5 rounded-xl mb-4"
              >
                {error}
              </motion.div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" size="lg" shape="pill" className="flex-1" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                shape="pill"
                className="flex-1 group"
                loading={loading}
                onClick={handleComplete}
              >
                Enter UniConnect
                <ArrowUpRight className="w-4 h-4 transition-transform duration-[var(--dur-quick)] group-hover:rotate-45" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
