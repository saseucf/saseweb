"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FaDiscord } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import Link from "next/link"
import supabase from "@/lib/auth"

export function SignupForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = searchParams.get("redirect") || "/"
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", session.user.id)
                    .single()

                if (profile && profile.name_confirmed === false) {
                    router.replace(`/confirm-name?redirect=${encodeURIComponent(redirectUrl)}`)
                    return
                }

                router.replace(redirectUrl)
                return
            }
            setCheckingSession(false)
        })
    }, [router, redirectUrl])

    if (checkingSession) return null

    const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError("")
        setIsLoading(true)

        const { error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`,
            },
        })

        if (signupError) {
            setError(signupError.message)
            setIsLoading(false)
            return
        }

        router.replace(redirectUrl)
    }

    const handleOAuthLogin = async (provider: "discord" | "google") => {
        setError("")
        const { error: loginError } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`,
            },
        })

        if (loginError) setError(loginError.message)
    }

    return (
        <div className="sase-login-card flex flex-col gap-4 p-6">
            <div>
                <h1 className="text-2xl font-bold">Sign up for SASE</h1>
                <p className="mt-1 text-sm text-gray-500">Create an account to get started.</p>
            </div>

            <form className="flex flex-col gap-3" onSubmit={handleSignup}>
                <label className="flex flex-col gap-1 text-sm font-medium">
                    Email
                    <input
                        className="rounded border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">
                    Password
                    <input
                        className="rounded border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                    />
                </label>
                <button
                    className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Signing up..." : "Sign up"}
                </button>
            </form>

            {error && (
                <p className="rounded bg-red-50 p-3 text-sm text-red-700" role="alert">
                    {error}
                </p>
            )}

            <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="h-px flex-1 bg-gray-200" />
                or continue with
                <span className="h-px flex-1 bg-gray-200" />
            </div>

            <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
                onClick={() => handleOAuthLogin("discord")}
            >
                <FaDiscord />
                Continue with Discord
            </button>
            <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
                onClick={() => handleOAuthLogin("google")}
            >
                <FcGoogle />
                Continue with Google
            </button>

            <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    )
}
