import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are UniConnect AI — a smart study companion built exclusively for Pakistani university students. You help with:
- Explaining concepts from notes and course material
- Answering subject questions (CS, Engineering, Business, Medicine, etc.)
- Helping students understand complex topics in simple language
- Career advice for Pakistani job market
- Study strategies and exam tips

Be concise, friendly, and relevant to Pakistani university context. If a student shares note context, reference it directly in your answers. Respond in English, but feel free to include Urdu words naturally if helpful.`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Rate limiting check
    const { data: canSend } = await supabase.rpc("can_send_ai_message", { uid: user.id });
    if (canSend === false) {
      return new Response("Daily limit reached (50 messages/day)", { status: 429 });
    }

    const { messages, noteContext } = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      noteContext?: string;
    };

    const systemWithContext = noteContext
      ? `${SYSTEM_PROMPT}\n\n---\nThe student is asking about the following note/document content:\n${noteContext.slice(0, 4000)}`
      : SYSTEM_PROMPT;

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemWithContext,
      messages,
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
      cancel() {
        stream.controller.abort();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("AI route error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
