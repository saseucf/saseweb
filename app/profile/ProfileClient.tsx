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
    CalendarCheck,
    Award,
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";
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
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    major: string;
    school: string;
    year: string;
    paid_member: boolean;
    role: string;
    wants_email_notifications: boolean;
};

type AttendedEvent = {
    event_id: string;
    events: {
        id: string;
        title: string;
        start_time: string;
        event_type: string;
        points: number;
    } | null;
};

const getEventTypeColor = (type: string) => {
    switch (type) {
        case "Workshop":
            return "bg-purple-100 text-purple-700 border-purple-200";
        case "Social":
            return "bg-pink-100 text-pink-700 border-pink-200";
        case "General Body Meeting":
            return "bg-blue-100 text-blue-700 border-blue-200";
        case "Fundraiser":
            return "bg-emerald-100 text-emerald-700 border-emerald-200";
        default:
            return "bg-gray-100 text-gray-700 border-gray-200";
    }
};

export default function ProfileClient({ initialProfile, checkout, initialAttendances }: { initialProfile: ProfileData, checkout: MembershipCheckoutConfigurationResult, initialAttendances: AttendedEvent[] }) {
    const router = useRouter();
    const [profile, setProfile] = useState(initialProfile);
    const [firstName, setFirstName] = useState(initialProfile.first_name || "");
    const [lastName, setLastName] = useState(initialProfile.last_name || "");
    const [major, setMajor] = useState(initialProfile.major || "");
    const [school, setSchool] = useState(initialProfile.school || "");
    const [graduationYear, setGraduationYear] = useState(initialProfile.year || "");
    const [phoneNumber, setPhoneNumber] = useState(initialProfile.phone_number || "");
    const [wantsEmail, setWantsEmail] = useState(initialProfile.wants_email_notifications ?? true);
    
    const [saving, setSaving] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
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
            wants_email_notifications: wantsEmail,
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

    const handleVerify = async () => {
        setIsVerifying(true);
        try {
            // 1. Ask the server to fetch Zeffy payments and auto-match if possible
            const res = await fetch("/api/membership/verify-payment", { method: "POST" });
            const resultData = await res.json();
            
            if (res.ok && resultData.success) {
                setProfile({ ...profile, paid_member: true });
                toast.success("Payment verified! You are now a paid member.");
                return;
            }

            // 2. If it didn't auto-match (or API failed), do a manual check in case admin already matched it
            const { data, error } = await supabase
                .from("profiles")
                .select("paid_member")
                .eq("id", profile.id)
                .single();

            if (error) throw error;

            if (data?.paid_member) {
                setProfile({ ...profile, paid_member: true });
                toast.success("Payment verified! You are now a paid member.");
            } else {
                toast.error("Payment not found yet. An officer may still need to review it.");
            }
        } catch {
            toast.error("Failed to verify payment status.");
        } finally {
            setIsVerifying(false);
        }
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

                        <div className="flex flex-col gap-1 border-t border-border pt-4 mt-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={wantsEmail}
                                        onChange={(e) => setWantsEmail(e.target.checked)}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${wantsEmail ? 'bg-[#5579bd]' : 'bg-gray-300'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${wantsEmail ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-[#171d52] dark:text-gray-200 block">Email Notifications</span>
                                    <span className="text-xs text-muted-foreground">Receive confirmation emails when you RSVP</span>
                                </div>
                            </label>
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
                                    <button
                                        onClick={handleVerify}
                                        disabled={isVerifying}
                                        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded bg-yellow-400 font-bold uppercase tracking-wider text-[#141b4d] transition-colors hover:bg-yellow-500 disabled:opacity-50"
                                    >
                                        {isVerifying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                                        Verify Payment
                                    </button>
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
                    </div>
                </section>

                {/* Event History Section */}
                <section className="sase-content-section border border-border bg-card shadow-[0_12px_30px_rgba(23,29,82,0.06)] rounded-xl lg:col-span-2">
                    <div className="p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <CalendarCheck className="w-6 h-6 text-[#4266a4]" />
                            <h2 className="text-xl font-bold tracking-tight">Event History</h2>
                        </div>

                        {initialAttendances.length === 0 ? (
                            <div className="text-center py-10 bg-muted/30 rounded-lg border border-border border-dashed">
                                <p className="text-muted-foreground font-medium">You haven&apos;t checked into any events yet.</p>
                                <p className="text-sm text-muted-foreground mt-1">Attend a workshop or GBM and check-in to start earning points!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {initialAttendances
                                    .filter(a => a.events)
                                    .sort((a, b) => new Date(b.events!.start_time).getTime() - new Date(a.events!.start_time).getTime())
                                    .map((attendance) => {
                                        const event = attendance.events!;
                                        return (
                                            <div key={event.id} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-background hover:border-[#89abe3] transition-colors group">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getEventTypeColor(event.event_type)}`}>
                                                            {event.event_type}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-[#171d52] truncate group-hover:text-[#5579bd] transition-colors">{event.title}</h3>
                                                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                                                        {new Date(event.start_time).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-center justify-center min-w-[3rem] p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                                    <Award className="w-4 h-4 text-yellow-600 mb-0.5" />
                                                    <span className="text-xs font-bold text-yellow-700">+{event.points}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
