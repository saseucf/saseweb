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
        } else if (type === "lumahacks_registration") {
            subject = "Registration Received: LumaHacks 2027";
            contentHtml = `
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="display: inline-block; padding: 4px 14px; background: rgba(0, 210, 255, 0.15); border: 1px solid #00d2ff; border-radius: 999px; color: #00d2ff; font-size: 12px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase;">
                        Registration Received · LumaHacks
                    </span>
                </div>
                <h2 style="color: #00d2ff; margin-top: 0; font-size: 26px; font-weight: 800; text-align: center; letter-spacing: -0.02em;">
                    Registration Received, ${firstName || "Hacker"}!
                </h2>
                <p style="color: #e0f2fe; font-size: 16px; line-height: 1.6; text-align: center;">
                    You have successfully registered for <strong>LumaHacks 2027</strong>!
                </p>
                <div style="background: rgba(0, 82, 255, 0.15); border-left: 3px solid #00d2ff; padding: 14px 18px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <p style="margin: 0; color: #e0f2fe; font-size: 14px; line-height: 1.5;">
                        <strong style="color: #00d2ff;">Important Status Note:</strong> You are currently <strong>registered</strong>. Official attendee confirmation and spot verification will take place closer to the event date on a separate event platform.
                    </p>
                </div>
                <div style="background: rgba(0, 7, 45, 0.6); border: 1px solid rgba(0, 210, 255, 0.25); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: left;">
                    <p style="margin: 0 0 10px 0; color: #506b8e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Mission Briefing</p>
                    <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 15px;"><strong>Duration:</strong> 24-Hour Hackathon</p>
                    <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 15px;"><strong>Date:</strong> March 6–7, 2027</p>
                    <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 15px;"><strong>Format:</strong> In-Person at UCF</p>
                    <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 15px;"><strong>Eligibility:</strong> Enrolled College & University Students (18+)</p>
                    <p style="margin: 0; color: #ffffff; font-size: 15px;"><strong>Status:</strong> Successfully Registered (Confirmation later on separate site)</p>
                </div>
                <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; text-align: left;">
                    Prepare your gear. You will dive deep into 24 hours of intense building, designing, and collaboration alongside passionate student innovators. Keep an eye on your inbox as we approach March 2027—we will send instructions on how to confirm your attendance on our dedicated event portal.
                </p>
                <p style="color: #00d2ff; font-size: 15px; line-height: 1.6; font-weight: 600; text-align: center; margin-top: 28px;">
                    See you at the ocean floor.
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

        // Themed HTML wrap
        const isLuma = type === "lumahacks_registration";
        const emailOuterBg = isLuma ? "#00072D" : "#f0f9ff";
        const containerBorder = isLuma ? "1px solid rgba(0, 210, 255, 0.4)" : "1px solid #bae6fd";
        const containerShadow = isLuma ? "0 10px 40px rgba(0, 82, 255, 0.35)" : "0 10px 25px rgba(2, 132, 199, 0.15)";
        const headerBg = isLuma
            ? "linear-gradient(135deg, #00072D 0%, #001242 50%, #0052ff 100%)"
            : "linear-gradient(135deg, #171d52 0%, #0369a1 50%, #0284c7 100%)";
        const bodyBg = isLuma
            ? "background-color: #000c36; background-image: radial-gradient(circle at 50% 0%, rgba(0, 210, 255, 0.12) 0%, rgba(0, 7, 45, 0.95) 75%);"
            : "background-color: #ffffff; background-image: radial-gradient(circle at 50% 100%, rgba(186, 230, 253, 0.25) 0%, rgba(255, 255, 255, 0.95) 70%);";
        const dividerBorder = isLuma ? "2px solid rgba(0, 210, 255, 0.25)" : "2px solid #e0f2fe";
        const signoffColor1 = isLuma ? "#506b8e" : "#0369a1";
        const signoffColor2 = isLuma ? "#00d2ff" : "#0284c7";
        const footerBg = isLuma ? "#00051a" : "#0f172a";

        const fullHtmlContent = `
            <div style="background-color: ${emailOuterBg}; padding: 40px 15px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: ${containerShadow}; border: ${containerBorder};">
                    
                    <!-- Gradient Header with SASE Logo -->
                    <div style="background: ${headerBg}; padding: 36px 24px; text-align: center;">
                        ${logoHtml}
                    </div>

                    <!-- Main Email Body -->
                    <div style="padding: 40px 32px; ${bodyBg} background-size: cover;">
                        
                        ${contentHtml}

                        <!-- Sign-off -->
                        <div style="margin-top: 36px; padding-top: 24px; border-top: ${dividerBorder};">
                            <p style="color: ${signoffColor1}; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">Sincerely,</p>
                            <p style="color: ${signoffColor2}; font-size: 18px; font-weight: 700; margin: 0;">UCF SASE & LumaHacks Team</p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: ${footerBg}; padding: 20px; text-align: center;">
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
