"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import supabase from "@/lib/auth"

export default function AuthCallbackPage() {
    const router = useRouter()

    useEffect(() => {
        // supabase-js uses the "implicit" flow by default, so by the time this
        // component mounts, the client has already parsed the access/refresh
        // tokens out of the URL hash and stored the session. getSession() just
        // waits for that internal init to finish and hands us the result.
        supabase.auth.getSession().then(({ data }) => {
            const user = data.session?.user
            if (user) {
                try {
                    localStorage.setItem("sase:auth", JSON.stringify(user))
                } catch {
                    // ignore localStorage errors
                }
                window.dispatchEvent(new CustomEvent("sase:auth", { detail: { user } }))

                router.replace("/")
                return
            }
            router.replace("/login")
        })
    }, [router])

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">Signing you in...</p>
        </div>
    )
}
