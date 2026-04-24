/**
 * Short name for greetings: first word of Clerk-derived `name`, else first segment
 * of the email local-part (split on . _ -), capitalized.
 */
export function displayNameFromUser(user: {
  name: string | null;
  email: string;
}): string {
  const trimmed = (user.name ?? "").trim();
  if (trimmed) {
    const first = trimmed.split(/\s+/)[0];
    if (first) {
      return first;
    }
  }
  const at = user.email.indexOf("@");
  const local = (at === -1 ? user.email : user.email.slice(0, at)).trim();
  const segment = local.split(/[._-]/u)[0]?.trim() ?? "";
  if (!segment) {
    return "there";
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}
