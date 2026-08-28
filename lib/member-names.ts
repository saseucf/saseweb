function cleanNamePart(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function getMemberNames(profile: {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}) {
  const firstName = cleanNamePart(profile.first_name);
  const lastName = cleanNamePart(profile.last_name);
  const displayName = [firstName, lastName].filter(Boolean).join(" ");
  const emailName = profile.email?.split("@")[0]?.trim() ?? "";

  return {
    displayName: displayName || emailName || "Member",
    greetingName: firstName || displayName || emailName || "Member",
  };
}
