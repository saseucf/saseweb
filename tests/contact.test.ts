import assert from "node:assert/strict";
import test from "node:test";
import { CONTACT_EMAIL, EMPTY_CONTACT, contactDraftHref, validateContact } from "../lib/contact";
import { CONTACT_BODY_LIMIT, handleContact, readContactConfiguration, type ContactConfiguration } from "../lib/contact-handler";

const config: ContactConfiguration = { apiKey: "test-key", from: "hello@example.org", siteKey: "site-key", secretKey: "secret-key", origins: ["https://sase.example"] };
const payload = { ...EMPTY_CONTACT, name: "Test Student", email: "student@example.org", subject: "Check-in help", message: "The camera does not open.", company: "", token: "valid-token", submissionId: "2ed0909e-433d-4b23-bf9d-30e2bd1456ff" };
function request(overrides = {}, headers = {}) {
  return new Request("https://sase.example/api/contact", { method: "POST", headers: { "Content-Type": "application/json", Origin: config.origins[0], ...headers }, body: JSON.stringify({ ...payload, ...overrides }) });
}
function transport(verification: unknown = { success: true, action: "contact", hostname: "sase.example" }, sendStatus = 200, sendBody: unknown = { id: "provider-id" }) {
  const calls: { url: string; options: RequestInit }[] = [];
  const fetcher: typeof fetch = async (url, options) => {
    calls.push({ url: String(url), options: options! });
    return String(url).includes("siteverify") ? Response.json(verification) : Response.json(sendBody, { status: sendStatus });
  };
  return { calls, fetcher };
}

test("contact sends to the officer inbox with a validated Reply-To and readable plain text", async () => {
  const { calls, fetcher } = transport();
  const response = await handleContact(request({ to: "attacker@example.org", from: "attacker@example.org", topic: "website", page: "/checkin", steps: "1. Open check-in\n2. Tap Scan" }), config, fetcher);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { ok: true, data: { reference: payload.submissionId } });
  assert.equal(calls.length, 2);
  const email = JSON.parse(String(calls[1].options.body));
  assert.deepEqual(email.to, [CONTACT_EMAIL]);
  assert.equal(email.from, "UCF SASE <hello@example.org>");
  assert.equal(email.reply_to, payload.email);
  assert.equal(email.subject, "[SASE Website problem] Check-in help");
  assert.match(email.text, /Affected page: \/checkin/);
  assert.match(email.text, /1\. Open check-in\n2\. Tap Scan/);
  assert.equal(email.html, undefined);
  assert.ok(calls.every(call => call.options.signal instanceof AbortSignal));
});

test("identical retries keep the same provider key and body after a fresh challenge", async () => {
  const { calls, fetcher } = transport();
  await handleContact(request(), config, fetcher);
  await handleContact(request({ token: "fresh-token" }), config, fetcher);
  const sends = calls.filter(call => call.url.includes("resend.com"));
  assert.equal(sends[0].options.body, sends[1].options.body);
  assert.equal(new Headers(sends[0].options.headers).get("Idempotency-Key"), `contact/${payload.submissionId}`);
  assert.equal(new Headers(sends[0].options.headers).get("Idempotency-Key"), new Headers(sends[1].options.headers).get("Idempotency-Key"));
});

