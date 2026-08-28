import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import MemberProfileForm from "@/components/membership/member-profile-form";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function MembershipProfilePage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/membership/profile");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("email, first_name, last_name, major, phone_number, school, year")
    .eq("id", user.id)
    .single();

  return (
    <main className="sase-page" style={{ paddingTop: "120px" }}>
      <div className="sase-page-header">
        <p className="sase-eyebrow !text-[#4266a4] dark:!text-[#89abe3]">UCF SASE / Membership</p>
        <h1>Update your details</h1>
        <p className="!text-muted-foreground">Keep your member information current so officers can identify payments and event attendance.</p>
      </div>

      {error || !profile ? (
        <section className="mx-auto mt-12 flex max-w-[1180px] items-start gap-4 border border-destructive/35 bg-destructive/10 p-5" role="alert">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <h2 className="font-bold">Profile unavailable</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Your details could not be loaded. Return to Membership and try again.
            </p>
            <Link href="/membership" className="mt-4 inline-flex min-h-11 items-center font-bold text-[#4266a4] underline underline-offset-4 dark:text-[#89abe3]">
              Return to Membership
            </Link>
          </div>
        </section>
      ) : (
        <section className="mx-auto mt-12 max-w-2xl border border-border bg-card p-5 sm:p-8" aria-labelledby="member-profile-form-heading">
          <h2 id="member-profile-form-heading" className="text-xl font-black tracking-tight">
            Member information
          </h2>
          <MemberProfileForm
            profile={{
              email: profile.email || user.email || "",
              firstName: profile.first_name || "",
              lastName: profile.last_name || "",
              major: profile.major || "",
              phoneNumber: profile.phone_number || "",
              school: profile.school || "",
              graduationYear: profile.year || "",
            }}
          />
        </section>
      )}
    </main>
  );
}
