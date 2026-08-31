"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase-server";

export async function clearEventsCache() {
    revalidatePath("/events", "layout");
    revalidatePath("/admin/events", "layout");
    revalidatePath("/", "layout");
}

export async function saveEvent(eventData: any, existingId?: string) {
    const supabase = createAdminSupabase();
    
    if (existingId) {
        const { error } = await supabase
            .from("events")
            .update(eventData)
            .eq("id", existingId);
            
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase
            .from("events")
            .insert(eventData);
            
        if (error) throw new Error(error.message);
    }
    
    // Clear cache immediately after saving
    await clearEventsCache();
}

export async function deleteEvent(eventId: string) {
    const supabase = createAdminSupabase();
    
    const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
        
    if (error) throw new Error(error.message);
    
    await clearEventsCache();
}

export async function cancelEvent(eventId: string) {
    const supabase = createAdminSupabase();
    
    const { error } = await supabase
        .from("events")
        .update({ status: "cancelled" })
        .eq("id", eventId);
        
    if (error) throw new Error(error.message);
    
    await clearEventsCache();
}
