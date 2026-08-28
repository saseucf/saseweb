const AUTH_ENTRY_PATHS = new Set([
  "/auth/callback",
  "/confirm-name",
  "/login",
  "/checkin/login",
  "/checkin/admin/login",
]);

const MAX_REDIRECT_LENGTH = 2_048;
const INTERNAL_ORIGIN = "https://sase.local";

export const DEFAULT_MEMBER_DESTINATION = "/membership";

export function getSafeAuthRedirect(value: string | null | undefined, fallback = "/") {
  if (
    !value ||
    value.length > MAX_REDIRECT_LENGTH ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }

  try {
    const url = new URL(value, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN || AUTH_ENTRY_PATHS.has(url.pathname)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
