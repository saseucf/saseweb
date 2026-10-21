"use client";
import { QRCodeSVG } from "qrcode.react";
import React, { useRef, useState } from "react";
import { normalizeCheckinAppearance } from "@/lib/checkin-appearance";

export default function DownloadableQr({ value, label, filename = "sase-qr", foreground = "#171d52", background = "#ffffff", showDownloads = true }: { value: string; label: string; filename?: string; foreground?: string; background?: string; showDownloads?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const colors = normalizeCheckinAppearance({ qrForeground: foreground, qrBackground: background });
  function save(blob: Blob, extension: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${filename.replace(/[^a-z0-9_-]/gi, "-")}.${extension}`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function download(format: "svg" | "png") {
    const svg = root.current?.querySelector("svg");
    if (!svg) return;
    setError("");
    const copy = svg.cloneNode(true) as SVGElement;
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    copy.setAttribute("width", "1200"); copy.setAttribute("height", "1200");
    const blob = new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml;charset=utf-8" });
    if (format === "svg") { save(blob, "svg"); return; }
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1200;
      canvas.getContext("2d")?.drawImage(image, 0, 0, 1200, 1200);
      URL.revokeObjectURL(url);
      canvas.toBlob(result => result ? save(result, "png") : setError("Unable to save PNG. Please download SVG."), "image/png");
    };
    image.onerror = () => { URL.revokeObjectURL(url); setError("Unable to save PNG. Please download SVG."); };
    image.src = url;
  }
  return <div className="w-full">
    <div ref={root}><QRCodeSVG value={value} title={label} size={300} level="H" marginSize={4} fgColor={colors.qrForeground} bgColor={colors.qrBackground} className="h-auto w-full" /></div>
    {showDownloads && <div className="mt-4 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => download("png")} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold text-foreground">Download PNG</button><button type="button" onClick={() => download("svg")} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold text-foreground">Download SVG</button></div>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </div>;
}
