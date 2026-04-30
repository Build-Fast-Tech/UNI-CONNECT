import { NextRequest, NextResponse } from "next/server";

// Piston API (self-hosted at localhost:2000 or configurable)
const PISTON_URL   = process.env.PISTON_API_URL   || "http://localhost:2000";
const JUDGE0_URL   = process.env.JUDGE0_API_URL    || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_KEY   = process.env.JUDGE0_API_KEY    || "";

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
  const res = await fetch(`${PISTON_URL}/api/v2/execute`, {
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
  const { code, language = "cpp", stdin = "" } = await req.json();
  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  // Try Piston first (localhost), fallback to Judge0, fallback to pending_key
  try {
    const result = await runWithPiston(code, language, stdin);
    return NextResponse.json(result);
  } catch (pistonErr) {
    // Piston unavailable — try Judge0
    if (JUDGE0_KEY) {
      try {
        const result = await runWithJudge0(code, language, stdin);
        return NextResponse.json(result);
      } catch (judgeErr: any) {
        return NextResponse.json({ error: judgeErr.message, status: "error" }, { status: 500 });
      }
    }
    // No compiler available
    return NextResponse.json({
      status: "pending_key",
      message: "No compiler configured. Add JUDGE0_API_KEY to .env.local or run Piston on localhost:2000",
      output: "", error: null, executionTime: 0,
    });
  }
}
