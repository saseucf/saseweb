import type { AdminAuthorization } from "@/lib/admin-membership-core";
import { DEFAULT_EVENT_LOCATION, DEFAULT_EVENT_POINTS } from "@/lib/event-scheduling";

type DatabaseError = { code?: string; message?: string };
export type EventMutationResult = { ok: true } | { ok: false; error: string };
export type EventMutation =
  | { type: "save"; eventData: Record<string, unknown>; existingId?: string }
  | { type: "delete" | "cancel"; eventId: string };
type Dependencies = {
  authorize: () => Promise<AdminAuthorization>;
  configured: boolean;
  write: (mutation: EventMutation) => Promise<{ error: DatabaseError | null }>;
  refresh: () => Promise<void>;
  report: (context: string, error: unknown) => void;
  recordEdit?: (mutation: EventMutation, adminId: string) => Promise<void>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validatedEvent(input: Record<string, unknown>) {
  if (!input || typeof input !== "object") throw new Error("Check your event details.");
  const text = (key: string, required = false) => {
    const value = typeof input[key] === "string" ? input[key].trim() : "";
    if (required && !value) throw new Error("Enter a title and event type.");
    return value || null;
  };
  const title = text("title", true), eventType = text("event_type", true);
  const start = typeof input.start_time === "string" ? Date.parse(input.start_time) : NaN;
  const end = typeof input.end_time === "string" ? Date.parse(input.end_time) : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error("Choose valid dates with the end after the start.");
  const points = input.points == null || input.points === "" ? DEFAULT_EVENT_POINTS : input.points;
  if (!Number.isSafeInteger(points) || (points as number) < 0) throw new Error("Points must be a whole number of zero or more.");
  if (input.capacity != null && (!Number.isSafeInteger(input.capacity) || (input.capacity as number) < 1)) throw new Error("Capacity must be a whole number of at least one, or left blank.");
  if (!["draft", "published", "cancelled"].includes(String(input.status))) throw new Error("Choose a valid event status.");
  const data: Record<string, unknown> = {
    title, event_type: eventType, description: text("description"), location: text("location") ?? DEFAULT_EVENT_LOCATION, host: text("host"),
    start_time: new Date(start).toISOString(), end_time: new Date(end).toISOString(),
    points, capacity: input.capacity ?? null, status: input.status,
  };
  if (Object.hasOwn(input, "academic_field_id")) {
    if (input.academic_field_id != null && (typeof input.academic_field_id !== "string" || !uuid.test(input.academic_field_id))) throw new Error("Choose a valid event category.");
    data.academic_field_id = input.academic_field_id ?? null;
  }
  return data;
}

function missingCategory(error: DatabaseError) {
  return ["PGRST204", "42703"].includes(error.code ?? "") && /academic_field_id/i.test(error.message ?? "");
}

function databaseMessage(error: DatabaseError) {
  if (missingCategory(error)) return "Event categories are not configured. Choose no category and save again.";
  if (error.code === "42501") return "Administrator permission is required to change events.";
  if (error.code === "23503") return "The selected category is unavailable. Choose another category or leave it blank.";
  if (error.code === "PGRST116") return "This event no longer exists. Refresh the event list.";
  if (error.code === "23514" || error.code === "22P02") return "Check the event dates, status, points, and capacity.";
  return "The event could not be saved. Please try again. If it continues, contact an officer.";
}

export async function executeEventMutation(input: EventMutation, dependencies: Dependencies): Promise<EventMutationResult> {
  let committed = false;
  try {
    const auth = await dependencies.authorize();
    if (auth.status !== "authorized") return { ok: false, error: auth.status === "unauthenticated" ? "Your session expired. Sign in again before saving." : auth.status === "unavailable" ? "Your permissions could not be verified. Please try again." : "Administrator permission is required to change events." };
    if (!dependencies.configured) return { ok: false, error: "Event management is not configured on the server. Please contact an officer." };
    const id = input.type === "save" ? input.existingId : input.eventId;
    if (id !== undefined && !uuid.test(id)) return { ok: false, error: "Invalid event. Refresh the event list." };
    let mutation = input;
    if (input.type === "save") {
      try { mutation = { ...input, eventData: validatedEvent(input.eventData) }; }
      catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Check your event details." }; }
    }
    let result = await dependencies.write(mutation);
    // A failed PostgREST statement did not commit. Retry only the known optional
    // NULL column; never discard a selected category or retry unrelated failures.
    if (result.error && mutation.type === "save" && mutation.eventData.academic_field_id === null && missingCategory(result.error)) {
      const data = { ...mutation.eventData };
      delete data.academic_field_id;
      mutation = { ...mutation, eventData: data };
      result = await dependencies.write(mutation);
    }
    if (result.error) {
      dependencies.report(`events.${input.type}`, result.error);
      return { ok: false, error: databaseMessage(result.error) };
    }
    committed = true;
    try { await dependencies.recordEdit?.(mutation, auth.adminId); }
    catch (error) { dependencies.report("events.edit-history", error); }
    await dependencies.refresh();
    return { ok: true };
  } catch (error) {
    dependencies.report(`events.${input.type}`, error);
    // Cache invalidation failing after a write must not encourage duplicate saves.
    return committed ? { ok: true } : { ok: false, error: "Unable to reach event management. Please try again." };
  }
}
