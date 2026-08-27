"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/auth";

type AvailableForm = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    type: string | null;
    events: { event_type: string } | null;
};

export default function Forms(){
    const [isAdmin, setIsAdmin] = useState(false);
    const [availableForms, setAvailableForms] = useState<AvailableForm[]>([]);
    const [loadError, setLoadError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string | null>(null);

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
                .select("id, slug, title, description, type, events(event_type)")
                .eq("is_open", true)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error loading available forms:", error);
                setLoadError("Available forms could not be loaded.");
                return;
            }

            setAvailableForms((data as unknown as AvailableForm[]) || []);
        }

        loadAvailableForms();
    }, []);

    function backToHome() {
        window.location.href = "/";
    }

    // Compute display types for each form and unique types for filter
    const formsWithTypes = availableForms.map(form => ({
        ...form,
        displayType: form.events?.event_type || form.type || "General"
    }));

    const uniqueTypes = Array.from(new Set(formsWithTypes.map(f => f.displayType))).sort();

    const filteredForms = formsWithTypes.filter(form => {
        const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType ? form.displayType === selectedType : true;
        return matchesSearch && matchesType;
    });

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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2>Available Forms</h2>
                    
                    {/* Search Bar */}
                    <div className="relative w-full md:max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search forms by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-border rounded-xl leading-5 bg-card placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e9eef8] focus:border-[#89abe3] transition-all sm:text-sm"
                        />
                    </div>
                </div>

                {/* Filter Chips */}
                {uniqueTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        <button
                            onClick={() => setSelectedType(null)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                                selectedType === null 
                                ? 'bg-foreground text-background' 
                                : 'bg-card border border-[#D0D0CE] text-muted-foreground hover:bg-background'
                            }`}
                        >
                            All
                        </button>
                        {uniqueTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                                    selectedType === type
                                    ? 'bg-card shadow-md border-transparent text-foreground border-2 border-[#89abe3]' 
                                    : 'bg-card border border-[#D0D0CE] text-muted-foreground hover:bg-background'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                )}

                {loadError && <p className="mt-2 text-red-600">{loadError}</p>}
                {!loadError && availableForms.length === 0 && (
                    <p className="mt-2 text-gray-500">There are no forms available right now.</p>
                )}
                {!loadError && availableForms.length > 0 && filteredForms.length === 0 && (
                    <p className="mt-2 text-gray-500">No forms match your search criteria.</p>
                )}
                <div className="sase-form-grid">
                    {filteredForms.map((form) => (
                        <div key={form.id} className="sase-form-card flex flex-col justify-between items-start h-full gap-4">
                            <div className="w-full">
                                <span className="inline-block bg-[#e9eef8] text-[#89abe3] text-[10px] font-bold uppercase px-2 py-1 rounded mb-2 tracking-wider">
                                    {form.displayType}
                                </span>
                                <h3>{form.title}</h3>
                                {form.description && <p className="text-sm text-gray-600 mt-1">{form.description}</p>}
                            </div>
                            <Link
                                href={`/forms/${form.slug}`}
                                className="sase-primary-button mt-auto"
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