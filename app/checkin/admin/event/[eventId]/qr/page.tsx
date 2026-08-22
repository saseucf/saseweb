"use client"

import { useEffect, useState } from "react";
import { createClient } from "@/lib/checkin-supabase";
import { QRCodeSVG } from 'qrcode.react';
import React from "react";
import { Loader2 } from "lucide-react";

export default function AdminEventQRPage({ params }: { params: Promise<{ eventId: string }> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState("");
  
  const supabase = createClient();
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
      setLoading(false);
    };
    init();
  }, [eventId, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center flex-col">
        <h1 className="text-2xl font-bold text-destructive">Event not found</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-5xl font-black text-primary tracking-tight">{event.title}</h1>
        <p className="text-2xl text-muted-foreground">Scan to Check-In!</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-primary/20 animate-in zoom-in duration-700">
        <QRCodeSVG 
          value={qrUrl}
          size={500}
          level={"H"}
          includeMargin={false}
        />
      </div>
      
      <div className="mt-12 text-center text-muted-foreground font-medium">
        <p>Point your phone camera at this code to automatically check in.</p>
      </div>
    </div>
  );
}
