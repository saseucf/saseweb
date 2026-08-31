import Link from "next/link";
import { User, ShieldCheck } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function CheckinLandingPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      redirect("/checkin/admin");
    } else {
      redirect("/membership");
    }
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm mx-auto">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">SASE Check-In</h1>
        <p className="text-gray-500 font-medium">Select your portal to continue</p>
      </div>

      <div className="w-full space-y-4">
        <Link href="/membership" className="block">
          <div className="w-full p-6 bg-card border border-border hover:border-[#89abe3] transition-colors rounded-xl shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-[#e9eef8] text-[#89abe3] rounded-full">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">I&apos;m a Member</h2>
              <p className="text-sm text-gray-500">Show QR to get points</p>
            </div>
          </div>
        </Link>

        <Link href="/checkin/admin/login" className="block">
          <div className="w-full p-6 bg-card border border-border hover:border-foreground transition-colors rounded-xl shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-foreground text-background rounded-full">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">I&apos;m an Admin</h2>
              <p className="text-sm text-gray-500">Scan members into events</p>
            </div>
          </div>
        </Link>
      </div>

    </div>
  );
}
