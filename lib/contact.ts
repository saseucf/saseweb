/** Shared form contract. Keep provider credentials and transport out of this file. */
export const CONTACT_EMAIL = "ucf@saseconnect.org";
export const CONTACT_TOPICS = {
  general: "General question",
  events: "Events & programs",
  membership: "Membership",
  website: "Website problem",
} as const;
export type ContactTopic = keyof typeof CONTACT_TOPICS;
export const CONTACT_LIMITS = { name: 100, email: 254, subject: 140, message: 4000, page: 250, steps: 2000 } as const;
export type ContactFields = { name: string; email: string; topic: ContactTopic; subject: string; message: string; page: string; steps: string };
export type ContactErrors = Partial<Record<keyof ContactFields, string>>;
export const EMPTY_CONTACT: ContactFields = { name: "", email: "", topic: "general", subject: "", message: "", page: "", steps: "" };

export function isContactEmail(value: string): boolean {
  return value.length <= CONTACT_LIMITS.email && /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i.test(value);
}

export function validateContact(input: unknown): { ok: true; data: ContactFields } | { ok: false; errors: ContactErrors } {
  const record = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const errors: ContactErrors = {};
  const fields = { ...EMPTY_CONTACT };
  for (const field of Object.keys(CONTACT_LIMITS) as (keyof typeof CONTACT_LIMITS)[]) {
    const raw = record[field];
    if (typeof raw !== "string") {
      errors[field] = "Enter a valid value.";
      continue;
    }
    const multiline = field === "message" || field === "steps";
    // Header fields must reject line breaks before trimming.
    if ((multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/).test(raw)) {
      errors[field] = "Remove unsupported characters.";
    }
    fields[field] = raw.trim().replace(/\r\n/g, "\n");
    if (raw.length > CONTACT_LIMITS[field]) errors[field] = `Use ${CONTACT_LIMITS[field]} characters or fewer.`;
  }
  if (typeof record.topic !== "string" || !Object.hasOwn(CONTACT_TOPICS, record.topic)) errors.topic = "Choose a topic.";
  else fields.topic = record.topic as ContactTopic;
  for (const field of ["name", "email", "subject", "message"] as const) {
    if (!fields[field] && !errors[field]) errors[field] = "This field is required.";
  }
  if (fields.email && !isContactEmail(fields.email)) errors.email = "Enter a valid email address.";
  if (fields.page && (!/^\/(?!\/)[^?#\s\\]*$/.test(fields.page) || /%(?:0[0-9a-f]|1[0-9a-f]|7f|3f|23)/i.test(fields.page))) {
    errors.page = "Use a page path such as /events, without a query string or # fragment.";
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  if (fields.topic !== "website") { fields.page = ""; fields.steps = ""; }
  return { ok: true, data: fields };
}

export function contactMessageText(fields: ContactFields): string {
  return [
    `Name: ${fields.name}`, `Reply email: ${fields.email}`, `Topic: ${CONTACT_TOPICS[fields.topic]}`,
    "", "Message:", fields.message,
    ...(fields.topic === "website" ? ["", `Affected page: ${fields.page || "Not provided"}`, "Steps to reproduce:", fields.steps || "Not provided"] : []),
  ].join("\n");
}

export function contactDraftHref(fields: ContactFields): string {
  const subject = `[SASE ${CONTACT_TOPICS[fields.topic]}] ${fields.subject || "Contact request"}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(contactMessageText(fields))}`;
}
