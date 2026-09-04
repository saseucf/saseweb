import { Suspense } from "react"
import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
    return (
        <div className="sase-login-page">
            <div className="w-full max-w-sm">
                <Suspense>
                    <SignupForm />
                </Suspense>
            </div>
        </div>
    )
}
