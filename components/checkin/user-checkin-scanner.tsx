"use client";

import { useState } from "react";
import QRScanner from "./QRScanner";
import { Camera, AlertCircle } from "lucide-react";

export default function UserCheckinScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (result: string) => {
    if (result.includes("/checkin/scan/")) {
      // It's a valid event QR code, redirect to it
      window.location.href = result;
    } else {
      setError("Invalid QR code. Please scan a valid SASE Event QR.");
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 w-full text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!scanning ? (
        <button
          onClick={() => {
            setError(null);
            setScanning(true);
          }}
          className="w-full flex flex-col items-center justify-center space-y-2 bg-[#171d52] text-white p-6 rounded-xl font-bold shadow-lg hover:bg-[#5579bd] transition-all active:scale-[0.98] h-40"
        >
          <Camera className="w-12 h-12" />
          <span className="text-lg tracking-wide uppercase mt-2">Scan Event QR</span>
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
    </div>
  );
}
