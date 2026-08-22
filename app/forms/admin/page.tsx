"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/auth";

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

  function handleAddForm() {
    router.push("/forms/admin/formCreator");
  }

  function backToForms() {
    router.push("/forms");
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
    <main className="sase-page sase-admin-page">
      <div className="sase-page-header">
        <p className="sase-eyebrow">UCF SASE / Admin workspace</p>
        <h1>Admin Panel</h1>
        <p>Publish forms, manage the response flow, and review submissions.</p>
      </div>

      <button className="sase-secondary-button" onClick={backToForms}>
        Back to Forms
      </button>

      <button
        className="sase-primary-button sase-add-button"
        onClick={handleAddForm}
      >
        Add Form
      </button>

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

            <button
              className="sase-danger-button"
              onClick={() => deleteForm(form.id)}
            >
              Delete Form
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}