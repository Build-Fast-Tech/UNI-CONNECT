"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // Step 1
  const [universities, setUniversities] = useState<University[]>([]);
  const [uniSearch, setUniSearch] = useState("");
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  // Step 2
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");

  // Step 3
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

  const filteredUnis = universities.filter(u =>
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
    setLoading(true);
    setError("");
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
      full_name: user.user_metadata?.full_name ?? "",
      university_id: selectedUni?.id,
      branch_id: selectedBranch?.id ?? null,
      department: department || null,
      year_of_study: year ? YEARS.indexOf(year) + 1 : null,
      bio: bio || null,
      avatar_url: avatar_url ?? null,
    }, { onConflict: "id" });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/feed");
  };

  const slideVariants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  };

  return (
    <div className="w-full max-w-lg">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                step > i + 1
                  ? "bg-[rgb(var(--success))] text-white"
                  : step === i + 1
                  ? "bg-[rgb(var(--primary))] text-white"
                  : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]"
              )}>
                {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn(
                "text-sm font-medium hidden sm:block",
                step === i + 1 ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--muted-fg))]"
              )}>{label}</span>
              {i < 2 && <div className="w-12 h-px bg-[rgb(var(--border))] mx-2" />}
            </div>
          ))}
        </div>
        <div className="h-1 bg-[rgb(var(--muted))] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[rgb(var(--primary))] rounded-full"
            animate={{ width: `${((step - 1) / 2) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="theme-card p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ── Step 1: University ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-1">Pick your university</h2>
              <p className="text-sm text-[rgb(var(--muted-fg))] mb-6">
                This sets your campus identity across UniConnect.
              </p>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
                <input
                  type="text"
                  value={uniSearch}
                  onChange={e => setUniSearch(e.target.value)}
                  placeholder="Search NUST, LUMS, FAST…"
                  className={cn(
                    "w-full h-11 pl-10 pr-4 rounded-xl text-sm",
                    "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                    "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                  )}
                />
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredUnis.length === 0 && (
                  <p className="text-center text-sm text-[rgb(var(--muted-fg))] py-8">
                    No universities found
                  </p>
                )}
                {filteredUnis.map(uni => (
                  <button
                    key={uni.id}
                    onClick={() => setSelectedUni(uni)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                      selectedUni?.id === uni.id
                        ? "bg-[rgb(var(--primary)/0.1)] border border-[rgb(var(--primary)/0.4)] text-[rgb(var(--primary))]"
                        : "hover:bg-[rgb(var(--muted))] border border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
                      "bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))]"
                    )}>
                      {uni.short_name.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uni.name}</p>
                      <p className="text-xs text-[rgb(var(--muted-fg))]">
                        {uni.short_name} · {uni.city}
                      </p>
                    </div>
                    {selectedUni?.id === uni.id && (
                      <CheckCircle className="w-4 h-4 text-[rgb(var(--primary))] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-6"
                disabled={!selectedUni}
                onClick={() => setStep(2)}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 2: Branch + Details ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-1">Your details</h2>
              <p className="text-sm text-[rgb(var(--muted-fg))] mb-6">
                {selectedUni?.name}
              </p>

              {/* Branch */}
              {branches.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Campus / Branch</label>
                  <select
                    value={selectedBranch?.id || ""}
                    onChange={e => {
                      const b = branches.find(br => br.id === e.target.value);
                      setSelectedBranch(b || null);
                    }}
                    className={cn(
                      "w-full h-11 px-4 rounded-xl text-sm",
                      "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                      "text-[rgb(var(--fg))]",
                      "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                    )}
                  >
                    <option value="">Select campus</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Department */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Department</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className={cn(
                    "w-full h-11 px-4 rounded-xl text-sm",
                    "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                    "text-[rgb(var(--fg))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                  )}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Year of study</label>
                <div className="grid grid-cols-3 gap-2">
                  {YEARS.map(y => (
                    <button
                      key={y}
                      onClick={() => setYear(y)}
                      className={cn(
                        "py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",
                        year === y
                          ? "bg-[rgb(var(--primary)/0.1)] border-[rgb(var(--primary)/0.4)] text-[rgb(var(--primary))]"
                          : "border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]"
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  disabled={!department || !year || (branches.length > 0 && !selectedBranch)}
                  onClick={() => setStep(3)}
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Profile ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-1">Your profile</h2>
              <p className="text-sm text-[rgb(var(--muted-fg))] mb-6">
                Optional — you can always update this later.
              </p>

              {/* Avatar upload */}
              <div className="flex flex-col items-center mb-6">
                <label htmlFor="avatar-upload" className="cursor-pointer group">
                  <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center overflow-hidden",
                    "border-2 border-dashed border-[rgb(var(--border))]",
                    "group-hover:border-[rgb(var(--primary))] transition-colors",
                    "bg-[rgb(var(--muted))]"
                  )}>
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-[rgb(var(--muted-fg))] mx-auto mb-1" />
                        <span className="text-xs text-[rgb(var(--muted-fg))]">Photo</span>
                      </div>
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
                <p className="text-xs text-[rgb(var(--muted-fg))] mt-2">Click to upload profile picture</p>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell other students a bit about yourself…"
                  rows={3}
                  maxLength={160}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-sm resize-none",
                    "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                    "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                  )}
                />
                <p className="text-xs text-[rgb(var(--muted-fg))] text-right mt-1">{bio.length}/160</p>
              </div>

              {error && (
                <p className="text-sm text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.1)] px-3 py-2 rounded-lg text-center mb-2">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  loading={loading}
                  onClick={handleComplete}
                >
                  Enter UniConnect 🚀
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
