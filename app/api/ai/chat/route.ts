import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are UniConnect AI — a helpful study companion for Pakistani university students. Help with explaining concepts, answering subject questions (CS, Engineering, Business, Medicine), career advice for Pakistan, and study tips. Be concise and friendly. Respond in English but feel free to use Urdu words naturally.`;

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return new Response("AI feature is not configured yet.", { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: canSend } = await supabase.rpc("can_send_ai_message", { uid: user.id });
    if (canSend === false) {
      return new Response("Daily limit reached (50 messages/day)", { status: 429 });
    }

    const { messages, noteContext } = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      noteContext?: string;
    };

    const contextLine = noteContext
      ? `\n\nNote context:\n${noteContext.slice(0, 3000)}`
      : "";

    const filtered = messages
      .filter(m => !m.content.startsWith("I've loaded"))
      .filter(m => m.role === "user" || m.role === "assistant");

    const firstUserIdx = filtered.findIndex(m => m.role === "user");
    const trimmed = firstUserIdx >= 0 ? filtered.slice(firstUserIdx) : filtered;

    const history = trimmed.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastContent = trimmed[trimmed.length - 1]?.content
      ?? messages[messages.length - 1].content;

    const userText = history.length === 0
      ? `${SYSTEM_PROMPT}${contextLine}\n\n${lastContent}`
      : lastContent;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContentStream({
      model: "gemini-2.0-flash",
      contents: [...history, { role: "user", parts: [{ text: userText }] }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.text;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("AI route error:", msg);
    return new Response(msg, { status: 500 });
  }
}
