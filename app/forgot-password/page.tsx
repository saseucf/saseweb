import { Suspense } from "react"
import { Inter } from "next/font/google"
import { ForgotPasswordForm } from "@/components/forgot-password-form"
import styles from "../login/login.module.css"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const metadata = {
    title: "Forgot Password | UCF SASE",
    description: "Reset your UCF SASE account password.",
}

export default function ForgotPasswordPage() {
    return (
        <main className={`${styles.page} ${inter.className}`}>
            <div className={styles.layout} style={{ display: "flex", justifyContent: "center" }}>
                <section className={styles.signIn} aria-labelledby="forgot-heading">
                    <header className={styles.heading}>
                        <p className={styles.eyebrow}>UCF SASE · Account recovery</p>
                        <h1 id="forgot-heading">Reset your password</h1>
                        <p>Enter your email and we&apos;ll send you a reset link.</p>
                    </header>
                    <Suspense>
                        <ForgotPasswordForm />
                    </Suspense>
                </section>
            </div>
        </main>
    )
}
