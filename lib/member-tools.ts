export function parseMemberInput(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Enter your name and email.");
  const input = value as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const [given, ...family] = fullName.split(/\s+/);
  const firstName = typeof input.firstName === "string" ? input.firstName.trim() : given;
  const lastName = typeof input.lastName === "string" ? input.lastName.trim() : family.join(" ");
  if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100) {
    throw new Error("Enter both a first and last name (up to 100 characters each).");
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  return { firstName, lastName, email };
}

export function csvCell(value: unknown) {
  let text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  // Prevent spreadsheet software from evaluating member-supplied formulae.
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function membersCsv(rows: Record<string, unknown>[]) {
  const columns = [...new Set(rows.flatMap(Object.keys))];
  return tableCsv(columns, rows.map(row => columns.map(key => row[key])));
}

export function tableCsv(headers: readonly string[], rows: readonly (readonly unknown[])[]) {
  return "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
}
