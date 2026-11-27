export type EditableItem = {
  id: string; title: string; created_at?: string | null; updated_at?: string | null;
  last_edited_at?: string | null; start_time?: string | null;
};
function time(value?: string | null) {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}
export function lastEditedTime(item: EditableItem) {
  const updated = time(item.updated_at), created = time(item.created_at);
  return Math.max(time(item.last_edited_at), updated > created ? updated : 0);
}
export function compareAdminItems(a: EditableItem, b: EditableItem) {
  const edited = lastEditedTime(b) - lastEditedTime(a);
  if (edited) return edited;
  const aStart = time(a.start_time) || Infinity, bStart = time(b.start_time) || Infinity;
  if (aStart !== bStart) return aStart - bStart;
  return time(b.created_at) - time(a.created_at) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
}
export function latestEditTimes(logs: { entity_id: string | null; created_at: string }[]) {
  const result: Record<string, string> = {};
  for (const log of logs) if (log.entity_id && time(log.created_at) > time(result[log.entity_id])) result[log.entity_id] = log.created_at;
  return result;
}
export function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
export function searchScore(title: string, fields: unknown[], query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return 0;
  const heading = normalizeSearch(title);
  const text = normalizeSearch([title, ...fields].filter(value => value !== null && value !== undefined).join(" "));
  if (!normalized.split(/\s+/).every(term => text.includes(term))) return -1;
  return heading === normalized ? 100 : heading.startsWith(normalized) ? 75 : heading.includes(normalized) ? 50 : 10;
}
export function searchEditableItems<T extends EditableItem>(items: T[], query: string, fields: (item: T) => unknown[]) {
  return items.map(item => ({ item, score: searchScore(item.title, fields(item), query) }))
    .filter(entry => entry.score >= 0)
    .sort((a, b) => b.score - a.score || compareAdminItems(a.item, b.item))
    .map(entry => entry.item);
}

export type AdminListEvent = EditableItem & {
  description: string | null; event_type: string; location: string | null;
  start_time: string; end_time: string; capacity: number | null; points: number;
  host: string | null; status: "draft" | "published" | "cancelled";
  forms?: { id: string; title: string }[]; checkin_count?: number; rsvp_count?: number;
};
export function isCompletedEvent(event: { end_time?: string | null; start_time?: string | null }, now: number) {
  const end = time(event.end_time) || time(event.start_time);
  return end > 0 && end <= now;
}
function dateSearch(value: string) {
  const timestamp = time(value);
  return timestamp ? `${value} ${new Date(timestamp).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "full", timeStyle: "short" })}` : "";
}
export function organizeAdminEvents(events: AdminListEvent[], query: string, now: number) {
  const scored = events.map(event => ({ event, score: searchScore(event.title, [event.id, event.description, event.event_type, event.location?.trim() || "TBD", event.host, event.status, `${event.points} points`, event.capacity, event.checkin_count, event.rsvp_count, isCompletedEvent(event, now) ? "completed past date passed" : time(event.start_time) <= now ? "ongoing" : "upcoming", dateSearch(event.start_time), dateSearch(event.end_time), ...(event.forms ?? []).map(form => form.title)], query) }));
  const matching = scored.filter(item => item.score >= 0).sort((a, b) => b.score - a.score || compareAdminItems(a.event, b.event)).map(item => item.event);
  const upcoming = matching.filter(event => !isCompletedEvent(event, now));
  const folders = new Map<string, AdminListEvent[]>();
  for (const event of matching) if (isCompletedEvent(event, now)) {
    const type = event.event_type.trim() || "Other events";
    folders.set(type, [...(folders.get(type) ?? []), event]);
  }
  return { matching, upcoming, folders: [...folders].sort(([a], [b]) => a.localeCompare(b)).map(([type, events]) => ({ type, events })) };
}
