"use client";
import { membersCsv, tableCsv } from "@/lib/member-tools";
import { assertAdminCsvAccess } from "@/lib/csv-access";

export async function saveCsv(filename: string, csv: string) {
  await assertAdminCsvAccess();
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename.replace(/[^a-z0-9_-]/gi, "-")}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadRows(filename: string, rows: readonly object[]) {
  await saveCsv(filename, membersCsv(rows as Record<string, unknown>[]));
}

export async function downloadTable(filename: string, headers: string[], rows: unknown[][]) {
  await saveCsv(filename, tableCsv(headers, rows));
}
