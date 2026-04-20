import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are UniConnect AI — a smart study companion built exclusively for Pakistani university students. You help with:
- Explaining concepts from notes and course material
- Answering subject questions (CS, Engineering, Business, Medicine, etc.)
- Helping students understand complex topics in simple language
- Career advice for Pakistani job market
- Study strategies and exam tips

Be concise, friendly, and relevant to Pakistani university context. If a student shares note context, reference it directly in your answers. Respond in English, but feel free to include Urdu words naturally if helpful.`;

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

    const systemWithContext = noteContext
      ? `${SYSTEM_PROMPT}\n\n---\nThe student is asking about the following note/document content:\n${noteContext.slice(0, 4000)}`
      : SYSTEM_PROMPT;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction: systemWithContext,
    });

    // Gemini requires history to start with "user" and alternate roles
    const priorMessages = messages.slice(0, -1).filter(m => !m.content.startsWith("I've loaded"));
    const firstUserIdx = priorMessages.findIndex(m => m.role === "user");
    const trimmed = firstUserIdx >= 0 ? priorMessages.slice(firstUserIdx) : [];
    const history = trimmed.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
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
