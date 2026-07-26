"use client"
import supabase from "@/lib/auth"
import { FaDiscord } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"

export function LoginForm() {
    const handleDiscordLogin = async () => {
        // Kicks off Supabase's OAuth flow: this redirects the whole browser tab to
        // Discord's consent screen, so nothing after this call in this function runs.
        await supabase.auth.signInWithOAuth({
            provider: "discord",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    const handleGoogleLogin = async () => {
        // Same flow as Discord, just a different provider - redirects to Google's
        // consent screen, then back to /auth/callback once the user approves.
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    return (
        <div className="flex flex-col gap-3">
            <h1 className="text-xl font-bold text-center mb-2">Login to your account</h1>
            <button
                type="button"
                className="w-full border rounded px-4 py-2 flex items-center justify-center gap-2"
                onClick={handleDiscordLogin}
            >
                <FaDiscord />
                Continue with Discord
            </button>
            <button
                type="button"
                className="w-full border rounded px-4 py-2 flex items-center justify-center gap-2"
                onClick={handleGoogleLogin}
            >
                <FcGoogle />
                Continue with Google
            </button>
        </div>
    )
}
