import { redirect } from "next/navigation";
import { DEFAULT_MEMBER_DESTINATION, getSafeAuthRedirect } from "@/lib/auth-redirect";
export default async function AccessRedirect({ searchParams }: { searchParams: Promise<{ redirect?: string | string[] }> }) {
  const query = await searchParams;
  const destination = getSafeAuthRedirect(typeof query.redirect === "string" ? query.redirect : null, DEFAULT_MEMBER_DESTINATION);
  redirect(`/login?redirect=${encodeURIComponent(destination)}`);
}
