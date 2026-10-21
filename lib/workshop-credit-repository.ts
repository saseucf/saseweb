import type { SupabaseClient } from "@supabase/supabase-js";
import { awardWorkshopCredit, planWorkshopCredits, rosterClaimId, type CreditCandidate, type CreditProfile, type CreditClaim } from "./workshop-credit";
import { GITHUB_WORKSHOP, WORKSHOP_CREDIT_ENTRIES } from "./workshop-credit-roster";

export async function loadWorkshopCreditState(client: SupabaseClient) {
  const profiles: CreditProfile[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await client.from("profiles").select("id,first_name,last_name").order("id").range(offset, offset + 999);
    if (result.error) throw new Error("Could not load workshop members.");
    profiles.push(...result.data);
    if (result.data.length < 1000) break;
  }
  const logs = await client.from("admin_logs").select("id,actor_id,action,entity_id").in("id", WORKSHOP_CREDIT_ENTRIES.map(row => rosterClaimId(row.name, row.targetProfileId)));
  if (logs.error) throw new Error("Could not load workshop credit claims.");
  if (logs.data.some(row => row.action !== "workshop_roster_claim" || row.entity_id !== GITHUB_WORKSHOP.id)) throw new Error("Workshop credit claim requires review.");
  const claims: CreditClaim[] = logs.data.map(row => ({ id: row.id, profileId: row.actor_id }));
  return { profiles, claims, plan: planWorkshopCredits(profiles, claims) };
}

export function workshopCreditDependencies(client: SupabaseClient) {
  return {
    reserve: async (candidate: CreditCandidate) => {
      const inserted = await client.from("admin_logs").insert({
        id: candidate.claimId, actor_id: candidate.profileId,
        action: "workshop_roster_claim", entity_type: "events", entity_id: GITHUB_WORKSHOP.id,
        details: { source: "Officer-provided October 20 GitHub workshop roster", name: candidate.name, graduation_term: candidate.graduationTerm, major: candidate.major, points: GITHUB_WORKSHOP.points },
      });
      if (inserted.error && inserted.error.code !== "23505") throw new Error("Could not reserve workshop credit. Please retry.");
      // A pending ledger entry starts with no owner. PostgreSQL serializes this
      // conditional update, so only one matching account can reserve the debt.
      const reserved = await client.from("admin_logs").update({ actor_id: candidate.profileId })
        .eq("id", candidate.claimId).eq("action", "workshop_roster_claim").eq("entity_id", GITHUB_WORKSHOP.id).is("actor_id", null);
      if (reserved.error) throw new Error("Could not reserve workshop credit. Please retry.");
      const current = await client.from("admin_logs").select("actor_id,action,entity_id").eq("id", candidate.claimId).single();
      if (current.error || current.data.action !== "workshop_roster_claim" || current.data.entity_id !== GITHUB_WORKSHOP.id || !current.data.actor_id) throw new Error("Could not verify workshop credit ownership.");
      return { profileId: current.data.actor_id as string };
    },
    attend: async (candidate: CreditCandidate): Promise<"awarded" | "already_attended"> => {
      const attendance = await client.from("event_attendances").insert({
        id: candidate.claimId, event_id: GITHUB_WORKSHOP.id, user_id: candidate.profileId,
        checked_in_at: GITHUB_WORKSHOP.start,
      });
      if (!attendance.error) return "awarded";
      if (attendance.error.code !== "23505") throw new Error("Workshop credit is reserved, but attendance could not be recorded. Please retry.");
      const existing = await client.from("event_attendances").select("id").eq("event_id", GITHUB_WORKSHOP.id).eq("user_id", candidate.profileId).maybeSingle();
      if (existing.error || !existing.data) throw new Error("Workshop attendance conflict requires review.");
      return "already_attended";
    },
  };
}

export async function seedWorkshopCreditLedger(client: SupabaseClient) {
  const rows = WORKSHOP_CREDIT_ENTRIES.map(row => ({
    id: rosterClaimId(row.name, row.targetProfileId), actor_id: null,
    action: "workshop_roster_claim", entity_type: "events", entity_id: GITHUB_WORKSHOP.id,
    details: { source: "Officer-provided October 20 GitHub workshop roster", name: row.name, graduation_term: row.graduationTerm, major: row.major, points: GITHUB_WORKSHOP.points, ...(row.targetProfileId ? { authorized_account_id: row.targetProfileId } : {}) },
  }));
  const result = await client.from("admin_logs").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (result.error) throw new Error("Could not record pending workshop credits. No attendance credits have started.");
}

export async function validateWorkshopEvent(client: SupabaseClient) {
  const result = await client.from("events").select("id,points,start_time,status").eq("id", GITHUB_WORKSHOP.id).single();
  if (result.error || result.data.points !== GITHUB_WORKSHOP.points || Date.parse(result.data.start_time) !== Date.parse(GITHUB_WORKSHOP.start) || result.data.status === "cancelled") throw new Error("Workshop credit is awaiting event configuration.");
}

export async function claimMemberWorkshopCredit(client: SupabaseClient, profileId: string) {
  await validateWorkshopEvent(client);
  const state = await loadWorkshopCreditState(client);
  const candidate = state.plan.find(row => row.profileId === profileId);
  if (!candidate?.profileId) return { awarded: false, points: 0 };
  const result = await awardWorkshopCredit({ ...candidate, profileId: candidate.profileId }, workshopCreditDependencies(client));
  return { awarded: result === "awarded", points: result === "awarded" ? GITHUB_WORKSHOP.points : 0 };
}
