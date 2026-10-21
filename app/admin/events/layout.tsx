"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProfileRole } from "@/components/use-profile-role";

export default function AdminEventsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const { userId, role, loading } = useProfileRole();

    useEffect(() => {
        if (loading) return;
        if (!userId) router.replace("/login");
        else if (role !== "admin") router.replace("/events");
    }, [router, userId, role, loading]);

    // Prevent admin content from briefly appearing
    // before the user's permissions are checked.
    if (loading) {
        return (
            <main className="sase-page sase-admin-page flex items-center justify-center">
                <p className="text-gray-500 font-medium text-lg">
                    Checking permissions...
                </p>
            </main>
        );
    }

    if (role !== "admin") {
        return null;
    }

    return <>{children}</>;
}
