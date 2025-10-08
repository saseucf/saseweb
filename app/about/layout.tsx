export const metadata = {
    title: "About",
    description: "About SASE UCF — mission, member demographics, awards, and chapter information.",
} as const;

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
