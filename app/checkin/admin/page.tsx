"use client"

import { useEffect, useState } from "react";
import supabase from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, CheckCircle, XCircle, Camera, QrCode } from "lucide-react";
import QRScanner from "@/components/checkin/QRScanner";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [scannedUser, setScannedUser] = useState<any>(null);
  const [checkInStatus, setCheckInStatus] = useState<{success: boolean; msg: string} | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);

  const router = useRouter();

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
  }, [router]);

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
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      
      {/* Header */}
      <div className="w-full flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="font-bold text-lg text-foreground">Admin Portal</h2>
          <p className="text-sm text-muted-foreground font-medium">Manage Event Check-Ins</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Event Selector */}
      <div className="w-full space-y-2">
        <label className="text-sm font-bold text-foreground ml-1">Check-in Destination:</label>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="flex h-12 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-[#89abe3] focus:ring-2 focus:ring-[#dbe5fa]"
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
      <div className="w-full flex space-x-3">
        {!scanning ? (
          <button
            onClick={() => setScanning(true)}
            className="flex-1 flex flex-col items-center justify-center space-y-2 bg-foreground text-white p-4 rounded-xl font-bold shadow-md hover:bg-[#26355f] transition-all active:scale-[0.98] disabled:opacity-50 h-28"
            disabled={!selectedEvent}
          >
            <Camera className="w-8 h-8" />
            <span className="text-sm tracking-wide">Scan Members</span>
          </button>
        ) : (
          <div className="w-full space-y-4 animate-in fade-in zoom-in-95">
            <QRScanner onScan={handleScan} />
            <button
              onClick={() => setScanning(false)}
              className="w-full p-3 text-center text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-[#e9eef8] rounded-xl transition-colors border border-border"
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
            className="flex-1 flex flex-col items-center justify-center space-y-2 bg-card text-[#89abe3] border-2 border-[#89abe3] p-4 rounded-xl font-bold shadow-sm hover:bg-[#e9eef8] transition-all active:scale-[0.98] disabled:opacity-50 h-28"
          >
            <QrCode className="w-8 h-8" />
            <span className="text-sm tracking-wide text-center">Show Event QR</span>
          </button>
        )}
      </div>

      {/* Results / Status Card */}
      {checkInLoading && (
        <div className="w-full p-8 bg-card border border-border rounded-xl shadow-sm flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#89abe3]" />
          <p className="text-sm font-bold text-foreground animate-pulse uppercase tracking-wider">Processing check-in...</p>
        </div>
      )}

      {scannedUser && !checkInLoading && (
        <div className="w-full bg-card border border-border rounded-xl shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className={`p-4 flex items-center space-x-3 text-white ${checkInStatus?.success ? 'bg-green-600' : 'bg-red-600'}`}>
            {checkInStatus?.success ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            <span className="font-bold tracking-wide">{checkInStatus?.msg}</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-start border-b border-[#e9eef8] pb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">{scannedUser.first_name} {scannedUser.last_name}</h3>
                <p className="text-sm text-muted-foreground font-medium">{scannedUser.email}</p>
              </div>
              <div className="text-right bg-muted p-2 rounded-lg border border-[#e9eef8]">
                <div className="text-xl font-bold text-[#89abe3] leading-none">{scannedUser.total_points}</div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Total Pts</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted p-3 rounded-lg border border-[#e9eef8]">
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider mb-1">Major</span>
                <span className="font-bold text-foreground">{scannedUser.major || "N/A"}</span>
              </div>
              <div className="bg-muted p-3 rounded-lg border border-[#e9eef8]">
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider mb-1">Year</span>
                <span className="font-bold text-foreground">{scannedUser.year || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
