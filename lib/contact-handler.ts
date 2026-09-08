/** Server boundary, kept dependency-injected so tests never contact real providers. */
import { CONTACT_EMAIL, CONTACT_TOPICS, contactMessageText, isContactEmail, validateContact } from "./contact";

export type ContactConfiguration = { apiKey: string; from: string; siteKey: string; secretKey: string; origins: string[] };
export const CONTACT_BODY_LIMIT = 32 * 1024;

export function readContactConfiguration(env: Record<string, string | undefined>): ContactConfiguration | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.CONTACT_FROM_EMAIL?.trim();
  const siteKey = env.CONTACT_TURNSTILE_SITE_KEY?.trim();
  const secretKey = env.CONTACT_TURNSTILE_SECRET_KEY?.trim();
  const origins = (env.CONTACT_ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
  if (!apiKey || !from || !isContactEmail(from) || !siteKey || !secretKey || !origins.length) return null;
  // Cloudflare's public dummy keys must never activate a production deployment.
  if (env.NODE_ENV === "production" && [siteKey, secretKey].some(key => /^[123]x0{10}/.test(key))) return null;
  try {
    if (origins.some(value => {
      const url = new URL(value);
      return url.origin !== value || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)));
    })) return null;
  } catch { return null; }
  return { apiKey, from, siteKey, secretKey, origins };
}

function failure(status: number, kind: string, message: string, fields?: unknown, retryAfter?: number): Response {
  return Response.json({ ok: false, error: { kind, message, ...(fields ? { fields } : {}) } }, {
    status,
    headers: { "Cache-Control": "no-store", ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) },
  });
}

async function readBoundedJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > CONTACT_BODY_LIMIT) throw new RangeError();
  if (!request.body) throw new SyntaxError();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > CONTACT_BODY_LIMIT) { void reader.cancel().catch(() => {}); throw new RangeError(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

export async function handleContact(request: Request, config: ContactConfiguration | null, fetcher: typeof fetch = fetch): Promise<Response> {
  if (request.method !== "POST") return failure(405, "method_not_allowed", "Use the contact form to send a message.");
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) return failure(415, "invalid_input", "Submit the contact form as JSON.");
  if (!config) return failure(503, "not_configured", "Website sending is unavailable. Your message has not been sent. Please email the officer team directly.");
  const origin = request.headers.get("origin") || "";
  if (!config.origins.includes(origin) || request.headers.get("sec-fetch-site") === "cross-site") return failure(403, "forbidden", "Open the contact page on the SASE website and try again.");
  let input: unknown;
  try { input = await readBoundedJson(request); }
  catch (error) {
    return error instanceof RangeError
      ? failure(413, "invalid_input", "This message is too large. Shorten it and try again.")
      : failure(400, "invalid_input", "We could not read this message. Please try again.");
  }
  const parsed = validateContact(input);
  if (!parsed.ok) return failure(400, "invalid_input", "Check the highlighted fields.", parsed.errors);
  const payload = input as Record<string, unknown>;
  if (payload.company !== "") return failure(400, "verification_failed", "We could not verify this submission. Please email the officer team directly.");
  if (typeof payload.submissionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.submissionId)) return failure(400, "invalid_input", "Reload the contact page before sending a new message.");
  if (typeof payload.token !== "string" || !payload.token.trim() || payload.token.length > 2048) return failure(400, "verification_failed", "Complete the verification and try again.");

  try {
    const verification = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: config.secretKey, response: payload.token }),
      signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!verification.ok) return failure(503, "verification_unavailable", "Verification is unavailable. Try again or email the officer team directly.");
    const result = await verification.json();
    if (result?.success !== true || result.action !== "contact" || result.hostname !== new URL(origin).hostname) {
      return failure(400, "verification_failed", "Verification expired or could not be completed. Please verify again.");
    }
  } catch { return failure(503, "verification_unavailable", "Verification is unavailable. Try again or email the officer team directly."); }

  const fields = parsed.data;
  const reference = payload.submissionId.toLowerCase();
  try {
    // Direct API call keeps the contact timeout local; it does not change the shared RSVP integration.
    const sent = await fetcher("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(12000), cache: "no-store",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `contact/${reference}` },
      body: JSON.stringify({
        from: `UCF SASE <${config.from}>`, to: [CONTACT_EMAIL], reply_to: fields.email,
        subject: `[SASE ${CONTACT_TOPICS[fields.topic]}] ${fields.subject}`,
        text: `UCF SASE contact request\nReference: ${reference}\n\n${contactMessageText(fields)}\n\nSent through the public contact form. The sender's identity is self-reported.`,
      }),
    });
    if (sent.status === 429) return failure(429, "rate_limited", "Sending is busy. Wait a minute before trying again, or email the officer team directly.", undefined, 60);
    if (sent.status === 409) return failure(409, "conflict", "This request is already processing or has changed. Wait a moment and retry, or start a new message.");
    const receipt = sent.ok ? await sent.json() : null;
    if (!receipt || typeof receipt.id !== "string" || !receipt.id.trim()) return failure(502, "send_failed", "We could not confirm sending. Your message is still here. Retry without editing to avoid a duplicate, or email the officer team directly.");
    return Response.json({ ok: true, data: { reference } }, { headers: { "Cache-Control": "no-store" } });
  } catch { return failure(502, "send_failed", "We could not confirm sending. Your message is still here. Retry without editing to avoid a duplicate, or email the officer team directly."); }
}
