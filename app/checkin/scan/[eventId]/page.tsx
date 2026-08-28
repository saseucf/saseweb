"use client"

import { useEffect, useState } from "react";
import supabase from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import React from "react";

export default function MemberSelfCheckIn({ params }: { params: Promise<{ eventId: string }> }) {
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [event, setEvent] = useState<any>(null);
  const [status, setStatus] = useState<{success: boolean; msg: string} | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const router = useRouter();
  const { eventId } = React.use(params);

  useEffect(() => {
    const init = async () => {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login, then come back here
        router.replace(`/checkin/login?redirect=/checkin/scan/${eventId}`);
        return;
      }

      setUserId(user.id);

      // Fetch event
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !eventData) {
        setStatus({ success: false, msg: "Event not found." });
      } else {
        setEvent(eventData);
      }
      
      setLoading(false);
    };

    init();
  }, [eventId, router]);

  const handleCheckIn = async () => {
    if (!userId || !event) return;
    
    setCheckingIn(true);
    setStatus(null);

    const { error } = await supabase
      .from('event_attendances')
      .insert({
        event_id: event.id,
        user_id: userId,
      });

    if (error) {
      if (error.code === '23505') {
        setStatus({ success: false, msg: "You are already checked in!" });
      } else {
        setStatus({ success: false, msg: "Failed to check in. Please try again." });
      }
    } else {
      setStatus({ success: true, msg: "Successfully checked in to " + event.title + "!" });
    }
    
    setCheckingIn(false);
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#171d52]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {status ? (
        <div className="w-full max-w-sm p-8 bg-card border border-border rounded-xl shadow-lg flex flex-col items-center justify-center space-y-6 text-center animate-in zoom-in-95">
          {status.success ? (
            <div className="bg-green-100 text-green-700 p-4 rounded-full">
              <CheckCircle className="w-12 h-12" />
            </div>
          ) : (
            <div className="bg-red-50 text-red-600 p-4 rounded-full">
              <XCircle className="w-12 h-12" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-[#171d52]">{status.success ? "Checked In!" : "Check-In Failed"}</h2>
            <p className="text-muted-foreground font-medium mt-2">{status.msg}</p>
          </div>
          <button
            onClick={() => router.push('/membership')}
            className="w-full bg-[#171d52] text-white py-3 rounded-lg font-bold hover:bg-[#5579bd] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      ) : event ? (
        <div className="w-full max-w-sm p-8 bg-card border border-border rounded-xl shadow-lg flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#171d52]">Event Check-In</h1>
            <p className="text-muted-foreground font-medium">You are checking into:</p>
            <h2 className="text-xl font-bold text-[#5579bd] mt-2">{event.title}</h2>
            <p className="text-sm font-bold bg-[#171d52] text-[#fffde9] inline-block px-3 py-1 rounded-full mt-2">
              +{event.points} Points
            </p>
          </div>

          <button
            onClick={handleCheckIn}
            disabled={checkingIn}
            className="w-full bg-[#5579bd] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-[#171d52] transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
          >
            {checkingIn ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
            Confirm Check-In
          </button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold text-[#171d52]">Event Not Found</h2>
          <button onClick={() => router.push('/membership')} className="text-[#5579bd] font-bold hover:underline">
            Return to Dashboard
          </button>
        </div>
      )}

    </div>
  );
}
