import type { parseMemberInput } from "@/lib/member-tools";

type GuestInput = ReturnType<typeof parseMemberInput>;
export type GuestEvent = { status?: string | null; start_time: string; end_time: string };
export function guestCheckinIsOpen(event: GuestEvent | null) {
  return event !== null && event.status !== "cancelled";
}

export async function registerGuestAttendance(input: GuestInput, dependencies: {
  onboard: (input: GuestInput) => Promise<{ id: string; created: boolean; emailSent: boolean }>;
  attend: (id: string) => Promise<{ error: { code?: string } | null }>;
}) {
  const member = await dependencies.onboard(input);
  const { error } = await dependencies.attend(member.id);
  if (error && error.code !== "23505") throw new Error("Your account is ready, but check-in failed. Please try again or ask an officer.");
  return {
    message: error ? "You are already checked in to this event." : "You are checked in! Your participation points have been recorded.",
    emailWarning: member.created && !member.emailSent ? "Your account was created, but the welcome email could not be sent. Use Forgot password to access your account." : null,
  };
}
