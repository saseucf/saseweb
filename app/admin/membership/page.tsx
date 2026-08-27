import { redirect } from "next/navigation";

import MembershipReconciliation from "@/components/admin/membership-reconciliation";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminMembershipPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin/membership");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role?.trim().toLowerCase() !== "admin") redirect("/");

  return <MembershipReconciliation />;
}
