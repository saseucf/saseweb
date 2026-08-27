import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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
    .select("first_name, last_name, email, phone_number, paid_member")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return (
      <main className="sase-page pt-[120px]">
        <div className="sase-page-header">
          <p className="sase-eyebrow">UCF SASE / Membership</p>
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
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");

  return (
    <main className="sase-page pt-[120px]">
      <div className="sase-page-header">
        <p className="sase-eyebrow">UCF SASE / Membership</p>
        <h1>Membership dues</h1>
        <p>Complete annual dues through Zeffy, then an officer will confirm your membership.</p>
      </div>

      <section className="sase-content-section overflow-hidden border border-border bg-card shadow-[0_12px_30px_rgba(23,29,82,0.06)]" aria-labelledby="membership-status-heading">
        <div className="grid gap-0 lg:grid-cols-[1fr_0.8fr]">
          <div className="px-5 py-7 sm:px-8 sm:py-9">
            <div className="flex items-start gap-4">
              <span className={`grid size-11 shrink-0 place-items-center ${profile.paid_member ? "bg-emerald-500/10 text-emerald-600" : "bg-[#89abe3]/15 text-[#5579bd]"}`}>
                {profile.paid_member ? (
                  <CheckCircle2 className="size-6" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="size-6" aria-hidden="true" />
                )}
              </span>
              <div>
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#89abe3]">
                  Current status
                </p>
                <h2 id="membership-status-heading" className="mt-2 text-2xl font-black tracking-tight">
                  {profile.paid_member ? "Payment confirmed" : "No payment confirmed yet"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {profile.paid_member
                    ? "Your account is marked as a paid UCF SASE member."
                    : "After you pay, an officer will match the Zeffy payment to your account. Your status may not update immediately."}
                </p>
              </div>
            </div>

            {!profile.paid_member ? (
              <ol className="mt-8 divide-y divide-border border-y border-border">
                <li className="grid gap-2 py-4 sm:grid-cols-[32px_1fr]">
                  <span className="font-mono text-sm font-bold text-[#89abe3]">01</span>
                  <span>
                    <strong className="block text-sm">Check your contact details</strong>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      Use the same email and phone number in Zeffy so an officer can identify your payment.
                    </span>
                  </span>
                </li>
                <li className="grid gap-2 py-4 sm:grid-cols-[32px_1fr]">
                  <span className="font-mono text-sm font-bold text-[#89abe3]">02</span>
                  <span>
                    <strong className="block text-sm">Complete the hosted Zeffy form</strong>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      Zeffy handles the payment on its secure website. Keep your receipt for reference.
                    </span>
                  </span>
                </li>
                <li className="grid gap-2 py-4 sm:grid-cols-[32px_1fr]">
                  <span className="font-mono text-sm font-bold text-[#89abe3]">03</span>
                  <span>
                    <strong className="block text-sm">Wait for confirmation</strong>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      An officer reviews unmatched payments and updates the membership status shown here.
                    </span>
                  </span>
                </li>
              </ol>
            ) : null}
          </div>

          <aside className="border-t border-border bg-muted/35 px-5 py-7 sm:px-8 sm:py-9 lg:border-l lg:border-t-0" aria-label="Membership details">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
              Member information
            </p>
            <p className="mt-3 text-xl font-black tracking-tight">{displayName}</p>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-[#89abe3]" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="sr-only">Email</dt>
                  <dd className="break-all">{profile.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-[#89abe3]" aria-hidden="true" />
                <div>
                  <dt className="sr-only">Phone number</dt>
                  <dd className="font-mono">{profile.phone_number || "No phone number saved"}</dd>
                </div>
              </div>
            </dl>

            {!profile.phone_number ? (
              <div className="mt-5 flex gap-3 border border-amber-500/35 bg-amber-500/10 p-4 text-sm">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
                <p className="leading-relaxed">
                  Add a phone number before paying to make manual matching easier.{" "}
                  <Link href="/confirm-name?redirect=/membership" className="font-bold text-[#5579bd] underline underline-offset-2">
                    Update details
                  </Link>
                </p>
              </div>
            ) : null}

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
                    Pay membership dues
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Opens the official UCF SASE form on Zeffy.
                  </p>
                </div>
              ) : (
                <div className="mt-8 flex gap-3 border border-destructive/35 bg-destructive/10 p-4" role="alert">
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
          </aside>
        </div>
      </section>
    </main>
  );
}
