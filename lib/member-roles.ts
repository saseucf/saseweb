// Existing accounts use "user"; newer accounts may use "member".
// Keep an explicit allowlist so administrator and unknown roles stay private.
export const MEMBER_PROFILE_ROLES = ["member", "user"] as const;

export function isMemberProfileRole(role: unknown) {
  return MEMBER_PROFILE_ROLES.some(memberRole => memberRole === role);
}
