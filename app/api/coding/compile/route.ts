import { NextRequest, NextResponse } from "next/server";

const JUDGE0_URL = process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || "";

// Judge0 language IDs
const LANG_IDS: Record<string, number> = {
  cpp:    54, // C++ (GCC 9.2.0)
  c:      50, // C (GCC 9.2.0)
  python: 71, // Python 3.8
  java:   62, // Java (OpenJDK 13)
};

export async function POST(req: NextRequest) {
  const { code, language = "cpp", stdin = "", problemId } = await req.json();

  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  // If no API key configured, return a mock response
  if (!JUDGE0_KEY) {
    return NextResponse.json({
      status: "pending_key",
      message: "Compiler API key not configured yet. Your code has been saved.",
      output: "",
      error: null,
      executionTime: 0,
    });
  }

  const langId = LANG_IDS[language] ?? 54;

  try {
    // Submit to Judge0
    const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": JUDGE0_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      body: JSON.stringify({
        source_code: code,
        language_id: langId,
        stdin,
        cpu_time_limit: 5,
        memory_limit: 131072,
      }),
    });

    const result = await submitRes.json();

    const statusId = result.status?.id;
    // Status IDs: 1=queued, 2=processing, 3=accepted, 4=wrong, 5=TLE, 6=CE, 7-12=runtime errors
    let status: string;
    if (statusId === 3) status = "accepted";
    else if (statusId === 4) status = "wrong_answer";
    else if (statusId === 5) status = "timeout";
    else if (statusId === 6) status = "error";
    else if (statusId >= 7) status = "error";
    else status = "pending";

    return NextResponse.json({
      status,
      output: result.stdout || "",
      error: result.stderr || result.compile_output || "",
      executionTime: result.time ? Math.round(parseFloat(result.time) * 1000) : 0,
      memory: result.memory,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, status: "error" }, { status: 500 });
  }
}
