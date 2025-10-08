export const metadata = {
    title: "Profile",
    description: "Account settings and profile details for SASE UCF members.",
} as const;

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
