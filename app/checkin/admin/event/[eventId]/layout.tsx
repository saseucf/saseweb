"use client";

import { use, type ReactNode } from "react";
import { EventAppearanceProvider } from "@/components/checkin/event-appearance";

export default function EventDisplayLayout({ children, params }: { children: ReactNode; params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  return <EventAppearanceProvider key={eventId} eventId={eventId}>{children}</EventAppearanceProvider>;
}
