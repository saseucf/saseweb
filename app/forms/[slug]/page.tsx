"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/lib/auth";

type Question = {
  id: string;
  type: "short_text" | "paragraph" | "multiple_choice" | "checkbox";
  label: string;
  required: boolean;
  options?: string[];
};

type FormRecord = {
  id: string;
  title: string;
  description: string | null;
  schema: Question[];
  requires_login: boolean;
  is_open: boolean;
  event_id: string | null;
};

type Answers = Record<string, string | string[]>;

export default function FormResponsePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormRecord | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [message, setMessage] = useState("Loading form...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadForm() {
      const { data, error } = await supabase
        .from("forms")
        .select("id, title, description, schema, requires_login, is_open, event_id")
        .eq("slug", params.slug)
        .eq("is_open", true)
        .single();

      if (error || !data) {
        setMessage("This form is unavailable or no longer accepting responses.");
        return;
      }

      if (data.requires_login) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        // Check for multiple submissions
        const { count } = await supabase
          .from("form_submissions")
          .select("*", { count: "exact", head: true })
          .eq("form_id", data.id)
          .eq("user_id", user.id);

        if (count && count > 0) {
          setMessage("You have already submitted a response for this form.");
          return;
        }
      }

      setForm(data);
      setMessage("");
    }

    loadForm();
  }, [params.slug, router]);

  function updateAnswer(questionId: string, value: string | string[]) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function toggleCheckbox(questionId: string, option: string, checked: boolean) {
    const current = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    const next = checked
      ? [...current, option]
      : current.filter((value) => value !== option);
    updateAnswer(questionId, next);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    const missingRequired = form.schema.some((question) => {
      const answer = answers[question.id];
      return question.required &&
        (!answer || (Array.isArray(answer) && answer.length === 0) ||
          (!Array.isArray(answer) && answer.trim() === ""));
    });

    if (missingRequired) {
      setMessage("Please answer all required questions.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    const { data: { user } } = await supabase.auth.getUser();

    const { error: submissionError } = await supabase.from("form_submissions").insert({
      form_id: form.id,
      user_id: user?.id ?? null,
      responses: answers,
    });

    if (submissionError) {
      console.error("Error submitting form:", submissionError);
      setMessage("There was an error submitting your response. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Auto-RSVP if the form is linked to an event and the user is logged in
    let rsvpMessage = "";
    if (form.event_id && user?.id) {
      const { error: rsvpError } = await supabase.from("event_rsvps").insert({
        event_id: form.event_id,
        user_id: user.id,
        status: "Going"
      });
      
      if (!rsvpError) {
         rsvpMessage = " You have also been RSVP'd to the associated event!";
      } else if (rsvpError.code !== '23505') {
         // 23505 is unique violation, meaning they are already RSVP'd
         console.error("Error auto-RSVPing user:", rsvpError);
      }
    }

    setMessage(`Your form was submitted successfully.${rsvpMessage}`);
    setIsSubmitting(false);
  }

  if (!form) {
    return (
        <main className="sase-page">
            <div className="sase-content-section text-center text-gray-500 font-medium">
                {message}
            </div>
        </main>
    );
  }

  return (
    <main className="sase-page">
      <div className="sase-page-header">
        <p className="sase-eyebrow">UCF SASE / Form</p>
        <h1>{form.title}</h1>
        <Link
          href="/forms"
          className="sase-secondary-button mx-auto block max-w-max text-center mt-6"
        >
          &larr; Back to Forms
        </Link>
        {form.description && <p className="mt-4">{form.description}</p>}
      </div>
      
      <div className="bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0] p-8 md:p-12 max-w-3xl mx-auto mt-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#171d52] via-[#5579bd] to-[#171d52]"></div>
        
        <form className="flex flex-col gap-10 mt-4" onSubmit={submitForm}>
          {form.schema.map((question) => (
            <fieldset key={question.id} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
              <legend className="text-xl font-black text-[#171d52] mb-4 w-full leading-snug">
                {question.label || "Untitled question"}
                {question.required && <span className="ml-1 text-red-500">*</span>}
              </legend>

              {question.type === "short_text" && (
                <input
                  className="w-full rounded-xl border border-border bg-gray-50 p-4 outline-none focus:bg-card focus:border-[#5579bd] focus:ring-4 focus:ring-[#e9eef8] transition-all text-[#171d52] font-medium"
                  placeholder="Your answer"
                  value={typeof answers[question.id] === "string" ? answers[question.id] : ""}
                  onChange={(event) => updateAnswer(question.id, event.target.value)}
                  required={question.required}
                />
              )}

              {question.type === "paragraph" && (
                <textarea
                  className="min-h-32 w-full rounded-xl border border-border bg-gray-50 p-4 outline-none focus:bg-card focus:border-[#5579bd] focus:ring-4 focus:ring-[#e9eef8] transition-all text-[#171d52] font-medium resize-y"
                  placeholder="Your answer"
                  value={typeof answers[question.id] === "string" ? answers[question.id] : ""}
                  onChange={(event) => updateAnswer(question.id, event.target.value)}
                  required={question.required}
                />
              )}

              {question.type === "multiple_choice" && (
                <div className="flex flex-col gap-4">
                  {question.options?.map((option) => (
                    <label key={option} className="flex items-center gap-4 cursor-pointer group p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="relative flex items-center">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(event) => updateAnswer(question.id, event.target.value)}
                          required={question.required}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 rounded-full border-2 border-border peer-checked:border-[#5579bd] transition-colors flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#5579bd] opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                        </div>
                      </div>
                      <span className="text-[#171d52] font-medium group-hover:text-[#5579bd] transition-colors text-lg">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === "checkbox" && (
                <div className="flex flex-col gap-4">
                  {question.options?.map((option) => (
                    <label key={option} className="flex items-center gap-4 cursor-pointer group p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={Array.isArray(answers[question.id]) && answers[question.id].includes(option)}
                          onChange={(event) => toggleCheckbox(question.id, option, event.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 rounded border-2 border-border peer-checked:border-[#5579bd] peer-checked:bg-[#5579bd] transition-all flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      </div>
                      <span className="text-[#171d52] font-medium group-hover:text-[#5579bd] transition-colors text-lg">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          ))}

          {message && (
             <div className={`p-4 rounded-xl font-medium ${message.includes("successfully") ? "bg-[#e6f4ea] text-[#137333] border border-[#ceead6]" : "bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]"}`}>
                 {message}
             </div>
          )}
          
          <button
            className="w-full bg-[#171d52] hover:bg-[#26355f] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-md mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Form"}
          </button>
        </form>
      </div>
    </main>
  );
}
