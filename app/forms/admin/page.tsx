"use client";
import CsvDownloadButton from "@/components/csv-download-button";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/auth";
import { QRCodeCanvas } from "qrcode.react";
import { isCompletedEvent, lastEditedTime, searchEditableItems } from "@/lib/admin-list-order";

type Form = {
  id: string;
  slug: string;
  title: string;
  description: string;
  requires_login: boolean;
  is_open: boolean;
  type: string | null;
  created_at: string;
  updated_at: string | null;
  events: { title: string; event_type: string; location: string | null; start_time: string; end_time: string } | null;
};


export default function Admin() {
  const router = useRouter();

  const [forms, setForms] = useState<Form[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  
  const qrRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const filteredForms = searchEditableItems(forms.map(form => ({ ...form, start_time: form.events?.start_time })), searchQuery,
    form => [form.slug, form.description, form.type, form.is_open ? "open" : "closed", form.events?.title, form.events?.event_type, form.events?.location]);

  function handleAddForm() {
    router.push("/forms/admin/formCreator");
  }

  function backToForms() {
    router.push("/forms");
  }

  async function copyLink(slug: string) {
    const url = `${window.location.origin}/forms/${slug}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }

  async function downloadQR(slug: string) {
    const canvas = qrRefs.current[slug];
    if (!canvas) return;
    
    const url = canvas.toDataURL("image/png");

    // Fallback to traditional download
    const a = document.createElement("a");
    a.href = url;
    a.download = `sase-form-${slug}-qr.png`;
    a.click();
  }

  useEffect(() => {
    async function loadForms() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

      setIsAuthorized(true);

      const { data, error } = await supabase
        .from("forms")
        .select("*, events(title, event_type, location, start_time, end_time)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading forms:", error);
        return;
      }

      setForms((data as unknown as Form[]) || []);
    }

    loadForms();
  }, [router]);

  async function deleteForm(id: string) {
    const { error } = await supabase
      .from("forms")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting form:", error);
      alert("Could not delete form.");
      return;
    }

    setForms(
      forms.filter((form) => form.id !== id)
    );
  }

  function editForm(id: string) {
    router.push(`/forms/admin/formCreator?id=${id}`);
  }

  function viewResponses(id: string) {
    router.push(`/forms/admin/responses?id=${id}`);
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <main className="sase-page sase-admin-page pt-[120px]">
      <div className="sase-page-header">
        <p className="sase-eyebrow">UCF SASE / Admin workspace</p>
        <h1>Admin Panel</h1>
          <CsvDownloadButton filename="sase-forms" rows={filteredForms} label="Download filtered forms (CSV)" />
        <p>Publish forms, manage the response flow, and review submissions.</p>
      </div>

      <div className="max-w-[1180px] mx-auto w-full flex flex-col">
        <div className="flex flex-wrap gap-3 mt-4">
          <button className="sase-secondary-button" onClick={backToForms}>
            Back to Forms
          </button>

        <button
          className="sase-secondary-button"
          onClick={() => router.push("/admin/events")}
        >
          Events Dashboard
        </button>

        <button
          className="sase-primary-button sase-add-button sm:ml-auto"
          onClick={handleAddForm}
        >
          Add Form
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md mt-6 mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          aria-label="Search all form details"
          placeholder="Search title, description, type, event, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-[#D0D0CE] rounded-xl leading-5 bg-card placeholder-[#ACA39A] focus:outline-none focus:ring-2 focus:ring-[#e9eef8] focus:border-[#89abe3] transition-all sm:text-sm shadow-sm"
        />
      </div>

      <p className="mb-5 text-sm text-muted-foreground">Recently edited first, then earliest linked event. Search matches appear first.</p>
      {filteredForms.length === 0 ? (
        <div className="sase-form-card">
          <p className="text-[#ACA39A] font-medium text-center">No forms found matching your search.</p>
        </div>
      ) : (
        <div className="sase-form-grid sase-admin-grid">
          {filteredForms.map((form) => (
          <div
            key={form.id}
            className="sase-form-card"
            style={form.events && isCompletedEvent(form.events, Date.now()) ? { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" } : undefined}
          >
            <h2>
              {form.title}
            </h2>

            <p className="sase-meta">
              /forms/{form.slug}
            </p>
            {lastEditedTime(form) > 0 && <p className="!text-xs">Edited {new Date(lastEditedTime(form)).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>}

            <p className="sase-status">
              Status: {form.is_open ? "Open" : "Closed"}
            </p>

            <div className="flex flex-col gap-2 mt-2">
              <button
                className="sase-primary-button"
                onClick={() => editForm(form.id)}
              >
                Edit Form
              </button>

              <button
                className="sase-secondary-button"
                onClick={() => viewResponses(form.id)}
              >
                View Responses
              </button>

              <div className="flex gap-2 w-full">
                <button
                  className="sase-secondary-button flex-1 text-xs px-2"
                  onClick={() => copyLink(form.slug)}
                >
                  {copiedSlug === form.slug ? "Copied!" : "Copy Link"}
                </button>
                <button
                  className="sase-secondary-button flex-1 text-xs px-2"
                  onClick={() => downloadQR(form.slug)}
                >
                  Download QR
                </button>
              </div>
              
              {/* Hidden QR Code for downloading */}
              <div className="hidden">
                <QRCodeCanvas
                  value={typeof window !== "undefined" ? `${window.location.origin}/forms/${form.slug}` : ""}
                  size={512}
                  marginSize={4}
                  ref={(el) => {
                    qrRefs.current[form.slug] = el;
                  }}
                />
              </div>

              <button
                className="sase-danger-button mt-2"
                onClick={() => deleteForm(form.id)}
              >
                Delete Form
              </button>
            </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </main>
  );
}
