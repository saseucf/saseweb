import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import MemberQr from "@/components/membership/member-qr";
import { getMemberNames } from "@/lib/member-names";
import { getMembershipCheckoutConfiguration } from "@/lib/membership-checkout";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export default async function MembershipPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/membership");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone_number, paid_member, total_points")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return (
      <main className="sase-page" style={{ paddingTop: "120px" }}>
        <div className="sase-page-header">
          <h1>Membership dues</h1>
        </div>
        <section className="sase-content-section flex items-start gap-4 border border-destructive/35 bg-destructive/10 p-5" role="alert">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <h2 className="font-bold">Membership status unavailable</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Your profile could not be loaded. Refresh the page or try again later.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const checkout = getMembershipCheckoutConfiguration({
    checkoutUrl: process.env.NEXT_PUBLIC_ZEFFY_MEMBERSHIP_URL,
    membershipPeriod: process.env.MEMBERSHIP_PERIOD,
    amountCents: process.env.ZEFFY_EXPECTED_AMOUNT_CENTS,
    currency: process.env.ZEFFY_EXPECTED_CURRENCY,
  });
  const { displayName, greetingName } = getMemberNames(profile);
  const membershipPeriod = checkout.ok
    ? checkout.configuration.membershipPeriod
    : process.env.MEMBERSHIP_PERIOD?.trim() || "Current school year";
  const totalPoints = profile.total_points ?? 0;

  return (
    <main className="sase-page" style={{ paddingTop: "120px" }}>
      <div className="sase-page-header">
        <h1>Hi, {greetingName}</h1>
      </div>

      <section
        className="sase-content-section border border-[#dbc8b6]/55 bg-card px-5 py-7 sm:px-8 sm:py-9"
        aria-labelledby="membership-status-heading"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex items-center gap-4">
            {profile.paid_member ? (
              <span className="grid size-11 shrink-0 place-items-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-6" aria-hidden="true" />
              </span>
            ) : null}
            <h2 id="membership-status-heading" className="text-2xl font-black tracking-tight">
              {profile.paid_member ? "Dues paid" : "Unpaid dues"}
            </h2>
          </div>

          {!profile.paid_member ? (
            checkout.ok ? (
              <div className="border-t border-border pt-6 lg:min-w-[260px] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <p className="text-base font-bold text-muted-foreground">
                  {checkout.configuration.membershipPeriod} / {checkout.configuration.currency}
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight">
                  {formatMoney(checkout.configuration.amountCents, checkout.configuration.currency)}
                </p>
                <a
                  href={checkout.configuration.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="sase-primary-button mt-5 !inline-flex min-h-11 w-full items-center justify-center gap-2 !text-[#141b4d] hover:!bg-[#dbc8b6]"
                >
                  Pay {formatMoney(checkout.configuration.amountCents, checkout.configuration.currency)} dues
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              </div>
            ) : (
              <div className="flex max-w-sm gap-3 border border-destructive/35 bg-destructive/10 p-4" role="alert">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold">Checkout is temporarily unavailable</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Please contact a UCF SASE officer before submitting dues.
                  </p>
                </div>
              </div>
            )
          ) : (
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {membershipPeriod}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto mt-6 grid w-full max-w-[1180px] gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
        <section className="order-2 border border-border bg-card p-5 sm:p-8 lg:order-1 lg:row-span-2" aria-labelledby="member-qr-heading">
          <h2 id="member-qr-heading" className="text-2xl font-black tracking-tight">
            Your member QR
          </h2>
          <div className="mt-6 flex justify-center lg:justify-start">
            <div className="w-full max-w-[300px] bg-[#f6f8fc] p-4">
              <MemberQr displayName={displayName} userId={user.id} />
            </div>
          </div>
        </section>

        <section className="order-1 border border-border bg-card p-5 sm:p-7 lg:order-2" aria-labelledby="member-points-heading">
          <div className="flex items-center justify-between gap-5">
            <h2 id="member-points-heading" className="text-xl font-black tracking-tight">
              Total points
            </h2>
            <div className="flex items-center gap-3" aria-label={`${totalPoints} total points`}>
              <Trophy className="size-5 text-[#4266a4] dark:text-[#89abe3]" aria-hidden="true" />
              <span className="font-mono text-4xl font-black tabular-nums">{totalPoints}</span>
            </div>
          </div>
        </section>

        <section className="order-3 border border-border bg-card p-5 sm:p-7" aria-labelledby="member-forms-heading">
          <h2 id="member-forms-heading" className="text-xl font-black tracking-tight">
            Forms
          </h2>
          <Link href="/forms" className="sase-secondary-button mt-6 !inline-flex min-h-11 w-full items-center justify-center gap-2 dark:!border-[#89abe3]/60 dark:!text-[#e9e8e8] dark:hover:!bg-[#89abe3]/10">
            Open forms
          </Link>
        </section>
      </div>

      <section className="mx-auto mt-6 max-w-[1180px] border border-border bg-card p-5 sm:p-8" aria-labelledby="member-details-heading">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="member-details-heading" className="text-xl font-black tracking-tight">
              Member details
            </h2>
            <dl className="mt-5 grid gap-5 md:grid-cols-2 md:gap-x-12">
              <div className="min-w-0">
                <dt className="text-sm font-bold">Email</dt>
                <dd className="mt-1 break-all text-base text-muted-foreground">{profile.email || "Not added"}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold">Phone</dt>
                <dd className={`mt-1 text-base text-muted-foreground ${profile.phone_number ? "font-mono" : ""}`}>
                  {profile.phone_number || "Not added"}
                </dd>
              </div>
            </dl>
          </div>
          <Link href="/membership/profile" className="sase-secondary-button !inline-flex min-h-11 shrink-0 items-center justify-center px-5 dark:!border-[#89abe3]/60 dark:!text-[#e9e8e8] dark:hover:!bg-[#89abe3]/10">
            Update details
          </Link>
        </div>
      </section>
    </main>
  );
}
