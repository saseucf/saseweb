"use client"

import { FormEvent, useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import supabase from "@/lib/auth"
import styles from "./login-form.module.css"

export function ResetPasswordForm() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [sessionReady, setSessionReady] = useState(false)
    const [noSession, setNoSession] = useState(false)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSessionReady(true)
            } else {
                setNoSession(true)
            }
        })
    }, [])

    if (noSession) {
        return (
            <div>
                <div className={styles.error} role="alert">
                    This reset link has expired or is invalid. Please request a new one.
                </div>
                <p className={styles.signup}>
                    <Link href="/forgot-password">
                        Request a new reset link
                    </Link>
                </p>
            </div>
        )
    }

    if (!sessionReady) return null

    if (isComplete) {
        return (
            <div>
                <div style={{ padding: "16px 14px", borderRadius: 4, background: "oklch(96.5% 0.02 145)", border: "1px solid oklch(77% 0.075 145)", color: "oklch(35% 0.1 145)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                    Your password has been updated successfully.
                </div>
                <p className={styles.signup}>
                    <Link href="/login">
                        Log in with your new password
                    </Link>
                </p>
            </div>
        )
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError("")

        if (password.length < 6) {
            setError("Password must be at least 6 characters.")
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        setIsLoading(true)

        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) {
            setError(updateError.message)
            setIsLoading(false)
            return
        }

        setIsComplete(true)
        setIsLoading(false)
    }

    return (
        <div>
            <form className={styles.form} onSubmit={handleSubmit} aria-busy={isLoading}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="new-password">New password</label>
                    <div className={styles.password}>
                        <input
                            id="new-password"
                            name="password"
                            className={styles.input}
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="new-password"
                            minLength={6}
                            required
                        />
                        <button
                            className={styles.visibility}
                            type="button"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-controls="new-password"
                            onClick={() => setShowPassword((visible) => !visible)}
                        >
                            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                        </button>
                    </div>
                </div>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="confirm-password">Confirm new password</label>
                    <input
                        id="confirm-password"
                        name="confirmPassword"
                        className={styles.input}
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        required
                    />
                </div>
                <button
                    className={styles.primary}
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Updating..." : "Update password"}
                </button>
            </form>

            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}
        </div>
    )
}
