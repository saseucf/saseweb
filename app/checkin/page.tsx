import Link from "next/link";
import { User, ShieldCheck } from "lucide-react";

export default function CheckinLandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">SASE Check-In</h1>
        <p className="text-muted-foreground">Select your portal to continue</p>
      </div>

      <div className="w-full space-y-4">
        <Link href="/checkin/login" className="block">
          <div className="w-full p-6 bg-card border border-border hover:border-primary/50 transition-colors rounded-xl shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">I'm a Member</h2>
              <p className="text-sm text-muted-foreground">Show QR to get points</p>
            </div>
          </div>
        </Link>

        <Link href="/checkin/admin/login" className="block">
          <div className="w-full p-6 bg-card border border-border hover:border-primary/50 transition-colors rounded-xl shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-secondary text-secondary-foreground rounded-full">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">I'm an Admin</h2>
              <p className="text-sm text-muted-foreground">Scan members into events</p>
            </div>
          </div>
        </Link>
      </div>

    </div>
  );
}
