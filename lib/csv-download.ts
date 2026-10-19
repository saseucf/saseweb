"use client";
import { membersCsv, tableCsv } from "@/lib/member-tools";

export function saveCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename.replace(/[^a-z0-9_-]/gi, "-")}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadRows(filename: string, rows: readonly object[]) {
  saveCsv(filename, membersCsv(rows as Record<string, unknown>[]));
}

export function downloadTable(filename: string, headers: string[], rows: unknown[][]) {
  saveCsv(filename, tableCsv(headers, rows));
}
