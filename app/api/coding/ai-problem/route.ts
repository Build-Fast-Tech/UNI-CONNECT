import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  const { topic, difficulty, language, customInstructions } = await req.json();

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
