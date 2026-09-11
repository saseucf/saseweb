import { Suspense } from "react"
import Image from "next/image"
import { Inter } from "next/font/google"
import { LoginForm, LoginFormSkeleton } from "@/components/login-form"
import styles from "./login.module.css"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const metadata = {
    title: "Log in | UCF SASE",
    description: "Log in to your UCF SASE account to manage your membership and event forms.",
}

export default function LoginPage() {
    return (
        <main className={`${styles.page} ${inter.className}`}>
            <div className={styles.layout}>
                <aside className={styles.community} aria-label="Our SASE community">
                    <div className={styles.identity}>
                        <Image src="/logo-white-horizontal.png" alt="SASE" width={180} height={39} />
                        <p>University of Central Florida</p>
                    </div>
                    <h2>A place to grow<br />together.</h2>
                    <figure className={styles.photo}>
                        <div className={styles.photoFrame}>
                            <Image
                                src="/events/breadboard2.jpg"
                                alt="SASE members working on a circuit design during a workshop"
                                fill
                                sizes="(min-width: 1180px) 464px, (min-width: 900px) 40vw, 1px"
                            />
                        </div>
                        <figcaption>Building circuits at a SASE workshop.</figcaption>
                    </figure>
                </aside>

                <section className={styles.signIn} aria-labelledby="login-heading">
                    <header className={styles.heading}>
                        <p className={styles.eyebrow}>UCF SASE · Member access</p>
                        <h1 id="login-heading">Log in to SASE</h1>
                        <p>Manage your membership and event forms.</p>
                    </header>
                    <Suspense fallback={<LoginFormSkeleton />}>
                        <LoginForm />
                    </Suspense>
                </section>
            </div>
        </main>
    )
}
