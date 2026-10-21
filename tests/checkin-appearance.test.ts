import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DownloadableQr from "../components/downloadable-qr";
import { appearanceStorageKey, CHECKIN_APPEARANCE_PRESETS, DEFAULT_CHECKIN_APPEARANCE, normalizeCheckinAppearance, qrColorContrast } from "../lib/checkin-appearance";

test("persisted appearance validates colors and cannot inject arbitrary CSS", () => {
  assert.deepEqual(normalizeCheckinAppearance(null), DEFAULT_CHECKIN_APPEARANCE);
  assert.deepEqual(normalizeCheckinAppearance("invalid"), DEFAULT_CHECKIN_APPEARANCE);
  const parsed = normalizeCheckinAppearance({ pageBackground: "#1122AA", pageText: "url(https://example.com)", qrForeground: "#abc", panelBackground: 123, qrBackground: "#fff5e9", extra: "ignored" });
  assert.equal(parsed.pageBackground, "#1122aa");
  assert.equal(parsed.pageText, DEFAULT_CHECKIN_APPEARANCE.pageText);
  assert.equal(parsed.qrForeground, DEFAULT_CHECKIN_APPEARANCE.qrForeground);
  assert.equal(parsed.panelBackground, DEFAULT_CHECKIN_APPEARANCE.panelBackground);
  assert.equal(parsed.qrBackground, "#fff5e9");
  assert.equal("extra" in parsed, false);
});

test("event settings are isolated, and saved colors survive a JSON round trip", () => {
  assert.notEqual(appearanceStorageKey("event-one"), appearanceStorageKey("event-two"));
  const colors = { ...DEFAULT_CHECKIN_APPEARANCE, pageBackground: "#121212", qrForeground: "#553377" };
  assert.deepEqual(normalizeCheckinAppearance(JSON.parse(JSON.stringify(colors))), colors);
  assert.deepEqual(DEFAULT_CHECKIN_APPEARANCE.pageBackground, "#ffffff");
});

test("presets retain high QR contrast; warnings can identify low-contrast or inverted colors", () => {
  for (const preset of CHECKIN_APPEARANCE_PRESETS) {
    assert.ok(qrColorContrast(preset.colors.qrForeground, preset.colors.qrBackground) >= 4.5);
  }
  assert.ok(qrColorContrast("#eeeeee", "#ffffff") < 4.5);
  assert.ok(qrColorContrast("#ffffff", "#171d52") < 4.5);
});

test("the QR SVG uses selected colors even at low contrast, with no appearance controls on the display", () => {
  const html = renderToStaticMarkup(createElement(DownloadableQr, { value: "https://sase.example/checkin/scan/event", label: "Event check-in", foreground: "#eeeeee", background: "#fff5e9" }));
  assert.match(html, /fill="#eeeeee"/);
  assert.match(html, /fill="#fff5e9"/);
  assert.doesNotMatch(html, /fill="#171d52"/);
  assert.doesNotMatch(html, /type="color"|<fieldset|Safe colors/);
  assert.match(html, /Download PNG/);
  assert.match(html, /Download SVG/);
  const display = renderToStaticMarkup(createElement(DownloadableQr, { value: "https://sase.example/checkin/scan/event", label: "Event display", foreground: "#553377", showDownloads: false }));
  assert.match(display, /fill="#553377"/);
  assert.doesNotMatch(display, /<button|Download PNG|Download SVG/);
});
