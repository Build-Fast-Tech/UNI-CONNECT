import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { hours, subjects, breakMins } = await req.json();

    const subjectList = (subjects as string)
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    if (subjectList.length === 0) {
      return NextResponse.json({ error: "No subjects provided." }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured." }, { status: 500 });
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
