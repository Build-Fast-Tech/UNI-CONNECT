import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Piston API — defaults to the free public instance; set PISTON_API_URL to override
// Self-hosted Piston uses /api/v2/execute; emkc.org public instance uses /api/v2/piston/execute
const PISTON_URL   = process.env.PISTON_API_URL   || "https://emkc.org/api/v2/piston";
const JUDGE0_URL   = process.env.JUDGE0_API_URL    || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_KEY   = process.env.JUDGE0_API_KEY    || "";

// Submitted source/stdin caps — keep payloads sane so this endpoint can't be
// used to push multi-megabyte bodies to the upstream compiler on our behalf.
const MAX_CODE_CHARS  = 50_000;
const MAX_STDIN_CHARS = 20_000;
const SUPPORTED_LANGS = new Set(["cpp", "c", "python", "java"]);

// Piston language identifiers
const PISTON_LANGS: Record<string, { language: string; version: string }> = {
  cpp:    { language: "c++",    version: "*" },
  c:      { language: "c",      version: "*" },
  python: { language: "python", version: "*" },
  java:   { language: "java",   version: "*" },
};

// Judge0 language IDs (fallback)
const JUDGE0_IDS: Record<string, number> = {
  cpp: 54, c: 50, python: 71, java: 62,
};

async function runWithPiston(code: string, language: string, stdin: string) {
  const lang = PISTON_LANGS[language] ?? PISTON_LANGS.cpp;
  const res = await fetch(`${PISTON_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: lang.language,
      version: lang.version,
      files: [{ name: `solution.${language === "python" ? "py" : language === "java" ? "java" : language === "c" ? "c" : "cpp"}`, content: code }],
      stdin,
      compile_timeout: 10000,
      run_timeout: 5000,
      run_memory_limit: 131072,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Piston error: ${res.status}`);
  const data = await res.json();

  const stdout = data.run?.stdout || "";
  const stderr = data.run?.stderr || data.compile?.stderr || "";
  const exitCode = data.run?.code ?? 0;

  let status = "accepted";
  if (data.compile?.code !== undefined && data.compile.code !== 0) status = "error";
  else if (exitCode !== 0) status = "error";

  return { status, output: stdout, error: stderr, executionTime: data.run?.wall_time ? Math.round(data.run.wall_time * 1000) : 0 };
}

async function runWithJudge0(code: string, language: string, stdin: string) {
  const langId = JUDGE0_IDS[language] ?? 54;
  const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": JUDGE0_KEY,
      "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
    },
    body: JSON.stringify({ source_code: code, language_id: langId, stdin, cpu_time_limit: 5, memory_limit: 131072 }),
  });
  const data = await res.json();
  const sid = data.status?.id;
  const status = sid === 3 ? "accepted" : sid === 5 ? "timeout" : (sid === 6 || sid >= 7) ? "error" : "pending";
  return { status, output: data.stdout || "", error: data.stderr || data.compile_output || "", executionTime: data.time ? Math.round(parseFloat(data.time) * 1000) : 0 };
}

export async function POST(req: NextRequest) {
  // Require an authenticated user. Running arbitrary code on a shared compiler
  // backend is expensive and abusable, so it must never be open to the public.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Per-user burst limit so a single account can't hammer the compiler backend.
  const rl = rateLimit(rateLimitKey("compile", user.id, req), {
    windowMs: 60 * 1000,
    max: 30,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many runs. Slow down for a moment." },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  let body: { code?: unknown; language?: unknown; stdin?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  const language = typeof body.language === "string" ? body.language : "cpp";
  const stdin = typeof body.stdin === "string" ? body.stdin : "";

  if (!code.trim()) return NextResponse.json({ error: "No code provided" }, { status: 400 });
  if (!SUPPORTED_LANGS.has(language)) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }
  if (code.length > MAX_CODE_CHARS) {
    return NextResponse.json({ error: "Code is too long" }, { status: 413 });
  }
  if (stdin.length > MAX_STDIN_CHARS) {
    return NextResponse.json({ error: "Input is too long" }, { status: 413 });
  }

  // Try Piston first (localhost), fallback to Judge0, fallback to pending_key
  try {
    const result = await runWithPiston(code, language, stdin);
    return NextResponse.json(result);
  } catch {
    // Piston unavailable — try Judge0
    if (JUDGE0_KEY) {
      try {
        const result = await runWithJudge0(code, language, stdin);
        return NextResponse.json(result);
      } catch (judgeErr) {
        console.error("Judge0 error:", judgeErr instanceof Error ? judgeErr.message : judgeErr);
        return NextResponse.json({ error: "Compiler unavailable", status: "error" }, { status: 500 });
      }
    }
    // No compiler available
    return NextResponse.json({
      status: "pending_key",
      message: "No compiler configured. Add JUDGE0_API_KEY to .env.local or set PISTON_API_URL",
      output: "", error: null, executionTime: 0,
    });
  }
}
