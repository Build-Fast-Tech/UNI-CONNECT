import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Require auth + rate limit: this calls the paid Gemini API.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = rateLimit(rateLimitKey("ai-schedule", user.id, req), {
      windowMs: 60 * 1000,
      max: 6,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    let body: { hours?: unknown; subjects?: unknown; breakMins?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const subjectList = (typeof body.subjects === "string" ? body.subjects : "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 20);

    if (subjectList.length === 0) {
      return NextResponse.json({ error: "No subjects provided." }, { status: 400 });
    }

    const hours = Number(body.hours) || 6;
    const breakMins = Number(body.breakMins) || 10;

    // Only the server-side GEMINI_API_KEY — never a NEXT_PUBLIC_* key, which
    // would be inlined into the client bundle and leak the credential.
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured." }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Create a structured daily study schedule for a university student.
Parameters:
- Total study hours: ${hours}
- Subjects: ${subjectList.join(", ")}
- Break duration: ${breakMins} minutes between sessions
- Start time: 9:00 AM

Rules:
1. Divide study hours equally among subjects (each session 45–60 min)
2. Insert ${breakMins}-minute breaks between each subject block
3. Include a 30-minute lunch break around 1:00 PM
4. Start at 9:00 AM

Respond with ONLY a valid JSON array — no markdown, no explanation:
[
  {"time": "9:00 AM", "subject": "Algorithms", "duration": "50 min", "type": "study"},
  {"time": "9:50 AM", "subject": "Break", "duration": "${breakMins} min", "type": "break"}
]`;

    const result = await model.generateContent(prompt);
    const raw    = result.response.text().trim();
    const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const schedule = JSON.parse(jsonStr);

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("AI Schedule error:", error);
    return NextResponse.json({ error: "Failed to generate schedule." }, { status: 500 });
  }
}
