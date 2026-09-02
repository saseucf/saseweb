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
                try {
                    localStorage.setItem("sase:auth", JSON.stringify(user))
                } catch {
                    // ignore localStorage errors
                }
                window.dispatchEvent(new CustomEvent("sase:auth", { detail: { user } }))

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single()

                // Profile row is missing (e.g. it was deleted while the
                // auth.users row still exists, so handle_new_user() never
                // re-fired). Re-create it from OAuth metadata so the user
                // isn't stuck.
                if (profileError?.code === "PGRST116") {
                    const meta = user.user_metadata ?? {}
                    let firstName = ""
                    let lastName = ""

                    if (meta.given_name) {
                        firstName = meta.given_name
                        lastName = meta.family_name ?? ""
                    } else if (meta.first_name) {
                        firstName = meta.first_name
                        lastName = meta.last_name ?? ""
                    } else {
                        const displayName =
                            meta.full_name || meta.name || meta.user_name || "New Member"
                        const spaceIdx = displayName.indexOf(" ")
                        if (spaceIdx > 0) {
                            firstName = displayName.slice(0, spaceIdx)
                            lastName = displayName.slice(spaceIdx + 1)
                        } else {
                            firstName = displayName
                        }
                    }

                    await supabase.from("profiles").insert({
                        id: user.id,
                        first_name: firstName,
                        last_name: lastName,
                        email: user.email ?? "",
                        major: "",
                        year: "",
                        school: "",
                        name_confirmed: false,
                    })

                    router.replace(`/confirm-name?redirect=${encodeURIComponent(redirectUrl)}`)
                    return
                }

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
