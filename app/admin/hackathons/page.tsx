import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminAuthorization } from "@/lib/admin-membership";
import { createServerSupabase } from "@/lib/supabase-server";
import HackathonManager from "@/components/admin/hackathon-manager";

export const dynamic = "force-dynamic";

export default async function HackathonsPage() {
  const authorization = await getAdminAuthorization();
  if (authorization.status !== "authorized") redirect("/login");
  const { data, error } = await createServerSupabase().from("hackathons")
    .select("id,name,slug,discord_channel_id,discord_role_id").order("name");
  return <main className="sase-page sase-admin-page pt-[120px]">
    <div className="sase-page-header">
      <p className="sase-eyebrow">UCF SASE / Admin workspace</p>
      <h1>Manage Hackathons</h1>
      <p className="mt-2 text-muted-foreground">Create a hackathon and choose where its session reminders go.</p>
      <Link href="/admin/events" className="sase-secondary-button mt-4 inline-flex">Back to events</Link>
    </div>
    {error ? <p role="alert">Could not load hackathons. Apply the hackathon migration in Supabase, then refresh.</p>
      : <HackathonManager hackathons={data ?? []} />}
  </main>;
}
