import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_MESSAGE_CHARS = 4000;
const MAX_CONTEXT_CHARS = 12_000;
const MAX_HISTORY = 30;

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

    // Short-window rate limit on top of the 50/day DB counter — blocks burst
    // abuse and protects the Gemini quota even if the DB counter were bypassed.
    const rl = rateLimit(rateLimitKey("ai-chat", user.id, req), {
      windowMs: 60 * 1000,
      max: 8,
    });
    if (!rl.ok) {
      return new Response("You're sending messages too fast. Slow down.", {
        status: 429,
        headers: rateLimitHeaders(rl),
      });
    }

    const { data: canSend } = await supabase.rpc("can_send_ai_message", { uid: user.id });
    if (canSend === false) {
      return new Response("Daily limit reached (3 messages/day)", { status: 429 });
    }

    let body: {
      messages?: { role: "user" | "assistant"; content: string }[];
      noteContext?: string;
    };
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const noteContext = typeof body.noteContext === "string" ? body.noteContext : undefined;

    if (rawMessages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    // Clamp shape + size so a hostile client can't smuggle a prompt-injection
    // payload or blow past Gemini's input limits.
    const messages = rawMessages
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_HISTORY)
      .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

    if (messages.length === 0) {
      return new Response("No valid messages", { status: 400 });
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
          content: lastUserMessage.content.slice(0, MAX_MESSAGE_CHARS),
        });
      }
    }

    const contextLine = noteContext
      ? `\n\nNote context:\n${noteContext.slice(0, MAX_CONTEXT_CHARS)}`
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
          controller.enqueue(encoder.encode(`\n\n[Stream error]`));
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
    console.error("AI route error:", err?.message ?? err);
    return new Response("Internal server error", { status: 500 });
  }
}
