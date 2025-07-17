import { LoginForm } from "@/components/login-form"

export default function Page() {
    return (
        <div className="min-h-screen w-full overflow-x-clip flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    )
}
