import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase admin client (service role key bypasses RLS for OTP storage)
// ---------------------------------------------------------------------------
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Shared helper: send an email via Resend
// ---------------------------------------------------------------------------
async function sendViaResend(payload: {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
}) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// GET /api/email — Health check
// ---------------------------------------------------------------------------
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Email API is ready",
    configured: Boolean(process.env.RESEND_API_KEY),
  });
}

// ---------------------------------------------------------------------------
// POST /api/email — Route by `action` field
//
//   action: "send"        → general-purpose email
//   action: "send-otp"    → generate & email a 6-digit OTP, store in Supabase
//   action: "verify-otp"  → validate the submitted OTP against Supabase
//
// If `action` is omitted, the request defaults to "send".
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "send";

    // ── 1. Send OTP ──────────────────────────────────────────────────────────
    if (action === "send-otp") {
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const userId = typeof body.userId === "string" ? body.userId.trim() : "";

      if (!email) {
        return NextResponse.json({ error: "Missing required field: 'email'." }, { status: 400 });
      }
      if (!userId) {
        return NextResponse.json({ error: "Missing required field: 'userId'." }, { status: 400 });
      }
      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({ error: "RESEND_API_KEY is not configured." }, { status: 500 });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return NextResponse.json(
          { error: "Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)." },
          { status: 500 }
        );
      }

      // Generate a 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

      // Delete any existing codes for this user
      await supabase
        .from("verification_codes")
        .delete()
        .eq("user_id", userId);

      // Store the new OTP
      const { error: insertError } = await supabase
        .from("verification_codes")
        .insert({ user_id: userId, email, code: otpCode, expires_at: expiresAt });

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to store verification code.", details: insertError.message },
          { status: 500 }
        );
      }

      // Send the OTP email via Resend
      const from = process.env.EMAIL_FROM || "UCF SASE <noreply@ucfsase.com>";
      const resendResp = await sendViaResend({
        from,
        to: [email],
        subject: "Your UCF SASE verification code",
        text: `UCF SASE email verification\n\nYour verification code is: ${otpCode}\n\nThis code expires in 10 minutes.\n\nIf you did not request this code, you can ignore this message.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
            <h1 style="font-size: 24px; margin: 0 0 8px 0;">UCF SASE</h1>
            <p style="font-size: 14px; margin: 0 0 20px 0; color: #444;">Email verification</p>

            <p style="font-size: 15px; margin: 0 0 12px 0;">Your verification code is:</p>
            <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; font-family: monospace; margin: 0 0 20px 0;">${otpCode}</div>

            <p style="font-size: 14px; margin: 0; color: #444;">This code expires in 10 minutes.</p>
            <p style="font-size: 14px; margin: 8px 0 0 0; color: #444;">If you did not request this code, you can ignore this message.</p>
          </div>
        `,
      });

      const resendData = await resendResp.json();
      if (!resendResp.ok) {
        return NextResponse.json(
          { error: resendData?.message || "Failed to send verification email.", details: resendData },
          { status: resendResp.status }
        );
      }

      return NextResponse.json({ ok: true, message: "Verification code sent." });
    }

    // ── 2. Verify OTP ────────────────────────────────────────────────────────
    if (action === "verify-otp") {
      const code = typeof body.code === "string" ? body.code.trim() : "";
      const userId = typeof body.userId === "string" ? body.userId.trim() : "";

      if (!code || code.length !== 6) {
        return NextResponse.json({ error: "Please provide a valid 6-digit code." }, { status: 400 });
      }
      if (!userId) {
        return NextResponse.json({ error: "Missing required field: 'userId'." }, { status: 400 });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return NextResponse.json(
          { error: "Supabase is not configured." },
          { status: 500 }
        );
      }

      // Look up the stored OTP
      const { data: rows, error: queryError } = await supabase
        .from("verification_codes")
        .select("*")
        .eq("user_id", userId)
        .eq("code", code)
        .limit(1);

      if (queryError) {
        return NextResponse.json(
          { error: "Failed to query verification codes.", details: queryError.message },
          { status: 500 }
        );
      }

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: "Invalid code. Please check and try again." }, { status: 400 });
      }

      const record = rows[0] as { expires_at: string; email: string; id: string };

      // Check expiry
      if (new Date() > new Date(record.expires_at)) {
        return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
      }

      // Clean up the used code
      await supabase.from("verification_codes").delete().eq("id", record.id);

      return NextResponse.json({
        ok: true,
        message: "Email verified successfully.",
        verifiedEmail: record.email,
      });
    }

    // ── 3. General-purpose email send (default) ──────────────────────────────
    {
      const toInput = body.to;
      const to = Array.isArray(toInput)
        ? toInput.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        : typeof toInput === "string" && toInput.trim().length > 0
          ? [toInput.trim()]
          : [];

      const subject = typeof body.subject === "string" ? body.subject : "New message from UCF SASE";
      const text = typeof body.text === "string" ? body.text : "Hello from UCF SASE.";
      const html =
        typeof body.html === "string"
          ? body.html
          : `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="margin-bottom: 12px;">UCF SASE</h2>
              <p>${text.replace(/\n/g, "<br />")}</p>
            </div>`;
      const from =
        typeof body.from === "string"
          ? body.from
          : process.env.EMAIL_FROM || "UCF SASE <noreply@ucfsase.com>";

      if (!to.length) {
        return NextResponse.json(
          { error: "Missing email recipient: 'to' is required." },
          { status: 400 }
        );
      }
      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json(
          { error: "RESEND_API_KEY is not set. Add it to your environment before sending email." },
          { status: 500 }
        );
      }

      const response = await sendViaResend({ from, to, subject, text, html });
      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data?.message || "Failed to send email.", details: data },
          { status: response.status }
        );
      }

      return NextResponse.json({ ok: true, message: "Email sent successfully.", id: data?.id });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error.";
    return NextResponse.json(
      { error: "Email request failed.", details: message },
      { status: 500 }
    );
  }
}
