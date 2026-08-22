"use client";

import supabase from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminEventsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const [isChecking, setIsChecking] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        async function checkAdminAccess() {
            // Check whether a user is currently logged in.
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.replace("/login");
                return;
            }

            // Check the logged-in user's role.
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (error || profile?.role !== "admin") {
                router.replace("/events");
                return;
            }

            setIsAuthorized(true);
            setIsChecking(false);
        }

        checkAdminAccess();
    }, [router]);

    // Prevent admin content from briefly appearing
    // before the user's permissions are checked.
    if (isChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Checking permissions...
                </p>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
}