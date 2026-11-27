"use server";

import { revalidatePath } from "next/cache";
import { getAdminAuthorization } from "@/lib/admin-membership";
import { createServerSupabase } from "@/lib/supabase-server";

type SaveResult = { ok: boolean; message: string };

export async function saveEventGroup(groupId: string | null, form: FormData): Promise<SaveResult> {
    if ((await getAdminAuthorization()).status !== "authorized") {
        return { ok: false, message: "Administrator permission is required to manage event groups." };
    }

    const name = String(form.get("name") ?? "").trim();
    const discord_channel_id = String(form.get("discord_channel_id") ?? "").trim();
    const discord_role_id = String(form.get("discord_role_id") ?? "").trim();
    const discordId = /^[1-9][0-9]{16,19}$/;
    if (!name || name.length > 80) {
        return { ok: false, message: "Enter a group name of up to 80 characters." };
    }
    if (!discordId.test(discord_channel_id) || !discordId.test(discord_role_id)) {
        return { ok: false, message: "Enter valid Discord channel and role IDs." };
    }

    const groups = createServerSupabase().from("event_groups");
    const values = { name, discord_channel_id, discord_role_id };
    const { error } = await (groupId ? groups.update(values).eq("id", groupId) : groups.insert(values))
        .select("id")
        .single();
    if (error?.code === "23505") {
        return { ok: false, message: "A group with that name already exists." };
    }
    if (error) {
        console.error("Could not save event group", error.code);
        return { ok: false, message: "Could not save this event group. Refresh the page and try again." };
    }

    revalidatePath("/admin/events", "layout");
    return { ok: true, message: groupId ? "Event group updated." : "Event group created." };
}
