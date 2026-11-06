"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/lib/auth";
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

/* ---- Countdown hook --------------------------------------- */
function useCountdown(target: Date) {
  const [delta, setDelta] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    function tick() {
      const diff = Math.max(0, target.getTime() - Date.now());
      setDelta({
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
      });
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
  const [collegeConfirmed, setCollegeConfirmed] = useState(false);
  const [wheelSelections, setWheelSelections] = useState<Record<string, string>>({});

  /* landing-specific state */
  const [email, setEmail] = useState("");
  const [landingSubmitted, setLandingSubmitted] = useState(false);
  const [landingError, setLandingError] = useState("");
  const [tridentShock, setTridentShock] = useState(false);
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

  /* countdown target — March 6, 2026 */
  const countdown = useCountdown(new Date("2026-03-06T09:00:00-05:00"));

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

  /* landing email pre-registration */
  async function handleLandingSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { setLandingError("Please enter a valid email."); return; }
    setLandingError("");
    setIsLandingSubmitting(true);

    // Store interest email in a simple form_submissions entry if the form exists
    if (form) {
      const { error } = await supabase.from("form_submissions").insert({
        form_id: form.id,
        user_id: null,
        responses: { interest_email: email, college_eligibility: "pre-registration interest" },
      });
      if (error && error.code !== "23505") {
        setLandingError("Something went wrong. Please try again.");
        setIsLandingSubmitting(false);
        return;
      }
    }

    setLandingSubmitted(true);
    setIsLandingSubmitting(false);
    setTridentShock(true);
    setTimeout(() => setTridentShock(false), 2000);
  }

  /* full form submit */
  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    const missingRequired = form.schema.some((q) => {
      const a = answers[q.id];
      return q.required && (!a || (Array.isArray(a) && a.length === 0) || (!Array.isArray(a) && a.trim() === ""));
    });

    if (missingRequired) { setMessage("Please answer all required questions."); return; }

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

    let rsvpMessage = "";
    if (form.event_id && user?.id) {
      const { error: rsvpError } = await supabase.from("event_rsvps").insert({
        event_id: form.event_id,
        user_id: user.id,
        status: "Going",
      });
      if (!rsvpError) {
        rsvpMessage = " You have also been RSVP'd to the associated event!";
        try {
          const [eventRes, profileRes] = await Promise.all([
            supabase.from("events").select("title").eq("id", form.event_id).single(),
            supabase.from("profiles").select("first_name, email, wants_email_notifications").eq("id", user.id).single(),
          ]);
          if (eventRes.data && profileRes.data?.email && profileRes.data.wants_email_notifications !== false) {
            await fetch("/api/email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: profileRes.data.email,
                firstName: profileRes.data.first_name,
                eventTitle: eventRes.data.title,
              }),
            });
          }
        } catch (e) {
          console.error("Failed to send RSVP email", e);
        }
      } else if (rsvpError.code !== "23505") {
        console.error("Error auto-RSVPing user:", rsvpError);
      }
    }

    setMessage(`Your form was submitted successfully.${rsvpMessage}`);
    setIsSubmitting(false);
  }

  const isLumaHacks = params.slug === "lumahacks";

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
     LUMAHACKS — Abyssal Descent Landing
     ================================================================ */

  /* ---- STEP 2: Full registration form ---------------------- */
  if (hasStarted) {
    return (
      <main className={`${styles.lumaPage} ${styles.formShell}`}>
        {/* Parallax layers */}
        <AbyssalLayers scrollMultiplier={0} />

        {/* Cursor */}
        <div ref={spotlightRef} className={styles.cursorSpotlight} aria-hidden="true" />

        <div className={styles.formHeader}>
          <p className="sase-eyebrow">UCF SASE / LumaHacks 2026</p>
          <h1>{form.title}</h1>
          <Link href="/forms" className="sase-secondary-button mx-auto block max-w-max text-center mt-6">
            ← Back to Forms
          </Link>
          {form.description && <p className="mt-4" style={{ color: "#506b8e" }}>{form.description}</p>}
        </div>

        <div className={`bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0] p-8 md:p-12 max-w-3xl mx-auto mt-8 relative overflow-hidden ${styles.formCard}`}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00d2ff] to-transparent" />
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
                dark
              />
            ))}
            {message && (
              <div className={message.includes("successfully") ? styles.successPulse : styles.errorPulse}>
                {message}
              </div>
            )}
            <button
              className="w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #00d2ff, #0052ff)",
                color: "#00072D",
                boxShadow: "0 0 30px rgba(0,210,255,0.3)",
              }}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit Registration"}
            </button>
          </form>
        </div>

        {/* Seabed hint at bottom */}
        <div style={{ height: "6rem" }} />
      </main>
    );
  }

  /* ---- STEP 1: Cinematic landing page ---------------------- */
  return (
    <main className={styles.lumaPage}>
      {/* Cursor spotlight */}
      <div ref={spotlightRef} className={styles.cursorSpotlight} aria-hidden="true" />

      {/* ===== PARALLAX LAYERS (fixed, behind everything) ===== */}
      <AbyssalLayers scrollMultiplier={1} />

      {/* ===================================================
          HERO ZONE — The Surface
          =================================================== */}
      <section className={styles.heroZone}>
        <div className={styles.depthIndicator} aria-hidden="true">
          <span className={styles.depthDot} />
          0M — Surface
        </div>

        <p className={styles.heroEyebrow}>UCF SASE presents</p>

        <h1 className={styles.heroTitle}>
          Luma
          <span className={styles.heroTitleAccent}>Hacks</span>
        </h1>

        <p className={styles.heroSubtitle}>
          {form.description || "A cinematic 48-hour descent into building, designing, and shipping — with the UCF tech community."}
        </p>

        {/* Event meta pills */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "2.5rem" }}>
          {[
            { label: "When", value: "March 6–7, 2026" },
            { label: "Who", value: "College students" },
            { label: "Format", value: "Hybrid" },
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

        {/* Countdown */}
        <div className={styles.countdown} aria-label="Countdown to LumaHacks">
          {[
            { n: countdown.days,    label: "Days" },
            { n: countdown.hours,   label: "Hrs" },
            { n: countdown.minutes, label: "Min" },
            { n: countdown.seconds, label: "Sec" },
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

        {/* Email pre-reg capture */}
        {!landingSubmitted ? (
          <form className={styles.emailCapture} onSubmit={handleLandingSubmit}>
            <div className={styles.eligibilityCheck}>
              <input
                id="college-eligibility"
                type="checkbox"
                checked={collegeConfirmed}
                onChange={(e) => {
                  setCollegeConfirmed(e.target.checked);
                  updateAnswer("college_eligibility", e.target.checked ? "I am currently enrolled in college or university." : "");
                }}
              />
              <label htmlFor="college-eligibility">
                <strong>College students only</strong>
                I confirm that I am currently enrolled in a college or university and am eligible to participate in LumaHacks.
              </label>
            </div>

            <div className={styles.emailWrapper}>
              <input
                className={styles.emailInput}
                type="email"
                placeholder="your@email.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!collegeConfirmed}
                required
              />
              <button
                type="submit"
                className={styles.submitOrb}
                disabled={!collegeConfirmed || isLandingSubmitting}
                aria-label="Submit pre-registration"
              >
                →
              </button>
            </div>

            {landingError && <p className={styles.errorPulse}>{landingError}</p>}

            <p style={{ color: "#506b8e", fontSize: "0.75rem", textAlign: "center", margin: 0 }}>
              Pre-register your interest · Full registration coming soon
            </p>

            <button
              type="button"
              onClick={() => setHasStarted(true)}
              disabled={!collegeConfirmed}
              style={{
                marginTop: "0.5rem",
                background: "transparent",
                border: "1px solid rgba(0,210,255,0.3)",
                borderRadius: "999px",
                color: "#00d2ff",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.65rem 1.5rem",
                cursor: collegeConfirmed ? "pointer" : "not-allowed",
                opacity: collegeConfirmed ? 1 : 0.4,
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              Full Registration Form →
            </button>
          </form>
        ) : (
          <div className={styles.emailCapture}>
            <span className={styles.successPulse}>You&apos;re on the list — dive deeper</span>
            <button
              type="button"
              onClick={() => { setCollegeConfirmed(true); setHasStarted(true); }}
              style={{
                marginTop: "0.75rem",
                background: "linear-gradient(135deg, #00d2ff, #0052ff)",
                border: "none",
                borderRadius: "999px",
                color: "#00072D",
                fontSize: "0.78rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.8rem 2rem",
                cursor: "pointer",
                boxShadow: "0 0 30px rgba(0,210,255,0.4)",
              }}
            >
              Complete Full Registration →
            </button>
          </div>
        )}

        {/* Scroll cue */}
        <div className={styles.scrollCue} aria-hidden="true">
          <span className={styles.scrollLine} />
          Descend
        </div>
      </section>

      {/* ===================================================
          TRENCH ZONE — Content Cards
          =================================================== */}
      <section className={styles.trenchZone}>
        {/* Tracks */}
        <div className={styles.sectionLabel}>Tracks</div>
        <div className={styles.trenchCard}>
          <span className={styles.depthLabel}>200M depth</span>
          <h2 className={styles.trenchCardTitle}>What will you build?</h2>
          <p className={styles.trenchCardBody}>
            Choose your path and go deep. Each track is an entire ocean waiting to be mapped.
          </p>
          <div className={styles.trenchGrid} style={{ marginTop: "2rem" }}>
            {[
              { icon: "⚡", name: "AI & Machine Learning", desc: "Build intelligent systems. Train models. Predict the unknowable." },
              { icon: "🌊", name: "Design & UX", desc: "Craft interfaces that feel like breathing underwater — intuitive and alive." },
              { icon: "🔗", name: "Open Innovation", desc: "No constraints. Any tech. Any problem. Any depth." },
              { icon: "🛡️", name: "Cybersecurity", desc: "Defend, detect, disrupt. Build tools that protect the digital reef." },
            ].map(({ icon, name, desc }) => (
              <div key={name} className={styles.trackTile}>
                <span className={styles.trackIcon}>{icon}</span>
                <p className={styles.trackName}>{name}</p>
                <p className={styles.trackDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.lightLeak} aria-hidden="true" />

        {/* Prizes */}
        <div className={styles.sectionLabel}>Prizes</div>
        <div className={styles.trenchCard}>
          <span className={styles.depthLabel}>1,500M depth</span>
          <h2 className={styles.trenchCardTitle}>Surface with something to show</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
            {[
              { rank: "1st", name: "Grand Prize", value: "$1,500" },
              { rank: "2nd", name: "Runner Up", value: "$750" },
              { rank: "3rd", name: "Third Place", value: "$400" },
              { rank: "★", name: "Best Design", value: "Special Award" },
              { rank: "★", name: "Best AI Use", value: "Special Award" },
            ].map(({ rank, name, value }, i) => (
              <div key={i} className={styles.prizeRow}>
                <span className={styles.prizeRank}>{rank}</span>
                <div className={styles.prizeInfo}>
                  <p className={styles.prizeName}>{name}</p>
                  <p className={styles.prizeValue}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.lightLeak} aria-hidden="true" />

        {/* Schedule */}
        <div className={styles.sectionLabel}>Schedule</div>
        <div className={styles.trenchCard}>
          <span className={styles.depthLabel}>4,000M depth</span>
          <h2 className={styles.trenchCardTitle}>48 hours. One descent.</h2>
          <div style={{ marginTop: "1.5rem" }}>
            {[
              { time: "SAT 9:00 AM", event: "Opening Ceremony", detail: "Welcome & track kickoffs" },
              { time: "SAT 10:00 AM", event: "Hacking Begins", detail: "Teams lock in. Dive starts." },
              { time: "SAT 1:00 PM", event: "Sponsor Workshops", detail: "AI tools, design systems, cloud infra" },
              { time: "SAT 7:00 PM", event: "Midnight Checkpoint", detail: "Optional mentor rounds" },
              { time: "SUN 10:00 AM", event: "Submission Deadline", detail: "Project freeze" },
              { time: "SUN 12:00 PM", event: "Demos & Judging", detail: "Panel reviews each track" },
              { time: "SUN 4:00 PM", event: "Awards Ceremony", detail: "Surface. Celebrate. Repeat." },
            ].map(({ time, event, detail }) => (
              <div key={time} className={styles.scheduleItem}>
                <span className={styles.scheduleTime}>{time}</span>
                <span className={styles.scheduleEvent}>
                  {event}
                  <small>{detail}</small>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.lightLeak} aria-hidden="true" />

        {/* FAQ */}
        <div className={styles.sectionLabel}>FAQ</div>
        <div className={styles.trenchCard}>
          <span className={styles.depthLabel}>7,000M depth</span>
          <h2 className={styles.trenchCardTitle}>Before you dive in</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1.5rem" }}>
            {[
              { q: "Who can participate?", a: "Any currently enrolled college or university student. All majors and skill levels are welcome." },
              { q: "Is it in-person or remote?", a: "LumaHacks is hybrid — attend at UCF or compete remotely from anywhere." },
              { q: "Do I need a team?", a: "Teams of 1–4. Solo divers welcome. We'll help match you with teammates at kickoff." },
              { q: "Is there a cost?", a: "LumaHacks is completely free to participate in. Food and swag provided on-site." },
            ].map(({ q, a }) => (
              <div key={q}>
                <p style={{ color: "#e0f2fe", fontWeight: 700, margin: "0 0 0.35rem", fontSize: "0.95rem" }}>{q}</p>
                <p style={{ color: "#506b8e", margin: 0, fontSize: "0.9rem", lineHeight: 1.6 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          SEABED TERMINAL — Ocean Floor
          =================================================== */}
      <section className={styles.seabed}>
        <div className={styles.seabedContent}>
          <p className={styles.terminalLabel}>Terminal depth reached</p>
          <p className={styles.depthReadout}>
            11,034<span>M</span>
          </p>
          <p style={{ color: "#506b8e", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "2rem" }}>
            Challenger Deep · Mariana Trench
          </p>

          {/* THE TRIDENT */}
          <div className={`${styles.tridentWrap} ${tridentShock ? styles.submitted : ""}`} aria-hidden="true">
            {/* Shockwave rings */}
            <div className={styles.shockwave} />
            <div className={styles.shockwave} />
            <div className={styles.shockwave} />

            {/* Aura */}
            <div className={styles.tridentAura} />

            {/* Trident geometry */}
            <div className={styles.trident}>
              <div className={styles.tridentHead}>
                <div className={styles.tineCentre} />
                <div className={styles.tineLeft} />
                <div className={styles.tineRight} />
                <div className={styles.crossbar} />
              </div>
              <div className={styles.tridentShaft} />
            </div>
          </div>

          <h2 className={styles.seabedTitle}>Ready to descend?</h2>
          <p className={styles.seabedSubtitle}>
            Pre-register now and be first to receive full application details when registration opens.
          </p>

          {!landingSubmitted ? (
            <form onSubmit={handleLandingSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", width: "100%", maxWidth: "28rem" }}>
              <div className={styles.emailWrapper} style={{ width: "100%" }}>
                <input
                  className={styles.emailInput}
                  type="email"
                  placeholder="your@email.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className={styles.submitOrb} disabled={isLandingSubmitting} aria-label="Submit pre-registration">
                  →
                </button>
              </div>
              {landingError && <p className={styles.errorPulse}>{landingError}</p>}
            </form>
          ) : (
            <span className={styles.successPulse}>Descent confirmed — we&apos;ll be in touch</span>
          )}

          <div style={{ marginTop: "3rem", display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              href="/forms"
              style={{ color: "#506b8e", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textDecoration: "none", textTransform: "uppercase" }}
            >
              ← All Forms
            </Link>
            <button
              type="button"
              onClick={() => { setCollegeConfirmed(true); setHasStarted(true); }}
              style={{ color: "#00d2ff", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", background: "none", border: "none", cursor: "pointer", textTransform: "uppercase", padding: 0 }}
            >
              Full Application →
            </button>
          </div>
        </div>

        {/* Basalt rocks & gravel (purely decorative) */}
        <div className={styles.gravel} aria-hidden="true" />
        <div className={styles.rocks} aria-hidden="true" />
      </section>
    </main>
  );
}

/* ================================================================
   ABYSSAL LAYERS — fixed parallax background system
   ================================================================ */
function AbyssalLayers({ scrollMultiplier }: { scrollMultiplier: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollMultiplier === 0) return; // static on form page
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

  return (
    <div ref={ref} style={{ position: "fixed", inset: 0, pointerEvents: "none" }} aria-hidden="true">
      {/* Layer 5 — Abyssal plumes */}
      <div className={styles.layerTrench} data-parallax="0.1">
        <div className={styles.trenchPlume} />
        <div className={styles.trenchPlume} />
        <div className={styles.trenchPlume} />
      </div>

      {/* Layer 4 — Deep-sea fish */}
      <div className={styles.layerFish} data-parallax="0.3">
        <div className={`${styles.fish} ${styles.anglerfish} ${styles.fish1}`} />
        <div className={`${styles.fish} ${styles.lanternfish} ${styles.fish2}`} />
        <div className={`${styles.fish} ${styles.anglerfish} ${styles.fish3}`} />
        <div className={`${styles.fish} ${styles.lanternfish} ${styles.fish4}`} />
        <div className={`${styles.fish} ${styles.lanternfish} ${styles.fish5}`} />
        <div className={`${styles.fish} ${styles.anglerfish} ${styles.fish6}`} />
        <div className={`${styles.fish} ${styles.lanternfish} ${styles.fish7}`} />
        <div className={`${styles.fish} ${styles.lanternfish} ${styles.fish8}`} />
        {/* boid school */}
        <div className={`${styles.fish} ${styles.boid} ${styles.boid1}`} />
        <div className={`${styles.fish} ${styles.boid} ${styles.boid2}`} />
        <div className={`${styles.fish} ${styles.boid} ${styles.boid3}`} />
        <div className={`${styles.fish} ${styles.boid} ${styles.boid4}`} />
        <div className={`${styles.fish} ${styles.boid} ${styles.boid5}`} />
        <div className={`${styles.fish} ${styles.boid} ${styles.boid6}`} />
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
   SHARED — Form question renderer (unchanged logic, style-agnostic)
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
    ? "text-xl font-black text-white mb-4 w-full leading-snug"
    : "text-xl font-black text-[#171d52] mb-4 w-full leading-snug";

  return (
    <fieldset className="border-b border-gray-100 pb-8 last:border-0 last:pb-0" style={dark ? { borderColor: "rgba(0,82,255,0.15)" } : {}}>
      <legend className={legendCls}>
        {question.label || "Untitled question"}
        {question.required && <span className="ml-1 text-red-400">*</span>}
      </legend>

      {question.type === "short_text" && (
        <input
          className={inputCls}
          placeholder="Your answer"
          value={typeof answers[question.id] === "string" ? (answers[question.id] as string) : ""}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          required={question.required}
        />
      )}

      {question.type === "paragraph" && (
        <textarea
          className={`min-h-32 resize-y ${inputCls}`}
          placeholder="Your answer"
          value={typeof answers[question.id] === "string" ? (answers[question.id] as string) : ""}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          required={question.required}
        />
      )}

      {question.type === "multiple_choice" && (
        <div className="flex flex-col gap-4">
          {question.options?.map((option) => (
            <label key={option} className="flex items-center gap-4 cursor-pointer group p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors" style={dark ? { "--tw-bg-opacity": "0", backgroundColor: "transparent" } as React.CSSProperties : {}}>
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
              <span className={`${labelTextCls} font-medium text-lg`}>{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === "select" && (
        <select
          className={inputCls}
          value={typeof answers[question.id] === "string" ? (answers[question.id] as string) : ""}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          required={question.required}
        >
          <option value="">Select an option</option>
          {question.options?.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )}

      {question.type === "wheel" && (
        <div className="flex flex-col gap-3">
          <select
            className={inputCls}
            value={wheelSelections[question.id] || ""}
            onChange={(e) => updateWheelAnswer(question.id, e.target.value)}
            required={question.required && wheelSelections[question.id] !== "Other"}
          >
            <option value="">Spin to choose an option</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {wheelSelections[question.id] === "Other" && (
            <input
              className={inputCls}
              placeholder="Type your answer"
              value={typeof answers[question.id] === "string" ? (answers[question.id] as string) : ""}
              onChange={(e) => updateAnswer(question.id, e.target.value)}
              required={question.required}
            />
          )}
        </div>
      )}

      {question.type === "checkbox" && (
        <div className="flex flex-col gap-4">
          {question.options?.map((option) => (
            <label key={option} className="flex items-center gap-4 cursor-pointer group p-2 -ml-2 rounded-lg transition-colors">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(answers[question.id]) && (answers[question.id] as string[]).includes(option)}
                  onChange={(e) => toggleCheckbox(question.id, option, e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded border-2 border-border peer-checked:border-[#00d2ff] peer-checked:bg-[#00d2ff] transition-all flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#00072D] opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className={`${labelTextCls} font-medium text-lg`}>{option}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
