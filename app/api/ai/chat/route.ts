import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are UniConnect AI — a helpful study companion for Pakistani university students. You help with:
- Explaining concepts from notes and course material
- Answering subject questions (CS, Engineering, Business, Medicine, etc.)
- Career advice for the Pakistani job market
- Study strategies and exam tips

Be concise, friendly, and relevant to Pakistani university context. If a student shares note context, reference it directly. Respond in English, but feel free to include Urdu words naturally if helpful.`;

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
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

    const systemWithContext = noteContext
      ? `${SYSTEM_PROMPT}\n\n---\nThe student is asking about the following note/document:\n${noteContext.slice(0, 4000)}`
      : SYSTEM_PROMPT;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Filter out system/context messages, ensure proper alternation
    const filtered = messages
      .filter(m => !m.content.startsWith("I've loaded"))
      .filter(m => m.role === "user" || m.role === "assistant");

    // Ensure starts with user
    const firstUserIdx = filtered.findIndex(m => m.role === "user");
    const trimmed = firstUserIdx >= 0 ? filtered.slice(firstUserIdx) : filtered;

    const anthropicMessages = trimmed.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemWithContext,
      messages: anthropicMessages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
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
