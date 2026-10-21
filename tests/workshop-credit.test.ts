import assert from "node:assert/strict";
import test from "node:test";
import { awardWorkshopCredit, normalizedRosterName, planWorkshopCredits, rosterClaimId, type CreditCandidate } from "../lib/workshop-credit";
import { GITHUB_WORKSHOP_ROSTER, WORKSHOP_CREDIT_ENTRIES } from "../lib/workshop-credit-roster";

const kayla = { id: "kayla-account", first_name: " Kayla ", last_name: "TRAN" };

test("source roster preserves 25 people, graduation terms, and the supplied major counts", () => {
  assert.equal(GITHUB_WORKSHOP_ROSTER.length, 25);
  const counts: Record<string, number> = {};
  for (const [, term, major] of GITHUB_WORKSHOP_ROSTER) {
    assert.match(term, /^(Spring|Summer|Fall) 20\d\d$/);
    counts[major] = (counts[major] ?? 0) + 1;
  }
  assert.deepEqual(counts, { "Computer Science": 18, "Computer Engineering": 5, "Information Technology": 2 });
  assert.equal(WORKSHOP_CREDIT_ENTRIES.length, 26, "only the explicitly approved second Kevin account adds a claim");
});

test("matching uses full names, tolerating only capitalization, spacing, and accents", () => {
  assert.equal(normalizedRosterName("  José   Costas "), "jose costas");
  const plan = planWorkshopCredits([kayla, { id: "jose", first_name: "Jose", last_name: "Costas" }, { id: "first-only", first_name: "Abhinav", last_name: "Different" }], []);
  assert.equal(plan.find(row => row.name === "Kayla Tran")?.profileId, kayla.id);
  assert.equal(plan.find(row => row.name === "José Costas")?.profileId, "jose");
  assert.equal(plan.find(row => row.name === "Abhinav Vargheese")?.status, "pending");
  const ambiguous = planWorkshopCredits([kayla, { ...kayla, id: "duplicate" }], []);
  assert.equal(ambiguous.find(row => row.name === "Kayla Tran")?.status, "review");
  assert.equal(ambiguous.find(row => row.name === "Kayla Tran")?.profileId, null);
});

test("a pending ledger entry is claimable after registration and an owned entry survives a name change", () => {
  const id = rosterClaimId("Kayla Tran");
  assert.equal(planWorkshopCredits([], [{ id, profileId: null }]).find(row => row.claimId === id)?.status, "pending");
  assert.equal(planWorkshopCredits([kayla], [{ id, profileId: null }]).find(row => row.claimId === id)?.profileId, kayla.id);
  const reserved = planWorkshopCredits([{ ...kayla, first_name: "Changed" }, { ...kayla, id: "later-account" }], [{ id, profileId: kayla.id }]).find(row => row.claimId === id);
  assert.equal(reserved?.profileId, kayla.id);
});

test("only the two explicitly approved Kevin accounts receive separate claims", () => {
  const profiles = ["61b9652f-4192-41bb-8d05-cafea3e4d55b", "4fd99dcc-95b2-4041-ad88-b55793c2f9e9", "third-kevin"].map(id => ({ id, first_name: "Kevin", last_name: "Li" }));
  const candidates = planWorkshopCredits(profiles, []).filter(row => row.name === "Kevin Li");
  assert.equal(candidates.length, 2);
  assert.deepEqual(candidates.map(row => row.profileId).sort(), profiles.slice(0, 2).map(row => row.id).sort());
  assert.equal(new Set(candidates.map(row => row.claimId)).size, 2);
  assert.equal(rosterClaimId("JOSÉ Costas"), rosterClaimId("Jose Costas"));
});

test("a lost reservation race never creates attendance for another account", async () => {
  let attempts = 0;
  const candidate: CreditCandidate = { claimId: rosterClaimId("Kayla Tran"), profileId: kayla.id, name: "Kayla Tran", graduationTerm: "Spring 2030", major: "Computer Science" };
  const result = await awardWorkshopCredit(candidate, {
    reserve: async () => ({ profileId: "already-claimed-account" }),
    attend: async () => { attempts++; return "awarded"; },
  });
  assert.equal(result, "claimed_elsewhere");
  assert.equal(attempts, 0);
});

test("failed attendance retains its reservation and a retry or existing check-in cannot double award", async () => {
  const candidate: CreditCandidate = { claimId: rosterClaimId("Kayla Tran"), profileId: kayla.id, name: "Kayla Tran", graduationTerm: "Spring 2030", major: "Computer Science" };
  let owner: string | null = null;
  let attended = false;
  let failOnce = true;
  let points = 0;
  const dependencies = {
    reserve: async (row: CreditCandidate) => { owner ??= row.profileId; return { profileId: owner }; },
    attend: async (): Promise<"awarded" | "already_attended"> => {
      if (failOnce) { failOnce = false; throw new Error("Temporary database failure"); }
      if (attended) return "already_attended";
      attended = true; points += 30; return "awarded";
    },
  };
  await assert.rejects(awardWorkshopCredit(candidate, dependencies), /Temporary database failure/);
  assert.equal(owner, kayla.id);
  assert.equal(points, 0);
  assert.equal(await awardWorkshopCredit(candidate, dependencies), "awarded");
  assert.equal(await awardWorkshopCredit(candidate, dependencies), "already_attended");
  assert.equal(points, 30);
});
