export const WORKSHOP_SUBCATEGORIES = ["Pre-Health", "Pro-Dev", "Tech"];
export const REMINDER_ROUTES = ["General", "Tech", "Pro-Dev", "Pre-Health"];

export function defaultReminderAudience(eventType: string) {
    return WORKSHOP_SUBCATEGORIES.find(name => eventType === `Workshop - ${name}`) ?? "General";
}
