import { createHash } from "node:crypto";
import { createMemberFromProfile, type JoinProfile } from "@/lib/unified-auth";

type RegistrationDependencies = {
  claimAttempt: (fingerprint: string) => Promise<{ data: unknown; error: unknown }>;
  createUser: (input: { email: string; password: string; email_confirm: true; user_metadata: JoinProfile & { signup_profile_complete: true } }) => Promise<{ error: unknown }>;
};

export async function registerMember(body: Record<string, unknown>, ip: string | undefined, dependencies: RegistrationDependencies) {
  return createMemberFromProfile(body, "", async credentials => {
    for (const value of [credentials.email, ...(ip ? [ip] : [])]) {
      const fingerprint = `signup:${createHash("sha256").update(value).digest("hex")}`;
      const { data: allowed, error } = await dependencies.claimAttempt(fingerprint);
      if (error) return { status: 503, error: "Account creation is temporarily unavailable." };
      if (allowed !== true) return { status: 429, error: "Too many attempts. Please try again in ten minutes." };
    }
    const { error } = await dependencies.createUser({
      email: credentials.email, password: credentials.password,
      email_confirm: true, user_metadata: credentials.options.data,
    });
    if (error) return { status: 400, error: "Unable to create this account. If you already joined, sign in or use Forgot password." };
    return { status: 201, success: true };
  });
}
