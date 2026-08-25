"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/auth";
import Link from "next/link";
import { PlusCircle, Trash2, CheckCircle2 } from "lucide-react";

type Question = {
  id: string;
  type: "short_text" | "paragraph" | "multiple_choice" | "checkbox";
  label: string;
  required: boolean;
  options?: string[];
};

type SaseEvent = {
  id: string;
  title: string;
};

function FormCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const formId = searchParams.get("id");
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [eventId, setEventId] = useState<string | null>(null);
  
  const [events, setEvents] = useState<SaseEvent[]>([]);

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      type: "short_text",
      label: "",
      required: false,
    },
  ]);

  // Load existing form when editing & load events
  useEffect(() => {
    async function loadForm() {
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

      // Load active events for dropdown
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("id, title")
        .order("start_time", { ascending: false });
        
      if (!eventsError && eventsData) {
        setEvents(eventsData);
      }

      if (formId === null) {
        return;
      }

      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", formId)
        .single();

      if (error) {
        console.error("Error loading form:", error);
        return;
      }

      setTitle(data.title);
      setDescription(data.description || "");
      setSlug(data.slug);
      setRequiresLogin(data.requires_login);
      setIsOpen(data.is_open);
      setEventId(data.event_id || null);
      setQuestions(data.schema);
    }

    loadForm();
  }, [formId, router]);

  function applyRsvpTemplate() {
    setTitle("Event RSVP Form");
    setDescription("Please fill out this form to confirm your attendance!");
    setRequiresLogin(true);
    setQuestions([
      {
        id: crypto.randomUUID(),
        type: "short_text",
        label: "First Name",
        required: true,
      },
      {
        id: crypto.randomUUID(),
        type: "short_text",
        label: "Last Name",
        required: true,
      },
      {
        id: crypto.randomUUID(),
        type: "short_text",
        label: "Dietary Restrictions (If any)",
        required: false,
      },
      {
        id: crypto.randomUUID(),
        type: "multiple_choice",
        label: "How did you hear about this event?",
        required: false,
        options: ["Instagram", "Discord", "Friend", "Newsletter"],
      }
    ]);
  }

  function addQuestion() {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type: "short_text",
      label: "",
      required: false,
    };

    setQuestions([...questions, newQuestion]);
  }

  function changeQuestionType(id: string, newType: Question["type"]) {
    setQuestions(
      questions.map((question) =>
        question.id === id
          ? {
              ...question,
              type: newType,
              options:
                newType === "multiple_choice" || newType === "checkbox"
                  ? question.options || ["Option 1", "Option 2"]
                  : undefined,
            }
          : question
      )
    );
  }

  function changeQuestionLabel(id: string, newLabel: string) {
    setQuestions(
      questions.map((question) =>
        question.id === id ? { ...question, label: newLabel } : question
      )
    );
  }

  function changeRequired(id: string, required: boolean) {
    setQuestions(
      questions.map((question) =>
        question.id === id ? { ...question, required: required } : question
      )
    );
  }

  function changeOption(
    questionId: string,
    optionIndex: number,
    newValue: string
  ) {
    setQuestions(
      questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options:
                question.options?.map((option, index) =>
                  index === optionIndex ? newValue : option
                ) || [],
            }
          : question
      )
    );
  }

  function addOption(questionId: string) {
    setQuestions(
      questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: [
                ...(question.options || []),
                `Option ${(question.options?.length || 0) + 1}`,
              ],
            }
          : question
      )
    );
  }

  function deleteQuestion(id: string) {
    const updatedQuestions = questions.filter((question) => question.id !== id);
    setQuestions(updatedQuestions);
  }

  if (!isAuthorized) {
    return null;
  }

  async function saveForm() {
    if (title.trim() === "") {
      alert("Please enter a title for the form.");
      return;
    }

    if (slug.trim() === "") {
      alert("Please enter a slug for the form.");
      return;
    }
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Please log in before saving a form.");
      router.push("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role?.trim().toLowerCase() !== "admin") {
      alert("You do not have permission to manage forms.");
      router.push("/");
      return;
    }

    // EDIT EXISTING FORM
    if (formId !== null) {
      const { error } = await supabase
        .from("forms")
        .update({
          title: title,
          description: description,
          slug: slug,
          schema: questions,
          requires_login: requiresLogin,
          is_open: isOpen,
          event_id: eventId || null,
        })
        .eq("id", formId);

      if (error) {
        console.error("Error updating form:", error);
        alert("There was an error updating the form.");
        return;
      }
    }
    // CREATE NEW FORM
    else {
      const { error } = await supabase.from("forms").insert({
        title: title,
        description: description,
        slug: slug,
        schema: questions,
        requires_login: requiresLogin,
        is_open: isOpen,
        event_id: eventId || null,
        created_by: user.id,
      });

      if (error) {
        console.error("Error creating form:", error);
        alert("There was an error saving the form.");
        return;
      }
    }

    router.push("/forms/admin");
  }

  return (
    <main className="sase-page sase-creator-page pt-[120px]">
      <Link href="/forms/admin" className="sase-secondary-button mb-6 inline-block">
        &larr; Back to Admin Panel
      </Link>
      
      <div className="sase-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="sase-eyebrow">UCF SASE / Form builder</p>
          <h1>Form Creator</h1>
          <p className="mt-2 text-muted-foreground">Shape a clear, welcoming form for the SASE community.</p>
        </div>
        {!formId && (
          <button 
            onClick={applyRsvpTemplate}
            className="flex items-center gap-2 bg-[#e9eef8] text-[#89abe3] border border-[#89abe3] hover:bg-[#89abe3] hover:text-background px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Use RSVP Template
          </button>
        )}
      </div>

      {/* Form information */}
      <div className="bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0] p-8 max-w-3xl mx-auto flex flex-col gap-5 mt-8">
        <input
          className="text-3xl font-black text-foreground border-b-2 border-transparent hover:border-gray-200 focus:border-[#89abe3] focus:outline-none transition-colors w-full pb-2 placeholder-gray-300"
          placeholder="Form Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Form Description"
          className="text-muted-foreground border-b-2 border-transparent hover:border-gray-200 focus:border-[#89abe3] focus:outline-none transition-colors w-full pb-2 resize-none placeholder-gray-300"
          value={description}
          rows={2}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">URL Slug</label>
            <input
              type="text"
              placeholder="e.g. spring-kickoff-rsvp"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="border border-border rounded-xl px-4 py-3 text-sm focus:border-[#89abe3] focus:ring-2 focus:ring-[#e9eef8] outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Link to Event (Optional)</label>
            <select
              className="border border-border rounded-xl px-4 py-3 text-sm focus:border-[#89abe3] focus:ring-2 focus:ring-[#e9eef8] outline-none transition-all appearance-none bg-card"
              value={eventId || ""}
              onChange={(e) => setEventId(e.target.value || null)}
            >
              <option value="">-- No Event --</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-8 mt-4 pt-6 border-t border-gray-100">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={requiresLogin}
                onChange={(e) => setRequiresLogin(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded-md border-2 border-border peer-checked:border-[#89abe3] peer-checked:bg-[#89abe3] transition-all flex items-center justify-center">
                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <span className="text-sm font-semibold text-foreground group-hover:text-[#89abe3] transition-colors">Require Login</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={(e) => setIsOpen(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded-md border-2 border-border peer-checked:border-[#89abe3] peer-checked:bg-[#89abe3] transition-all flex items-center justify-center">
                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <span className="text-sm font-semibold text-foreground group-hover:text-[#89abe3] transition-colors">Accepting Responses</span>
          </label>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-3xl mx-auto flex flex-col gap-6 mt-8">
        {questions.map((question) => (
          <div
            key={question.id}
            className="bg-card rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#e2e8f0] p-6 md:p-8 flex flex-col gap-4 relative group hover:border-border transition-colors"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#89abe3] rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-start mb-2 gap-4">
              <input
                placeholder="Question..."
                className="text-lg font-bold text-foreground bg-gray-50 border border-transparent rounded-xl px-4 py-3 w-full focus:bg-card focus:border-[#89abe3] focus:ring-2 focus:ring-[#e9eef8] outline-none transition-all placeholder-gray-400"
                value={question.label}
                onChange={(e) => changeQuestionLabel(question.id, e.target.value)}
              />
              <select
                className="border border-border bg-card rounded-xl px-4 py-3 text-sm font-medium focus:border-[#89abe3] outline-none transition-all min-w-[160px]"
                value={question.type}
                onChange={(e) =>
                  changeQuestionType(question.id, e.target.value as Question["type"])
                }
              >
                <option value="short_text">Short Answer</option>
                <option value="paragraph">Paragraph</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="checkbox">Checkbox</option>
              </select>
            </div>

            <div className="px-1">
              {/* Short Answer */}
              {question.type === "short_text" && (
                <div className="border-b border-gray-300 w-1/2 pb-2 text-sm text-gray-400">Short answer text...</div>
              )}

              {/* Paragraph */}
              {question.type === "paragraph" && (
                <div className="border-b border-gray-300 w-full pb-2 text-sm text-gray-400">Long answer text...</div>
              )}

              {/* Multiple Choice & Checkbox */}
              {(question.type === "multiple_choice" || question.type === "checkbox") && (
                <div className="flex flex-col gap-3">
                  {question.options?.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-3">
                      {question.type === "multiple_choice" ? (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                      ) : (
                        <div className="w-4 h-4 rounded border-2 border-gray-300"></div>
                      )}
                      <input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          changeOption(question.id, optionIndex, e.target.value)
                        }
                        className="text-sm font-medium text-foreground border-b border-transparent hover:border-gray-300 focus:border-[#89abe3] outline-none w-full max-w-md bg-transparent pb-1 transition-colors"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(question.id)}
                    className="flex items-center gap-1.5 w-fit text-[#89abe3] hover:text-foreground text-sm font-bold uppercase tracking-wider mt-2 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Option
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end items-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => changeRequired(question.id, e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#89abe3]"></div>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Required</span>
              </label>

              <button
                className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                onClick={() => deleteQuestion(question.id)}
                title="Delete Question"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-24 justify-center items-center">
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 bg-card text-foreground border-2 border-foreground px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-foreground hover:text-white transition-all shadow-sm w-full sm:w-auto justify-center"
          >
            <PlusCircle className="w-5 h-5" /> Add Question
          </button>

          <button
            onClick={saveForm}
            className="bg-[#89abe3] text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-foreground transition-all shadow-md w-full sm:w-auto text-center"
          >
            {formId !== null ? "Save Changes" : "Save Form"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function FormCreatorPage() {
  return (
    <Suspense fallback={<main className="sase-page pt-[120px] text-center text-gray-500 font-medium">Loading form creator...</main>}>
      <FormCreator />
    </Suspense>
  );
}