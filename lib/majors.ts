// Shared by registration, profile editors, and historical demographics.
export const COMMON_MAJORS = ["Biomedical Sciences", "Civil Engineering", "Computer Engineering", "Computer Science", "Mechanical Engineering"] as const;
export const MAJORS = [...COMMON_MAJORS,
  "Accounting", "Aerospace Engineering", "Biochemistry", "Biology", "Biomedical Engineering",
  "Chemistry", "Clinical Psychology", "Communication", "Construction Engineering", "Criminal Justice",
  "Data Science", "Digital Media", "Economics", "Electrical Engineering", "Engineering",
  "Entertainment Management", "Environmental Engineering", "Film", "Finance", "Health Sciences",
  "Industrial Engineering", "Information Technology", "Journalism", "Kinesiology", "Management",
  "Marine Science", "Marketing", "Materials Science and Engineering", "Mathematics", "Music",
  "Neuroscience", "Nursing", "Paralegal Studies", "Photonic Science and Engineering", "Physics",
  "Political Science", "Psychology", "Statistics", "Undeclared", "Undeclared Engineering", "Other",
] as const;

const key = (value: string) => value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
const aliases = new Map<string, string>(MAJORS.map(major => [key(major), major]));
const groups: Record<string, string[]> = {
  "Biomedical Sciences": ["biomed", "biomedical science", "biomedical scienc", "biomedicine"],
  "Civil Engineering": ["civil eng", "civil engineer", "civil"],
  "Computer Engineering": ["comp eng", "computer eng", "computer engineer", "cpe"],
  "Computer Science": ["cs", "comp sci", "comp science", "computer sci", "computer scienc"],
  "Mechanical Engineering": ["mech eng", "mechanical eng", "mechanical engineer", "mech e"],
  "Electrical Engineering": ["ee", "electrical eng", "electrical engineer"],
  "Aerospace Engineering": ["aerospace", "aero eng", "areospace engineering"],
  "Biology": ["bio"],
  "Health Sciences": ["health science", "health sciencez", "health sciences pre clinical", "health sciences preclinical"],
  "Information Technology": ["it"],
  "Materials Science and Engineering": ["material science and engineering"],
  "Photonic Science and Engineering": ["photonics", "photonic engineering", "photonics engineering", "photonic sciences and engineering"],
  "Political Science": ["poli sci"],
  "Psychology": ["general psychology"],
};
for (const [major, variants] of Object.entries(groups)) for (const variant of variants) aliases.set(key(variant), major);

export function normalizeMajor(value: string | null | undefined): string {
  const trimmed = value?.trim().replace(/\s+/g, " ") ?? "";
  if (!trimmed) return "";
  // Preserve unrecognized and double majors rather than silently replacing them with Other.
  return aliases.get(key(trimmed)) ?? trimmed.toLowerCase().replace(/\b[a-z]/g, char => char.toUpperCase());
}
