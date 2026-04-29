"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, RotateCcw, ChevronLeft, CheckCircle, XCircle, Clock,
  Lightbulb, Terminal, Code2, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PROBLEMS, type Problem } from "@/lib/coding/problems";
import { cn } from "@/lib/utils";

const DIFF_COLOR = { easy: "text-emerald-400", medium: "text-yellow-400", hard: "text-red-400" };
const LANG_LABELS: Record<string, string> = { cpp: "C++", python: "Python 3", java: "Java", c: "C" };

type SubmitStatus = "idle" | "running" | "accepted" | "wrong_answer" | "error" | "timeout" | "pending_key";

export default function ProblemIDEPage() {
  const { problemId } = useParams<{ problemId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const problem = PROBLEMS.find(p => p.id === problemId);
  const [code, setCode]         = useState(problem?.starterCode || "");
  const [language, setLanguage] = useState("cpp");
  const [status, setStatus]     = useState<SubmitStatus>("idle");
  const [output, setOutput]     = useState("");
  const [errorLog, setErrorLog] = useState("");
  const [execTime, setExecTime] = useState(0);
  const [showHints, setShowHints]       = useState(false);
  const [showTestCases, setShowTestCases] = useState(true);
  const [activeTab, setActiveTab]       = useState<"code"|"output">("code");
  const [userId, setUserId]             = useState<string | null>(null);
  const [alreadySolved, setAlreadySolved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!problem) { router.push("/coding/practice"); return; }
    setCode(problem.starterCode);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      (supabase as any).from("coding_submissions").select("id").eq("user_id", user.id)
        .eq("problem_id", problem.id).eq("status", "accepted").maybeSingle()
        .then(({ data }: any) => setAlreadySolved(!!data));
    });
  }, [problemId]);

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      setTimeout(() => { el.selectionStart = el.selectionEnd = start + 4; }, 0);
    }
  };

  const runCode = async () => {
    if (!problem) return;
    setStatus("running");
    setOutput("");
    setErrorLog("");
    setActiveTab("output");

    const testInput = problem.testCases[0]?.input || "";
    try {
      const res = await fetch("/api/coding/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, stdin: testInput, problemId: problem.id }),
      });
      const data = await res.json();
      setStatus(data.status as SubmitStatus || "error");
      setOutput(data.output || "");
      setErrorLog(data.error || "");
      setExecTime(data.executionTime || 0);
    } catch {
      setStatus("error");
      setErrorLog("Network error — could not reach compiler.");
    }
  };

  const submitCode = async () => {
    if (!problem || !userId) return;
    setStatus("running");
    setActiveTab("output");

    // Run against all test cases
    let allPassed = true;
    let lastOutput = "";
    let lastError = "";
    let totalTime = 0;

    for (const tc of problem.testCases) {
      try {
        const res = await fetch("/api/coding/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language, stdin: tc.input }),
        });
        const data = await res.json();
        lastOutput = data.output || "";
        lastError  = data.error  || "";
        totalTime += data.executionTime || 0;
        if (data.status === "pending_key") { setStatus("pending_key"); return; }
        const actualOut = (data.output || "").trim();
        const expectedOut = tc.expected.trim();
        if (data.status !== "accepted" || actualOut !== expectedOut) { allPassed = false; break; }
      } catch { allPassed = false; break; }
    }

    const finalStatus: SubmitStatus = allPassed ? "accepted" : "wrong_answer";
    const pointsEarned = allPassed && !alreadySolved ? problem.points : 0;

    setStatus(finalStatus);
    setOutput(lastOutput);
    setErrorLog(lastError);
    setExecTime(totalTime);

    // Save to DB
    await (supabase as any).from("coding_submissions").insert({
      user_id: userId,
      problem_id: problem.id,
      code,
      language,
      status: finalStatus,
      output: lastOutput,
      error_log: lastError,
      points_earned: pointsEarned,
      execution_time_ms: totalTime,
    });
    if (allPassed) setAlreadySolved(true);
  };

  if (!problem) return null;

  const nextProblem = PROBLEMS.find((p, i) => PROBLEMS.indexOf(problem) + 1 === i);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-full">
      {/* Header bar */}
      <div className="flex items-center gap-3 mb-3">
        <Link href="/coding/practice" className="flex items-center gap-1 text-sm text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="font-bold text-sm flex-1 truncate">{problem.title}</h1>
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", DIFF_COLOR[problem.difficulty])}>{problem.difficulty}</span>
        <span className="text-xs text-[rgb(var(--muted-fg))]">{problem.points} pts</span>
        {alreadySolved && <CheckCircle className="w-4 h-4 text-emerald-400" />}
      </div>

      {/* IDE layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
        {/* Left: Problem description */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <div className="theme-card flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-3">{problem.title}</h2>
              <div className="prose prose-sm prose-invert max-w-none text-[rgb(var(--fg))] text-sm leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </div>
            </div>

            {/* Test cases */}
            <div>
              <button onClick={() => setShowTestCases(v => !v)}
                className="flex items-center gap-2 text-sm font-semibold mb-2 hover:text-[rgb(var(--primary))] transition-colors">
                Examples {showTestCases ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <AnimatePresence>
                {showTestCases && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden space-y-3">
                    {problem.testCases.slice(0, 2).map((tc, i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-[rgb(var(--border))] text-sm">
                        <div className="bg-[rgb(var(--muted)/0.5)] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--muted-fg))]">Example {i + 1}</div>
                        <div className="p-3 space-y-2">
                          <div><span className="text-xs text-[rgb(var(--muted-fg))]">Input:</span>
                            <pre className="mt-0.5 font-mono text-xs text-emerald-400 bg-[rgb(var(--muted)/0.3)] p-2 rounded">{tc.input}</pre></div>
                          <div><span className="text-xs text-[rgb(var(--muted-fg))]">Output:</span>
                            <pre className="mt-0.5 font-mono text-xs text-blue-400 bg-[rgb(var(--muted)/0.3)] p-2 rounded">{tc.expected}</pre></div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hints */}
            {problem.hints.length > 0 && (
              <div>
                <button onClick={() => setShowHints(v => !v)}
                  className="flex items-center gap-2 text-sm font-semibold text-yellow-400 hover:opacity-80 transition-opacity">
                  <Lightbulb className="w-4 h-4" /> Hints {showHints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <AnimatePresence>
                  {showHints && (
                    <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      className="overflow-hidden mt-2 space-y-1.5 pl-4">
                      {problem.hints.map((h, i) => (
                        <li key={i} className="text-sm text-[rgb(var(--muted-fg))] list-disc">{h}</li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Right: IDE */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Editor toolbar */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgb(var(--border))] bg-[#1A0B2E]">
            <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs text-purple-300 font-mono flex-1">solution.{language === "python" ? "py" : language === "java" ? "java" : "cpp"}</span>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="h-7 px-2 rounded-lg text-xs bg-[rgb(var(--muted)/0.4)] border border-purple-500/20 text-purple-300 focus:outline-none">
              {Object.entries(LANG_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button onClick={() => setCode(problem.starterCode)}
              className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted)/0.3)] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors" title="Reset code">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Code editor */}
          <div className="flex-1 rounded-xl overflow-hidden border border-purple-500/20 bg-[#0F051D] relative min-h-0">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={handleTabKey}
              spellCheck={false}
              className="w-full h-full resize-none bg-transparent text-sm font-mono text-purple-100 p-4 focus:outline-none leading-relaxed"
              style={{ tabSize: 4 }}
            />
            {/* Line numbers overlay could go here */}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button onClick={runCode} disabled={status === "running"}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] transition-colors disabled:opacity-50">
              {status === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run
            </button>
            <button onClick={submitCode} disabled={status === "running" || !userId}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[rgb(var(--primary))] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex-1 justify-center">
              {status === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Submit Solution
            </button>
          </div>

          {/* Output panel */}
          <AnimatePresence>
            {status !== "idle" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: status === "accepted" ? "rgb(34 197 94 / 0.3)" : status === "running" ? "rgb(var(--border))" : "rgb(239 68 68 / 0.3)" }}>
                <div className={cn("flex items-center gap-2 px-3 py-2 text-xs font-semibold",
                  status === "accepted" ? "bg-emerald-500/10 text-emerald-400" :
                  status === "running"  ? "bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-fg))]" :
                  status === "pending_key" ? "bg-blue-500/10 text-blue-400" :
                  "bg-red-500/10 text-red-400")}>
                  {status === "running"     && <><Loader2 className="w-3.5 h-3.5 animate-spin" />Running…</>}
                  {status === "accepted"    && <><CheckCircle className="w-3.5 h-3.5" />Accepted — All test cases passed! +{problem.points} pts</>}
                  {status === "wrong_answer"&& <><XCircle className="w-3.5 h-3.5" />Wrong Answer</>}
                  {status === "error"       && <><XCircle className="w-3.5 h-3.5" />Compilation / Runtime Error</>}
                  {status === "timeout"     && <><Clock className="w-3.5 h-3.5" />Time Limit Exceeded</>}
                  {status === "pending_key" && <><Terminal className="w-3.5 h-3.5" />Compiler API key not configured yet — code saved.</>}
                  {execTime > 0 && <span className="ml-auto text-[rgb(var(--muted-fg))]">{execTime}ms</span>}
                </div>
                {(output || errorLog) && (
                  <pre className="px-3 py-2 text-xs font-mono text-[rgb(var(--fg))] bg-[#0F051D] max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {output || errorLog}
                  </pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
