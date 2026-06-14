import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const clamp = (v: unknown, max: number) =>
  (typeof v === "string" ? v : "").slice(0, max);

export async function POST(req: NextRequest) {
  // Require auth + rate limit: each call hits the paid Gemini API, so an open
  // endpoint is a direct cost-abuse vector.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(rateLimitKey("ai-problem", user.id, req), {
    windowMs: 60 * 1000,
    max: 6,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  let parsedBody: { topic?: unknown; difficulty?: unknown; language?: unknown; customInstructions?: unknown };
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const topic = clamp(parsedBody.topic, 120) || "General";
  const difficulty = clamp(parsedBody.difficulty, 40) || "medium";
  const language = clamp(parsedBody.language, 40) || "cpp";
  const customInstructions = clamp(parsedBody.customInstructions, 500);

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      title: "Custom Battle Challenge",
      description: `Write a ${difficulty} ${topic} problem in ${language}. Implement the solution and pass all test cases.`,
      starterCode: language === "cpp"
        ? `#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    // your code here\n    return 0;\n}`
        : language === "python"
        ? `# your code here\n`
        : `public class Solution {\n    public static void main(String[] args) {\n        // your code here\n    }\n}`,
      testCases: [{ input: "1", expected: "1" }],
    });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Generate a competitive programming problem with these specs:
Topic: ${topic}
Difficulty: ${difficulty}
Language: ${language}
${customInstructions ? `Custom Instructions: ${customInstructions}` : ""}

Respond ONLY with valid JSON matching this exact schema:
{
  "title": "Problem title",
  "description": "Full problem statement with Input/Output format",
  "starterCode": "Language-appropriate starter code",
  "testCases": [
    {"input": "...", "expected": "..."},
    {"input": "...", "expected": "..."}
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const problem = JSON.parse(text);
    return NextResponse.json(problem);
  } catch {
    return NextResponse.json({
      title: `${topic} Battle Challenge`,
      description: `Solve this ${difficulty} ${topic} problem. Read from stdin and write to stdout.`,
      starterCode: `#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    // your code here\n    return 0;\n}`,
      testCases: [{ input: "5", expected: "5" }],
    });
  }
}
