"use client";

import Link from "next/link";
import { useProfileRole } from "@/components/use-profile-role";

export default function AdminEventControls() {
    const { role, loading } = useProfileRole();

    if (loading || role !== "admin") {
        return null;
    }

    return (
        <div className="flex gap-2">
            <Link
                href="/admin/events"
                className="rounded-md border px-4 py-2 text-sm font-medium"
            >
                Manage Events
            </Link>

            <Link
                href="/admin/events/new"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
                Create Event
            </Link>
        </div>
    );
}
