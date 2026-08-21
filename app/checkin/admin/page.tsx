"use client"

import { useEffect, useState } from "react";
import { createClient } from "@/lib/checkin-supabase";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, CheckCircle, XCircle, Camera } from "lucide-react";
import QRScanner from "@/components/checkin/QRScanner";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  
  const [scannedUser, setScannedUser] = useState<any>(null);
  const [checkInStatus, setCheckInStatus] = useState<{success: boolean; msg: string} | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      // Verify auth and admin status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/checkin/admin/login');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profile?.role !== 'admin') {
        router.replace('/checkin/admin/login');
        return;
      }

      // Fetch active events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(10);
        
      if (eventsData) {
        setEvents(eventsData);
        if (eventsData.length > 0) {
          setSelectedEvent(eventsData[0].id);
        }
      }
      
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/checkin/admin/login');
  };

  const handleScan = async (userId: string) => {
    setScanning(false);
    setCheckInLoading(true);
    setCheckInStatus(null);
    setScannedUser(null);

    // Fetch the scanned user's profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      setCheckInStatus({ success: false, msg: "Invalid QR code or user not found." });
      setCheckInLoading(false);
      return;
    }

    setScannedUser(userProfile);

    // Attempt to check them in
    if (!selectedEvent) {
      setCheckInStatus({ success: false, msg: "No event selected." });
      setCheckInLoading(false);
      return;
    }

    const { error: checkInError } = await supabase
      .from('event_attendances')
      .insert({
        event_id: selectedEvent,
        user_id: userId,
      });

    if (checkInError) {
      if (checkInError.code === '23505') { // Unique violation
        setCheckInStatus({ success: false, msg: "User is already checked in to this event." });
      } else {
        setCheckInStatus({ success: false, msg: "Failed to check in. Please try again." });
      }
    } else {
      setCheckInStatus({ success: true, msg: "Successfully checked in!" });
    }
    
    setCheckInLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      
      {/* Header */}
      <div className="w-full flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="font-bold text-lg text-primary">Admin Portal</h2>
          <p className="text-sm text-muted-foreground">Manage Event Check-Ins</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Event Selector */}
      <div className="w-full space-y-2">
        <label className="text-sm font-semibold ml-1">Select Event to Check Into:</label>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="flex h-12 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {events.length === 0 ? (
            <option value="" disabled>No events available</option>
          ) : (
            events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({new Date(evt.start_time).toLocaleDateString()})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Scanner Toggle and QR Generator */}
      <div className="w-full flex space-x-2">
        {!scanning ? (
          <button
            onClick={() => setScanning(true)}
            className="flex-1 flex items-center justify-center space-x-2 bg-primary text-primary-foreground p-4 rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]"
            disabled={!selectedEvent}
          >
            <Camera className="w-5 h-5" />
            <span>Scan Members</span>
          </button>
        ) : (
          <div className="w-full space-y-4 animate-in fade-in zoom-in-95">
            <QRScanner onScan={handleScan} />
            <button
              onClick={() => setScanning(false)}
              className="w-full p-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Cancel Scan
            </button>
          </div>
        )}

        {!scanning && (
          <button
            onClick={() => {
              if (selectedEvent) {
                window.open(`/checkin/admin/event/${selectedEvent}/qr`, '_blank');
              }
            }}
            disabled={!selectedEvent}
            className="flex items-center justify-center space-x-2 bg-secondary text-secondary-foreground p-4 rounded-xl font-bold shadow-md hover:bg-secondary/90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <span>Show Event QR</span>
          </button>
        )}
      </div>

      {/* Results / Status Card */}
      {checkInLoading && (
        <div className="w-full p-8 bg-card border border-border rounded-xl shadow-sm flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium animate-pulse">Processing check-in...</p>
        </div>
      )}

      {scannedUser && !checkInLoading && (
        <div className="w-full bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className={`p-4 flex items-center space-x-3 text-white ${checkInStatus?.success ? 'bg-green-600' : 'bg-destructive'}`}>
            {checkInStatus?.success ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            <span className="font-bold">{checkInStatus?.msg}</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{scannedUser.first_name} {scannedUser.last_name}</h3>
                <p className="text-sm text-muted-foreground">{scannedUser.email}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-primary">{scannedUser.total_points}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Pts</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/50 p-2 rounded-lg border border-border/50">
                <span className="text-muted-foreground block text-xs mb-1">Major</span>
                <span className="font-medium">{scannedUser.major || "N/A"}</span>
              </div>
              <div className="bg-muted/50 p-2 rounded-lg border border-border/50">
                <span className="text-muted-foreground block text-xs mb-1">Year</span>
                <span className="font-medium">{scannedUser.year || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
