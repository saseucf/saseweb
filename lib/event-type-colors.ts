export const PRESET_EVENT_TYPES = [
    { label: "GBM", color: "#141B4D" }, // Navy Blue
    { label: "Workshop", color: "#89ABE3" }, // National Blue
    { label: "Social", color: "#DBC8B6" }, // Sandy Brown
    { label: "Service", color: "#ACA39A" }, // Khaki Brown
    { label: "Fundraiser", color: "#3F4444" }, // Charcoal Gray
    { label: "Networking", color: "#101820" }, // Black
    { label: "Info Session", color: "#D0D0CE" }, // Stone Gray
];

export function getEventTypeColor(eventType: string): string {
    const normalized = eventType.trim().toLowerCase();
    const preset = PRESET_EVENT_TYPES.find(p => p.label.toLowerCase() === normalized);
    
    if (preset) {
        return preset.color;
    }

    // Hash the custom string to pick a color deterministically
    let hash = 0;
    for (let i = 0; i < eventType.length; i++) {
        hash = eventType.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Pick from a set of extended colors for custom types
    const customColors = [
        "#141B4D", "#89ABE3", "#DBC8B6", "#ACA39A", "#3F4444", "#D0D0CE",
        "#2d8bba", "#e07b54", "#4caf82", "#9b59b6" // extra fallback colors just in case
    ];
    
    const index = Math.abs(hash) % customColors.length;
    return customColors[index];
}
