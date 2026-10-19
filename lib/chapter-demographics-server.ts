import "server-only";
import { createAdminSupabase } from "@/lib/supabase-server";
import { aggregateMemberMajors } from "@/lib/chapter-demographics";

export async function loadMemberMajorBreakdown() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { data: [], error: true };
  const client = createAdminSupabase();
  const majors: { major: string | null }[] = [];
  for (let offset = 0; ; offset += 1000) {
    // The browser receives only aggregate counts, never profiles or names.
    const { data, error } = await client.from("profiles").select("major").eq("role", "member").order("id").range(offset, offset + 999);
    if (error) return { data: [], error: true };
    majors.push(...data);
    if (data.length < 1000) break;
  }
  return { data: aggregateMemberMajors(majors), error: false };
}
