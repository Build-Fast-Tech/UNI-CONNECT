import { createClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { fullName, email, companyName, companyUrl, description } =
      await req.json() as {
        fullName: string; email: string; companyName: string;
        companyUrl?: string; description?: string;
      };

    if (!fullName?.trim() || !email?.trim() || !companyName?.trim()) {
      return new Response("Missing required fields", { status: 400 });
    }

    const supabase = await createClient();

    // Check if already applied
    const { data: existing } = await (supabase as any)
      .from("employer_applications")
      .select("id, status")
      .eq("email", email.trim().toLowerCase())
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
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    await (supabase as any).from("employer_applications").insert({
      full_name:    fullName.trim(),
      email:        email.trim().toLowerCase(),
      company_name: companyName.trim(),
      company_url:  companyUrl?.trim() || null,
      description:  description?.trim() || null,
      user_id:      profile?.id ?? null,
    });

    // Notify admin
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      });
      await transporter.sendMail({
        from: `"UniConnect" <${process.env.GMAIL_USER}>`,
        to: "abdullah.xf90@gmail.com",
        subject: `[UniConnect] New Employer Application — ${companyName}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#6366f1">New Employer Application</h2>
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            ${companyUrl ? `<p><strong>Website:</strong> <a href="${companyUrl}">${companyUrl}</a></p>` : ""}
            ${description ? `<p><strong>About:</strong> ${description}</p>` : ""}
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
