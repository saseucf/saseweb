"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import supabase from "@/lib/auth"
import styles from "./login-form.module.css"

export function ForgotPasswordForm() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError("")
        setIsLoading(true)

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        })

        if (resetError) {
            setError(resetError.message)
            setIsLoading(false)
            return
        }

        setIsSubmitted(true)
        setIsLoading(false)
    }

    if (isSubmitted) {
        return (
            <div>
                <div style={{ padding: "16px 14px", borderRadius: 4, background: "oklch(96.5% 0.02 145)", border: "1px solid oklch(77% 0.075 145)", color: "oklch(35% 0.1 145)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                    Check your email for a password reset link. If you don&apos;t see it, check your spam folder.
                </div>
                <p className={styles.signup}>
                    <Link href="/login">
                        Back to login
                    </Link>
                </p>
            </div>
        )
    }

    return (
        <div>
            <form className={styles.form} onSubmit={handleSubmit} aria-busy={isLoading}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="forgot-email">Email</label>
                    <input
                        id="forgot-email"
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
                <button
                    className={styles.primary}
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Sending..." : "Send reset link"}
                </button>
            </form>

            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}

            <p className={styles.signup}>
                Remember your password?{" "}
                <Link href="/login">
                    Log in
                </Link>
            </p>
        </div>
    )
}
