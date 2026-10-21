"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { appearanceStorageKey, DEFAULT_CHECKIN_APPEARANCE, normalizeCheckinAppearance, type CheckinAppearance } from "@/lib/checkin-appearance";

type AppearanceContext = {
  appearance: CheckinAppearance;
  updateAppearance: (value: CheckinAppearance) => void;
  storageWarning: string;
  eventQrUrl: string;
};
const Context = createContext<AppearanceContext | null>(null);

export function EventAppearanceProvider({ eventId, children }: { eventId: string; children: ReactNode }) {
  const [appearance, setAppearance] = useState({ ...DEFAULT_CHECKIN_APPEARANCE });
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState("");
  const [eventQrUrl, setEventQrUrl] = useState("");
  const key = appearanceStorageKey(eventId);

  useEffect(() => {
    setEventQrUrl(`${window.location.origin}/checkin/scan/${encodeURIComponent(eventId)}`);
    const read = () => {
      try {
        const saved = localStorage.getItem(key);
        setAppearance(normalizeCheckinAppearance(saved ? JSON.parse(saved) : null));
      } catch {
        setStorageWarning("Your browser could not load saved colors. You can still customize this display.");
      }
      setReady(true);
    };
    read();
    const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) read(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, eventId]);

  const updateAppearance = (value: CheckinAppearance) => {
    const next = normalizeCheckinAppearance(value);
    setAppearance(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setStorageWarning("");
    } catch {
      setStorageWarning("Colors apply now, but this browser could not save them for your next visit.");
    }
  };

  return <Context.Provider value={{ appearance, updateAppearance, storageWarning, eventQrUrl }}>
    <div className="min-h-[calc(100svh-78px)] w-full" style={{ backgroundColor: appearance.pageBackground, color: appearance.pageText }}>
      {ready ? children : <p role="status" className="p-8 text-center">Loading display...</p>}
    </div>
  </Context.Provider>;
}

export function useEventAppearance() {
  const value = useContext(Context);
  if (!value) throw new Error("Event appearance must be used within an event display.");
  return value;
}
