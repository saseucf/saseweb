"use client"

import { FormEvent, Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import supabase from "@/lib/auth"

function ConfirmName() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = searchParams.get("redirect") || "/"

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [major, setMajor] = useState("")
    const [school, setSchool] = useState("")
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

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("first_name, last_name, major, school, phone_number, name_confirmed")
                .eq("id", user.id)
                .single()

            // Profile row missing — create a stub so the form can save.
            if (profileError?.code === "PGRST116") {
                const meta = user.user_metadata ?? {}
                let fn = ""
                let ln = ""
                if (meta.given_name) {
                    fn = meta.given_name
                    ln = meta.family_name ?? ""
                } else if (meta.first_name) {
                    fn = meta.first_name
                    ln = meta.last_name ?? ""
                } else {
                    const dn = meta.full_name || meta.name || meta.user_name || ""
                    const sp = dn.indexOf(" ")
                    if (sp > 0) { fn = dn.slice(0, sp); ln = dn.slice(sp + 1) }
                    else { fn = dn }
                }

                await supabase.from("profiles").insert({
                    id: user.id,
                    first_name: fn,
                    last_name: ln,
                    email: user.email ?? "",
                    major: "",
                    year: "",
                    school: "",
                    name_confirmed: false,
                })

                setFirstName(fn)
                setLastName(ln)
                setLoading(false)
                return
            }

            if (!profile || profile.name_confirmed) {
                router.replace(redirectUrl)
                return
            }

            setFirstName(profile.first_name || "")
            setLastName(profile.last_name || "")
            setMajor(profile.major || "")
            setSchool(profile.school || "")
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
        <main className="sase-login-page">
            <div className="sase-login-card p-8 md:p-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">Complete your profile</h1>
                    <p className="mt-2 text-sm">Confirm your info before continuing.</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-[#171d52]" htmlFor="firstName">
                                First name
                            </label>
                            <input
                                id="firstName"
                                className="w-full rounded border border-[#cbd5e8] p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                                value={firstName}
                                onChange={(event) => setFirstName(event.target.value)}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-[#171d52]" htmlFor="lastName">
                                Last name
                            </label>
                            <input
                                id="lastName"
                                className="w-full rounded border border-[#cbd5e8] p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                                value={lastName}
                                onChange={(event) => setLastName(event.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#171d52]" htmlFor="major">
                            Major
                        </label>
                        <input
                            id="major"
                            className="w-full rounded border border-[#cbd5e8] p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                            value={major}
                            onChange={(event) => setMajor(event.target.value)}
                            placeholder="e.g. Computer Science"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#171d52]" htmlFor="school">
                            School
                        </label>
                        <input
                            id="school"
                            className="w-full rounded border border-[#cbd5e8] p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                            value={school}
                            onChange={(event) => setSchool(event.target.value)}
                            placeholder="e.g. University of Central Florida"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#171d52]" htmlFor="phoneNumber">
                            Phone number
                        </label>
                        <input
                            id="phoneNumber"
                            type="tel"
                            className="w-full rounded border border-[#cbd5e8] p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
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
