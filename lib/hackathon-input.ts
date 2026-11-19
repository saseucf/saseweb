export function parseHackathonInput(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Enter hackathon details.");
  const fields = input as Record<string, unknown>;
  const text = (key: string) => typeof fields[key] === "string" ? fields[key].trim() : "";
  const name = text("name");
  const slug = text("slug");
  if (!name || name.length > 120) throw new Error("Enter a name of up to 120 characters.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100)
    throw new Error("Use lowercase letters, numbers, and single hyphens for the slug.");
  const discord_channel_id = text("discord_channel_id") || null;
  const discord_role_id = text("discord_role_id") || null;
  for (const value of [discord_channel_id, discord_role_id]) {
    if (value && !/^[0-9]{17,20}$/.test(value)) throw new Error("Discord IDs must contain 17–20 digits. Paste the ID, not the name or mention.");
  }
  return { name, slug, discord_channel_id, discord_role_id };
}
