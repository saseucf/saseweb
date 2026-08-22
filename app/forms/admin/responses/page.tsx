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
        <main className="sase-page sase-responses-page">
            <button
                className="mb-6 rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
                onClick={() => router.push("/forms/admin")}
            >
                Back to Admin Panel
            </button>
            <div className="sase-page-header">
                <p className="sase-eyebrow">UCF SASE / Response archive</p>
                <h1>{form.title} Responses</h1>
                <p>{submissions.length} response{submissions.length === 1 ? "" : "s"}</p>
            </div>

            {submissions.length === 0 ? (
                <p className="mt-8 text-gray-500">No responses have been submitted yet.</p>
            ) : (
                <div className="sase-table-wrap">
                    <table className="min-w-full border-collapse text-left text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="whitespace-nowrap border-b border-gray-300 px-4 py-3">Email</th>
                                {form.schema.map((question) => (
                                    <th key={question.id} className="min-w-48 border-b border-gray-300 px-4 py-3">
                                        {question.label || "Untitled question"}
                                    </th>
                                ))}
                                <th className="whitespace-nowrap border-b border-gray-300 px-4 py-3">Submitted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((submission) => (
                                <tr key={submission.id} className="odd:bg-white even:bg-gray-50">
                                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium">
                                        {submission.email || "Unknown"}
                                    </td>
                                    {form.schema.map((question) => {
                                        const answer = submission.responses?.[question.id];
                                        return (
                                            <td key={question.id} className="border-b border-gray-200 px-4 py-3 align-top">
                                                {Array.isArray(answer) ? answer.join(", ") : answer || "-"}
                                            </td>
                                        );
                                    })}
                                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-3">
                                        {new Date(submission.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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