import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "AI not configured" }, { status: 503 });
    }

    const { cvId } = await req.json();
    if (!cvId) return Response.json({ error: "cvId required" }, { status: 400 });

    const { data: cv } = await supabase
      .from("cvs")
      .select("id, file_url, headline")
      .eq("id", cvId)
      .eq("user_id", user.id)
      .single();

    if (!cv?.file_url) {
      return Response.json({ error: "CV not found" }, { status: 404 });
    }

    const fileRes = await fetch(cv.file_url);
    if (!fileRes.ok)
      return Response.json({ error: "Failed to download CV" }, { status: 502 });

    const buffer = await fileRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "application/pdf", data: base64 } },
            {
              text: `Analyze this CV and extract the following in JSON format only (no markdown, no code fences):
{
  "skills": ["list of technical and soft skills"],
  "roles": ["list of job titles the person is suited for"],
  "technologies": ["programming languages, frameworks, tools"],
  "summary": "2-sentence professional summary"
}`,
            },
          ],
        },
      ],
    });

    let parsed: {
      skills: string[];
      roles: string[];
      technologies: string[];
      summary: string;
    };
    try {
      const text =
        result.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      parsed = {
        skills: [],
        roles: [],
        technologies: [],
        summary: cv.headline ?? "",
      };
    }

    const allSkills = [
      ...new Set([...(parsed.skills ?? []), ...(parsed.technologies ?? [])]),
    ];

    await supabase
      .from("cvs")
      .update({
        skills: allSkills,
        preferred_roles: parsed.roles ?? [],
        headline: parsed.summary || cv.headline,
      })
      .eq("id", cvId)
      .eq("user_id", user.id);

    return Response.json({ ...parsed, skills: allSkills });
  } catch (err) {
    console.error("cv-parse error:", err);
    return Response.json({ error: "Parsing failed" }, { status: 500 });
  }
}
