import "./globals.css";
import NavBar from "@/components/navbar";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/themeprovider";
import { createServerSupabase } from "@/lib/supabase-server";

const geist = Geist({
    subsets: ["latin"],
    display: "swap",
});

export const metadata = {
    title: "Home",
    description:
        "Welcome to SASE UCF — events, programs, and resources for the Society of Asian Scientists and Engineers at UCF.",
} as const;

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabase = createServerSupabase();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    return (
        <html lang="en" className={geist.className}>
            <body>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <NavBar session={session} />
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
