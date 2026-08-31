import Link from "next/link";
import { User, ShieldCheck, QrCode } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import UserCheckinScanner from "@/components/checkin/user-checkin-scanner";

export default async function CheckinLandingPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  let role = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role;

    if (role === "admin") {
      redirect("/checkin/admin");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm mx-auto px-4">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">SASE Check-In</h1>
        <p className="text-gray-500 font-medium">Select your portal to continue</p>
      </div>

      {user && role !== "admin" ? (
        <div className="w-full space-y-6">
          <UserCheckinScanner />

          <div className="relative flex items-center py-2">
             <div className="flex-grow border-t border-border"></div>
             <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-medium uppercase tracking-widest">or</span>
             <div className="flex-grow border-t border-border"></div>
          </div>

          <Link href="/membership" className="block w-full p-4 bg-card border border-border hover:border-[#89abe3] transition-colors rounded-xl shadow-sm flex items-center justify-center space-x-3 text-foreground">
            <QrCode className="w-6 h-6" />
            <span className="font-bold">Show My Member QR</span>
          </Link>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <Link href="/membership" className="block">
            <div className="w-full p-6 bg-card border border-border hover:border-[#89abe3] transition-colors rounded-xl shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-[#e9eef8] text-[#89abe3] rounded-full">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">I&apos;m a Member</h2>
                <p className="text-sm text-gray-500">Show QR or scan an event</p>
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
      )}

    </div>
  );
}
