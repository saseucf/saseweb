import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
    return (
        <div className="sase-login-page">
            <div className="w-full max-w-sm">
                <Suspense>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    )
}
