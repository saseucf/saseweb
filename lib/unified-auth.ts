export type JoinProfile = { first_name: string; last_name: string; major: string; year: string; school: string };

export function parseJoinProfile(value: Record<string, unknown>): JoinProfile {
  const field = (key: string, label: string, limit: number) => {
    const text = typeof value[key] === "string" ? value[key].trim() : "";
    if (!text || text.length > limit) throw new Error(`Enter ${label} (up to ${limit} characters).`);
    return text;
  };
  const year = field("year", "your graduation year", 4);
  if (!/^\d{4}$/.test(year) || Number(year) < 2000 || Number(year) > 2200) throw new Error("Enter a four-digit graduation year between 2000 and 2200.");
  return { first_name: field("first_name", "your first name", 100), last_name: field("last_name", "your last name", 100), major: field("major", "your major", 150), year, school: field("school", "your school", 150) };
}

export function passwordNextStep(error: { code?: string } | null) {
  if (!error) return "signed-in";
  // Supabase intentionally uses the same error for an unknown email and an
  // incorrect password. Offering setup does not grant a session to either.
  if (error.code === "invalid_credentials" || error.code === "invalid_login_credentials") return "profile";
  if (error.code === "email_not_confirmed") return "verify";
  return "error";
}

export function profileIsComplete(profile: Record<string, unknown> | null) {
  if (!profile?.name_confirmed) return false;
  try { parseJoinProfile(profile); return true; } catch { return false; }
}

export async function createMemberFromProfile<T>(input: Record<string, unknown>, callbackUrl: string, signUp: (credentials: {
  email: string; password: string;
  options: { emailRedirectTo: string; data: JoinProfile & { signup_profile_complete: true } };
}) => Promise<T>) {
  const details = parseJoinProfile(input);
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (password.length < 8) throw new Error("Choose a password with at least 8 characters.");
  return signUp({ email, password, options: { emailRedirectTo: callbackUrl, data: { ...details, signup_profile_complete: true } } });
}
