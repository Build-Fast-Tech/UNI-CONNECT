import { createClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { type, message } = await req.json() as { type: string; message: string };
    if (!message?.trim()) return new Response("Message required", { status: 400 });

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

    // Send email via Gmail SMTP
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      try {
        await transporter.sendMail({
          from: `"UniConnect Feedback" <${process.env.GMAIL_USER}>`,
          to: "abdullah.xf90@gmail.com",
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
        console.log("Email sent via Gmail");
      } catch (mailErr) {
        console.error("Gmail error:", mailErr);
      }
    } else {
      console.warn("GMAIL_USER or GMAIL_APP_PASSWORD not set — email skipped");
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Feedback route error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
