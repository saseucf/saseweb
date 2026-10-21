import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { awardWorkshopCredit } from "../lib/workshop-credit";
import { GITHUB_WORKSHOP } from "../lib/workshop-credit-roster";
import { loadWorkshopCreditState, seedWorkshopCreditLedger, validateWorkshopEvent, workshopCreditDependencies } from "../lib/workshop-credit-repository";

async function main() {
  config({ path: ".env.local", quiet: true });
  if (process.argv.slice(2).some(arg => arg !== "--apply")) throw new Error("Use no arguments for a read-only preview, or --apply to back up and apply credits.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is required.");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const state = await loadWorkshopCreditState(client);
  const eventResult = await client.from("events").select("*").eq("id", GITHUB_WORKSHOP.id).single();
  if (eventResult.error || eventResult.data.title !== GITHUB_WORKSHOP.title || eventResult.data.points !== GITHUB_WORKSHOP.points) throw new Error("The expected 30-point GitHub workshop could not be verified. Nothing was changed.");
  const attendance = await client.from("event_attendances").select("*").eq("event_id", GITHUB_WORKSHOP.id);
  if (attendance.error) throw new Error("Could not load existing workshop check-ins.");
  const preview = state.plan.map(row => ({ name: row.name, status: row.status, accountId: row.profileId, alreadyAttended: attendance.data.some(att => att.user_id === row.profileId) }));
  console.log(JSON.stringify({ mode: process.argv.includes("--apply") ? "apply" : "read-only", event: { id: eventResult.data.id, title: eventResult.data.title, currentStart: eventResult.data.start_time, correctedStart: GITHUB_WORKSHOP.start, points: GITHUB_WORKSHOP.points }, existingAttendances: attendance.data.length, roster: preview }, null, 2));
  if (!process.argv.includes("--apply")) return;

  const backupDirectory = join(process.cwd(), ".local-backups", `github-workshop-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  await mkdir(backupDirectory, { recursive: true });
  const counts: Record<string, number> = {};
  // Save every row of the four affected tables before the first live write.
  // This is a data snapshot, not a full PostgreSQL/schema/Auth backup.
  for (const table of ["profiles", "events", "event_attendances", "admin_logs"]) {
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await client.from(table).select("*").order("id").range(offset, offset + 999);
      if (page.error) throw new Error(`Backup of ${table} failed. Nothing was changed.`);
      rows.push(...page.data);
      if (page.data.length < 1000) break;
    }
    counts[table] = rows.length;
    await writeFile(join(backupDirectory, `${table}.json`), JSON.stringify(rows, null, 2), { flag: "wx" });
  }
  await writeFile(join(backupDirectory, "manifest.json"), JSON.stringify({ createdAt: new Date().toISOString(), project: new URL(url).hostname, counts, roster: preview, eventId: GITHUB_WORKSHOP.id }, null, 2), { flag: "wx" });
  console.log(`Pre-change backup saved: ${backupDirectory}`);

  const eventUpdate = { start_time: GITHUB_WORKSHOP.start, end_time: GITHUB_WORKSHOP.end, location: GITHUB_WORKSHOP.location };
  const changed = await client.from("events").update(eventUpdate).eq("id", GITHUB_WORKSHOP.id).eq("points", GITHUB_WORKSHOP.points).eq("start_time", eventResult.data.start_time).select("id").single();
  if (changed.error) throw new Error("The event could not be corrected, or changed during recovery. No attendance credits were applied.");
  const log = await client.from("admin_logs").insert({ actor_id: null, action: "update", entity_type: "events", entity_id: GITHUB_WORKSHOP.id, details: { source: "User-authorized October 20 GitHub workshop recovery", before: { start_time: eventResult.data.start_time, end_time: eventResult.data.end_time, location: eventResult.data.location }, after: eventUpdate } });
  if (log.error) throw new Error("The event was corrected, but its audit entry could not be saved. Credits have not started; rerun after checking audit logging.");
  await validateWorkshopEvent(client);
  await seedWorkshopCreditLedger(client);
  const current = await loadWorkshopCreditState(client);
  const results: Record<string, unknown>[] = [];
  for (const candidate of current.plan) {
    if (!candidate.profileId) { results.push({ name: candidate.name, status: candidate.status }); continue; }
    const before = await client.from("profiles").select("total_points").eq("id", candidate.profileId).single();
    if (before.error) throw new Error("Could not read the member's points before crediting attendance.");
    const status = await awardWorkshopCredit({ ...candidate, profileId: candidate.profileId }, workshopCreditDependencies(client));
    const after = await client.from("profiles").select("total_points").eq("id", candidate.profileId).single();
    if (after.error) throw new Error("Could not verify the member's points after crediting attendance.");
    const delta = after.data.total_points - before.data.total_points;
    results.push({ name: candidate.name, profileId: candidate.profileId, status, pointsBefore: before.data.total_points, pointsAfter: after.data.total_points, pointsAdded: delta });
    await writeFile(join(backupDirectory, "recovery-results.json"), JSON.stringify(results, null, 2));
    if (delta !== (status === "awarded" ? GITHUB_WORKSHOP.points : 0)) throw new Error("Points verification differed from the expected award. Stopped further awards; inspect recovery-results.json before proceeding.");
  }
  await writeFile(join(backupDirectory, "recovery-results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ backupDirectory, awarded: results.filter(row => row.status === "awarded").length, alreadyAttended: results.filter(row => row.status === "already_attended").length, pending: results.filter(row => row.status === "pending").map(row => row.name), review: results.filter(row => row.status === "review" || row.status === "claimed_elsewhere").map(row => row.name) }, null, 2));
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Workshop recovery failed."); process.exitCode = 1; });
