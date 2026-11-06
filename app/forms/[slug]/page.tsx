"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Search, X } from "lucide-react";
import supabase from "@/lib/auth";
import { MAJORS } from "@/lib/majors";
import { UNIVERSITIES } from "@/lib/universities";
import styles from "./lumahacks.module.css";

/* ---- Types ------------------------------------------------ */
type Question = {
  id: string;
  type: "short_text" | "paragraph" | "multiple_choice" | "checkbox" | "select" | "wheel";
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

/* ---- Curated Diet Options for LumaHacks ---- */
const DIET_OPTIONS = [
  "No restrictions",
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Gluten-free",
  "Dairy-free / Lactose intolerant",
  "Pescatarian",
  "Nut allergy",
  "Peanut allergy",
  "Shellfish allergy",
  "Egg allergy",
  "Soy allergy",
  "Celiac disease",
  "Other",
];

/* ---- Precise Countdown hook with Months, Days, Hours, Minutes, Seconds ---- */
function useCountdown(target: Date) {
  const [delta, setDelta] = useState({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function tick() {
      const now = new Date();
      if (now >= target) {
        setDelta({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
      const tempDate = new Date(now);
      tempDate.setMonth(tempDate.getMonth() + months);

      if (tempDate > target) {
        months--;
        tempDate.setMonth(tempDate.getMonth() - 1);
      }

      const diffMs = Math.max(0, target.getTime() - tempDate.getTime());
      const days = Math.floor(diffMs / 86_400_000);
      const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
      const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
      const seconds = Math.floor((diffMs % 60_000) / 1_000);

      setDelta({ months, days, hours, minutes, seconds });
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return delta;
}

/* ---- Marine snow particle factory ------------------------- */
const SNOW_PARTICLES = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  width: `${Math.random() * 1.5 + 0.5}px`,
  height: `${Math.random() * 1.5 + 0.5}px`,
  animationDuration: `${Math.random() * 20 + 15}s`,
  animationDelay: `${-Math.random() * 20}s`,
}));

/* ---- Page component --------------------------------------- */
export default function FormResponsePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  /* form state */
  const [form, setForm] = useState<FormRecord | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [message, setMessage] = useState("Loading form...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [wheelSelections, setWheelSelections] = useState<Record<string, string>>({});

  /* landing-specific state */
  const [email, setEmail] = useState("");
  const [landingError, setLandingError] = useState("");
  const [isLandingSubmitting, setIsLandingSubmitting] = useState(false);

  /* cursor spotlight */
  const spotlightRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.left = `${e.clientX}px`;
        spotlightRef.current.style.top  = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  /* countdown target — March 6, 2027 09:00:00 EST */
  const countdownTarget = useRef(new Date("2027-03-06T09:00:00-05:00")).current;
  const countdown = useCountdown(countdownTarget);

  /* load form */
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
          router.replace(`/login?redirect=${encodeURIComponent(`/forms/${params.slug}`)}`);
          return;
        }
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

  /* answer helpers */
  function updateAnswer(questionId: string, value: string | string[]) {
    setAnswers((cur) => ({ ...cur, [questionId]: value }));
  }

  function updateWheelAnswer(questionId: string, value: string) {
    setWheelSelections((cur) => ({ ...cur, [questionId]: value }));
    updateAnswer(questionId, value === "Other" ? "" : value);
  }

  function toggleCheckbox(questionId: string, option: string, checked: boolean) {
    const current = Array.isArray(answers[questionId]) ? (answers[questionId] as string[]) : [];
    updateAnswer(questionId, checked ? [...current, option] : current.filter((v) => v !== option));
  }

  /* landing email capture — prompt to complete full registration */
  async function handleLandingSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setLandingError("Please enter a valid college or university email.");
      return;
    }
    setLandingError("");
    setIsLandingSubmitting(true);

    if (form) {
      const emailField = form.schema.find((q) => q.id === "email" || q.label.toLowerCase().includes("email"));
      if (emailField) {
        updateAnswer(emailField.id, email);
      }
    }

    setIsLandingSubmitting(false);
    setHasStarted(true);
  }

  const isLumaHacks = params.slug === "lumahacks";

  /* Reorder and normalize questions specifically for LumaHacks:
     - Level of study: Undergraduate or Graduate only (no high school)
     - College/school: searchable wheel
     - Major: searchable wheel with MAJORS
     - Diet: searchable wheel with DIET_OPTIONS
     - Graduation year: included
     - Agreement checkboxes (code of conduct, info sharing, partnership) placed at the very end
  */
  const displayQuestions = useMemo(() => {
    if (!form) return [];
    if (!isLumaHacks) return form.schema;

    const baseList: Question[] = [];
    let hasGraduationYear = false;

    form.schema.forEach((rawQ) => {
      let q = rawQ;

      // Filter out MLH questions / options for now
      const isMlhQuestion =
        q.id === "code_of_conduct" ||
        q.id === "info_sharing" ||
        q.id === "partnership" ||
        q.id.toLowerCase().includes("mlh") ||
        q.label.toLowerCase().includes("mlh") ||
        (q.options && q.options.length > 0 && q.options.every((opt) => opt.toLowerCase().includes("mlh")));

      if (isMlhQuestion) {
        return;
      }

      // If a multi-option question has MLH options mixed in, strip them out
      if (q.options && q.options.some((opt) => opt.toLowerCase().includes("mlh"))) {
        const cleanedOptions = q.options.filter((opt) => !opt.toLowerCase().includes("mlh"));
        if (cleanedOptions.length === 0) return;
        q = { ...q, options: cleanedOptions };
      }

      // 0. Age: MUST be 18+
      if (q.id === "age" || q.label.toLowerCase().includes("age")) {
        baseList.push({
          ...q,
          id: "age",
          type: "select",
          label: "Age (Must be 18+ to participate)",
          options: ["18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30+"],
          required: true,
        });
        return;
      }

      // 1. Level of study: Undergraduate or Graduate only
      if (q.id === "level_of_study" || q.label.toLowerCase().includes("level of study")) {
        baseList.push({
          ...q,
          id: "level_of_study",
          type: "multiple_choice",
          label: "Level of Study (College/University)",
          options: ["Undergraduate", "Graduate"],
          required: true,
        });
        return;
      }

      // 2. School/college: searchable wheel with full UNIVERSITIES list
      if (q.id === "school" || q.label.toLowerCase().includes("school")) {
        baseList.push({
          ...q,
          id: "school",
          type: "wheel",
          label: "College or University (Official Name)",
          options: UNIVERSITIES,
          required: true,
        });
        return;
      }

      // 3. Major: searchable wheel with MAJORS list
      if (q.id === "major" || q.label.toLowerCase().includes("major")) {
        baseList.push({
          ...q,
          id: "major",
          type: "wheel",
          label: "Major or Field of Study",
          options: [...MAJORS],
          required: true,
        });
        return;
      }

      // 4. Diet: searchable wheel with DIET_OPTIONS
      if (q.id === "dietary_restrictions" || q.label.toLowerCase().includes("diet")) {
        baseList.push({
          ...q,
          id: "dietary_restrictions",
          type: "wheel",
          label: "Dietary Restrictions or Needs",
          options: DIET_OPTIONS,
          required: false,
        });
        return;
      }

      if (q.id === "graduation_year" || q.label.toLowerCase().includes("graduation year")) {
        hasGraduationYear = true;
      }

      baseList.push(q);
    });

    // If schema doesn't already have graduation year, inject it right after school/level of study
    if (!hasGraduationYear) {
      const gradYearQuestion: Question = {
        id: "graduation_year",
        type: "select",
        label: "Expected Graduation Year",
        required: true,
        options: ["2026", "2027", "2028", "2029", "2030", "2031+"],
      };

      const schoolIndex = baseList.findIndex((q) => q.id === "school");
      if (schoolIndex !== -1) {
        baseList.splice(schoolIndex + 1, 0, gradYearQuestion);
      } else {
        baseList.push(gradYearQuestion);
      }
    }

    // Partition: separate agreement checkboxes to position at the very end
    const nonAgreement: Question[] = [];
    const agreementCheckboxes: Question[] = [];

    baseList.forEach((q) => {
      const isAgreement =
        q.type === "checkbox" ||
        q.id.includes("code_of_conduct") ||
        q.id.includes("info_sharing") ||
        q.id.includes("partnership") ||
        q.label.toLowerCase().includes("terms") ||
        q.label.toLowerCase().includes("agreement") ||
        q.label.toLowerCase().includes("policy") ||
        q.label.toLowerCase().includes("authorization");

      if (isAgreement) {
        agreementCheckboxes.push(q);
      } else {
        nonAgreement.push(q);
      }
    });

    return [...nonAgreement, ...agreementCheckboxes];
  }, [form, isLumaHacks]);

  /* full registration form submit */
  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    const missingRequired = displayQuestions.some((q) => {
      const a = answers[q.id];
      return q.required && (!a || (Array.isArray(a) && a.length === 0) || (!Array.isArray(a) && a.trim() === ""));
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

    // Extract registrant's email and first name
    const submittedEmail = (answers["email"] || email || "") as string;
    const submittedFirstName = (answers["first_name"] || "") as string;

    // Send the custom themed confirmation email
    let emailSent = false;
    if (submittedEmail && submittedEmail.includes("@")) {
      try {
        const emailRes = await fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "lumahacks_registration",
            email: submittedEmail.trim(),
            firstName: submittedFirstName.trim(),
            eventTitle: "LumaHacks 2027",
          }),
        });
        if (emailRes.ok) {
          emailSent = true;
        } else {
          const errData = await emailRes.json().catch(() => null);
          console.warn("Email API response not ok:", errData);
        }
      } catch (err) {
        console.error("Failed to trigger LumaHacks confirmation email:", err);
      }
    }

    // Auto-RSVP if the form is linked to an event
    let rsvpMessage = "";
    if (form.event_id && user?.id) {
      const { error: rsvpError } = await supabase.from("event_rsvps").insert({
        event_id: form.event_id,
        user_id: user.id,
        status: "Going",
      });
      if (!rsvpError) {
        rsvpMessage = " You have also been RSVP'd to the event!";
      }
    }

    const emailNote = emailSent
      ? " A registration email has been dispatched to your inbox. (Note: Official confirmation will take place closer to the event on a separate site.)"
      : submittedEmail
      ? ` Registration email dispatched for ${submittedEmail}. (Official confirmation will follow later on a separate site.)`
      : "";

    setMessage(`Your registration was submitted successfully!${emailNote}${rsvpMessage}`);
    setIsSubmitting(false);
  }

  /* ---- Loading / unavailable state ------------------------ */
  if (!form) {
    return (
      <main className="sase-page">
        <div className="sase-content-section text-center text-gray-500 font-medium">{message}</div>
      </main>
    );
  }

  /* ================================================================
     NON-LUMAHACKS: standard form shell
     ================================================================ */
  if (!isLumaHacks) {
    return (
      <main className="sase-page">
        <div className="sase-page-header">
          <p className="sase-eyebrow">UCF SASE / Form</p>
          <h1>{form.title}</h1>
          <Link href="/forms" className="sase-secondary-button mx-auto block max-w-max text-center mt-6">
            ← Back to Forms
          </Link>
          {form.description && <p className="mt-4">{form.description}</p>}
        </div>
        <div className="bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0] p-8 md:p-12 max-w-3xl mx-auto mt-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#171d52] via-[#5579bd] to-[#171d52]" />
          <form className="flex flex-col gap-10 mt-4" onSubmit={submitForm}>
            {form.schema.map((question) => (
              <FormQuestion
                key={question.id}
                question={question}
                answers={answers}
                wheelSelections={wheelSelections}
                updateAnswer={updateAnswer}
                updateWheelAnswer={updateWheelAnswer}
                toggleCheckbox={toggleCheckbox}
              />
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

  /* ================================================================
     LUMAHACKS — Abyssal Pre-registration Landing
     ================================================================ */

  /* ---- FULL REGISTRATION FORM VIEW ------------------------- */
  if (hasStarted) {
    return (
      <main className={`${styles.lumaPage} ${styles.formShell}`}>
        {/* Parallax layers */}
        <AbyssalLayers scrollMultiplier={0} />

        {/* Cursor spotlight */}
        <div ref={spotlightRef} className={styles.cursorSpotlight} aria-hidden="true" />

        <div className={styles.formHeader}>
          <p className="sase-eyebrow" style={{ color: "#00d2ff" }}>UCF SASE / LumaHacks 2027</p>
          <h1>Complete Full Registration</h1>
          <button
            type="button"
            onClick={() => setHasStarted(false)}
            className="sase-secondary-button mx-auto block max-w-max text-center mt-6"
            style={{
              borderColor: "rgba(0,210,255,0.35)",
              color: "#00d2ff",
              background: "transparent",
            }}
          >
            ← Back to Overview
          </button>
          <p className="mt-4" style={{ color: "#506b8e", textAlign: "center", fontSize: "0.95rem" }}>
            24-hour in-person hackathon · March 6–7, 2027 at UCF · Open strictly to currently enrolled college and university students.
          </p>
        </div>

        <div className={`rounded-3xl border border-[rgba(0,210,255,0.2)] p-8 md:p-12 max-w-3xl mx-auto mt-6 relative overflow-hidden ${styles.formCard}`}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00d2ff] to-transparent" />
          <form className="flex flex-col gap-8 mt-4" onSubmit={submitForm}>
            {displayQuestions.map((question) => (
              <FormQuestion
                key={question.id}
                question={question}
                answers={answers}
                wheelSelections={wheelSelections}
                updateAnswer={updateAnswer}
                updateWheelAnswer={updateWheelAnswer}
                toggleCheckbox={toggleCheckbox}
                dark
              />
            ))}

            {message && (
              <div className={message.includes("successfully") ? styles.successPulse : styles.errorPulse}>
                {message}
              </div>
            )}

            <button
              className="w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #00d2ff, #0052ff)",
                color: "#00072D",
                boxShadow: "0 0 30px rgba(0,210,255,0.4)",
              }}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting Registration…" : "Complete Registration"}
            </button>
          </form>
        </div>

        <div style={{ height: "6rem" }} />
      </main>
    );
  }

  /* ---- HERO PRE-REGISTRATION LANDING VIEW ------------------- */
  return (
    <main className={styles.lumaPage}>
      {/* Cursor spotlight */}
      <div ref={spotlightRef} className={styles.cursorSpotlight} aria-hidden="true" />

      {/* ===== PARALLAX LAYERS ===== */}
      <AbyssalLayers scrollMultiplier={1} />

      {/* ===================================================
          HERO ZONE
          =================================================== */}
      <section className={styles.heroZone}>
        <p className={styles.heroEyebrow}>UCF SASE presents</p>

        {/* Title: Single word in one line */}
        <h1 className={styles.heroTitle}>
          LumaHacks
        </h1>

        <p className={styles.heroSubtitle}>
          An exclusive 24-hour in-person hackathon uniting tech and design at the University of Central Florida. Open strictly to currently enrolled college and university students.
        </p>

        {/* Event meta badges */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "2.5rem" }}>
          {[
            { label: "When", value: "March 6–7, 2027" },
            { label: "Duration", value: "24-Hour Hackathon" },
            { label: "Format", value: "In-Person (UCF)" },
            { label: "Who", value: "College Students Only" },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "999px",
                border: "1px solid rgba(0,210,255,0.22)",
                background: "rgba(0,15,75,0.45)",
                backdropFilter: "blur(16px)",
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#506b8e", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
              <span style={{ color: "#e0f2fe", fontSize: "0.85rem", fontWeight: 700 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Countdown including Months */}
        <div className={styles.countdown} aria-label="Countdown to LumaHacks">
          {[
            { n: countdown.months,  label: "Months" },
            { n: countdown.days,    label: "Days" },
            { n: countdown.hours,   label: "Hours" },
            { n: countdown.minutes, label: "Mins" },
            { n: countdown.seconds, label: "Secs" },
          ].map(({ n, label }, i, arr) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "inherit" }}>
              <div className={styles.countUnit}>
                <span className={styles.countNumber}>{String(n).padStart(2, "0")}</span>
                <span className={styles.countLabel}>{label}</span>
              </div>
              {i < arr.length - 1 && <span className={styles.countSep}>:</span>}
            </div>
          ))}
        </div>

        {/* Email pre-registration field & Registration action */}
        <form className={styles.emailCapture} onSubmit={handleLandingSubmit}>
          <div className={styles.emailWrapper}>
            <input
              className={styles.emailInput}
              type="email"
              placeholder="Enter your college email (.edu)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className={styles.submitOrb}
              disabled={isLandingSubmitting}
              aria-label="Proceed to registration"
              title="Proceed to registration"
            >
              →
            </button>
          </div>

          {landingError && <p className={styles.errorPulse}>{landingError}</p>}

          <p style={{ color: "#506b8e", fontSize: "0.78rem", textAlign: "center", margin: "0.25rem 0 0" }}>
            Enrolled college & university students only · Enter email to complete full registration
          </p>

          <button
            type="button"
            onClick={() => {
              if (email && email.includes("@")) {
                const emailField = form.schema.find((q) => q.id === "email" || q.label.toLowerCase().includes("email"));
                if (emailField) updateAnswer(emailField.id, email);
              }
              setHasStarted(true);
            }}
            style={{
              marginTop: "0.75rem",
              background: "linear-gradient(135deg, #00d2ff, #0052ff)",
              border: "none",
              borderRadius: "999px",
              color: "#00072D",
              fontSize: "0.82rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "0.95rem 2.25rem",
              cursor: "pointer",
              boxShadow: "0 0 35px rgba(0,210,255,0.45)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            Complete Full Registration →
          </button>
        </form>
      </section>
    </main>
  );
}

/* ================================================================
   ABYSSAL LAYERS — fixed parallax background system with Fish School
   ================================================================ */
function AbyssalLayers({ scrollMultiplier }: { scrollMultiplier: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const schoolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollMultiplier === 0) return;
    function onScroll() {
      const y = window.scrollY;
      if (!ref.current) return;
      const layers = ref.current.querySelectorAll("[data-parallax]");
      layers.forEach((el) => {
        const speed = parseFloat((el as HTMLElement).dataset.parallax || "0");
        (el as HTMLElement).style.transform = `translateY(${y * speed}px)`;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollMultiplier]);

  // Interactive School of Fishes that swim to and orbit/surround the cursor
  useEffect(() => {
    const container = schoolRef.current;
    if (!container) return;

    const fishes = Array.from(container.children) as HTMLElement[];
    const count = fishes.length;
    if (count === 0) return;

    let targetX = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
    let targetY = typeof window !== "undefined" ? window.innerHeight / 2 : 400;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const boids = fishes.map((_, i) => ({
      x: targetX + (Math.random() - 0.5) * 800,
      y: targetY + (Math.random() - 0.5) * 600,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      orbitRadius: 40 + Math.random() * 85,
      orbitSpeed: (0.015 + Math.random() * 0.03) * (i % 2 === 0 ? 1 : -1),
      angle: (i / count) * Math.PI * 2,
      followSpeed: 0.02 + Math.random() * 0.045,
      wobbleFreq: 2 + Math.random() * 3,
      wobbleAmp: 5 + Math.random() * 8,
      scale: 0.75 + Math.random() * 0.5,
    }));

    let animId: number;
    let time = 0;

    const loop = () => {
      time += 0.03;

      boids.forEach((boid, i) => {
        const el = fishes[i];
        if (!el) return;

        boid.angle += boid.orbitSpeed;
        const currentRadius = boid.orbitRadius + Math.sin(time * boid.wobbleFreq + i) * boid.wobbleAmp;

        const desiredX = targetX + Math.cos(boid.angle) * currentRadius;
        const desiredY = targetY + Math.sin(boid.angle) * currentRadius;

        boid.x += (desiredX - boid.x) * boid.followSpeed;
        boid.y += (desiredY - boid.y) * boid.followSpeed;

        const nextX = targetX + Math.cos(boid.angle + boid.orbitSpeed) * currentRadius;
        const nextY = targetY + Math.sin(boid.angle + boid.orbitSpeed) * currentRadius;
        const headingRad = Math.atan2(nextY - boid.y, nextX - boid.x);
        const headingDeg = (headingRad * 180) / Math.PI;

        el.style.transform = `translate3d(${boid.x}px, ${boid.y}px, 0) rotate(${headingDeg}deg) scale(${boid.scale})`;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: "fixed", inset: 0, pointerEvents: "none" }} aria-hidden="true">
      {/* Layer 5 — Abyssal plumes */}
      <div className={styles.layerTrench} data-parallax="0.1">
        <div className={styles.trenchPlume} />
        <div className={styles.trenchPlume} />
        <div className={styles.trenchPlume} />
      </div>

      {/* Layer 4 — Deep-sea fish & School that surrounds cursor */}
      <div className={styles.layerFish} data-parallax="0.3">
        <div className={`${styles.fish} ${styles.anglerfish} ${styles.fish1}`} />
        <div className={`${styles.fish} ${styles.lanternfish} ${styles.fish2}`} />
        <div className={`${styles.fish} ${styles.anglerfish} ${styles.fish3}`} />
        <div className={`${styles.fish} ${styles.lanternfish} ${styles.fish4}`} />
        <div className={`${styles.fish} ${styles.lanternfish} ${styles.fish5}`} />
        <div className={`${styles.fish} ${styles.anglerfish} ${styles.fish6}`} />
        <div className={`${styles.fish} ${styles.lanternfish} ${styles.fish7}`} />
        <div className={`${styles.fish} ${styles.lanternfish} ${styles.fish8}`} />

        <div ref={schoolRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className={styles.boid} style={{ top: 0, left: 0 }} />
          ))}
        </div>
      </div>

      {/* Layer 3 — Wireframe jellies */}
      <div className={styles.layerJellies} data-parallax="0.6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`${styles.jelly} ${styles[`jelly${n}` as keyof typeof styles]}`}>
            <div className={styles.jellyBody} />
            <div className={styles.jellyTentacles}>
              {[0, 1, 2, 3].map((t) => (
                <span key={t} style={{ animationDelay: `${t * 0.4}s` }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Layer 2 — Marine snow */}
      <div className={styles.layerSnow} data-parallax="0.8">
        {SNOW_PARTICLES.map((p) => (
          <div
            key={p.id}
            className={styles.snowParticle}
            style={{
              left: p.left,
              width: p.width,
              height: p.height,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
              top: "-10px",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   SEARCHABLE WHEEL SELECT (with Instant Filter Search)
   ================================================================ */
function SearchableWheelSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select or search...",
  required = false,
  dark = false,
}: {
  value: string;
  onChange: (val: string) => void;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  dark?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const lower = query.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(lower));
  }, [options, query]);

  const displaySelected = value || "";

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Hidden input for native HTML form validity */}
      <input
        type="text"
        value={value}
        onChange={() => {}}
        required={required}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Trigger Button */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
          dark
            ? "border border-[rgba(0,210,255,0.22)] bg-[rgba(0,7,45,0.7)] hover:border-[#00d2ff] text-[#e0f2fe]"
            : "border border-border bg-gray-50 hover:border-[#5579bd] text-[#171d52]"
        } ${isOpen ? (dark ? "border-[#00d2ff] ring-2 ring-[rgba(0,210,255,0.2)]" : "border-[#5579bd] ring-2 ring-[#e9eef8]") : ""}`}
      >
        <span className={`font-medium truncate ${displaySelected ? (dark ? "text-white" : "text-[#171d52]") : "text-gray-400"}`}>
          {displaySelected || placeholder}
        </span>
        <div className="flex items-center gap-1.5 ml-2 shrink-0 text-[#00d2ff]">
          {displaySelected && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setQuery("");
              }}
              className="p-1 hover:text-white transition-colors"
              aria-label="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Dropdown Menu with Search */}
      {isOpen && (
        <div
          className={`absolute z-50 left-0 right-0 mt-2 rounded-xl shadow-2xl overflow-hidden border backdrop-blur-2xl ${
            dark
              ? "bg-[#000a38]/95 border-[rgba(0,210,255,0.3)] shadow-[0_15px_40px_rgba(0,0,0,0.8)]"
              : "bg-white border-border shadow-xl"
          }`}
        >
          {/* Search Box */}
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <Search size={16} className={dark ? "text-[#00d2ff]" : "text-gray-400"} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter..."
              className={`w-full bg-transparent text-sm outline-none font-medium ${
                dark ? "text-white placeholder:text-gray-400" : "text-gray-800 placeholder:text-gray-400"
              }`}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-gray-400 hover:text-white text-xs px-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                      isSelected
                        ? (dark ? "bg-[#00d2ff] text-[#00072D] font-bold" : "bg-[#5579bd] text-white font-bold")
                        : (dark ? "text-[#e0f2fe] hover:bg-white/10" : "text-gray-800 hover:bg-gray-100")
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && <span className="text-xs">✓</span>}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-gray-400">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   SHARED — Form question renderer
   ================================================================ */
function FormQuestion({
  question,
  answers,
  wheelSelections,
  updateAnswer,
  updateWheelAnswer,
  toggleCheckbox,
  dark = false,
}: {
  question: Question;
  answers: Answers;
  wheelSelections: Record<string, string>;
  updateAnswer: (id: string, v: string | string[]) => void;
  updateWheelAnswer: (id: string, v: string) => void;
  toggleCheckbox: (id: string, opt: string, checked: boolean) => void;
  dark?: boolean;
}) {
  const inputCls = dark
    ? "w-full rounded-xl border border-[rgba(0,210,255,0.22)] bg-[rgba(0,7,45,0.7)] p-4 outline-none focus:border-[#00d2ff] focus:ring-2 focus:ring-[rgba(0,210,255,0.15)] transition-all text-[#e0f2fe] font-medium"
    : "w-full rounded-xl border border-border bg-gray-50 p-4 outline-none focus:bg-card focus:border-[#5579bd] focus:ring-4 focus:ring-[#e9eef8] transition-all text-[#171d52] font-medium";

  const labelTextCls = dark ? "text-[#e0f2fe]" : "text-[#171d52]";
  const legendCls = dark
    ? "text-lg font-bold text-white mb-3 w-full leading-snug"
    : "text-xl font-black text-[#171d52] mb-4 w-full leading-snug";

  const isWheelLike = question.type === "wheel" || (dark && (question.id === "major" || question.id === "school" || question.id === "dietary_restrictions"));

  return (
    <fieldset className="border-b border-gray-100 pb-6 last:border-0 last:pb-0" style={dark ? { borderColor: "rgba(0,82,255,0.15)" } : {}}>
      <legend className={legendCls}>
        {question.label || "Untitled question"}
        {question.required && <span className="ml-1 text-[#00d2ff]">*</span>}
      </legend>

      {/* Searchable wheel dropdown for major, diet, college, or any wheel question */}
      {isWheelLike && (
        <div className="flex flex-col gap-3">
          <SearchableWheelSelect
            value={wheelSelections[question.id] || (typeof answers[question.id] === "string" ? (answers[question.id] as string) : "")}
            onChange={(val) => updateWheelAnswer(question.id, val)}
            options={question.options || []}
            placeholder={`Select or search ${question.label.toLowerCase()}...`}
            required={question.required && wheelSelections[question.id] !== "Other"}
            dark={dark}
          />
          {wheelSelections[question.id] === "Other" && (
            <input
              className={inputCls}
              placeholder={`Specify your ${question.label.toLowerCase()}`}
              value={typeof answers[question.id] === "string" ? (answers[question.id] as string) : ""}
              onChange={(e) => updateAnswer(question.id, e.target.value)}
              required={question.required}
            />
          )}
        </div>
      )}

      {question.type === "short_text" && !isWheelLike && (
        <input
          className={inputCls}
          placeholder="Your answer"
          value={typeof answers[question.id] === "string" ? (answers[question.id] as string) : ""}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          required={question.required}
        />
      )}

      {question.type === "paragraph" && !isWheelLike && (
        <textarea
          className={`min-h-32 resize-y ${inputCls}`}
          placeholder="Your answer"
          value={typeof answers[question.id] === "string" ? (answers[question.id] as string) : ""}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          required={question.required}
        />
      )}

      {question.type === "multiple_choice" && !isWheelLike && (
        <div className="flex flex-col gap-3">
          {question.options?.map((option) => (
            <label key={option} className="flex items-center gap-4 cursor-pointer group p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className="relative flex items-center">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  required={question.required}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded-full border-2 border-border peer-checked:border-[#00d2ff] transition-colors flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00d2ff] opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className={`${labelTextCls} font-medium text-base`}>{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === "select" && !isWheelLike && (
        <select
          className={inputCls}
          value={typeof answers[question.id] === "string" ? (answers[question.id] as string) : ""}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          required={question.required}
        >
          <option value="" style={{ background: "#00072D", color: "#e0f2fe" }}>Select an option</option>
          {question.options?.map((option) => (
            <option key={option} value={option} style={{ background: "#00072D", color: "#e0f2fe" }}>{option}</option>
          ))}
        </select>
      )}

      {question.type === "checkbox" && !isWheelLike && (
        <div className="flex flex-col gap-3">
          {question.options?.map((option) => (
            <label key={option} className="flex items-center gap-4 cursor-pointer group p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(answers[question.id]) && (answers[question.id] as string[]).includes(option)}
                  onChange={(e) => toggleCheckbox(question.id, option, e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded border-2 border-[rgba(0,210,255,0.4)] peer-checked:border-[#00d2ff] peer-checked:bg-[#00d2ff] transition-all flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#00072D] opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className={`${labelTextCls} font-medium text-base`}>{option}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
