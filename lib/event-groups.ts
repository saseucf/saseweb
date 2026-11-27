export const WORKSHOP_SUBCATEGORIES = ["Pre-Health", "Pro-Dev", "Tech"];
export const REMINDER_ROUTES = ["General", "Pro-Dev", "Tech", "Pre-Health", "Service", "Socials", "Fundraisers"];

export function defaultReminderAudience(eventType: string) {
    return WORKSHOP_SUBCATEGORIES.find(name => eventType === `Workshop - ${name}`) ?? "General";
}
