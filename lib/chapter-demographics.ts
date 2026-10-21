import type { SupabaseClient } from "@supabase/supabase-js";
import { MEMBER_PROFILE_ROLES } from "@/lib/member-roles";
import { normalizeMajor } from "@/lib/majors";

export function queryMemberMajors(client: SupabaseClient, offset: number) {
  return client.from("profiles").select("major")
    .in("role", [...MEMBER_PROFILE_ROLES]).order("id").range(offset, offset + 999);
}

export function aggregateMemberMajors(rows: readonly { major: string | null }[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const major = normalizeMajor(row.major);
    if (major) counts.set(major, (counts.get(major) ?? 0) + 1);
  }
  const majors = [...counts].map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const named = majors.filter(major => major.name !== "Other");
  const visible = named.slice(0, 7);
  const other = named.slice(7).reduce((sum, major) => sum + major.value, counts.get("Other") ?? 0);
  if (other) visible.push({ name: "Other", value: other });
  return visible;
}
