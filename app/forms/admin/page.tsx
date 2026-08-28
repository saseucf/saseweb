"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/auth";
import { QRCodeCanvas } from "qrcode.react";

type Form = {
  id: string;
  slug: string;
  title: string;
  description: string;
  requires_login: boolean;
  is_open: boolean;
};


export default function Admin() {
  const router = useRouter();

  const [forms, setForms] = useState<Form[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  
  const qrRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

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
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `sase-form-${slug}-qr.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Form QR Code",
        });
        return;
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }

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
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading forms:", error);
        return;
      }

      setForms(data || []);
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
        <p>Publish forms, manage the response flow, and review submissions.</p>
      </div>

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

      <div className="sase-form-grid sase-admin-grid">
        {forms.map((form) => (
          <div
            key={form.id}
            className="sase-form-card"
          >
            <h2>
              {form.title}
            </h2>

            <p className="sase-meta">
              /forms/{form.slug}
            </p>

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
    </main>
  );
}