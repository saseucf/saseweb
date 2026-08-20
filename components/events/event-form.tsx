"use client";

import supabase from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EventForm() {
    const router = useRouter();

    // Track submission errors and prevent duplicate submissions.
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setErrorMessage(null);
        setIsSubmitting(true);

        // Determine which submit button was clicked.
        // Publishing and saving as a draft use the same form,
        // but result in different event statuses.
        const submitter = (
            event.nativeEvent as SubmitEvent
        ).submitter as HTMLButtonElement | null;

        const action = submitter?.value;
        const status =
            action === "publish" ? "published" : "draft";

        const formData = new FormData(event.currentTarget);

        // Read the event information from the submitted form.
        const title = String(formData.get("title") ?? "").trim();
        const description = String(
            formData.get("description") ?? ""
        ).trim();
        const eventType = String(
            formData.get("event_type") ?? ""
        ).trim();
        const location = String(
            formData.get("location") ?? ""
        ).trim();
        const startTime = String(
            formData.get("start_time") ?? ""
        );
        const endTime = String(
            formData.get("end_time") ?? ""
        );
        const host = String(
            formData.get("host") ?? ""
        ).trim();

        const points = Number(formData.get("points") ?? 1);

        // Capacity is optional. Store an empty field as NULL
        // instead of an empty string because the database expects an integer.
        const capacityValue = String(
            formData.get("capacity") ?? ""
        );

        const capacity =
            capacityValue === ""
                ? null
                : Number(capacityValue);

        // Validate required fields before sending anything to Supabase.
        if (!title || !eventType || !startTime || !endTime) {
            setErrorMessage("Please fill out all required fields.");
            setIsSubmitting(false);
            return;
        }

        // Prevent an event from ending before or at its start time.
        if (new Date(endTime) <= new Date(startTime)) {
            setErrorMessage(
                "Event end time must be after the start time."
            );
            setIsSubmitting(false);
            return;
        }

        // datetime-local returns a timezone-less local value.
        // Convert it to an ISO UTC timestamp before storing it in TIMESTAMPTZ.
        const startTimeISO = new Date(startTime).toISOString();
        const endTimeISO = new Date(endTime).toISOString();

        // Insert the new event using the authenticated browser Supabase client.
        // RLS verifies that the current user has permission to create events.
        const { error } = await supabase
            .from("events")
            .insert({
                title,
                description: description || null,
                event_type: eventType,
                location: location || null,
                start_time: startTimeISO,
                end_time: endTimeISO,
                capacity,
                points,
                host: host || null,
                status,
            });

        if (error) {
            console.error("Could not create event:", error);
            setErrorMessage("Could not create event.");
            setIsSubmitting(false);
            return;
        }

        // Return to the public events page after successful creation.
        router.push("/events");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic event information */}
            <div>
                <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-medium"
                >
                    Title
                </label>
                <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    className="w-full rounded-md border px-3 py-2"
                />
            </div>

            <div>
                <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium"
                >
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={4}
                    className="w-full rounded-md border px-3 py-2"
                />
            </div>

            <div>
                <label
                    htmlFor="event_type"
                    className="mb-2 block text-sm font-medium"
                >
                    Event Type
                </label>
                <input
                    id="event_type"
                    name="event_type"
                    type="text"
                    required
                    className="w-full rounded-md border px-3 py-2"
                />
            </div>

            <div>
                <label
                    htmlFor="location"
                    className="mb-2 block text-sm font-medium"
                >
                    Location
                </label>
                <input
                    id="location"
                    name="location"
                    type="text"
                    className="w-full rounded-md border px-3 py-2"
                />
            </div>

            {/* Event schedule */}
            <div className="grid gap-6 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="start_time"
                        className="mb-2 block text-sm font-medium"
                    >
                        Start
                    </label>
                    <input
                        id="start_time"
                        name="start_time"
                        type="datetime-local"
                        required
                        className="w-full rounded-md border px-3 py-2"
                    />
                </div>

                <div>
                    <label
                        htmlFor="end_time"
                        className="mb-2 block text-sm font-medium"
                    >
                        End
                    </label>
                    <input
                        id="end_time"
                        name="end_time"
                        type="datetime-local"
                        required
                        className="w-full rounded-md border px-3 py-2"
                    />
                </div>
            </div>

            {/* Attendance-related event details */}
            <div className="grid gap-6 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="points"
                        className="mb-2 block text-sm font-medium"
                    >
                        Points
                    </label>
                    <input
                        id="points"
                        name="points"
                        type="number"
                        min="0"
                        defaultValue="1"
                        required
                        className="w-full rounded-md border px-3 py-2"
                    />
                </div>

                <div>
                    <label
                        htmlFor="capacity"
                        className="mb-2 block text-sm font-medium"
                    >
                        Capacity
                    </label>
                    <input
                        id="capacity"
                        name="capacity"
                        type="number"
                        min="1"
                        className="w-full rounded-md border px-3 py-2"
                    />
                </div>
            </div>

            <div>
                <label
                    htmlFor="host"
                    className="mb-2 block text-sm font-medium"
                >
                    Host
                </label>
                <input
                    id="host"
                    name="host"
                    type="text"
                    className="w-full rounded-md border px-3 py-2"
                />
            </div>

            {/* Display submission errors without leaving the form. */}
            {errorMessage && (
                <p className="text-sm text-destructive">
                    {errorMessage}
                </p>
            )}

            {/* The selected action determines the event's stored status. */}
            <div className="flex gap-4">
                <button
                    type="submit"
                    name="action"
                    value="draft"
                    disabled={isSubmitting}
                    className="rounded-md border px-4 py-2 font-medium"
                >
                    Save as Draft
                </button>

                <button
                    type="submit"
                    name="action"
                    value="publish"
                    disabled={isSubmitting}
                    className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
                >
                    Publish Event
                </button>
            </div>
        </form>
    );
}