"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function getAcademicFields() {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
        .from("academic_fields")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching academic fields:", error);
        return [];
    }

    return data;
}

export async function addAcademicField(name: string) {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
        .from("academic_fields")
        .insert([{ name }])
        .select()
        .single();

    if (error) {
        console.error("Error adding academic field:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/fields");
    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { success: true, data };
}

export async function deleteAcademicField(id: string) {
    const supabase = createServerSupabase();
    const { error } = await supabase
        .from("academic_fields")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting academic field:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/fields");
    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { success: true };
}
