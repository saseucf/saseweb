"use client"

import { FormEvent, useState } from "react"
import { Eye, EyeOff, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"
import supabase from "@/lib/auth"

export default function ChangePasswordForm({ userEmail }: { userEmail: string }) {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPasswords, setShowPasswords] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError("")

        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters.")
            return
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.")
            return
        }

        if (newPassword === currentPassword) {
            setError("New password must be different from your current password.")
            return
        }

        setIsLoading(true)

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: currentPassword,
        })

        if (signInError) {
            setError("Current password is incorrect.")
            setIsLoading(false)
            return
        }

        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

        if (updateError) {
            setError(updateError.message)
            setIsLoading(false)
            return
        }

        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setIsLoading(false)
        toast.success("Password updated successfully!")
    }

    return (
        <>
            <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-[#4266a4]" />
                <h2 className="text-xl font-bold tracking-tight">Change Password</h2>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-3 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="currentPassword">
                        Current password
                    </label>
                    <div className="relative">
                        <input
                            id="currentPassword"
                            type={showPasswords ? "text" : "password"}
                            className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 pr-12 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-gray-400 hover:text-[#171d52]"
                            aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                            onClick={() => setShowPasswords((v) => !v)}
                        >
                            {showPasswords ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="newPassword">
                        New password
                    </label>
                    <input
                        id="newPassword"
                        type={showPasswords ? "text" : "password"}
                        className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        required
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="confirmNewPassword">
                        Confirm new password
                    </label>
                    <input
                        id="confirmNewPassword"
                        type={showPasswords ? "text" : "password"}
                        className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded bg-[#5579bd] text-white p-3 font-bold uppercase tracking-wider text-sm mt-4 hover:bg-[#171d52] transition-colors flex items-center justify-center disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Update Password
                </button>
            </form>
        </>
    )
}
