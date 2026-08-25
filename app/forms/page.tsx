"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/auth";

type AvailableForm = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
};

export default function Forms(){
    const [isAdmin, setIsAdmin] = useState(false);
    const [availableForms, setAvailableForms] = useState<AvailableForm[]>([]);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        async function checkAdminRole() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            setIsAdmin(profile?.role?.trim().toLowerCase() === "admin");
        }

        checkAdminRole();
    }, []);

    useEffect(() => {
        async function loadAvailableForms() {
            const { data, error } = await supabase
                .from("forms")
                .select("id, slug, title, description")
                .eq("is_open", true)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error loading available forms:", error);
                setLoadError("Available forms could not be loaded.");
                return;
            }

            setAvailableForms(data || []);
        }

        loadAvailableForms();
    }, []);

    function backToHome() {
        window.location.href = "/";
    }

    return (
        <main className="sase-page sase-member-page">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
                <div className="sase-page-header !mb-0">
                    <p className="sase-eyebrow">UCF SASE / Member portal</p>
                    <h1 className="!mb-2">Forms and RSVPs</h1>
                    <p className="text-gray-600 max-w-xl">Find open applications, sign-ups, and opportunities from the SASE community.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="sase-secondary-button" onClick={backToHome}>
                        &larr; Back to Home
                    </button>
                    {isAdmin && (
                        <Link href="/forms/admin" className="sase-primary-button">
                            Manage Forms
                        </Link>
                    )}
                </div>
            </div>

            <section className="sase-content-section">
                <h2>Available Forms</h2>
                {loadError && <p className="mt-2 text-red-600">{loadError}</p>}
                {!loadError && availableForms.length === 0 && (
                    <p className="mt-2 text-gray-500">There are no forms available right now.</p>
                )}
                <div className="sase-form-grid">
                    {availableForms.map((form) => (
                        <div key={form.id} className="sase-form-card">
                            <h3>{form.title}</h3>
                            {form.description && <p>{form.description}</p>}
                            <Link
                                href={`/forms/${form.slug}`}
                                className="sase-primary-button"
                            >
                                Continue
                            </Link>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}