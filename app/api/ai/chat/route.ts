import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are UniConnect AI — a smart study companion built exclusively for Pakistani university students. You help with:
- Explaining concepts from notes and course material
- Answering subject questions (CS, Engineering, Business, Medicine, etc.)
- Helping students understand complex topics in simple language
- Career advice for Pakistani job market
- Study strategies and exam tips

Be concise, friendly, and relevant to Pakistani university context. If a student shares note context, reference it directly in your answers. Respond in English, but feel free to include Urdu words naturally if helpful.`;

type Provider = "claude" | "gemini";

async function checkRateLimit(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, provider: Provider) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).rpc("can_send_ai_message_provider", {
    uid: userId,
    p_provider: provider,
  });
  return data !== false;
}

async function streamClaude(
  messages: { role: "user" | "assistant"; content: string }[],
  system: string
): Promise<ReadableStream> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    messages,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
    cancel() {
      stream.controller.abort();
    },
  });
}

async function streamGemini(
  messages: { role: "user" | "assistant"; content: string }[],
  system: string
): Promise<ReadableStream> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: system,
  });

  // Convert messages to Gemini history format (all but the last user message)
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1].content;
  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage);

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });
}

export async function POST(req: Request) {
  try {
    const { messages, noteContext, provider = "claude" } = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      noteContext?: string;
      provider?: Provider;
    };

    const isClause = provider === "claude";
    const apiKey = isClause ? process.env.ANTHROPIC_API_KEY : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "not_configured", provider }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const canSend = await checkRateLimit(supabase, user.id, provider);
    if (!canSend) {
      return new Response(
        JSON.stringify({ error: "limit_reached", provider }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemWithContext = noteContext
      ? `${SYSTEM_PROMPT}\n\n---\nThe student is asking about the following note/document content:\n${noteContext.slice(0, 4000)}`
      : SYSTEM_PROMPT;

    const readable = isClause
      ? await streamClaude(messages, systemWithContext)
      : await streamGemini(messages, systemWithContext);

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Provider": provider,
      },
    });
  } catch (err) {
    console.error("AI route error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
