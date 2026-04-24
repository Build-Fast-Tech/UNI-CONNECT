import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are UniConnect AI — a helpful study companion for Pakistani university students. Help with explaining concepts, answering subject questions (CS, Engineering, Business, Medicine), career advice for Pakistan, and study tips. Be concise and friendly. Respond in English but feel free to use Urdu words naturally.`;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return new Response("AI is not configured: GEMINI_API_KEY is missing.", { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: canSend } = await supabase.rpc("can_send_ai_message", { uid: user.id });
    if (canSend === false) {
      return new Response("Daily limit reached (50 messages/day)", { status: 429 });
    }

    const body = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      noteContext?: string;
    };
    const { messages, noteContext } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    // Record the incoming user message so the 50/day counter is accurate.
    // We reuse a single "default" conversation per user to keep things simple.
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMessage?.content) {
      const sb = supabase as any;
      let conversationId: string | null = null;
      const { data: existingConvo } = await sb
        .from("ai_conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingConvo?.id) {
        conversationId = existingConvo.id;
      } else {
        const { data: created } = await sb
          .from("ai_conversations")
          .insert({ user_id: user.id, title: "UniConnect AI" })
          .select("id")
          .single();
        conversationId = created?.id ?? null;
      }

      if (conversationId) {
        await sb.from("ai_messages").insert({
          conversation_id: conversationId,
          role: "user",
          content: lastUserMessage.content.slice(0, 4000),
        });
      }
    }

    const contextLine = noteContext
      ? `\n\nNote context:\n${noteContext.slice(0, 3000)}`
      : "";

    const filtered = messages
      .filter(m => !m.content.startsWith("I've loaded"))
      .filter(m => m.role === "user" || m.role === "assistant");

    const firstUserIdx = filtered.findIndex(m => m.role === "user");
    const trimmed = firstUserIdx >= 0 ? filtered.slice(firstUserIdx) : filtered;

    if (trimmed.length === 0) {
      return new Response("No valid user message", { status: 400 });
    }

    const history = trimmed.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastContent = trimmed[trimmed.length - 1].content;

    const userText = history.length === 0
      ? `${SYSTEM_PROMPT}${contextLine}\n\n${lastContent}`
      : lastContent;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let response;
    try {
      response = await ai.models.generateContentStream({
        model: MODEL,
        contents: [...history, { role: "user", parts: [{ text: userText }] }],
      });
    } catch (sdkErr: any) {
      const msg = sdkErr?.message ?? String(sdkErr);
      console.error(`Gemini SDK error (model=${MODEL}):`, msg);
      return new Response(`Gemini error: ${msg}`, { status: 502 });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (streamErr: any) {
          const msg = streamErr?.message ?? String(streamErr);
          console.error("Gemini stream error:", msg);
          controller.enqueue(encoder.encode(`\n\n[Stream error: ${msg}]`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("AI route error:", msg);
    return new Response(msg, { status: 500 });
  }
}
