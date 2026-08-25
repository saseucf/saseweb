"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/auth";

type Question = {
    id: string;
    label: string;
};

type FormRecord = {
    title: string;
    schema: Question[];
};

type Submission = {
    id: string;
    user_id: string | null;
    responses: Record<string, string | string[]>;
    created_at: string;
    email?: string;
};

function Responses() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const formId = searchParams.get("id");
    const [form, setForm] = useState<FormRecord | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [message, setMessage] = useState("Loading responses...");

    useEffect(() => {
        async function loadResponses() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profile?.role?.trim().toLowerCase() !== "admin") {
                router.replace("/forms");
                return;
            }

            if (!formId) {
                setMessage("No form was selected.");
                return;
            }

            const { data: formData, error: formError } = await supabase
                .from("forms")
                .select("title, schema")
                .eq("id", formId)
                .single();

            if (formError || !formData) {
                setMessage("The selected form could not be loaded.");
                return;
            }

            const { data: responseData, error: responseError } = await supabase
                .from("form_submissions")
                .select("id, user_id, responses, created_at")
                .eq("form_id", formId)
                .order("created_at", { ascending: false });

            if (responseError) {
                console.error("Error loading responses:", responseError);
                setMessage("Responses could not be loaded.");
                return;
            }

            const userIds = [...new Set((responseData || [])
                .map((submission) => submission.user_id)
                .filter((id): id is string => Boolean(id)))];

            let emailByUserId: Record<string, string> = {};
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, email")
                    .in("id", userIds);
                emailByUserId = Object.fromEntries(
                    (profiles || []).map((profile) => [profile.id, profile.email])
                );
            }

            setForm(formData);
            setSubmissions((responseData || []).map((submission) => ({
                ...submission,
                email: submission.user_id ? emailByUserId[submission.user_id] : "Guest",
            })));
            setMessage("");
        }

        loadResponses();
    }, [formId, router]);

    if (!form) {
        return <main className="p-8">{message}</main>;
    }

    return (
        <main className="sase-page sase-responses-page pt-[120px]">
            <button
                className="sase-secondary-button mb-6"
                onClick={() => router.push("/forms/admin")}
            >
                &larr; Back to Admin Panel
            </button>
            <div className="sase-page-header">
                <p className="sase-eyebrow">UCF SASE / Response archive</p>
                <h1>{form.title} Responses</h1>
                <p>{submissions.length} response{submissions.length === 1 ? "" : "s"}</p>
            </div>

            {submissions.length === 0 ? (
                <div className="sase-form-card mt-8">
                    <p className="text-[#ACA39A] font-medium text-center">No responses have been submitted yet.</p>
                </div>
            ) : (
                <div className="space-y-6 mt-8 max-w-4xl">
                    {submissions.map((submission, index) => (
                        <div key={submission.id} className="sase-form-card">
                            <div className="flex flex-wrap justify-between items-center mb-6 pb-4 border-b border-[#D0D0CE] gap-4">
                                <div>
                                    <span className="inline-block bg-foreground text-white text-xs font-bold px-2 py-1 rounded mb-2">
                                        Response {submissions.length - index}
                                    </span>
                                    <h3 className="font-bold text-lg text-foreground break-all">{submission.email || "Unknown"}</h3>
                                </div>
                                <span className="text-sm font-medium text-[#ACA39A] whitespace-nowrap">
                                    {new Date(submission.created_at).toLocaleString('en-US', {
                                        timeZone: 'America/New_York',
                                        dateStyle: "medium",
                                        timeStyle: "short"
                                    })}
                                </span>
                            </div>
                            
                            <div className="space-y-6">
                                {form.schema.map((question) => {
                                    const answer = submission.responses?.[question.id];
                                    const displayAnswer = Array.isArray(answer) ? answer.join(", ") : answer;
                                    return (
                                        <div key={question.id}>
                                            <p className="font-semibold text-foreground mb-1.5">{question.label || "Untitled question"}</p>
                                            <div className="bg-background p-3 rounded-lg border border-[#D0D0CE]">
                                                <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                                                    {displayAnswer || <span className="italic text-[#ACA39A]">No answer provided</span>}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}

export default function ResponsesPage() {
    return (
        <Suspense fallback={<main className="p-8">Loading responses...</main>}>
            <Responses />
        </Suspense>
    );
}