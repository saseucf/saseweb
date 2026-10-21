"use client";


import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PRESET_EVENT_TYPES, getEventTypeColor } from "@/lib/event-type-colors";
import { saveEvent } from "@/app/actions/events";
import { getAcademicFields } from "@/app/actions/academic-fields";
import { DEFAULT_EVENT_LOCATION, DEFAULT_EVENT_POINTS, EVENT_DURATIONS, durationMinutes, eventEndFromDuration, localDateTimeValue as toDateTimeLocal } from "@/lib/event-scheduling";

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
    academic_field_id?: string | null;
};

type EventFormProps = {
    event?: EventData;
};

export default function EventForm({
    event: existingEvent,
}: EventFormProps) {
    const router = useRouter();

    // Track submission errors and prevent duplicate submissions.
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitAction, setSubmitAction] = useState<"publish" | "draft">("draft");
    const [academicFields, setAcademicFields] = useState<{id: string, name: string}[]>([]);

    useEffect(() => {
        getAcademicFields().then(setAcademicFields);
    }, []);

    let initialDescription = existingEvent?.description ?? "";
    let initialExternalUrl = "";

    const EXT_URL_DELIMITER = "\n\n===EXTERNAL_URL===";
    if (initialDescription.includes(EXT_URL_DELIMITER)) {
        const parts = initialDescription.split(EXT_URL_DELIMITER);
        initialDescription = parts[0];
        initialExternalUrl = parts[1] ?? "";
    }

    // Event type logic
    const WORKSHOP_SUBCATEGORIES = ["Pre-Health", "Pro-Dev", "Tech"];
    const initialType = existingEvent?.event_type ?? "";
    const isWorkshopSub = initialType.startsWith("Workshop - ");
    const isPreset = initialType === "" ? false : PRESET_EVENT_TYPES.some(p => p.label === initialType);
    const [eventTypeSelection, setEventTypeSelection] = useState(
        initialType === "" ? PRESET_EVENT_TYPES[0].label : (isWorkshopSub ? "Workshop" : (isPreset ? initialType : "custom"))
    );
    const [workshopSubcategory, setWorkshopSubcategory] = useState(
        isWorkshopSub ? initialType.replace("Workshop - ", "") : ""
    );
    const [customEventType, setCustomEventType] = useState(isPreset || isWorkshopSub ? "" : initialType);
    const initialDuration = durationMinutes(existingEvent?.start_time, existingEvent?.end_time);
    const [startValue, setStartValue] = useState(toDateTimeLocal(existingEvent?.start_time));
    const [duration, setDuration] = useState(EVENT_DURATIONS.includes(initialDuration) ? String(initialDuration) : Number.isSafeInteger(initialDuration) && initialDuration <= 10080 ? "custom" : "manual");
    const [customMinutes, setCustomMinutes] = useState(String(initialDuration));
    const [manualEnd, setManualEnd] = useState(toDateTimeLocal(existingEvent?.end_time));
    const endValue = duration === "manual" ? manualEnd : toDateTimeLocal(eventEndFromDuration(startValue, Number(duration === "custom" ? customMinutes : duration)));

    async function handleSubmit(
        submitEvent: React.FormEvent<HTMLFormElement>
    ) {
        submitEvent.preventDefault();
        if (isSubmitting) return;

        setErrorMessage(null);
        setIsSubmitting(true);

        const status = submitAction === "publish" ? "published" : "draft";

        const formData = new FormData(submitEvent.currentTarget);

        const academicFieldId = String(formData.get("academic_field_id") ?? "") || null;

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
        if (eventType === "Workshop") {
            if (!workshopSubcategory) {
                setErrorMessage("Please select a workshop subcategory.");
                setIsSubmitting(false);
                return;
            }
            eventType = `Workshop - ${workshopSubcategory}`;
        } else if (eventType === "custom") {
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

        const pointsValue = String(formData.get("points") ?? "").trim();
        const points = pointsValue === "" ? DEFAULT_EVENT_POINTS : Number(pointsValue);

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

        const startTimestamp = Date.parse(startTime);
        const calculatedEnd = duration === "manual" ? endTime : eventEndFromDuration(startTime, Number(duration === "custom" ? customMinutes : duration));
        const endTimestamp = Date.parse(calculatedEnd);
        // Preserve elapsed duration even when a daylight-saving change repeats
        // a local clock time. Do not re-parse the displayed calculated end time.
        if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp) || endTimestamp <= startTimestamp) {
            setErrorMessage(
                "Event end time must be after the start time."
            );
            setIsSubmitting(false);
            return;
        }

        // datetime-local returns a timezone-less local value.
        // Convert it to an ISO UTC timestamp before storing it in TIMESTAMPTZ.
        const startTimeISO = new Date(startTimestamp).toISOString();
        const endTimeISO = new Date(endTimestamp).toISOString();

        const eventData = {
            title,
            description: description || null,
            event_type: eventType,
            location: location || DEFAULT_EVENT_LOCATION,
            start_time: startTimeISO,
            end_time: endTimeISO,
            capacity,
            points,
            host: host || null,
            status,
            ...(formData.has("academic_field_id") ? { academic_field_id: academicFieldId } : {}),
        };

        try {
            const result = await saveEvent(eventData, existingEvent?.id);
            if (!result.ok) {
                setErrorMessage(`Could not save event. ${result.error}`);
                setIsSubmitting(false);
                return;
            }
            
            // After creating or editing, return to the admin event management page.
            router.push("/admin/events");
            router.refresh();
        } catch (error: unknown) {
            console.error("Could not save event:", error);
            setErrorMessage("Could not reach event management. Your entries are still here. Please try again.");
            setIsSubmitting(false);
        }
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
                                    eventTypeSelection === 'custom' ? customEventType
                                    : eventTypeSelection === 'Workshop' && workshopSubcategory ? `Workshop - ${workshopSubcategory}`
                                    : eventTypeSelection
                                ) 
                            }} 
                        />
                    </div>
                    
                    {eventTypeSelection === "Workshop" && (
                        <select
                            value={workshopSubcategory}
                            onChange={(e) => setWorkshopSubcategory(e.target.value)}
                            required
                            className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa] w-full"
                        >
                            <option value="" disabled>Select a subcategory...</option>
                            {WORKSHOP_SUBCATEGORIES.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    )}

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

            {(academicFields.length > 0 || existingEvent?.academic_field_id) && <div className="flex flex-col gap-1">
                <label
                    htmlFor="academic_field_id"
                    className="text-sm font-semibold text-foreground"
                >
                    Event Category (Optional)
                </label>
                <select
                    id="academic_field_id"
                    name="academic_field_id"
                    defaultValue={existingEvent?.academic_field_id ?? ""}
                    className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa]"
                >
                    <option value="">No specific field</option>
                    {academicFields.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
            </div>}

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
                    placeholder="TBD"
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
                        value={startValue}
                        onChange={event => setStartValue(event.target.value)}
                        required
                        className="border rounded-md p-2 bg-muted text-foreground focus:border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#dbe5fa]"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="duration" className="text-sm font-semibold text-foreground">Duration</label>
                    <select id="duration" value={duration} onChange={event => {
                        if (event.target.value === "manual") setManualEnd(endValue);
                        setDuration(event.target.value);
                    }} className="border rounded-md p-2 bg-muted text-foreground">
                        {EVENT_DURATIONS.map(minutes => <option key={minutes} value={minutes}>{minutes < 60 ? `${minutes} minutes` : `${minutes / 60} ${minutes === 60 ? "hour" : "hours"}`}</option>)}
                        <option value="custom">Custom duration</option>
                        <option value="manual">Set end time manually</option>
                    </select>
                    {duration === "custom" && <label className="mt-2 text-sm">Duration in minutes<input aria-label="Custom duration in minutes" type="number" min={1} max={10080} step={1} required value={customMinutes} onChange={event => setCustomMinutes(event.target.value)} className="mt-1 w-full rounded-md border bg-muted p-2 text-foreground" /></label>}
                    <p className="text-xs text-muted-foreground">End time updates automatically when the start or duration changes.</p>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                    <label
                        htmlFor="end_time"
                        className="text-sm font-semibold text-foreground"
                    >
                        End Time {duration !== "manual" && "(calculated)"}
                    </label>

                    <input
                        id="end_time"
                        name="end_time"
                        type="datetime-local"
                        value={endValue}
                        readOnly={duration !== "manual"}
                        onChange={event => setManualEnd(event.target.value)}
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
                        defaultValue={existingEvent?.points ?? DEFAULT_EVENT_POINTS}
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
                <div role="alert" className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-md text-sm">
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