test("missing or invalid configuration never pretends that mail was sent", async () => {
  const { calls, fetcher } = transport();
  const response = await handleContact(request(), null, fetcher);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.kind, "not_configured");
  assert.equal(calls.length, 0);
  assert.equal(readContactConfiguration({}), null);
  const env = { RESEND_API_KEY: "key", CONTACT_FROM_EMAIL: "hello@example.org", CONTACT_TURNSTILE_SITE_KEY: "site-key", CONTACT_TURNSTILE_SECRET_KEY: "secret-key", CONTACT_ALLOWED_ORIGINS: "https://sase.example,http://localhost:3001" };
  assert.equal(readContactConfiguration(env)?.origins.length, 2);
  for (const origin of ["https://sase.example/contact", "*", "http://evil.example", "https://sase.example/", "https://user:pass@sase.example"]) assert.equal(readContactConfiguration({ ...env, CONTACT_ALLOWED_ORIGINS: origin }), null);
  assert.equal(readContactConfiguration({ ...env, CONTACT_FROM_EMAIL: "UCF SASE <hello@example.org>" }), null);
  assert.equal(readContactConfiguration({ ...env, NODE_ENV: "production", CONTACT_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" }), null);
});

test("only same-site JSON submissions from configured origins are accepted", async () => {
  const { calls, fetcher } = transport();
  for (const origin of ["https://evil.example", "null", ""]) assert.equal((await handleContact(request({}, { Origin: origin }), config, fetcher)).status, 403);
  assert.equal((await handleContact(request({}, { "sec-fetch-site": "cross-site" }), config, fetcher)).status, 403);
  assert.equal((await handleContact(request({}, { "Content-Type": "text/plain" }), config, fetcher)).status, 415);
  assert.equal((await handleContact(new Request("https://sase.example/api/contact"), config, fetcher)).status, 405);
  assert.equal(calls.length, 0);
});

test("invalid fields, header injection, spam fields and IDs fail before providers are called", async () => {
  const { calls, fetcher } = transport();
  const invalid = [
    { name: "" }, { name: 123 }, { subject: "hello\r\nBcc: victim@example.org" },
    { email: "a@example.org\n" }, { email: "two@example.org,other@example.org" }, { email: "<a@example.org>" },
    { subject: "x".repeat(141) }, { message: "x".repeat(4001) }, { message: "\u0000" },
    { topic: "unknown" }, { topic: "__proto__" }, { token: "" }, { token: "x".repeat(2049) },
    { company: "autofilled" }, { company: null }, { submissionId: "a" },
    { topic: "website", page: "https://evil.example" }, { topic: "website", page: "/reset?token=secret" },
    { topic: "website", page: "/reset#secret" }, { topic: "website", page: "//evil.example" },
  ];
  for (const value of invalid) assert.equal((await handleContact(request(value), config, fetcher)).status, 400, JSON.stringify(value));
  assert.equal(calls.length, 0);
});

test("malformed and oversized bodies are rejected, including streamed bodies without Content-Length", async () => {
  const { calls, fetcher } = transport();
  const headers = { Origin: config.origins[0], "Content-Type": "application/json" };
  for (const body of ["{", "null", "[]"]) {
    assert.equal((await handleContact(new Request("https://sase.example/api/contact", { method: "POST", headers, body }), config, fetcher)).status, 400);
  }
  assert.equal((await handleContact(request({}, { "Content-Length": String(CONTACT_BODY_LIMIT + 1) }), config, fetcher)).status, 413);
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(20000)); controller.enqueue(new Uint8Array(20000)); controller.close(); } });
  const streamed = new Request("https://sase.example/api/contact", { method: "POST", headers, body: stream, duplex: "half" } as RequestInit);
  assert.equal((await handleContact(streamed, config, fetcher)).status, 413);
  assert.equal(calls.length, 0);
});

test("expired, wrong-host and wrong-action verification never sends an email", async () => {
  for (const verification of [{ success: false, "error-codes": ["timeout-or-duplicate"] }, { success: true, action: "login", hostname: "sase.example" }, { success: true, action: "contact", hostname: "evil.example" }, {}, null]) {
    const { calls, fetcher } = transport(verification);
    assert.equal((await handleContact(request(), config, fetcher)).status, 400);
    assert.equal(calls.length, 1);
  }
});

test("verification transport failure does not expose errors or send", async () => {
  const fetcher: typeof fetch = async () => { throw new Error("secret provider information"); };
  const response = await handleContact(request(), config, fetcher);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret provider/);
  const malformed: typeof fetch = async () => new Response("not-json");
  assert.equal((await handleContact(request(), config, malformed)).status, 503);
});

test("delivery errors, malformed success, conflicts and throttling are truthful and safe", async () => {
  for (const [providerStatus, responseStatus, body] of [[500, 502, { message: "private provider error" }], [401, 502, {}], [200, 502, {}], [200, 502, { id: true }], [200, 502, { id: " " }], [429, 429, {}], [409, 409, {}]] as const) {
    const { fetcher } = transport(undefined, providerStatus, body);
    const response = await handleContact(request(), config, fetcher);
    assert.equal(response.status, responseStatus);
    assert.equal((await response.clone().json()).ok, false);
    assert.doesNotMatch(await response.text(), /private provider error/);
    if (providerStatus === 429) assert.equal(response.headers.get("retry-after"), "60");
  }
  const fetcher: typeof fetch = async url => {
    if (String(url).includes("siteverify")) return Response.json({ success: true, action: "contact", hostname: "sase.example" });
    throw new DOMException("Timeout", "TimeoutError");
  };
  assert.equal((await handleContact(request(), config, fetcher)).status, 502);
});

test("shared validation normalizes content and drafts preserve user-entered text safely", () => {
  const parsed = validateContact({ ...payload, name: " Test Student ", message: "first\r\nsecond", page: "/events", steps: "old hidden details" });
  assert.ok(parsed.ok);
  assert.equal(parsed.data.name, "Test Student");
  assert.equal(parsed.data.message, "first\nsecond");
  assert.equal(parsed.data.page, "");
  assert.equal(parsed.data.steps, "");
  const draft = new URL(contactDraftHref({ ...parsed.data, message: "Hello & thanks? #SASE" }));
  assert.equal(draft.pathname, CONTACT_EMAIL);
  assert.match(draft.searchParams.get("body")!, /Hello & thanks\? #SASE/);
});
