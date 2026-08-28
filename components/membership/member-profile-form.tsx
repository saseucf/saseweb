"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import supabase from "@/lib/auth";

type MemberProfileFormProps = {
  profile: {
    email: string;
    firstName: string;
    lastName: string;
    major: string;
    phoneNumber: string;
    school: string;
    graduationYear: string;
  };
};

export default function MemberProfileForm({ profile }: MemberProfileFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [major, setMajor] = useState(profile.major);
  const [school, setSchool] = useState(profile.school);
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?redirect=/membership/profile");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          major: major.trim(),
          phone_number: phoneNumber.trim(),
          school: school.trim(),
          year: graduationYear.trim(),
        })
        .eq("id", user.id);

      if (updateError) {
        setError("Your profile could not be updated. Check your details and try again.");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Your profile could not be updated. Check your details and try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClassName =
    "min-h-11 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[#89abe3] focus:ring-2 focus:ring-[#89abe3]/35";

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error ? (
        <div className="flex gap-3 border border-destructive/35 bg-destructive/10 p-4 text-sm" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}

      {saved ? (
        <div className="flex gap-3 border border-emerald-500/35 bg-emerald-500/10 p-4 text-sm" role="status">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <p>Your profile has been updated.</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-bold" htmlFor="firstName">
          <span>First name</span>
          <input
            id="firstName"
            className={inputClassName}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            required
          />
        </label>

        <label className="space-y-2 text-sm font-bold" htmlFor="lastName">
          <span>Last name <span className="font-normal text-muted-foreground">(optional)</span></span>
          <input
            id="lastName"
            className={inputClassName}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
          />
        </label>
      </div>

      <label className="space-y-2 text-sm font-bold" htmlFor="email">
        <span>Email</span>
        <input id="email" className={`${inputClassName} cursor-not-allowed opacity-70`} value={profile.email} readOnly />
        <span className="block text-xs font-normal leading-relaxed text-muted-foreground">
          Your login email cannot be changed here.
        </span>
      </label>

      <label className="space-y-2 text-sm font-bold" htmlFor="phoneNumber">
        <span>Phone number <span className="font-normal text-muted-foreground">(optional)</span></span>
        <input
          id="phoneNumber"
          className={inputClassName}
          type="tel"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          autoComplete="tel"
          placeholder="(407) 555-0123"
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="space-y-2 text-sm font-bold" htmlFor="major">
          <span>Major</span>
          <input
            id="major"
            className={inputClassName}
            value={major}
            onChange={(event) => setMajor(event.target.value)}
            required
          />
        </label>

        <label className="space-y-2 text-sm font-bold" htmlFor="school">
          <span>School</span>
          <input
            id="school"
            className={inputClassName}
            value={school}
            onChange={(event) => setSchool(event.target.value)}
            required
          />
        </label>

        <label className="space-y-2 text-sm font-bold" htmlFor="graduationYear">
          <span>Graduation year</span>
          <input
            id="graduationYear"
            className={inputClassName}
            value={graduationYear}
            onChange={(event) => setGraduationYear(event.target.value)}
            inputMode="numeric"
            placeholder="2027"
            required
          />
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
        <Link href="/membership" className="sase-secondary-button !inline-flex min-h-11 items-center justify-center gap-2 px-5 dark:!border-[#89abe3]/60 dark:!text-[#e9e8e8] dark:hover:!bg-[#89abe3]/10">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to membership
        </Link>
        <button type="submit" className="sase-primary-button !inline-flex min-h-11 items-center justify-center gap-2 !text-[#141b4d] hover:!bg-[#dbc8b6]" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {saving ? "Saving..." : "Save details"}
        </button>
      </div>
    </form>
  );
}
