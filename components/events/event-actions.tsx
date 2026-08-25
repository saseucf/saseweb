"use client";

import supabase from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

type EventActionsProps = {
    eventId: string;
    status: "draft" | "published" | "cancelled";
};

export default function EventActions({
    eventId,
    status,
}: EventActionsProps) {
    const router = useRouter();

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleDelete() {
        const confirmed = window.confirm(
            "Are you sure you want to permanently delete this draft?"
        );

        if (!confirmed) return;

        setErrorMessage(null);
        setIsSubmitting(true);

        const { error } = await supabase
            .from("events")
            .delete()
            .eq("id", eventId);

        if (error) {
            console.error("Could not delete event:", error);
            setErrorMessage("Could not delete event.");
            setIsSubmitting(false);
            return;
        }

        router.refresh();
    }

    async function handleCancel() {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this event?"
        );

        if (!confirmed) return;

        setErrorMessage(null);
        setIsSubmitting(true);

        const { error } = await supabase
            .from("events")
            .update({
                status: "cancelled",
            })
            .eq("id", eventId);

        if (error) {
            console.error("Could not cancel event:", error);
            setErrorMessage("Could not cancel event.");
            setIsSubmitting(false);
            return;
        }

        router.refresh();
    }

    return (
        <div className="flex flex-col w-full h-full justify-center">
            {status === "draft" && (
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="sase-secondary-button w-full h-full flex items-center justify-center !text-red-600 !border-red-200 hover:!bg-red-50 text-center !px-2 !py-2.5 !text-[0.65rem] sm:!text-xs disabled:opacity-50"
                >
                    Delete
                </button>
            )}

            {status === "published" && (
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="sase-secondary-button w-full h-full flex items-center justify-center !text-red-600 !border-red-200 hover:!bg-red-50 text-center !px-2 !py-2.5 !text-[0.65rem] sm:!text-xs disabled:opacity-50"
                >
                    Cancel
                </button>
            )}

            {errorMessage && (
                <p className="mt-1 text-[10px] text-red-600 text-center font-medium leading-tight">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}