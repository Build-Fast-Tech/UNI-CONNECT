import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rateLimit, rateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

  let body: { date?: unknown; subjects?: unknown; studyHours?: unknown; startHour?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const date = typeof body.date === "string" ? body.date : new Date().toISOString().slice(0, 10);
  const subjects = Array.isArray(body.subjects) ? body.subjects.slice(0, 20).map(String) : [];
  const studyHours = Number(body.studyHours) || 6;
  const startHour = Number(body.startHour) || 9;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const subjectList = (subjects as string[]).length > 0
    ? (subjects as string[]).join(", ")
    : "General Study";

  const colors = ["#6366f1", "#10b981", "#f97316", "#8b5cf6", "#3b82f6", "#ec4899", "#eab308", "#ef4444"];
  const endHour = startHour + studyHours;

  const prompt = `Create a focused daily study schedule for ${date}.
Total study time: ${studyHours} hours (${startHour}:00 – ${endHour}:00).
Subjects to cover: ${subjectList}.
Rules:
- Add a 10-min break after every 50-min study block.
- Distribute subjects evenly.
- Use specific subject names for study blocks, "Break" for rest.
- Keep total time within ${startHour}:00–${endHour}:00.
Return ONLY valid JSON array, no markdown, no explanation.
Schema: [{"title": string, "start_time": "HH:MM", "end_time": "HH:MM", "color": string}]
Use these hex colors cyclically for subjects: ${colors.join(", ")}
Use "#10b981" for all break blocks.
Maximum 12 blocks.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");
    const blocks = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ blocks });
  } catch (err) {
    console.error("AI schedule error:", err);
    return NextResponse.json({ error: "Failed to generate schedule" }, { status: 500 });
  }
}
