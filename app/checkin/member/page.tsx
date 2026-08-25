"use client"

import { useEffect, useState } from "react";
import supabase from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';

export default function MemberDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/checkin');
        return;
      }
      
      setUserId(user.id);
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      setProfile(data);
      setLoading(false);
    };
    
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/checkin');
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#141b4d]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Profile Section */}
      <div className="w-full flex items-center justify-between bg-white p-5 rounded-xl border border-[#cbd5e8] shadow-sm">
        <div>
          <h2 className="font-bold text-[#141b4d] text-lg">{profile?.first_name} {profile?.last_name}</h2>
          <p className="text-sm text-[#64708c] font-medium">{profile?.major} • {profile?.year}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#89abe3]">{profile?.total_points || 0}</div>
          <div className="text-[10px] text-[#64708c] uppercase tracking-widest font-bold">Points</div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="w-full bg-white p-8 rounded-xl border border-[#cbd5e8] shadow-sm flex flex-col items-center space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-[#141b4d]">Your Event QR</h3>
          <p className="text-sm text-[#64708c] font-medium">Have an admin scan this at the door.</p>
        </div>
        
        <div className="bg-[#fbfcff] p-5 rounded-xl shadow-inner border border-[#e9eef8]">
          {userId ? (
            <QRCodeSVG 
              value={userId}
              size={230}
              level={"H"}
              includeMargin={false}
              fgColor="#141b4d"
            />
          ) : null}
        </div>
        
        <p className="text-xs text-[#89abe3] font-mono bg-[#e9eef8] px-3 py-1.5 rounded-full border border-[#cbd5e8] font-semibold">
          ID: {userId?.split('-')[0]}...
        </p>
      </div>

      {/* Action Buttons */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center space-x-2 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-bold tracking-wide uppercase text-sm border border-transparent hover:border-red-200"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out</span>
      </button>

    </div>
  );
}
