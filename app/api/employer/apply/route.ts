import { createClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";
import { rateLimit, rateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Escape HTML so user input can't inject tags into the admin notification email.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    const parsed = new URL(u.startsWith("http") ? u : `https://${u}`);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // Public endpoint — tight IP-based rate limit against spam/flooding.
    const rl = rateLimit(rateLimitKey("employer-apply", null, req), {
      windowMs: 60 * 60 * 1000,
      max: 5,
    });
    if (!rl.ok) {
      return new Response("Too many applications. Try again later.", {
        status: 429,
        headers: rateLimitHeaders(rl),
      });
    }

    let body: {
      fullName?: unknown;
      email?: unknown;
      companyName?: unknown;
      companyUrl?: unknown;
      description?: unknown;
    };
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    const fullName    = typeof body.fullName    === "string" ? body.fullName.trim().slice(0, 120) : "";
    const email       = typeof body.email       === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
    const companyName = typeof body.companyName === "string" ? body.companyName.trim().slice(0, 120) : "";
    const companyUrl  = typeof body.companyUrl  === "string" ? body.companyUrl.trim().slice(0, 500) : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 2000) : "";

    if (!fullName || !email || !companyName) {
      return new Response("Missing required fields", { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return new Response("Invalid email", { status: 400 });
    }

    const normalizedUrl = safeUrl(companyUrl);

    const supabase = await createClient();

    // Check if already applied
    const { data: existing } = await (supabase as any)
      .from("employer_applications")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return new Response(
        existing.status === "approved"
          ? "already_approved"
          : "already_applied",
        { status: 409 }
      );
    }

    // Check if already a user with this email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    await (supabase as any).from("employer_applications").insert({
      full_name:    fullName,
      email:        email,
      company_name: companyName,
      company_url:  normalizedUrl,
      description:  description || null,
      user_id:      profile?.id ?? null,
    });

    // Notify admin — user input is HTML-escaped to prevent injection, and
    // the company URL is validated to be http(s) before being linkified.
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
        },
      });
      const urlBlock = normalizedUrl
        ? `<p><strong>Website:</strong> <a href="${esc(normalizedUrl)}" rel="noopener noreferrer">${esc(normalizedUrl)}</a></p>`
        : "";
      const descBlock = description
        ? `<p><strong>About:</strong> ${esc(description)}</p>`
        : "";
      await transporter.sendMail({
        from: `"UniConnect" <${process.env.GMAIL_USER}>`,
        to: process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || process.env.GMAIL_USER || "",
        subject: `[UniConnect] New Employer Application — ${companyName}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#6366f1">New Employer Application</h2>
            <p><strong>Name:</strong> ${esc(fullName)}</p>
            <p><strong>Email:</strong> ${esc(email)}</p>
            <p><strong>Company:</strong> ${esc(companyName)}</p>
            ${urlBlock}
            ${descBlock}
            <hr style="margin:16px 0"/>
            <p>Review at <a href="https://uniconnect.pk/admin/employers">Admin → Employers</a></p>
          </div>
        `,
      }).catch(console.error);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Employer apply error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
