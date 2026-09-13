import { Suspense } from "react"
import { Inter } from "next/font/google"
import { ResetPasswordForm } from "@/components/reset-password-form"
import styles from "../login/login.module.css"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const metadata = {
    title: "Set New Password | UCF SASE",
    description: "Set a new password for your UCF SASE account.",
}

export default function ResetPasswordPage() {
    return (
        <main className={`${styles.page} ${inter.className}`}>
            <div className={styles.layout} style={{ display: "flex", justifyContent: "center" }}>
                <section className={styles.signIn} aria-labelledby="reset-heading">
                    <header className={styles.heading}>
                        <p className={styles.eyebrow}>UCF SASE · Account recovery</p>
                        <h1 id="reset-heading">Set a new password</h1>
                        <p>Enter your new password below.</p>
                    </header>
                    <Suspense>
                        <ResetPasswordForm />
                    </Suspense>
                </section>
            </div>
        </main>
    )
}
