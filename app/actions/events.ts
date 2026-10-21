"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase-server";
import { getAdminAuthorization } from "@/lib/admin-membership";
import { executeEventMutation, type EventMutation } from "@/lib/event-mutations";

async function mutateEvent(input: EventMutation) {
    return executeEventMutation(input, {
        authorize: getAdminAuthorization,
        configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        write: async mutation => {
            const supabase = createAdminSupabase();
            if (mutation.type === "save") {
                const query = mutation.existingId
                    ? supabase.from("events").update(mutation.eventData).eq("id", mutation.existingId)
                    : supabase.from("events").insert(mutation.eventData);
                return query.select("id").single();
            }
            if (mutation.type === "delete") return supabase.from("events").delete().eq("id", mutation.eventId).select("id").single();
            return supabase.from("events").update({ status: "cancelled" }).eq("id", mutation.eventId).select("id").single();
        },
        refresh: clearEventsCache,
        recordEdit: async (mutation, adminId) => {
            const id = mutation.type === "save" ? mutation.existingId : mutation.type === "cancel" ? mutation.eventId : undefined;
            if (!id) return;
            const { error } = await createAdminSupabase().from("admin_logs").insert({
                actor_id: adminId, action: "update", entity_type: "events", entity_id: id,
                details: mutation.type === "save" ? { title: mutation.eventData.title } : { status: "cancelled" },
            });
            if (error) throw error;
        },
        report: (context, error) => console.error(context, error),
    });
}

export async function clearEventsCache() {
    revalidatePath("/events", "layout");
    revalidatePath("/admin/events", "layout");
    revalidatePath("/", "layout");
}

export async function saveEvent(eventData: Record<string, unknown>, existingId?: string) {
    return mutateEvent({ type: "save", eventData, existingId });
}

export async function deleteEvent(eventId: string) {
    return mutateEvent({ type: "delete", eventId });
}

export async function cancelEvent(eventId: string) {
    return mutateEvent({ type: "cancel", eventId });
}
