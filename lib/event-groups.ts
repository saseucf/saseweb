import "server-only";

import { createServerSupabase } from "@/lib/supabase-server";

export type EventGroupOption = { id: string; name: string };

export async function getEventGroupOptions(): Promise<EventGroupOption[] | null> {
    const { data, error } = await createServerSupabase()
        .from("event_groups")
        .select("id, name")
        .order("name");

    if (error) {
        console.error("Could not load event groups", error.code);
        return null;
    }
    return data;
}
