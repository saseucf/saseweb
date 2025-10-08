import { RegisterForm } from "@/components/register-form"

export const metadata = {
    title: "Register",
    description: "Register for SASE UCF programs and membership — apply or express interest.",
} as const;

export default function Page() {
    return (
        <div className="min-h-screen w-full overflow-x-clip flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-sm">
                <RegisterForm />
            </div>
        </div>
    )
}
