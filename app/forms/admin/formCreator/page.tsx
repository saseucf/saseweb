"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/auth";

type Question = {
  id: string;
  type:
    | "short_text"
    | "paragraph"
    | "multiple_choice"
    | "checkbox";
  label: string;
  required: boolean;
  options?: string[];
};

function FormCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const formId = searchParams.get("id");
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [slug, setSlug] = useState("");

  const [requiresLogin, setRequiresLogin] =
    useState(true);

  const [isOpen, setIsOpen] =
    useState(true);

  const [questions, setQuestions] =
    useState<Question[]>([
      {
        id: crypto.randomUUID(),
        type: "short_text",
        label: "",
        required: false,
      },
    ]);

  // Load existing form when editing
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
    setQuestions(data.schema);
  }

  loadForm();
  }, [formId, router]);

  function addQuestion() {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type: "short_text",
      label: "",
      required: false,
    };

    setQuestions([
      ...questions,
      newQuestion,
    ]);
  }

  function changeQuestionType(
    id: string,
    newType: Question["type"]
  ) {
    setQuestions(
      questions.map((question) =>
        question.id === id
          ? {
              ...question,
              type: newType,

              // Give option-based questions
              // starting options
              options:
                newType === "multiple_choice" ||
                newType === "checkbox"
                  ? question.options || [
                      "Option 1",
                      "Option 2",
                    ]
                  : undefined,
            }
          : question
      )
    );
  }

  function changeQuestionLabel(
    id: string,
    newLabel: string
  ) {
    setQuestions(
      questions.map((question) =>
        question.id === id
          ? {
              ...question,
              label: newLabel,
            }
          : question
      )
    );
  }

  function changeRequired(
    id: string,
    required: boolean
  ) {
    setQuestions(
      questions.map((question) =>
        question.id === id
          ? {
              ...question,
              required: required,
            }
          : question
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
                question.options?.map(
                  (option, index) =>
                    index === optionIndex
                      ? newValue
                      : option
                ) || [],
            }
          : question
      )
    );
  }

  function addOption(
    questionId: string
  ) {
    setQuestions(
      questions.map((question) =>
        question.id === questionId
          ? {
              ...question,

              options: [
                ...(question.options || []),

                `Option ${
                  (question.options?.length || 0) + 1
                }`,
              ],
            }
          : question
      )
    );
  }

  function deleteQuestion(
    id: string
  ) {
    const updatedQuestions =
      questions.filter(
        (question) =>
          question.id !== id
      );

    setQuestions(updatedQuestions);
  }

  function goBackToAdminPanel() {
    router.replace("/forms/admin");
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
    const { error } = await supabase
      .from("forms")
      .insert({
        title: title,
        description: description,
        slug: slug,
        schema: questions,
        requires_login: requiresLogin,
        is_open: isOpen,
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
    <main className="sase-page sase-creator-page">
      <div className="sase-page-header">
        <p className="sase-eyebrow">UCF SASE / Form builder</p>
        <h1>Form Creator</h1>
        <p>Shape a clear, welcoming form for the SASE community.</p>
      </div>

      <button
        className="ml-8 mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        onClick={goBackToAdminPanel}
      >
        Back to Admin Panel
      </button>

      {/* Form information */}
      <div className="sase-creator-panel">
        <textarea
          className="text-3xl text-gray-500 font-bold"
          placeholder="Title..."
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
        />

        <textarea
          placeholder="Description..."
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
        />

        <input
          type="text"
          placeholder="Slug..."
          value={slug}
          onChange={(e) =>
            setSlug(e.target.value)
          }
          className="border rounded-md p-2"
        />

        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={requiresLogin}
            onChange={(e) =>
              setRequiresLogin(
                e.target.checked
              )
            }
          />

          Require Login
        </label>

        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={isOpen}
            onChange={(e) =>
              setIsOpen(
                e.target.checked
              )
            }
          />

          Accepting Responses
        </label>
      </div>

      {/* Questions */}
      {questions.map(
        (question, index) => (
          <div
            key={question.id}
            className="w-[600px] flex flex-col ml-150 mt-4 border rounded-xl border-gray-300 gap-4 p-4"
          >
            <h1 className="text-2xl font-bold">
              Question {index + 1}
            </h1>

            <button
              className="ml-100 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              onClick={() =>
                deleteQuestion(
                  question.id
                )
              }
            >
              Delete Question
            </button>

            {/* Question Type */}
            <select
              className="border rounded-md p-2"
              value={question.type}
              onChange={(e) =>
                changeQuestionType(
                  question.id,

                  e.target
                    .value as Question["type"]
                )
              }
            >
              <option value="short_text">
                Short Answer
              </option>

              <option value="paragraph">
                Paragraph
              </option>

              <option value="multiple_choice">
                Multiple Choice
              </option>

              <option value="checkbox">
                Checkbox
              </option>
            </select>

            {/* Actual question */}
            <textarea
              placeholder="Question..."
              className="border rounded-md p-2"
              value={question.label}
              onChange={(e) =>
                changeQuestionLabel(
                  question.id,
                  e.target.value
                )
              }
            />

            {/* Required */}
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={
                  question.required
                }
                onChange={(e) =>
                  changeRequired(
                    question.id,
                    e.target.checked
                  )
                }
              />

              Required
            </label>

            {/* Short Answer */}
            {question.type ===
              "short_text" && (
              <input
                type="text"
                placeholder="Short answer..."
                className="border rounded-md p-2"
                disabled
              />
            )}

            {/* Paragraph */}
            {question.type ===
              "paragraph" && (
              <textarea
                placeholder="Long answer..."
                className="border rounded-md p-2"
                disabled
              />
            )}

            {/* Multiple Choice */}
            {question.type ===
              "multiple_choice" && (
              <div className="flex flex-col gap-2">

                {question.options?.map(
                  (
                    option,
                    optionIndex
                  ) => (
                    <label
                      key={
                        optionIndex
                      }
                      className="flex items-center gap-2"
                    >
                      <input
                        type="radio"
                        disabled
                      />

                      <input
                        type="text"
                        value={
                          option
                        }
                        onChange={(
                          e
                        ) =>
                          changeOption(
                            question.id,
                            optionIndex,
                            e.target
                              .value
                          )
                        }
                        className="border-b p-1 outline-none"
                      />
                    </label>
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    addOption(
                      question.id
                    )
                  }
                  className="w-fit text-blue-600 hover:underline"
                >
                  + Add Option
                </button>
              </div>
            )}

            {/* Checkbox */}
            {question.type ===
              "checkbox" && (
              <div className="flex flex-col gap-2">

                {question.options?.map(
                  (
                    option,
                    optionIndex
                  ) => (
                    <label
                      key={
                        optionIndex
                      }
                      className="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        disabled
                      />

                      <input
                        type="text"
                        value={
                          option
                        }
                        onChange={(
                          e
                        ) =>
                          changeOption(
                            question.id,
                            optionIndex,
                            e.target
                              .value
                          )
                        }
                        className="border-b p-1 outline-none"
                      />
                    </label>
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    addOption(
                      question.id
                    )
                  }
                  className="w-fit text-blue-600 hover:underline"
                >
                  + Add Option
                </button>
              </div>
            )}
          </div>
        )
      )}

      <button
        onClick={addQuestion}
        className="ml-150 mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Add Question
      </button>

      <button
        onClick={saveForm}
        className="ml-150 mt-4 mb-8 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        {formId !== null
          ? "Save Changes"
          : "Save Form"}
      </button>
    </main>
  );
}

export default function FormCreatorPage() {
  return (
    <Suspense fallback={<main className="p-8">Loading form creator...</main>}>
      <FormCreator />
    </Suspense>
  );
}