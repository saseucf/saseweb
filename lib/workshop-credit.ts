import { createHash } from "node:crypto";
import { GITHUB_WORKSHOP, WORKSHOP_CREDIT_ENTRIES } from "./workshop-credit-roster";

export type CreditProfile = { id: string; first_name: string | null; last_name: string | null };
export type CreditClaim = { id: string; profileId: string | null };
export type CreditCandidate = { claimId: string; profileId: string; name: string; graduationTerm: string; major: string };

export function normalizedRosterName(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function rosterClaimId(name: string, targetProfileId?: string | null) {
  const hex = createHash("sha256").update(`workshop-credit:v1:${GITHUB_WORKSHOP.id}:${normalizedRosterName(name)}${targetProfileId ? `:${targetProfileId}` : ""}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16], 16) & 3) | 8).toString(16);
  const id = hex.join("");
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

export function planWorkshopCredits(profiles: CreditProfile[], claims: CreditClaim[]) {
  return WORKSHOP_CREDIT_ENTRIES.map(({ name, graduationTerm, major, targetProfileId }) => {
    const claimId = rosterClaimId(name, targetProfileId);
    const claim = claims.find(row => row.id === claimId);
    const matches = profiles.filter(profile => targetProfileId ? profile.id === targetProfileId : normalizedRosterName(`${profile.first_name ?? ""} ${profile.last_name ?? ""}`) === normalizedRosterName(name));
    const profileId = claim?.profileId ?? (matches.length === 1 ? matches[0].id : null);
    const reservedElsewhere = profileId && claims.some(row => row.profileId === profileId && row.id !== claimId);
    return { claimId, name, graduationTerm, major, profileId: reservedElsewhere ? null : profileId, status: claim?.profileId ? "reserved" : reservedElsewhere || matches.length > 1 ? "review" : matches.length === 1 ? "matched" : "pending" };
  });
}

export async function awardWorkshopCredit(candidate: CreditCandidate, dependencies: {
  reserve: (candidate: CreditCandidate) => Promise<{ profileId: string }>;
  attend: (candidate: CreditCandidate) => Promise<"awarded" | "already_attended">;
}) {
  const reservation = await dependencies.reserve(candidate);
  if (reservation.profileId !== candidate.profileId) return "claimed_elsewhere" as const;
  // The database attendance trigger awards points in the same transaction as
  // this insert. Its unique (event_id,user_id) constraint prevents double points.
  return dependencies.attend(candidate);
}
