import "server-only";
import { createAdminSupabase } from "@/lib/supabase-server";
import { parseMemberInput } from "@/lib/member-tools";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

export async function onboardMember(input: ReturnType<typeof parseMemberInput>, origin: string) {
  const admin = createAdminSupabase();
  const { data: existing, error: lookupError } = await admin.from("profiles").select("id").eq("email", input.email).maybeSingle();
  if (lookupError) throw new Error("Unable to look up membership. Please try again.");
  if (existing) return { id: existing.id as string, created: false, emailSent: false };

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || origin}/auth/callback?flow=setup`;
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite", email: input.email,
    options: { redirectTo, data: { first_name: input.firstName, last_name: input.lastName } },
  });
  if (error || !data.user || !data.properties?.action_link) {
    // A simultaneous request may already have created this member.
    const { data: concurrent } = await admin.from("profiles").select("id").eq("email", input.email).maybeSingle();
    if (concurrent) return { id: concurrent.id as string, created: false, emailSent: false };
    throw new Error("Unable to create membership. If you already have an account, please sign in.");
  }
  let emailSent = false;
  if (process.env.BREVO_API_KEY) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST", headers: { "content-type": "application/json", "api-key": process.env.BREVO_API_KEY },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          sender: { name: "UCF SASE", email: process.env.EMAIL_USER || "noreplysaseucf@gmail.com" },
          to: [{ email: input.email }], subject: "Welcome to UCF SASE!",
          htmlContent: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;background:#f0f7ff;color:#171d52"><h1>Welcome to UCF SASE!</h1><p>Hi ${escapeHtml(input.firstName)},</p><p>Your account is ready. Join our events, explore our programs, and track your participation points.</p><p><a href="${escapeHtml(data.properties.action_link)}">Activate your account and set a password</a></p><p>If this link expires, use Forgot password on our sign-in page.</p><p>See you at the next event!<br>The UCF SASE team</p></div>`,
        }),
      });
      emailSent = response.ok;
    } catch { /* Membership is retained if the email provider is unavailable. */ }
  }
  if (emailSent) await admin.auth.admin.updateUserById(data.user.id, { user_metadata: { welcome_email_sent: true } });
  return { id: data.user.id, created: true, emailSent };
}
