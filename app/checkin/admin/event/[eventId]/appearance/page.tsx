"use client";

import { use } from "react";
import Link from "next/link";
import DownloadableQr from "@/components/downloadable-qr";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useEventAppearance } from "@/components/checkin/event-appearance";
import { CHECKIN_APPEARANCE_PRESETS, DEFAULT_CHECKIN_APPEARANCE, panelTextColor, qrColorContrast, type AppearanceColor } from "@/lib/checkin-appearance";

const pageFields: { key: AppearanceColor; label: string }[] = [
  { key: "pageBackground", label: "Page background" },
  { key: "pageText", label: "Page text" },
  { key: "panelBackground", label: "QR panel background" },
];
const qrFields: { key: AppearanceColor; label: string }[] = [
  { key: "qrForeground", label: "QR lines" },
  { key: "qrBackground", label: "QR background" },
];

export default function CheckinAppearancePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { appearance, updateAppearance, storageWarning, eventQrUrl } = useEventAppearance();
  const contrast = qrColorContrast(appearance.qrForeground, appearance.qrBackground);
  const renderField = ({ key, label }: { key: AppearanceColor; label: string }) => <label key={key} className="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
    <span className="text-sm font-medium">{label}</span>
    <span className="flex shrink-0 items-center gap-3">
      <span className="font-mono text-xs text-muted-foreground">{appearance[key]}</span>
      <input aria-label={label} type="color" value={appearance[key]} onChange={event => updateAppearance({ ...appearance, [key]: event.target.value })} className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-1" />
    </span>
  </label>;

  return <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
    <Link href={`/checkin/admin/event/${eventId}/qr`} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold underline underline-offset-4"><ArrowLeft size={17} aria-hidden="true" />Back to QR display</Link>
    <h1 className="mt-5 text-3xl font-bold tracking-tight">Check-in appearance</h1>
    <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-80">Choose colors for this event’s check-in display. Changes save automatically in this browser and appear on the QR page.</p>
    {storageWarning && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{storageWarning}</p>}

    <div className="mt-7 grid items-start gap-7 lg:grid-cols-[1.1fr_1fr]">
      <section className="space-y-6 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6" aria-label="Appearance settings">
        <div>
          <h2 className="text-sm font-bold">Start with a palette</h2>
          <div className="mt-3 flex flex-wrap gap-2">{CHECKIN_APPEARANCE_PRESETS.map(preset => <button key={preset.name} type="button" onClick={() => updateAppearance(preset.colors)} aria-pressed={JSON.stringify(appearance) === JSON.stringify(preset.colors)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted aria-pressed:border-foreground">
            <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: preset.colors.pageBackground }} aria-hidden="true" />{preset.name}
          </button>)}</div>
        </div>
        <fieldset className="space-y-3"><legend className="mb-3 font-bold">Page colors</legend>{pageFields.map(renderField)}</fieldset>
        <fieldset className="space-y-3"><legend className="mb-3 font-bold">QR colors</legend>{qrFields.map(renderField)}</fieldset>
        {contrast < 4.5 && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">These QR colors may be difficult to scan. Try darker lines and a lighter background. Your selected colors are still applied.</p>}
        <button type="button" onClick={() => updateAppearance({ ...DEFAULT_CHECKIN_APPEARANCE })} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold underline underline-offset-4"><RotateCcw size={16} aria-hidden="true" />Reset colors</button>
      </section>

      <section aria-label="Live display preview" className="rounded-2xl border border-current/20 p-5 text-center sm:p-8" style={{ backgroundColor: appearance.pageBackground, color: appearance.pageText }}>
        <p className="text-xs font-bold uppercase tracking-widest opacity-70">Live preview</p>
        <h2 className="mt-5 text-2xl font-black uppercase">Event check-in</h2>
        <p className="mt-2 font-bold">Scan to Check-In!</p>
        <div className="mx-auto mt-6 max-w-64 rounded-2xl p-4 shadow-lg" style={{ backgroundColor: appearance.panelBackground, color: panelTextColor(appearance.panelBackground) }}>
          <DownloadableQr value={eventQrUrl} label="QR color preview" filename={`sase-event-${eventId}`} foreground={appearance.qrForeground} background={appearance.qrBackground} />
        </div>
        <p className="mt-6 text-sm">Point your phone camera at this code to check in.</p>
        <Link href={`/checkin/admin/event/${eventId}/qr`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-current px-5 py-3 text-sm font-bold">View QR display</Link>
      </section>
    </div>
  </div>;
}
