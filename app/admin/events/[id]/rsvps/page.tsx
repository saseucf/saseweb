"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/auth";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import React from "react";

type SaseEvent = {
  id: string;
  title: string;
};

type Form = {
  id: string;
  title: string;
  schema: Record<string, unknown>[];
};

type Submission = {
  id: string;
  form_id: string;
  user_id: string | null;
  responses: Record<string, string | string[]>;
  created_at: string;
  email?: string;
  name?: string;
};

export default function EventRSVPsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<SaseEvent | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    async function loadData() {
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
        router.replace("/");
        return;
      }

      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id, title")
        .eq("id", id)
        .single();

      if (eventError || !eventData) {
        console.error("Error loading event");
        setLoading(false);
        return;
      }
      setEvent(eventData);

      // Load forms linked to this event
      const { data: formsData } = await supabase
        .from("forms")
        .select("id, title, schema")
        .eq("event_id", id);

      if (!formsData || formsData.length === 0) {
        setLoading(false);
        return;
      }
      
      setForms(formsData);
      
      const formIds = formsData.map(f => f.id);

      // Load all submissions for these forms
      const { data: submissionsData } = await supabase
        .from("form_submissions")
        .select("id, form_id, user_id, responses, created_at")
        .in("form_id", formIds)
        .order("created_at", { ascending: false });

      if (submissionsData && submissionsData.length > 0) {
        // Fetch profiles to get emails/names
        const userIds = [...new Set(submissionsData.map(s => s.user_id).filter(id => Boolean(id)))];
        let profilesDict: Record<string, { id: string; email: string; first_name: string; last_name: string }> = {};
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, email, first_name, last_name")
            .in("id", userIds);
            
          if (profiles) {
            profilesDict = Object.fromEntries(
              profiles.map(p => [p.id, p])
            );
          }
        }

        const mappedSubmissions = submissionsData.map(sub => {
          const prof = sub.user_id ? profilesDict[sub.user_id] : null;
          return {
            ...sub,
            email: prof?.email || "Guest",
            name: prof ? `${prof.first_name} ${prof.last_name}` : "Unknown Guest"
          };
        });

        setSubmissions(mappedSubmissions as Submission[]);
      }
      
      setLoading(false);
    }

    loadData();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#171d52]" />
      </div>
    );
  }

  if (!event) {
    return (
      <main className="sase-page pt-[120px] text-center">
        <h1 className="text-2xl font-bold text-red-600">Event Not Found</h1>
        <Link href="/admin/events" className="text-[#5579bd] hover:underline mt-4 inline-block">Return to Events</Link>
      </main>
    );
  }

  // Calculate stats
  const totalRSVPs = submissions.length;
  const countsByForm = forms.map(f => ({
    title: f.title,
    count: submissions.filter(s => s.form_id === f.id).length
  }));

  return (
    <main className="sase-page pt-[120px]">
      <Link href="/admin/events" className="sase-secondary-button mb-6 inline-block">
        &larr; Back to Events
      </Link>
      
      <div className="sase-page-header">
        <p className="sase-eyebrow">UCF SASE / Event Data</p>
        <h1>{event.title} RSVPs</h1>
        <p className="mt-2 text-muted-foreground">Monitor who is coming and track form submissions.</p>
      </div>

      <div className="max-w-6xl mx-auto mt-8 flex flex-col gap-8">
        
        {/* Top Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black text-[#5579bd]">{totalRSVPs}</span>
            <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground mt-2">Total Submissions</span>
          </div>
          
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#171d52] mb-4 border-b border-gray-100 pb-2">Submissions by Form</h3>
            {countsByForm.length === 0 ? (
              <p className="text-sm text-gray-500">No forms linked to this event.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {countsByForm.map((cf, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-muted-foreground">{cf.title}</span>
                    <span className="bg-[#e9eef8] text-[#5579bd] px-3 py-1 rounded-full font-bold">{cf.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Master List */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-muted">
            <h2 className="font-bold text-[#171d52]">Master RSVP List</h2>
          </div>
          
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-medium">No one has RSVP&apos;d yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#171d52] text-[#fffde9]">
                  <tr>
                    <th className="px-6 py-3 uppercase tracking-wider font-bold text-[10px]">Name</th>
                    <th className="px-6 py-3 uppercase tracking-wider font-bold text-[10px]">Email</th>
                    <th className="px-6 py-3 uppercase tracking-wider font-bold text-[10px]">Form Used</th>
                    <th className="px-6 py-3 uppercase tracking-wider font-bold text-[10px]">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((sub) => {
                    const formUsed = forms.find(f => f.id === sub.form_id);
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-[#171d52] whitespace-nowrap">
                          {sub.name}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {sub.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium truncate max-w-[200px] inline-block">
                            {formUsed?.title || "Unknown Form"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
                          {new Date(sub.created_at).toLocaleString('en-US', { timeZone: 'America/New_York' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
