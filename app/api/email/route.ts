import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, eventTitle, firstName } = body;

        if (!email || !eventTitle) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!process.env.RESEND_API_KEY) {
            console.warn("RESEND_API_KEY is missing. Skipping email sending.");
            return NextResponse.json({ success: true, warning: "Email skipped because API key is missing" });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const nameDisplay = firstName ? ` ${firstName}` : "";

        const { data, error } = await resend.emails.send({
            from: "UCF SASE <hello@ucfsase.com>",
            to: [email],
            subject: `RSVP Confirmed: ${eventTitle}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #171d52; padding: 24px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">UCF SASE</h1>
                    </div>
                    <div style="padding: 32px; background-color: #ffffff;">
                        <h2 style="color: #171d52; margin-top: 0;">You're on the list!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                            Hi${nameDisplay},
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                            This email is to confirm your RSVP for <strong>${eventTitle}</strong>. 
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                            We can't wait to see you there! If you have any questions, feel free to reach out to an officer.
                        </p>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Failed to send email:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
