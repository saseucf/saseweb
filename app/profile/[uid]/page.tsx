"use client"
import { Card } from "@/components/ui/card"
export default function Page() {
    return (
        <div>
            <Card>
                <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                    <div className="w-full max-w-sm">
                        <h1 className="text-2xl font-bold">Profile Page</h1>
                        <p>This is the user profile page.</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}