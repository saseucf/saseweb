"use client";

import Link from "next/link";
import supabase from "@/lib/auth";
import { useEffect, useState } from "react";

export default function AdminEventControls() {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        async function checkAdmin() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setIsAdmin(false);
                return;
            }

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("Could not check admin role:", error);
                setIsAdmin(false);
                return;
            }

            setIsAdmin(profile.role === "admin");
        }

        checkAdmin();
    }, []);

    if (!isAdmin) {
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