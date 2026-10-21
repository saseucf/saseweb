"use client"

import { useEffect, useState } from "react";
import supabase from "@/lib/auth";
import DownloadableQr from "@/components/downloadable-qr";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Palette } from "lucide-react";
import { useEventAppearance } from "@/components/checkin/event-appearance";
import { panelTextColor } from "@/lib/checkin-appearance";
import styles from "./qr-display.module.css";

export default function AdminEventQRPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [event, setEvent] = useState<{ id: string; title: string } | null>(null);
  const { appearance } = useEventAppearance();
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState("");
  const [checkInCount, setCheckInCount] = useState(0);

  const { eventId } = React.use(params);

  useEffect(() => {
    const init = async () => {
      // Fetch event details
      const { data } = await supabase
        .from('events')
        .select('id, title')
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
      <div className="flex min-h-[calc(100svh-78px)] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-[calc(100svh-78px)] items-center justify-center flex-col">
        <h1 className="text-2xl font-bold">Event not found</h1>
      </div>
    );
  }

  return (
    <div className={styles.display} data-event-qr-display>
      <nav className={styles.toolbar} aria-label="QR display actions">
        <Link href="/checkin/admin"><ArrowLeft size={16} aria-hidden="true" />Check-in</Link>
        <Link href={`/checkin/admin/event/${eventId}/appearance`}><Palette size={16} aria-hidden="true" />Appearance</Link>
      </nav>
      <div className={styles.content}>
        <div className={styles.copy}>
          <h1 className={styles.title} title={event.title}>{event.title}</h1>
          <p className={styles.subtitle}>Scan to Check-In!</p>
          <p className={styles.instructions}>Point your phone camera at this code to check in. Guests are welcome.</p>
          <div className={styles.counter} style={{ backgroundColor: appearance.panelBackground, color: panelTextColor(appearance.panelBackground) }}>
            <strong>{checkInCount}</strong><span>{checkInCount === 1 ? 'member' : 'members'} checked in</span>
          </div>
        </div>
        <div className={styles.qrArea}>
          <div className={styles.panel} style={{ backgroundColor: appearance.panelBackground, color: panelTextColor(appearance.panelBackground) }}>
            <DownloadableQr value={qrUrl} label={`Check in to ${event.title}`} filename={`sase-event-${event.id}`} foreground={appearance.qrForeground} background={appearance.qrBackground} showDownloads={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
