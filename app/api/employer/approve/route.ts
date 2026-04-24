import { createClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: admin } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (admin?.role !== "admin") return new Response("Forbidden", { status: 403 });

    let body: { applicationId?: unknown; action?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }
    const applicationId = typeof body.applicationId === "string" ? body.applicationId : "";
    const action = body.action === "approve" || body.action === "reject" ? body.action : null;
    if (!UUID_RE.test(applicationId) || !action) {
      return new Response("Invalid request", { status: 400 });
    }

    const { data: app } = await (supabase as any)
      .from("employer_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (!app) return new Response("Not found", { status: 404 });

    // Update application status
    await (supabase as any)
      .from("employer_applications")
      .update({ status: action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", applicationId);

    // If approving and user exists, update their role
    if (action === "approve" && app.user_id) {
      await supabase
        .from("profiles")
        .update({ role: "employer" } as any)
        .eq("id", app.user_id);
    }

    // Email the applicant — all DB values are HTML-escaped since older rows
    // may have been saved before strict validation was added.
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
        },
      });

      const safeName    = esc(app.full_name);
      const safeCompany = esc(app.company_name);
      const safeEmail   = esc(app.email);

      if (action === "approve") {
        await transporter.sendMail({
          from: `"UniConnect" <${process.env.GMAIL_USER}>`,
          to: app.email,
          subject: "Your UniConnect Employer Account is Approved!",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#6366f1">Welcome to UniConnect, ${safeName}!</h2>
              <p>Your employer account for <strong>${safeCompany}</strong> has been approved.</p>
              ${app.user_id
                ? `<p>Log in at <a href="https://uniconnect.pk/login">uniconnect.pk/login</a> and go to <strong>Jobs → Post a Job</strong> to get started.</p>`
                : `<p>Sign up at <a href="https://uniconnect.pk/signup">uniconnect.pk/signup</a> using this email address (${safeEmail}) to activate your employer account.</p>`
              }
            </div>
          `,
        }).catch(console.error);
      } else {
        await transporter.sendMail({
          from: `"UniConnect" <${process.env.GMAIL_USER}>`,
          to: app.email,
          subject: "UniConnect Employer Application Update",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <p>Hi ${safeName}, unfortunately your employer application for <strong>${safeCompany}</strong> was not approved at this time.</p>
              <p>Feel free to reply to this email if you have questions.</p>
            </div>
          `,
        }).catch(console.error);
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Employer approve error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
