import { RegisterForm } from "@/components/register-form"

export default function Page() {
    return (
        <div className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-sm">
                <RegisterForm />
            </div>
        </div>
    )
}
