"use client"

import { FormEvent, Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import supabase from "@/lib/auth"
import { getSafeAuthRedirect } from "@/lib/auth-redirect"

function ConfirmName() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = getSafeAuthRedirect(searchParams.get("redirect"))

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [major, setMajor] = useState("")
    const [school, setSchool] = useState("")
    const [graduationYear, setGraduationYear] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const user = session?.user
            if (!user) {
                router.replace("/login")
                return
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("first_name, last_name, major, school, year, phone_number, name_confirmed")
                .eq("id", user.id)
                .single()

            if (!profile || profile.name_confirmed) {
                router.replace(redirectUrl)
                return
            }

            setFirstName(profile.first_name || "")
            setLastName(profile.last_name || "")
            setMajor(profile.major || "")
            setSchool(profile.school || "")
            setGraduationYear(profile.year || "")
            setPhoneNumber(profile.phone_number || "")
            setLoading(false)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading) {
        return (
            <div className="sase-login-page">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        )
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError("")
        setSaving(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            router.replace("/login")
            return
        }

        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                major: major.trim(),
                school: school.trim(),
                year: graduationYear.trim(),
                phone_number: phoneNumber.trim(),
                name_confirmed: true,
            })
            .eq("id", user.id)

        if (updateError) {
            setError(updateError.message)
            setSaving(false)
            return
        }

        router.replace(redirectUrl)
    }

    return (
        <main className="sase-login-page p-4">
            <div className="sase-login-card p-8 md:p-12 w-full max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold dark:text-white">Complete your profile</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Confirm your info before continuing.</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="firstName">
                                First name
                            </label>
                            <input
                                id="firstName"
                                className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa] dark:text-white"
                                value={firstName}
                                onChange={(event) => setFirstName(event.target.value)}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="lastName">
                                Last name
                            </label>
                            <input
                                id="lastName"
                                className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa] dark:text-white"
                                value={lastName}
                                onChange={(event) => setLastName(event.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="major">
                            Major
                        </label>
                        <input
                            id="major"
                            className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa] dark:text-white"
                            value={major}
                            onChange={(event) => setMajor(event.target.value)}
                            placeholder="e.g. Computer Science"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="school">
                                School
                            </label>
                            <input
                                id="school"
                                className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa] dark:text-white"
                                value={school}
                                onChange={(event) => setSchool(event.target.value)}
                                placeholder="e.g. University of Central Florida"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="graduationYear">
                                Graduation Year
                            </label>
                            <input
                                id="graduationYear"
                                className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa] dark:text-white"
                                value={graduationYear}
                                onChange={(event) => setGraduationYear(event.target.value)}
                                placeholder="e.g. 2027"
                                required
                            />
                        </div>
                    </div>



                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="phoneNumber">
                            Phone number
                        </label>
                        <input
                            id="phoneNumber"
                            type="tel"
                            className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa] dark:text-white"
                            value={phoneNumber}
                            onChange={(event) => setPhoneNumber(event.target.value)}
                            placeholder="e.g. (407) 555-1234"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded bg-[#5579bd] text-white p-3 font-bold uppercase tracking-wider text-sm mt-2 hover:bg-[#171d52] transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Continue
                    </button>
                </form>
            </div>
        </main>
    )
}

export default function ConfirmNamePage() {
    return (
        <Suspense fallback={<div className="sase-login-page"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
            <ConfirmName />
        </Suspense>
    )
}
