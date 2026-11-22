export type Hackathon = {
  id: string; slug: string; name: string; description: string; timezone: string;
  starts_at: string; ends_at: string; hacking_starts_at: string; hacking_ends_at: string;
  applications_open_at: string; applications_close_at: string; rsvp_deadline: string;
  venue_name: string; venue_address: string; parking_info: string; contact_email: string;
  guide_url: string | null; discord_url: string | null; devpost_url: string | null;
  social_links: Record<string, string>; is_published: boolean;
};
export type Track = { id: string; name: string; description: string; prizes: unknown; resources_url: string | null };
export type Sponsor = { id: string; name: string; tier: string; logo_url: string | null; website_url: string | null; is_partner: boolean };
export type Faq = { id: string; question: string; answer: string };
export type Application = {
  id: string; user_id: string; first_name: string; last_name: string; email: string;
  phone: string; shirt_size: string | null; dietary_restrictions: string; resume_path: string | null;
  status: "applied" | "accepted" | "waitlisted" | "rejected" | "confirmed" | "withdrawn"; qr_token: string;
};
export type ScheduleEvent = { id: string; title: string; description: string; category: string; starts_at: string; ends_at: string; location_id: string | null; host_name: string | null; requires_checkin: boolean };
export type Floor = { id: string; building_name: string; floor_label: string; image_url: string };
export type Room = { id: string; floor_id: string; room_name: string; zone_type: string; coord_x: number; coord_y: number };
export type Perk = { id: string; title: string; instructions: string; redeem_code: string | null; redeem_url: string | null };
export type Landing = { event: Hackathon; tracks: Track[]; sponsors: Sponsor[]; faqs: Faq[] };
export type Dashboard = {
  event: Hackathon; application: Application | null; schedule: ScheduleEvent[]; floors: Floor[]; locations: Room[];
  resources: { wifi_ssid: string | null; wifi_password: string | null; wifi_instructions: string } | null;
  perks: Perk[]; team: { team_id: string; teams: { name: string; invite_code: string } } | null;
  teammates: { user_id: string; first_name: string; last_name: string }[];
  announcements: { id: string; title: string; body: string; priority: string }[];
};

/** Only web URLs are allowed in organizer-supplied links and images. */
export function webUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}

export function applicationWindow(event: Pick<Hackathon, "applications_open_at" | "applications_close_at" | "is_published">, now = Date.now()) {
  const start = Date.parse(event.applications_open_at), end = Date.parse(event.applications_close_at);
  if (!event.is_published || !Number.isFinite(start) || !Number.isFinite(end) || now < start) return "upcoming";
  return now <= end ? "open" : "closed";
}

export function countdown(event: Pick<Hackathon, "hacking_starts_at" | "hacking_ends_at">, now = Date.now()) {
  const start = Date.parse(event.hacking_starts_at), end = Date.parse(event.hacking_ends_at);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { label: "Time to be announced", value: "—" };
  if (now >= end) return { label: "Hacking has ended", value: "00:00:00" };
  const seconds = Math.max(0, Math.floor(((now < start ? start : end) - now) / 1000));
  const days = Math.floor(seconds / 86400);
  const clock = [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, "0")).join(":");
  return { label: now < start ? "Hacking starts in" : "Time left to build", value: `${days ? `${days}d ` : ""}${clock}` };
}

export function qrToken(value: string): string | null {
  const token = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token) ? token : null;
}

export function dateTime(value: string, timezone: string, timeOnly = false) {
  return new Intl.DateTimeFormat("en-US", { timeZone: timezone, ...(timeOnly ? {} : { month: "short", day: "numeric" }), hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(value));
}

export function dateOnly(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(date) : "To be announced";
}

export function dateRange(start: string, end: string) {
  const a = new Date(`${start}T12:00:00Z`), b = new Date(`${end}T12:00:00Z`);
  if (!Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime()) || b < a) return "Dates announced soon";
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).formatRange(a, b);
}
