import { createServerSupabase } from "@/lib/supabase-server";

export async function getAdminHackathons() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("hackathons").select("id,name").order("name");
  if (error) throw new Error("Could not load hackathons. Check that the migration has been applied.");
  return data ?? [];
}
