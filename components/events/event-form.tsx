"use client";

import supabase from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { PRESET_EVENT_TYPES, getEventTypeColor } from "@/lib/event-type-colors";
import { clearEventsCache } from "@/app/actions/events";

type EventData = {
    id: string;
    title: string;
    description: string | null;
    event_type: string;
    location: string | null;
    start_time: string;
    end_time: string;
    capacity: number | null;
    points: number;
    host: string | null;
    status: "draft" | "published" | "cancelled";
};

type EventFormProps = {
    event?: EventData;
};

function toDateTimeLocal(timestamp?: string) {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    // Convert the stored UTC timestamp back into local time
    // for the datetime-local input.
    const offset = date.getTimezoneOffset() * 60_000;

    return new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
}

export default function EventForm({
    event: existingEvent,
}: EventFormProps) {
    const router = useRouter();

    // Track submission errors and prevent duplicate submissions.
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitAction, setSubmitAction] = useState<"publish" | "draft">("draft");

    let initialDescription = existingEvent?.description ?? "";
    let initialExternalUrl = "";

    const EXT_URL_DELIMITER = "\n\n===EXTERNAL_URL===";
    if (initialDescription.includes(EXT_URL_DELIMITER)) {
        const parts = initialDescription.split(EXT_URL_DELIMITER);
        initialDescription = parts[0];
        initialExternalUrl = parts[1] ?? "";
    }

    // Event type logic
    const initialType = existingEvent?.event_type ?? "";
    const isPreset = initialType === "" ? false : PRESET_EVENT_TYPES.some(p => p.label === initialType);
    const [eventTypeSelection, setEventTypeSelection] = useState(
        initialType === "" ? PRESET_EVENT_TYPES[0].label : (isPreset ? initialType : "custom")
    );
    const [customEventType, setCustomEventType] = useState(isPreset ? "" : initialType);

    async function handleSubmit(
        submitEvent: React.FormEvent<HTMLFormElement>
    ) {
        submitEvent.preventDefault();

        setErrorMessage(null);
        setIsSubmitting(true);

        const status = submitAction === "publish" ? "published" : "draft";

        const formData = new FormData(submitEvent.currentTarget);

        // Read the event information from the submitted form.
        const title = String(
            formData.get("title") ?? ""
        ).trim();

        let description = String(
            formData.get("description") ?? ""
        ).trim();

        const externalUrl = String(
            formData.get("external_url") ?? ""
        ).trim();

        if (externalUrl) {
            description = `${description}${EXT_URL_DELIMITER}${externalUrl}`;
        }

        let eventType = eventTypeSelection;
        if (eventType === "custom") {
            eventType = customEventType.trim();
        }

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

        const points = Number(
            formData.get("points") ?? 1
        );

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
            setErrorMessage(
                "Please fill out all required fields."
            );
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

        const eventData = {
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
        };

        let error;

        if (existingEvent) {
            // Existing event: update the matching database row.
            const result = await supabase
                .from("events")
                .update(eventData)
                .eq("id", existingEvent.id);

            error = result.error;
        } else {
            // New event: create a new database row.
            const result = await supabase
                .from("events")
                .insert(eventData);

            error = result.error;
        }

        if (error) {
            console.error(
                existingEvent
                    ? "Could not update event:"
                    : "Could not create event:",
                error
            );

            setErrorMessage(
                existingEvent
                    ? "Could not update event."
                    : "Could not create event."
            );

            setIsSubmitting(false);
            return;
        }

        // Clear the server cache so the changes appear immediately
        await clearEventsCache();

        // After creating or editing, return to the admin event management page.
        router.push("/admin/events");
        router.refresh();
        }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 sase-creator-page"
        >
            {/* Basic event information */}
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="title"
                    className="text-sm font-semibold text-foreground"
                >
                    Title
                </label>

                <input
                    id="title"
                    name="title"
                    type="text"
                    defaultValue={existingEvent?.title ?? ""}
                    required
                    className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa]"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="description"
                    className="text-sm font-semibold text-foreground"
                >
                    Description
                </label>

                <textarea
                    id="description"
                    name="description"
                    rows={4}
                    defaultValue={initialDescription}
                    className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa] resize-y"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="external_url"
                    className="text-sm font-semibold text-foreground"
                >
                    External RSVP Link (e.g. Google Forms)
                </label>
                <input
                    id="external_url"
                    name="external_url"
                    type="url"
                    placeholder="https://forms.gle/..."
                    defaultValue={initialExternalUrl}
                    className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa]"
                />
                <p className="text-xs text-muted-foreground mt-1">If provided, this link will replace any built-in forms and users will be redirected here to RSVP.</p>
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="event_type_select"
                    className="text-sm font-semibold text-foreground"
                >
                    Event Type
                </label>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <select
                            id="event_type_select"
                            value={eventTypeSelection}
                            onChange={(e) => setEventTypeSelection(e.target.value)}
                            className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa] flex-1"
                        >
                            {PRESET_EVENT_TYPES.map(preset => (
                                <option key={preset.label} value={preset.label}>
                                    {preset.label}
                                </option>
                            ))}
                            <option value="custom">+ Custom Type...</option>
                        </select>
                        <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ 
                                backgroundColor: getEventTypeColor(
                                    eventTypeSelection === 'custom' ? customEventType : eventTypeSelection
                                ) 
                            }} 
                        />
                    </div>
                    
                    {eventTypeSelection === "custom" && (
                        <input
                            type="text"
                            placeholder="Enter custom event type..."
                            value={customEventType}
                            onChange={(e) => setCustomEventType(e.target.value)}
                            required
                            className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa] w-full"
                        />
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="location"
                    className="text-sm font-semibold text-foreground"
                >
                    Location
                </label>

                <input
                    id="location"
                    name="location"
                    type="text"
                    defaultValue={existingEvent?.location ?? ""}
                    className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa]"
                />
            </div>

            {/* Event schedule */}
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="start_time"
                        className="text-sm font-semibold text-foreground"
                    >
                        Start Time
                    </label>

                    <input
                        id="start_time"
                        name="start_time"
                        type="datetime-local"
                        defaultValue={toDateTimeLocal(
                            existingEvent?.start_time
                        )}
                        required
                        className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa]"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="end_time"
                        className="text-sm font-semibold text-foreground"
                    >
                        End Time
                    </label>

                    <input
                        id="end_time"
                        name="end_time"
                        type="datetime-local"
                        defaultValue={toDateTimeLocal(
                            existingEvent?.end_time
                        )}
                        required
                        className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa]"
                    />
                </div>
            </div>

            {/* Attendance-related event details */}
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="points"
                        className="text-sm font-semibold text-foreground"
                    >
                        Points
                    </label>

                    <input
                        id="points"
                        name="points"
                        type="number"
                        min="0"
                        defaultValue={existingEvent?.points ?? 1}
                        required
                        className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa]"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="capacity"
                        className="text-sm font-semibold text-foreground"
                    >
                        Capacity (Optional)
                    </label>

                    <input
                        id="capacity"
                        name="capacity"
                        type="number"
                        min="1"
                        defaultValue={existingEvent?.capacity ?? ""}
                        className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa]"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="host"
                    className="text-sm font-semibold text-foreground"
                >
                    Host (Optional)
                </label>

                <input
                    id="host"
                    name="host"
                    type="text"
                    defaultValue={existingEvent?.host ?? ""}
                    className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa]"
                />
            </div>

            {/* Display submission errors without leaving the form. */}
            {errorMessage && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-md text-sm">
                    {errorMessage}
                </div>
            )}

            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                <Link
                    href="/admin/events"
                    className="sase-secondary-button text-center w-full sm:w-auto sm:mr-auto"
                >
                    Cancel
                </Link>
                
                <button
                    type="submit"
                    onClick={() => setSubmitAction("draft")}
                    disabled={isSubmitting}
                    className="sase-secondary-button w-full sm:w-auto disabled:opacity-50"
                >
                    Save as Draft
                </button>

                <button
                    type="submit"
                    onClick={() => setSubmitAction("publish")}
                    disabled={isSubmitting}
                    className="sase-primary-button w-full sm:w-auto disabled:opacity-50"
                >
                    {existingEvent
                        ? "Save & Publish"
                        : "Publish Event"}
                </button>
            </div>
        </form>
    );
}