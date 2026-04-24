import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";

// Admin-only endpoint to verify that feedback email providers are configured
// correctly. Hit GET /api/feedback/test while logged in as an admin.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "abdullah.xf90@gmail.com")
    .split(",").map(s => s.trim()).filter(Boolean);

  const report: Record<string, any> = {
    admin_emails: adminEmails,
    resend: { configured: !!process.env.RESEND_API_KEY },
    gmail: {
      configured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      user: process.env.GMAIL_USER ? "(set)" : "(missing)",
      password_length: (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "").length,
    },
  };

  // Try Gmail
  if (report.gmail.configured) {
    try {
      const pass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER!, pass },
      });
      await transporter.verify();
      const info = await transporter.sendMail({
        from: `"UniConnect Test" <${process.env.GMAIL_USER}>`,
        to: adminEmails,
        subject: "[UniConnect] Feedback email smoke test (Gmail)",
        html: `<p>This is a smoke test from <strong>/api/feedback/test</strong>. If you received it, Gmail delivery works.</p>`,
      });
      report.gmail.result = { ok: true, messageId: info.messageId };
    } catch (e: any) {
      report.gmail.result = { ok: false, error: e?.message ?? String(e) };
    }
  }

  // Try Resend
  if (report.resend.configured) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY!);
      const from = process.env.RESEND_FROM || "UniConnect <onboarding@resend.dev>";
      const res = await resend.emails.send({
        from,
        to: adminEmails,
        subject: "[UniConnect] Feedback email smoke test (Resend)",
        html: `<p>This is a smoke test from <strong>/api/feedback/test</strong>. If you received it, Resend delivery works.</p>`,
      });
      if (res.error) {
        report.resend.result = { ok: false, error: res.error.message };
      } else {
        report.resend.result = { ok: true, id: res.data?.id };
      }
    } catch (e: any) {
      report.resend.result = { ok: false, error: e?.message ?? String(e) };
    }
  }

  return Response.json(report);
}
