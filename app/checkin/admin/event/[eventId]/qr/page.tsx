"use client"

import { useEffect, useState } from "react";
import supabase from "@/lib/auth";
import DownloadableQr from "@/components/downloadable-qr";
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

      <div className="w-full max-w-[480px] rounded-3xl border border-border bg-card p-5 shadow-xl">
        <DownloadableQr value={qrUrl} label={`Check in to ${event.title}`} filename={`sase-event-${event.id}`} customizable />
      </div>

      <div className="text-center">
        <p className="text-muted-foreground font-bold tracking-wide uppercase text-xs sm:text-sm mb-4">
          Point your phone camera at this code to check in. Guests are welcome.
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
