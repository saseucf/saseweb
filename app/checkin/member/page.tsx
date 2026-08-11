"use client"

import { useEffect, useState } from "react";
import { createClient } from "@/lib/checkin-supabase";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';

export default function MemberDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

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
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/checkin');
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Profile Section */}
      <div className="w-full flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="font-semibold text-lg">{profile?.first_name} {profile?.last_name}</h2>
          <p className="text-sm text-muted-foreground">{profile?.major} • {profile?.year}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{profile?.total_points || 0}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Points</div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="w-full bg-card p-8 rounded-xl border border-border shadow-sm flex flex-col items-center space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold">Your Event QR Code</h3>
          <p className="text-sm text-muted-foreground">Have an admin scan this at the door.</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100">
          {userId ? (
            <QRCodeSVG 
              value={userId}
              size={250}
              level={"H"}
              includeMargin={true}
            />
          ) : null}
        </div>
        
        <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1 rounded-full border border-border/50">
          ID: {userId?.split('-')[0]}...
        </p>
      </div>

      {/* Action Buttons */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center space-x-2 p-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors font-medium border border-transparent hover:border-destructive/20"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out</span>
      </button>

    </div>
  );
}
