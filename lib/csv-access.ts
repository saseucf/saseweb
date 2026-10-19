export class AdminCsvAccessError extends Error {
  constructor() { super("Administrator access is required to download CSV files."); }
}

export async function canDownloadCsv(fetcher: typeof fetch = fetch, signal?: AbortSignal) {
  const response = await fetcher("/api/admin/export-access", { cache: "no-store", signal });
  if (!response.ok) return false;
  const result = await response.json();
  return result?.isAdmin === true;
}

export async function assertAdminCsvAccess(fetcher: typeof fetch = fetch) {
  if (!await canDownloadCsv(fetcher)) throw new AdminCsvAccessError();
}
