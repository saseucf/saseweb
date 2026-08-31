"use client"

import { useEffect, useState } from "react";
import supabase from "@/lib/auth";
import { QRCodeSVG } from 'qrcode.react';
import React from "react";
import { Loader2 } from "lucide-react";

export default function AdminEventQRPage({ params }: { params: Promise<{ eventId: string }> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState("");
  const [checkInCount, setCheckInCount] = useState(0);

  const { eventId } = React.use(params);

  useEffect(() => {
    const init = async () => {
      // Fetch event details
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
        
      if (data) {
        setEvent(data);
        // Build the URL for the member to scan. 
        // We use window.location.origin to get the current base URL (e.g., https://sase-web.vercel.app)
        setQrUrl(`${window.location.origin}/checkin/scan/${data.id}`);
      }

      // Fetch initial checkin count
      const { count } = await supabase
        .from('event_attendances')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
      
      setCheckInCount(count || 0);

      // Subscribe to real-time changes
      const channel = supabase.channel('realtime_checkins')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'event_attendances', filter: `event_id=eq.${eventId}` },
          () => {
            setCheckInCount((prev) => prev + 1);
          }
        )
        .subscribe();

      setLoading(false);

      return () => {
         supabase.removeChannel(channel);
      };
    };
    const cleanup = init();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-[#171d52]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center flex-col bg-background">
        <h1 className="text-2xl font-bold text-red-600">Event not found</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-8 gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#171d52] tracking-tight uppercase leading-tight">{event.title}</h1>
        <p className="text-lg sm:text-2xl text-[#5579bd] font-bold">Scan to Check-In!</p>
      </div>

      {/* QR code box: fills the available screen space */}
      <div className="bg-[#fffde9] p-4 sm:p-8 rounded-3xl shadow-2xl border-4 border-[#171d52] w-full max-w-[min(80vw,80vh,480px)] aspect-square flex items-center justify-center">
        <QRCodeSVG 
          value={qrUrl}
          size={undefined}
          style={{ width: "100%", height: "100%", maxWidth: "100%", maxHeight: "100%" }}
          level={"H"}
          includeMargin={false}
          fgColor="#171d52"
          bgColor="#fffde9"
        />
      </div>
      
      <div className="text-center">
        <p className="text-muted-foreground font-bold tracking-wide uppercase text-xs sm:text-sm mb-4">
          Point your phone camera at this code to automatically check in.
        </p>
        <div className="inline-flex items-center gap-3 bg-[#e9eef8] px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-[#89abe3] shadow-inner">
          <span className="text-[#171d52] font-black text-base sm:text-xl">
            {checkInCount} {checkInCount === 1 ? 'member has' : 'members have'} checked in
          </span>
        </div>
      </div>
    </div>
  );
}
