export const DEFAULT_EVENT_POINTS = 30;
export const DEFAULT_EVENT_LOCATION = "TBD";
export const EVENT_DURATIONS = [30, 45, 60, 90, 120, 150, 180, 240];

export function eventEndFromDuration(start: string, minutes: number) {
  const timestamp = Date.parse(start);
  if (!Number.isFinite(timestamp) || !Number.isSafeInteger(minutes) || minutes < 1 || minutes > 10080) return "";
  return new Date(timestamp + minutes * 60000).toISOString();
}

export function localDateTimeValue(timestamp?: string) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function durationMinutes(start?: string, end?: string) {
  if (!start || !end) return 60;
  const minutes = (Date.parse(end) - Date.parse(start)) / 60000;
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 60;
}
