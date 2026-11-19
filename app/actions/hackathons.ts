"use server";

import { revalidatePath } from "next/cache";
import { getAdminAuthorization } from "@/lib/admin-membership";
import { createServerSupabase } from "@/lib/supabase-server";
import { parseHackathonInput } from "@/lib/hackathon-input";

export async function saveHackathon(input: unknown, id?: string) {
  try {
    const authorization = await getAdminAuthorization();
    if (authorization.status !== "authorized") return { error: "Administrator access is required." };
    if (id !== undefined && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))
      return { error: "Invalid hackathon ID." };
    const fields = parseHackathonInput(input);
    // Use the administrator's session; database RLS also enforces admin access.
    const supabase = createServerSupabase();
    const query = id ? supabase.from("hackathons").update(fields).eq("id", id)
      : supabase.from("hackathons").insert(fields);
    const { error } = await query.select("id").single();
    if (error) return { error: error.code === "23505" ? "That slug is already in use. Choose another." : "Could not save the hackathon. Check access and that the migration is applied." };
    revalidatePath("/admin/hackathons");
    revalidatePath("/admin/events", "layout");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save the hackathon." };
  }
}
