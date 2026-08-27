"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import supabase from "@/lib/auth"

function AuthCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = searchParams.get("redirect") || "/"

    useEffect(() => {
        // supabase-js uses the "implicit" flow by default, so by the time this
        // component mounts, the client has already parsed the access/refresh
        // tokens out of the URL hash and stored the session. getSession() just
        // waits for that internal init to finish and hands us the result.
        supabase.auth.getSession().then(async ({ data }) => {
            const user = data.session?.user
            if (user) {
                const accountCreatedAt = new Date(user.created_at).getTime()
                const accountWasJustCreated =
                    Number.isFinite(accountCreatedAt) &&
                    Date.now() - accountCreatedAt < 10 * 60 * 1000
                const welcomeEmailSent = user.user_metadata?.welcome_email_sent === true

                if (accountWasJustCreated && !welcomeEmailSent && user.email) {
                    try {
                        const response = await fetch("/api/email", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                to: user.email,
                                subject: "Welcome to UCF SASE",
                                text: "Welcome to UCF SASE! Your account has been created successfully.",
                                html: `
                                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
                                        <h2 style="margin-bottom: 12px;">Welcome to UCF SASE</h2>
                                        <p>Your account has been created successfully.</p>
                                        <p>We are glad to have you with us.</p>
                                    </div>
                                `,
                            }),
                        })

                        if (response.ok) {
                            await supabase.auth.updateUser({
                                data: { ...user.user_metadata, welcome_email_sent: true },
                            })
                        }
                    } catch (error) {
                        console.error("Failed to send welcome email:", error)
                    }
                }

                try {
                    localStorage.setItem("sase:auth", JSON.stringify(user))
                } catch {
                    // ignore localStorage errors
                }
                window.dispatchEvent(new CustomEvent("sase:auth", { detail: { user } }))

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single()

                if (profile && !profile.name_confirmed) {
                    router.replace(`/confirm-name?redirect=${encodeURIComponent(redirectUrl)}`)
                    return
                }

                router.replace(redirectUrl)
                return
            }
            router.replace("/login")
        })
    }, [router, redirectUrl])

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">Signing you in...</p>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense>
            <AuthCallback />
        </Suspense>
    )
}
