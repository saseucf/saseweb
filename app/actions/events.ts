"use server";

import { revalidatePath } from "next/cache";

export async function clearEventsCache() {
    revalidatePath("/events", "layout");
    revalidatePath("/admin/events", "layout");
    revalidatePath("/", "layout");
}
