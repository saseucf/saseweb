export const DEFAULT_CHECKIN_APPEARANCE = {
  pageBackground: "#ffffff",
  pageText: "#171d52",
  panelBackground: "#ffffff",
  qrForeground: "#171d52",
  qrBackground: "#ffffff",
};

export type CheckinAppearance = typeof DEFAULT_CHECKIN_APPEARANCE;
export type AppearanceColor = keyof CheckinAppearance;

export function normalizeCheckinAppearance(value: unknown): CheckinAppearance {
  const result = { ...DEFAULT_CHECKIN_APPEARANCE };
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const key of Object.keys(result) as AppearanceColor[]) {
    const color = (value as Record<string, unknown>)[key];
    if (typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)) result[key] = color.toLowerCase();
  }
  return result;
}

export function appearanceStorageKey(eventId: string) {
  return `sase:checkin-appearance:${eventId}`;
}

function luminance(hex: string) {
  const rgb = hex.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

export function qrColorContrast(foreground: string, background: string) {
  // Direction matters for QR scanning: dark modules on a light background.
  return (luminance(background) + .05) / (luminance(foreground) + .05);
}

export function panelTextColor(background: string) {
  return luminance(background) > .179 ? "#171d52" : "#ffffff";
}

export const CHECKIN_APPEARANCE_PRESETS: { name: string; colors: CheckinAppearance }[] = [
  { name: "Classic", colors: DEFAULT_CHECKIN_APPEARANCE },
  { name: "Midnight", colors: { pageBackground: "#141b4d", pageText: "#ffffff", panelBackground: "#24336e", qrForeground: "#141b4d", qrBackground: "#ffffff" } },
  { name: "Warm", colors: { pageBackground: "#fff5e9", pageText: "#542c32", panelBackground: "#ffffff", qrForeground: "#542c32", qrBackground: "#fffaf4" } },
];
