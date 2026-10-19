"use client";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";

function luminance(hex: string) {
  const values = hex.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
}

export default function DownloadableQr({ value, label, filename = "sase-qr", customizable = false }: { value: string; label: string; filename?: string; customizable?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [foreground, setForeground] = useState("#171d52");
  const [background, setBackground] = useState("#ffffff");
  const [error, setError] = useState("");
  const contrast = (luminance(background) + .05) / (luminance(foreground) + .05);
  const safe = contrast >= 4.5;
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
    <div ref={root}><QRCodeSVG value={value} title={label} size={300} level="H" marginSize={4} fgColor={safe ? foreground : "#171d52"} bgColor={safe ? background : "#ffffff"} className="h-auto w-full" /></div>
    {customizable && <fieldset className="mt-5 flex flex-wrap gap-4 text-sm"><legend className="mb-2 font-bold">QR colors</legend>
      <label className="flex items-center gap-2">Lines<input aria-label="QR line color" type="color" value={foreground} onChange={event => setForeground(event.target.value)} /></label>
      <label className="flex items-center gap-2">Background<input aria-label="QR background color" type="color" value={background} onChange={event => setBackground(event.target.value)} /></label>
    </fieldset>}
    {!safe && <p role="status" className="mt-2 text-sm text-amber-800">Choose darker lines and a lighter background. Safe colors are shown until contrast improves.</p>}
    <div className="mt-4 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => download("png")} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold">Download PNG</button><button type="button" onClick={() => download("svg")} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold">Download SVG</button></div>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </div>;
}
