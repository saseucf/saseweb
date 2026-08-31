"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/auth";
import { Download, ChevronLeft, ChevronRight, Users, Clock, Mail } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

type Question = {
    id: string;
    type: "short_text" | "paragraph" | "multiple_choice" | "checkbox";
    label: string;
    required: boolean;
    options?: string[];
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

// Nice SASE Blue colors for charts
const CHART_COLORS = ['#89abe3', '#5579bd', '#171d52', '#a0c1f5', '#6b8fc9'];

function Responses() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const formId = searchParams.get("id");
    const [form, setForm] = useState<FormRecord | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [message, setMessage] = useState("Loading responses...");
    
    // UI State
    const [currentTab, setCurrentTab] = useState<"summary" | "individual">("summary");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredSubmissions = submissions.filter(sub => {
        if (searchQuery.trim() === "") return true;
        const query = searchQuery.toLowerCase();
        if (sub.email?.toLowerCase().includes(query)) return true;
        
        for (const key in sub.responses) {
            const val = sub.responses[key];
            if (Array.isArray(val)) {
                if (val.some(v => String(v).toLowerCase().includes(query))) return true;
            } else {
                if (String(val).toLowerCase().includes(query)) return true;
            }
        }
        return false;
    });

    // Editing State (Only for individual view)
    const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
    const [editedResponses, setEditedResponses] = useState<Record<string, string | string[]>>({});

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
                .order("created_at", { ascending: true }); // Oldest first for index chronological order

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

    // CSV Export
    function exportToCSV() {
        if (!form || filteredSubmissions.length === 0) return;
        
        const headers = ["Submitted At", "Email", ...form.schema.map(q => q.label || "Untitled")];
        
        const rows = filteredSubmissions.map(sub => {
            const time = new Date(sub.created_at).toLocaleString();
            const email = sub.email || "Unknown";
            const answers = form.schema.map(q => {
                const raw = sub.responses[q.id];
                const answer = Array.isArray(raw) ? raw.join(", ") : (raw || "");
                return `"${String(answer).replace(/"/g, '""')}"`;
            });
            return `"${time}","${email}",${answers.join(",")}`;
        });

        const csvContent = [headers.map(h => `"${h}"`).join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${form.title.replace(/\s+/g, "_")}_Responses.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Individual Edit Handlers
    function handleEdit(submission: Submission) {
        setEditingResponseId(submission.id);
        setEditedResponses({ ...submission.responses });
    }

    function handleCancelEdit() {
        setEditingResponseId(null);
        setEditedResponses({});
    }

    async function handleSaveEdit(submissionId: string) {
        const { error } = await supabase
            .from("form_submissions")
            .update({ responses: editedResponses })
            .eq("id", submissionId);
        
        if (error) {
            console.error("Error updating response:", error);
            alert("Failed to update response.");
            return;
        }

        setSubmissions((current) =>
            current.map((sub) =>
                sub.id === submissionId ? { ...sub, responses: editedResponses } : sub
            )
        );
        setEditingResponseId(null);
        setEditedResponses({});
    }

    function updateEditAnswer(questionId: string, value: string) {
        setEditedResponses((current) => ({ ...current, [questionId]: value }));
    }

    function updateEditArrayAnswer(questionId: string, value: string) {
        const arr = value.split(',').map(s => s.trim()).filter(s => s !== '');
        setEditedResponses((current) => ({ ...current, [questionId]: arr }));
    }

    if (!form) {
        return <main className="sase-page pt-[120px]"><div className="p-8 font-medium">{message}</div></main>;
    }

    return (
        <main className="sase-page pt-[120px]">
            <div className="flex justify-between items-start mb-6">
                <button
                    className="sase-secondary-button"
                    onClick={() => router.push("/forms/admin")}
                >
                    &larr; Back to Admin Panel
                </button>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0c5e31] text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                >
                    <Download size={16} />
                    Export CSV
                </button>
            </div>
            
            <div className="sase-page-header">
                <p className="sase-eyebrow">UCF SASE / Response archive</p>
                <h1>{form.title}</h1>
                <p>{filteredSubmissions.length} response{filteredSubmissions.length === 1 ? "" : "s"} {searchQuery ? `(filtered from ${submissions.length})` : ""}</p>
            </div>

            {/* Search and Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border mt-8 mb-8 gap-4">
                <div className="flex gap-8">
                    <button 
                    className={`pb-4 font-bold uppercase tracking-wider text-sm transition-colors relative ${currentTab === "summary" ? "text-[#89abe3]" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setCurrentTab("summary")}
                >
                    Summary
                    {currentTab === "summary" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#89abe3]"></div>}
                </button>
                <button 
                    className={`pb-4 font-bold uppercase tracking-wider text-sm transition-colors relative ${currentTab === "individual" ? "text-[#89abe3]" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setCurrentTab("individual")}
                >
                    Individual
                    {currentTab === "individual" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#89abe3]"></div>}
                </button>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full max-w-sm mb-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by email or answer..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentIndex(0); // Reset index on search
                        }}
                        className="block w-full pl-10 pr-3 py-2 border border-[#D0D0CE] rounded-lg leading-5 bg-card placeholder-[#ACA39A] focus:outline-none focus:ring-2 focus:ring-[#e9eef8] focus:border-[#89abe3] transition-all sm:text-sm shadow-sm"
                    />
                </div>
            </div>

            {filteredSubmissions.length === 0 ? (
                <div className="sase-form-card mt-8">
                    <p className="text-muted-foreground font-medium text-center py-12">
                        {searchQuery ? "No responses matched your search." : "No responses have been submitted yet."}
                    </p>
                </div>
            ) : currentTab === "summary" ? (
                <div className="space-y-8 max-w-4xl mx-auto">
                    {form.schema.map((question) => {
                        // Aggregate data for this question
                        const isChartable = question.type === 'multiple_choice' || question.type === 'checkbox';
                        let chartData: { name: string; count: number }[] = [];
                        let textResponses: string[] = [];

                        if (isChartable) {
                            const counts: Record<string, number> = {};
                            question.options?.forEach(opt => counts[opt] = 0);
                            
                            filteredSubmissions.forEach(sub => {
                                const ans = sub.responses[question.id];
                                if (!ans) return;
                                if (Array.isArray(ans)) {
                                    ans.forEach(a => counts[a] = (counts[a] || 0) + 1);
                                } else {
                                    counts[ans] = (counts[ans] || 0) + 1;
                                }
                            });
                            
                            chartData = Object.entries(counts)
                                .map(([name, count]) => ({ name, count }))
                                .sort((a, b) => b.count - a.count);
                        } else {
                            textResponses = filteredSubmissions
                                .map(sub => (sub.responses[question.id] as string) || "")
                                .filter(ans => ans.trim().length > 0);
                        }

                        return (
                            <div key={question.id} className="bg-card rounded-2xl border border-border shadow-sm p-6 overflow-hidden">
                                <h3 className="font-bold text-lg text-foreground mb-6">{question.label || "Untitled Question"}</h3>
                                <div className="text-sm text-muted-foreground mb-4">{isChartable ? `${filteredSubmissions.length} responses` : `${textResponses.length} responses`}</div>

                                {isChartable ? (
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                                                <YAxis dataKey="name" type="category" width={150} stroke="var(--muted-foreground)" fontSize={12} tick={{fill: "var(--foreground)"}} />
                                                <RechartsTooltip 
                                                    cursor={{fill: 'var(--muted)'}}
                                                    contentStyle={{backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)'}}
                                                />
                                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                        {textResponses.length === 0 ? (
                                            <p className="text-muted-foreground italic text-sm">No answers provided.</p>
                                        ) : (
                                            textResponses.map((text, i) => (
                                                <div key={i} className="bg-muted p-4 rounded-xl text-foreground text-sm border border-border/50">
                                                    {text}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="max-w-3xl mx-auto mt-8 relative pb-24">
                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between bg-card rounded-2xl border border-border p-4 mb-6 sticky top-[100px] z-10 shadow-sm">
                        <button 
                            onClick={() => setCurrentIndex(c => Math.max(0, c - 1))}
                            disabled={currentIndex === 0}
                            className="p-2 rounded-full hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="font-bold text-foreground">
                            {currentIndex + 1} of {filteredSubmissions.length}
                        </div>
                        <button 
                            onClick={() => setCurrentIndex(c => Math.min(filteredSubmissions.length - 1, c + 1))}
                            disabled={currentIndex === filteredSubmissions.length - 1}
                            className="p-2 rounded-full hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Individual Submission Card */}
                    {filteredSubmissions[currentIndex] && (
                        <div className="sase-form-card">
                            <div className="flex flex-col gap-4 mb-8 pb-6 border-b border-border">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                        <Users className="text-[#89abe3]" size={20} />
                                        Response {currentIndex + 1}
                                    </h2>
                                    {editingResponseId !== filteredSubmissions[currentIndex].id && (
                                        <button 
                                            onClick={() => handleEdit(filteredSubmissions[currentIndex])}
                                            className="text-xs bg-[#e9eef8] text-[#89abe3] hover:bg-[#89abe3] hover:text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-colors"
                                        >
                                            Edit Response
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} />
                                        <span className="font-semibold text-foreground">{filteredSubmissions[currentIndex].email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} />
                                        <span>
                                            {new Date(filteredSubmissions[currentIndex].created_at).toLocaleString('en-US', {
                                                dateStyle: "long",
                                                timeStyle: "short"
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-8">
                                {form.schema.map((question) => {
                                    const submission = filteredSubmissions[currentIndex];
                                    const isEditing = editingResponseId === submission.id;
                                    const answer = isEditing ? editedResponses[question.id] : submission.responses?.[question.id];
                                    const isArray = Array.isArray(answer) || question.type === 'checkbox';
                                    const displayAnswer = Array.isArray(answer) ? answer.join(", ") : (answer as string) || "";
                                    
                                    return (
                                        <div key={question.id}>
                                            <p className="font-semibold text-foreground mb-3">{question.label || "Untitled question"}</p>
                                            {isEditing ? (
                                                <textarea 
                                                    className="w-full bg-background p-4 rounded-xl border border-[#89abe3] focus:outline-none focus:ring-2 focus:ring-[#e9eef8] transition-all text-sm min-h-[100px]"
                                                    value={displayAnswer}
                                                    onChange={(e) => {
                                                        if (isArray) {
                                                            updateEditArrayAnswer(question.id, e.target.value);
                                                        } else {
                                                            updateEditAnswer(question.id, e.target.value);
                                                        }
                                                    }}
                                                    placeholder={isArray ? "Comma separated values..." : "Answer..."}
                                                />
                                            ) : (
                                                <div className="bg-muted p-4 rounded-xl border border-border/50">
                                                    <p className="text-foreground whitespace-pre-wrap text-sm">
                                                        {displayAnswer || <span className="italic text-muted-foreground">No answer provided</span>}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                
                                {editingResponseId === filteredSubmissions[currentIndex].id && (
                                    <div className="flex gap-4 pt-6 mt-6 border-t border-border">
                                        <button 
                                            onClick={() => handleSaveEdit(filteredSubmissions[currentIndex].id)}
                                            className="bg-[#89abe3] hover:bg-[#26355f] text-white px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors w-full sm:w-auto"
                                        >
                                            Save Changes
                                        </button>
                                        <button 
                                            onClick={handleCancelEdit}
                                            className="bg-muted hover:bg-border text-foreground px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors w-full sm:w-auto"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}

export default function ResponsesPage() {
    return (
        <Suspense fallback={<main className="sase-page pt-[120px]"><div className="p-8 text-muted-foreground font-medium">Loading responses...</div></main>}>
            <Responses />
        </Suspense>
    );
}