"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FaDiscord } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import supabase from "@/lib/auth"
import { DEFAULT_MEMBER_DESTINATION, getSafeAuthRedirect } from "@/lib/auth-redirect"
import styles from "./login-form.module.css"

export function LoginFormSkeleton() {
    return (
        <div className={styles.skeleton} role="status" aria-label="Checking your session" aria-busy="true">
            <span className={styles.srOnly}>Checking your session…</span>
            <div className={styles.skeletonField} aria-hidden="true">
                <span className={styles.skeletonLabel} />
                <span className={styles.skeletonInput} />
            </div>
            <div className={styles.skeletonField} aria-hidden="true">
                <span className={styles.skeletonLabel} />
                <span className={styles.skeletonInput} />
            </div>
            <span className={styles.skeletonButton} aria-hidden="true" />
            <span className={styles.skeletonDivider} aria-hidden="true" />
            <div className={styles.providers} aria-hidden="true">
                <span className={styles.skeletonButton} />
                <span className={styles.skeletonButton} />
            </div>
            <span className={styles.skeletonFooter} aria-hidden="true" />
        </div>
    )
}

export function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = getSafeAuthRedirect(searchParams.get("redirect"), DEFAULT_MEMBER_DESTINATION)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("name_confirmed")
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

    if (checkingSession) return <LoginFormSkeleton />

    const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError("")
        setIsLoading(true)

        const { data, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (loginError) {
            setError(loginError.message)
            setIsLoading(false)
            return
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("name_confirmed")
            .eq("id", data.user.id)
            .single()

        if (profile?.name_confirmed === false) {
            router.replace(`/confirm-name?redirect=${encodeURIComponent(redirectUrl)}`)
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
        <div>
            <form className={styles.form} onSubmit={handlePasswordLogin} aria-busy={isLoading}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="login-email">Email</label>
                    <input
                        id="login-email"
                        name="email"
                        className={styles.input}
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="login-password">Password</label>
                    <div className={styles.password}>
                        <input
                            id="login-password"
                            name="password"
                            className={styles.input}
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            className={styles.visibility}
                            type="button"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-controls="login-password"
                            onClick={() => setShowPassword((visible) => !visible)}
                        >
                            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                        </button>
                    </div>
                </div>
                <button
                    className={styles.primary}
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Logging in..." : "Log in"}
                </button>
            </form>

            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}

            <div className={styles.separator}>
                or continue with
            </div>

            <div className={styles.providers}>
                <button
                    type="button"
                    className={styles.provider}
                    onClick={() => handleOAuthLogin("discord")}
                >
                    <FaDiscord aria-hidden="true" />
                    Continue with Discord
                </button>
                <button
                    type="button"
                    className={styles.provider}
                    onClick={() => handleOAuthLogin("google")}
                >
                    <FcGoogle aria-hidden="true" />
                    Continue with Google
                </button>
            </div>

            <p className={styles.signup}>
                Don&apos;t have an account?{" "}
                <Link href="/signup">
                    Sign up
                </Link>
            </p>
        </div>
    )
}
