"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { downloadRows } from "@/lib/csv-download";

type Props = { filename: string; label?: string; disabled?: boolean } & (
  { rows: readonly object[]; endpoint?: never } | { endpoint: string; rows?: never }
);

export default function CsvDownloadButton({ filename, label = "Download CSV", rows, endpoint, disabled = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    setError("");
    if (rows) { downloadRows(filename, rows); return; }
    if (!endpoint) return;
    setBusy(true);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error((await response.json()).error || "Download failed.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = `${filename}.csv`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setError(error instanceof Error ? error.message : "Download failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="my-3">
    <button type="button" onClick={download} disabled={disabled || busy || (rows !== undefined && rows.length === 0)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
      <Download size={16} aria-hidden="true" />{busy ? "Preparing CSV…" : label}
    </button>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </div>;
}
