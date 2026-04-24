import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";

// Email sending uses Node APIs (net sockets for SMTP); force the Node runtime
// so this route doesn't accidentally get deployed on Edge, which would break
// nodemailer silently.
export const runtime = "nodejs";

// Primary recipient. Honour ADMIN_EMAILS env (comma-separated) so deployments
// can override without a code change.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "abdullah.xf90@gmail.com")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function renderHtml({
  fromName,
  fromEmail,
  type,
  message,
}: {
  fromName: string;
  fromEmail: string;
  type: string;
  message: string;
}) {
  const safeMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#6366f1">New ${type} on UniConnect</h2>
      <p><strong>From:</strong> ${fromName} (${fromEmail})</p>
      <p><strong>Type:</strong> ${type}</p>
      <hr style="border:1px solid #e5e7eb;margin:16px 0"/>
      <p style="white-space:pre-wrap;background:#f9fafb;padding:16px;border-radius:8px;color:#111">${safeMessage}</p>
    </div>
  `;
}

async function sendViaResend(opts: {
  subject: string;
  html: string;
  replyTo: string;
}) {
  if (!process.env.RESEND_API_KEY) return { ok: false, reason: "no_key" };
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM || "UniConnect <onboarding@resend.dev>";
    const result = await resend.emails.send({
      from,
      to: ADMIN_EMAILS,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    });
    if (result.error) {
      return { ok: false, reason: `resend:${result.error.message ?? "unknown"}` };
    }
    return { ok: true, reason: "resend" };
  } catch (e: any) {
    return { ok: false, reason: `resend:${e?.message ?? "exception"}` };
  }
}

async function sendViaGmail(opts: {
  subject: string;
  html: string;
  replyTo: string;
}) {
  const user = process.env.GMAIL_USER;
  // Gmail app passwords are copied as "xxxx xxxx xxxx xxxx" with spaces — strip
  // them because SMTP auth expects the raw 16-char string.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) return { ok: false, reason: "gmail:no_creds" };

  // Two transport configs — try STARTTLS on 587 first (works on most serverless
  // hosts where outbound 465 is blocked), fall back to implicit TLS on 465.
  type GmailConfig = {
    host: string;
    port: number;
    secure: boolean;
    requireTLS?: boolean;
    auth: { user: string; pass: string };
  };
  const configs: GmailConfig[] = [
    { host: "smtp.gmail.com", port: 587, secure: false, requireTLS: true, auth: { user, pass } },
    { host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } },
  ];

  const errors: string[] = [];
  for (const config of configs) {
    try {
      const transporter = nodemailer.createTransport(config);
      await transporter.sendMail({
        from: `"UniConnect Feedback" <${user}>`,
        to: ADMIN_EMAILS,
        replyTo: opts.replyTo,
        subject: opts.subject,
        html: opts.html,
      });
      return { ok: true, reason: "gmail" };
    } catch (e) {
      const err = e as { code?: string; message?: string };
      errors.push(`:${config.port} ${err.code ?? ""} ${err.message ?? String(e)}`.trim());
    }
  }
  return { ok: false, reason: `gmail:${errors.join(" | ")}` };
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    let body: { type?: string; message?: string };
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    const type = (body.type || "suggestion").toString();
    const message = (body.message ?? "").toString().trim();

    if (!message) return new Response("Message required", { status: 400 });
    if (message.length > 2000) return new Response("Message too long (max 2000 characters)", { status: 400 });

    const allowedTypes = new Set(["suggestion", "bug", "feature", "other"]);
    const normalizedType = allowedTypes.has(type) ? type : "suggestion";

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const fromName = profile?.full_name ?? "Unknown";
    const fromEmail = profile?.email ?? user.email ?? "unknown@unknown";

    // suggestions table isn't in the generated types yet; see types/database.ts
    const { error: insertError } = await (supabase as any)
      .from("suggestions")
      .insert({
        user_id: user.id,
        type: normalizedType,
        message,
      });

    if (insertError) {
      console.error("Feedback insert failed:", insertError);
      return new Response(`Could not save feedback: ${insertError.message}`, { status: 500 });
    }

    const subject = `[UniConnect] ${normalizedType.toUpperCase()} from ${fromName}`;
    const html = renderHtml({ fromName, fromEmail, type: normalizedType, message });

    // Try Gmail first (most reliable when the app password is set correctly)
    // and fall back to Resend. Collect failure reasons so the UI can surface
    // them in dev without hiding the root cause.
    const attempts: string[] = [];

    let emailResult = await sendViaGmail({ subject, html, replyTo: fromEmail });
    if (!emailResult.ok) {
      attempts.push(emailResult.reason);
      console.warn(`Gmail failed (${emailResult.reason}); trying Resend fallback.`);
      emailResult = await sendViaResend({ subject, html, replyTo: fromEmail });
    }

    if (!emailResult.ok) {
      attempts.push(emailResult.reason);
      console.error(`All email providers failed: ${attempts.join(" | ")}`);
      return Response.json(
        { saved: true, emailed: false, reason: attempts.join(" | ") },
        { status: 200 }
      );
    }

    return Response.json(
      { saved: true, emailed: true, via: emailResult.reason },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Feedback route error:", err);
    return new Response(err?.message ?? "Internal server error", { status: 500 });
  }
}
