import { NextResponse } from "next/server";

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
// POST /api/email — Send general-purpose email
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error.";
    return NextResponse.json(
      { error: "Email request failed.", details: message },
      { status: 500 }
    );
  }
}

