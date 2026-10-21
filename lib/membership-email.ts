import { paymentEligibility, type MembershipConfiguration } from "@/lib/admin-membership-core";
import type { ZeffyPayment } from "@/lib/zeffy-core";

export type EmailMember = { id: string; email: string | null; paid_member: boolean };
export type EmailPaymentMatch = { provider_payment_id: string; profile_id: string; membership_period: string; unlinked_at: string | null };
export const normalizedEmail = (email: string | null | undefined) => email?.trim().toLowerCase() ?? "";

export function planEmailMembershipMatches(payments: ZeffyPayment[], members: EmailMember[], history: EmailPaymentMatch[], configuration: MembershipConfiguration) {
  const claimedProfiles = new Set<string>();
  const assignments: { payment: ZeffyPayment; member: EmailMember; existing: boolean }[] = [];
  const sorted = [...payments].sort((a, b) => Number(history.some(m => m.provider_payment_id === b.id && !m.unlinked_at)) - Number(history.some(m => m.provider_payment_id === a.id && !m.unlinked_at)) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  for (const payment of sorted) {
    if (paymentEligibility(payment, configuration)) continue;
    const email = normalizedEmail(payment.buyer.email);
    if (!email) continue;
    const candidates = members.filter(member => normalizedEmail(member.email) === email);
    if (candidates.length !== 1) continue;
    const member = candidates[0];
    if (member.paid_member || claimedProfiles.has(member.id)) continue;
    const previous = history.filter(match => match.provider_payment_id === payment.id);
    const active = previous.find(match => !match.unlinked_at);
    if (active) {
      if (active.profile_id !== member.id || active.membership_period !== configuration.membershipPeriod) continue;
    } else {
      // Preserve an officer's explicit unlink and existing period assignments.
      if (previous.length || history.some(match => !match.unlinked_at && match.profile_id === member.id && match.membership_period === configuration.membershipPeriod)) continue;
    }
    assignments.push({ payment, member, existing: !!active });
    claimedProfiles.add(member.id);
  }
  return assignments;
}
