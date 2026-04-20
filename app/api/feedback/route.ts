import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { type, message } = await req.json() as { type: string; message: string };
    if (!message?.trim()) return new Response("Message required", { status: 400 });

    // Save to database
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    await (supabase as any).from("suggestions").insert({
      user_id: user.id,
      type: type || "suggestion",
      message: message.trim(),
    });

    // Send email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "UniConnect <onboarding@resend.dev>",
        to: process.env.ADMIN_EMAILS || "abdullah.xf90@gmail.com",
        subject: `[UniConnect] New ${type || "Suggestion"} from ${profile?.full_name ?? user.email}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#6366f1">New ${type || "Suggestion"} on UniConnect</h2>
            <p><strong>From:</strong> ${profile?.full_name ?? "Unknown"} (${profile?.email ?? user.email})</p>
            <p><strong>Type:</strong> ${type || "Suggestion"}</p>
            <hr style="border:1px solid #e5e7eb;margin:16px 0"/>
            <p style="white-space:pre-wrap;background:#f9fafb;padding:16px;border-radius:8px">${message.trim()}</p>
          </div>
        `,
      });
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Feedback route error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
