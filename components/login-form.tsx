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
import { createMemberFromProfile, passwordNextStep } from "@/lib/unified-auth"
import { announceMemberSession, memberDestination, sendMemberWelcome } from "@/lib/member-session"

export function LoginFormSkeleton() {
    return (
        <div className={styles.skeleton} role="status" aria-label="Checking your session" aria-busy="true">
            <span className={styles.srOnly}>Checking your session...</span>
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
    const [step, setStep] = useState<"credentials" | "profile" | "verify">("credentials")
    const [notice, setNotice] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [major, setMajor] = useState("")
    const [year, setYear] = useState("")

    useEffect(() => {
        let cancelled = false
        async function resume() {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                if (cancelled) return
                if (error) throw error
                if (session) {
                    const destination = await memberDestination(session.user, redirectUrl)
                    if (!cancelled) router.replace(destination)
                    return
                }
            } catch { if (!cancelled) setError("Unable to load your session. Please try again.") }
            if (!cancelled) setCheckingSession(false)
        }
        void resume()
        return () => { cancelled = true }
    }, [router, redirectUrl])

    if (checkingSession) return <LoginFormSkeleton />

    const callbackUrl = () => `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`
    const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (isLoading) return
        setError(""); setNotice(""); setIsLoading(true)
        try {
            if (step === "profile") {
                const { data, error } = await createMemberFromProfile({
                    email, password, first_name: firstName, last_name: lastName, major, year, school: "University of Central Florida",
                }, callbackUrl(), credentials => supabase.auth.signUp(credentials))
                if (error) throw error
                if (!data.session) {
                    setStep("verify"); setPassword("")
                    setNotice("Check your email for a confirmation link to finish joining and continue. If you already have an account, sign in with your existing password or use Forgot password.")
                    return
                }
                const destination = await memberDestination(data.session.user, redirectUrl)
                announceMemberSession(data.session.user)
                await sendMemberWelcome(data.session.user)
                router.replace(destination)
                return
            }
            const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
            const next = passwordNextStep(error)
            if (next === "profile") {
                setStep("profile")
                setNotice("We couldn't sign in with those details. New here? Complete your profile below to join. Already a member? Go back and use your existing password, or reset it.")
                return
            }
            if (next === "verify") {
                setStep("verify"); setPassword(""); setNotice("Confirm your email before continuing. Check your inbox or request a new confirmation link below.")
                return
            }
            if (error) throw error
            if (!data.user) throw new Error("Sign-in could not be completed. Please try again.")
            const destination = await memberDestination(data.user, redirectUrl)
            announceMemberSession(data.user)
            await sendMemberWelcome(data.user)
            router.replace(destination)
        } catch (error) { setError(error instanceof Error ? error.message : "Unable to connect. Please try again.") }
        finally { setIsLoading(false) }
    }

    const handleOAuthLogin = async (provider: "discord" | "google") => {
        setError(""); setIsLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: callbackUrl() } })
            if (error) throw error
        } catch (error) {
            setError(error instanceof Error ? error.message : "Unable to connect. Please try again.")
            setIsLoading(false)
        }
    }

    const resendConfirmation = async () => {
        setIsLoading(true); setError("")
        try {
            const { error } = await supabase.auth.resend({ type: "signup", email: email.trim().toLowerCase(), options: { emailRedirectTo: callbackUrl() } })
            if (error) throw error
            setNotice("If this address has a pending registration, a new confirmation link is on its way. Check your inbox and spam folder.")
        } catch (error) { setError(error instanceof Error ? error.message : "Unable to resend. Please try again.") }
        finally { setIsLoading(false) }
    }

    return (
        <div>
            <p className={styles.helper}>One place to sign in or join. Use your email and password, or choose Google or Discord to sign in and automatically create an account if you are new.</p>
            {notice && <p className={styles.notice} role="status">{notice}</p>}
            {step === "verify" ? <div className={styles.form}><p className={styles.helper}>Confirmation links return you to your original destination, including event check-in.</p><button type="button" disabled={isLoading} className={styles.primary} onClick={resendConfirmation}>{isLoading ? "Sending..." : "Resend confirmation email"}</button><button type="button" className={styles.provider} onClick={() => { setStep("credentials"); setNotice(""); setError("") }}>Back to sign in</button></div> : <form className={styles.form} onSubmit={handlePasswordLogin} aria-busy={isLoading}>
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
                            autoComplete={step === "profile" ? "new-password" : "current-password"}
                            minLength={step === "profile" ? 8 : undefined}
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
                {step === "profile" && <fieldset className={styles.profileFields}>
                    <legend className={styles.profileTitle}>Finish joining SASE</legend>
                    <p className={styles.helper}>Add your details and choose a password above. Your account is created when you continue.</p>
                    <div className={styles.nameFields}>
                        <label className={styles.field}>First name<input className={styles.input} autoComplete="given-name" value={firstName} onChange={event => setFirstName(event.target.value)} required maxLength={100} /></label>
                        <label className={styles.field}>Last name<input className={styles.input} autoComplete="family-name" value={lastName} onChange={event => setLastName(event.target.value)} required maxLength={100} /></label>
                    </div>
                    <label className={styles.field}>Major<input className={styles.input} value={major} onChange={event => setMajor(event.target.value)} required maxLength={150} placeholder="e.g. Computer Science" /></label>
                    <label className={styles.field}>Graduation year<input className={styles.input} inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} value={year} onChange={event => setYear(event.target.value)} required placeholder="e.g. 2028" /></label>
                    <button type="button" disabled={isLoading} className={styles.forgotLink} onClick={() => { setStep("credentials"); setNotice(""); setError("") }}>Back to sign in</button>
                </fieldset>}
                <div style={{ textAlign: "right", marginTop: -4 }}>
                    <Link href="/forgot-password" className={styles.forgotLink}>
                        Forgot password?
                    </Link>
                </div>
                <button
                    className={styles.primary}
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Continuing..." : step === "profile" ? "Create account & continue" : "Continue with email"}
                </button>
            </form>}

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
                    disabled={isLoading}
                    onClick={() => handleOAuthLogin("discord")}
                >
                    <FaDiscord aria-hidden="true" />
                    Continue with Discord
                </button>
                <button
                    type="button"
                    className={styles.provider}
                    disabled={isLoading}
                    onClick={() => handleOAuthLogin("google")}
                >
                    <FcGoogle aria-hidden="true" />
                    Continue with Google
                </button>
            </div>

            <p className={styles.signup}>Google and Discord handle sign-in securely. New members will be asked for their name, major, and graduation year before continuing.</p>
        </div>
    )
}
