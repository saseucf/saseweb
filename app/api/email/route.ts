import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, email, eventTitle, firstName } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Missing required field: email" },
                { status: 400 }
            );
        }

        const brevoApiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.EMAIL_USER || "noreplysaseucf@gmail.com";

        if (!brevoApiKey) {
            console.error("BREVO_API_KEY is missing in process.env!");
            return NextResponse.json(
                { error: "BREVO_API_KEY is not configured in environment variables." },
                { status: 500 }
            );
        }

        // Exact SASE logo with blue flask & white text, hosted on GitHub CDN
        const logoUrl = "https://raw.githubusercontent.com/saseucf/saseweb/main/public/logo-hero.png";
        const logoHtml = `<img src="${logoUrl}" alt="SASE Logo" style="max-width: 220px; width: 100%; height: auto; display: block; margin: 0 auto;" />`;

        const nameDisplay = firstName ? ` ${firstName}` : "";
        let subject = "";
        let contentHtml = "";

        if (type === "welcome") {
            subject = "Welcome to UCF SASE!";
            contentHtml = `
                <h2 style="color: #0284c7; margin-top: 0; font-size: 22px; font-weight: 700;">Welcome to UCF SASE!</h2>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                    Hi${nameDisplay},
                </p>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                    Your UCF SASE account has been successfully created! 
                </p>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                    You can now log in, RSVP for upcoming events, join our programs, and track your attendance seamlessly.
                </p>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                    We're thrilled to have you as part of our community. If you have any questions, feel free to reach out to any officer!
                </p>
            `;
        } else {
            if (!eventTitle) {
                return NextResponse.json(
                    { error: "Missing required field: eventTitle" },
                    { status: 400 }
                );
            }

            subject = `RSVP Confirmed: ${eventTitle}`;
            contentHtml = `
                <h2 style="color: #0284c7; margin-top: 0; font-size: 22px; font-weight: 700;">You're on the list!</h2>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                    Hi${nameDisplay},
                </p>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                    This email is to confirm your RSVP for <strong>${eventTitle}</strong>. 
                </p>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                    We can't wait to see you there! If you have any questions, feel free to reach out to an officer.
                </p>
            `;
        }

        // Ocean-themed email template with GitHub CDN logo, deep ocean gradient header & semi-transparent ocean body
        const fullHtmlContent = `
            <div style="background-color: #f0f9ff; padding: 40px 15px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.15); border: 1px solid #bae6fd;">
                    
                    <!-- Deep Ocean Gradient Header with Blue Flask SASE Logo -->
                    <div style="background: linear-gradient(135deg, #171d52 0%, #0369a1 50%, #0284c7 100%); padding: 36px 24px; text-align: center;">
                        ${logoHtml}
                    </div>

                    <!-- Main Email Body with Semi-Transparent Ocean Background -->
                    <div style="padding: 40px 32px; background-color: #ffffff; background-image: radial-gradient(circle at 50% 100%, rgba(186, 230, 253, 0.25) 0%, rgba(255, 255, 255, 0.95) 70%); background-size: cover;">
                        
                        ${contentHtml}

                        <!-- Professional Ocean Sign-off -->
                        <div style="margin-top: 36px; padding-top: 24px; border-top: 2px solid #e0f2fe;">
                            <p style="color: #0369a1; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">Sincerely,</p>
                            <p style="color: #0284c7; font-size: 18px; font-weight: 700; margin: 0;">SASE Team</p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                            © ${new Date().getFullYear()} UCF Society of Asian Scientists & Engineers. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        `;

        console.log(`Sending ${type || "rsvp"} email to ${email} via Brevo API...`);

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": brevoApiKey,
            },
            body: JSON.stringify({
                sender: { name: "UCF SASE", email: senderEmail },
                to: [{ email }],
                subject,
                htmlContent: fullHtmlContent,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Brevo API Error:", data);
            return NextResponse.json(
                { error: data.message || "Failed to send email via Brevo" },
                { status: response.status }
            );
        }

        console.log("Email sent successfully via Brevo:", data);
        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        console.error("Failed to send email via Brevo API:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
