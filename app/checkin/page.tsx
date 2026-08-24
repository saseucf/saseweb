import Link from "next/link";
import { User, ShieldCheck } from "lucide-react";

export default function CheckinLandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm mx-auto">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#171d52]">SASE Check-In</h1>
        <p className="text-gray-500 font-medium">Select your portal to continue</p>
      </div>

      <div className="w-full space-y-4">
        <Link href="/login?redirect=/checkin/member" className="block">
          <div className="w-full p-6 bg-white border border-[#cbd5e8] hover:border-[#5579bd] transition-colors rounded-xl shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-[#e9eef8] text-[#5579bd] rounded-full">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#171d52]">I&apos;m a Member</h2>
              <p className="text-sm text-gray-500">Show QR to get points</p>
            </div>
          </div>
        </Link>

        <Link href="/checkin/admin/login" className="block">
          <div className="w-full p-6 bg-white border border-[#cbd5e8] hover:border-[#171d52] transition-colors rounded-xl shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-[#171d52] text-[#fffde9] rounded-full">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#171d52]">I&apos;m an Admin</h2>
              <p className="text-sm text-gray-500">Scan members into events</p>
            </div>
          </div>
        </Link>
      </div>

    </div>
  );
}
