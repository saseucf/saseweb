"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
        .select("id, title, description, schema, requires_login, is_open")
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

    const { error } = await supabase.from("form_submissions").insert({
      form_id: form.id,
      user_id: user?.id ?? null,
      responses: answers,
    });

    if (error) {
      console.error("Error submitting form:", error);
      setMessage("There was an error submitting your response. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Your form was submitted successfully.");
    setIsSubmitting(false);
  }

  if (!form) {
    return <main className="p-8">{message}</main>;
  }

  return (
    <main className="min-h-screen p-8">
      <button
        className="mb-6 rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
        onClick={() => router.push("/forms")}
      >
        Back to Forms
      </button>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold">{form.title}</h1>
        {form.description && <p className="mt-3 text-gray-600">{form.description}</p>}

        <form className="mt-8 flex flex-col gap-5" onSubmit={submitForm}>
          {form.schema.map((question, index) => (
            <fieldset key={question.id} className="rounded-xl border border-gray-300 p-5">
              <legend className="px-2 text-lg font-bold">
                {index + 1}. {question.label || "Untitled question"}
                {question.required && <span className="ml-1 text-red-600">*</span>}
              </legend>

              {question.type === "short_text" && (
                <input
                  className="mt-2 w-full rounded border border-gray-300 p-2"
                  value={typeof answers[question.id] === "string" ? answers[question.id] : ""}
                  onChange={(event) => updateAnswer(question.id, event.target.value)}
                  required={question.required}
                />
              )}

              {question.type === "paragraph" && (
                <textarea
                  className="mt-2 min-h-28 w-full rounded border border-gray-300 p-2"
                  value={typeof answers[question.id] === "string" ? answers[question.id] : ""}
                  onChange={(event) => updateAnswer(question.id, event.target.value)}
                  required={question.required}
                />
              )}

              {question.type === "multiple_choice" && (
                <div className="mt-2 flex flex-col gap-2">
                  {question.options?.map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(event) => updateAnswer(question.id, event.target.value)}
                        required={question.required}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}

              {question.type === "checkbox" && (
                <div className="mt-2 flex flex-col gap-2">
                  {question.options?.map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Array.isArray(answers[question.id]) && answers[question.id].includes(option)}
                        onChange={(event) => toggleCheckbox(question.id, option, event.target.checked)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          ))}

          {message && <p className={message.includes("successfully") ? "text-green-700" : "text-red-600"}>{message}</p>}
          <button
            className="w-fit rounded bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
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
