"use client";

import { useState } from "react";
import Link from "next/link";
import {
    AlertCircle,
    CheckCircle2,
    ExternalLink,
    Mail,
    Phone,
    ShieldCheck,
    Loader2,
    FileText,
} from "lucide-react";
import supabase from "@/lib/auth";
import { useRouter } from "next/navigation";
import type { MembershipCheckoutConfigurationResult } from "@/lib/membership-checkout";

function formatMoney(cents: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(cents / 100);
}

type ProfileData = {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    major: string;
    school: string;
    year: string;
    paid_member: boolean;
    role: string;
};

export default function ProfileClient({ initialProfile, checkout }: { initialProfile: ProfileData, checkout: MembershipCheckoutConfigurationResult }) {
    const router = useRouter();
    const [profile, setProfile] = useState(initialProfile);
    const [firstName, setFirstName] = useState(initialProfile.first_name || "");
    const [lastName, setLastName] = useState(initialProfile.last_name || "");
    const [major, setMajor] = useState(initialProfile.major || "");
    const [school, setSchool] = useState(initialProfile.school || "");
    const [graduationYear, setGraduationYear] = useState(initialProfile.year || "");
    const [phoneNumber, setPhoneNumber] = useState(initialProfile.phone_number || "");
    
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setSaving(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/login");
            return;
        }

        const updates = {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            major: major.trim(),
            school: school.trim(),
            year: graduationYear.trim(),
            phone_number: phoneNumber.trim(),
        };

        const { error: updateError } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id);

        if (updateError) {
            setError(updateError.message);
        } else {
            setSuccessMessage("Profile updated successfully!");
            setProfile({ ...profile, ...updates });
        }
        setSaving(false);
    };

    return (
        <main className="sase-page pt-[120px] sase-member-page">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                <div className="sase-page-header !mb-0">
                    <p className="sase-eyebrow !text-[#4266a4] dark:!text-[#89abe3]">UCF SASE / Profile</p>
                    <h1 className="!mb-2">Member Profile</h1>
                    <p className="text-gray-600 max-w-xl dark:text-gray-300">Manage your personal information and view your membership status.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Link href="/forms" className="sase-primary-button flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Browse Forms & RSVPs
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Profile Editor */}
                <section className="sase-content-section border border-border bg-card shadow-sm rounded-xl p-6 sm:p-8">
                    <h2 className="text-xl font-bold mb-6 tracking-tight">Personal Information</h2>
                    
                    <form className="space-y-5" onSubmit={handleSaveProfile}>
                        {error && (
                            <div className="p-3 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-3 text-sm text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
                                {successMessage}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="firstName">
                                    First name
                                </label>
                                <input
                                    id="firstName"
                                    className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="lastName">
                                    Last name
                                </label>
                                <input
                                    id="lastName"
                                    className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
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
                                className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                                value={major}
                                onChange={(e) => setMajor(e.target.value)}
                                placeholder="e.g. Computer Science"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="school">
                                    School
                                </label>
                                <input
                                    id="school"
                                    className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                                    value={school}
                                    onChange={(e) => setSchool(e.target.value)}
                                    placeholder="e.g. UCF"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="graduationYear">
                                    Graduation Year
                                </label>
                                <input
                                    id="graduationYear"
                                    className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                                    value={graduationYear}
                                    onChange={(e) => setGraduationYear(e.target.value)}
                                    placeholder="e.g. 2027"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-[#171d52] dark:text-gray-200" htmlFor="phoneNumber">
                                Phone number <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
                            </label>
                            <input
                                id="phoneNumber"
                                type="tel"
                                className="w-full rounded border border-[#cbd5e8] bg-transparent p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="e.g. (407) 555-1234"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded bg-[#5579bd] text-white p-3 font-bold uppercase tracking-wider text-sm mt-4 hover:bg-[#171d52] transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </button>
                    </form>
                </section>

                {/* Membership Status */}
                <section className="sase-content-section overflow-hidden border border-border bg-card shadow-[0_12px_30px_rgba(23,29,82,0.06)] animate-in fade-in !p-0" aria-labelledby="membership-status-heading">
                    <div className="px-5 py-7 sm:px-8 sm:py-9">
                        <div className="flex items-start gap-4">
                            <span className={`grid size-11 shrink-0 place-items-center rounded-full ${profile.paid_member ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-[#89abe3]/15 text-[#4266a4] dark:text-[#89abe3]"}`}>
                                {profile.paid_member ? (
                                    <CheckCircle2 className="size-6" aria-hidden="true" />
                                ) : (
                                    <ShieldCheck className="size-6" aria-hidden="true" />
                                )}
                            </span>
                            <div>
                                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#4266a4] dark:text-[#89abe3]">
                                    Membership Status
                                </p>
                                <h2 id="membership-status-heading" className="mt-2 text-2xl font-black tracking-tight">
                                    {profile.paid_member ? "Payment Confirmed" : "Not a Paid Member"}
                                </h2>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    {profile.paid_member
                                        ? "Your account is marked as a paid UCF SASE member."
                                        : "After you pay via Zeffy, an officer will match the payment to your account."}
                                </p>
                            </div>
                        </div>

                        {!profile.paid_member ? (
                            checkout.ok ? (
                                <div className="mt-8 border-t border-border pt-6">
                                    <p className="font-mono text-xs font-semibold text-muted-foreground">
                                        {checkout.configuration.membershipPeriod} / {checkout.configuration.currency}
                                    </p>
                                    <p className="mt-1 text-3xl font-black tracking-tight">
                                        {formatMoney(checkout.configuration.amountCents, checkout.configuration.currency)}
                                    </p>
                                    <a
                                        href={checkout.configuration.checkoutUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="sase-primary-button mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 !text-[#141b4d]"
                                    >
                                        Pay Membership Dues
                                        <ExternalLink className="size-4" aria-hidden="true" />
                                    </a>
                                </div>
                            ) : (
                                <div className="mt-8 flex gap-3 border border-destructive/35 bg-destructive/10 p-4 rounded-lg" role="alert">
                                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                                    <div>
                                        <p className="text-sm font-bold">Checkout is temporarily unavailable</p>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            Please contact a UCF SASE officer before submitting dues.
                                        </p>
                                    </div>
                                </div>
                            )
                        ) : null}

                        <div className="mt-8 border-t border-border pt-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Membership Info</h3>
                            <dl className="space-y-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <Mail className="mt-0.5 size-4 shrink-0 text-[#4266a4] dark:text-[#89abe3]" aria-hidden="true" />
                                    <div className="min-w-0">
                                        <dt className="sr-only">Email</dt>
                                        <dd className="break-all">{profile.email}</dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="mt-0.5 size-4 shrink-0 text-[#4266a4] dark:text-[#89abe3]" aria-hidden="true" />
                                    <div>
                                        <dt className="sr-only">Phone number</dt>
                                        <dd className="font-mono">{profile.phone_number || "No phone number saved"}</dd>
                                    </div>
                                </div>
                            </dl>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
