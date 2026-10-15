"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import type { ClinicConfig } from "@/lib/clinic/types";
import { enquiryMessage, enquiryProblems, waLink } from "@/lib/clinic/whatsapp";
import { WhatsAppMark } from "./marks";

/**
 * The enquiry form, in ONE place.
 *
 * It is shown twice: inside the dialog the floating "Enquire" button opens,
 * and as a section near the end of the page (the #enquiry section in
 * ClinicDetails). One component for both, because two copies of a form
 * drift -- the dialog gains a field the section does not, and what reaches
 * the clinic then depends on which one the patient happened to find.
 *
 * STYLING. Square edges, hairline borders, an uppercase label above each
 * box: the same vocabulary as the rest of the page, which has no rounded
 * corner anywhere. A form in a different idiom to the page it sits in is
 * the thing that reads as bolted on. The one exception is the submit
 * button's green, which is WhatsApp's own and tells the patient where the
 * message is going before they commit to it.
 *
 * WHAT SUBMIT ACTUALLY DOES. lib/clinic/whatsapp.ts is blunt about the
 * limit and so is this: a page with no server of its own cannot SEND a
 * WhatsApp message. Submitting opens WhatsApp with the message already
 * written, and the patient taps send. The form says that under the button
 * rather than letting anyone believe their details have gone.
 */
export default function EnquiryForm({
  config,
  onSent,
  autoFocus = false,
}: {
  config: ClinicConfig;
  /** Given by the dialog, which closes itself instead of showing the note. */
  onSent?: () => void;
  autoFocus?: boolean;
}) {
  const contact = config.contact;
  const subjects = contact?.form?.subjects || [];

  const [values, setValues] = useState({
    name: "",
    phone: "",
    subject: subjects[0] || "",
    message: "",
  });
  const [error, setError] = useState("");
  const [handedOver, setHandedOver] = useState(false);
  const nameBox = useRef<HTMLInputElement>(null);
  const phoneBox = useRef<HTMLInputElement>(null);

  if (!contact) return null;

  const set = (key: keyof typeof values, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();

    const problems = enquiryProblems(values);
    if (problems.length) {
      setError(problems[0]);
      // Put the cursor where the fix is. Only two fields are ever at
      // fault, so reading which from the message is enough -- the
      // alternative is a second copy of the validation rules in here.
      const box = problems[0].toLowerCase().includes("name") ? nameBox : phoneBox;
      box.current?.focus();
      return;
    }

    const href = waLink(contact.whatsapp, enquiryMessage(values, config.brand));
    if (!href) {
      setError("The clinic's WhatsApp number is missing.");
      return;
    }

    // A new tab, so the patient's place in the page is still here when they
    // come back from WhatsApp. On a phone this hands straight to the app.
    window.open(href, "_blank", "noopener,noreferrer");
    setError("");

    if (onSent) onSent();
    else setHandedOver(true);
  };

  // Only the in-page form reaches this: the dialog closes instead. Without
  // it the page would sit unchanged behind a tab that may have been
  // blocked, with nothing to tell the patient either way.
  if (handedOver) {
    return (
      <div>
        <p className="text-[13px] uppercase tracking-[0.14em] text-[color:var(--accent)]">
          Over to WhatsApp
        </p>
        <p className={`${serif} mt-3 text-[26px] font-light leading-snug`}>
          Your message is written and waiting.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--muted)]">
          Tap send in the WhatsApp tab and {config.brand} will have your
          details. If that tab did not open, use the WhatsApp button at the
          bottom of the screen and the same message will be there.
        </p>
        <button
          type="button"
          onClick={() => {
            setValues({ name: "", phone: "", subject: subjects[0] || "", message: "" });
            setHandedOver(false);
          }}
          className="mt-7 inline-flex h-12 items-center border border-[color:var(--hairline)] px-6 text-[14px] font-medium transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" required>
          <input
            ref={nameBox}
            autoFocus={autoFocus}
            className={box}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
            placeholder="Full name"
          />
        </Field>

        <Field label="Phone number" required>
          <input
            ref={phoneBox}
            className={box}
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="10-digit mobile"
          />
        </Field>
      </div>

      {subjects.length > 0 && (
        <div className="mt-5">
          <Field label="What is it about?">
            <div className="relative">
              <select
                className={`${box} cursor-pointer appearance-none pr-11`}
                value={values.subject}
                onChange={(e) => set("subject", e.target.value)}
              >
                {subjects.map((s) => (
                  <option key={s} value={s} className="bg-[#101113]">
                    {s}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
          </Field>
        </div>
      )}

      <div className="mt-5">
        <Field label="Anything you would like to add" hint="Optional">
          <textarea
            className={`${box} min-h-[112px] resize-y py-3.5 leading-relaxed`}
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="What is troubling you, or what you would like to know"
          />
        </Field>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 border-l-2 border-[#E08A7B] bg-[#E08A7B]/10 px-4 py-3 text-[13px] text-[#EEBAB0]"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        className="mt-7 flex h-[52px] w-full items-center justify-center gap-2.5 bg-[#25D366] px-6 text-[14px] font-semibold tracking-wide text-[#08190F] transition-colors hover:bg-[#3BDE7C]"
      >
        <WhatsAppMark />
        Send on WhatsApp
      </button>

      {/* Said plainly, above the fold of the button: a form that looks like
          it has sent and has not is worse than one that explains itself. */}
      <div className="mt-6 space-y-2 border-t border-[color:var(--hairline)] pt-5 text-[12px] leading-relaxed text-[color:var(--muted)]">
        <p>
          This opens WhatsApp with your details already written — tap send
          there and the clinic replies to you directly.
        </p>
        <p>
          Nothing is saved on this page, and your number goes to the clinic
          alone.
        </p>
        {contact.form?.note && <p>{contact.form.note}</p>}
      </div>
    </form>
  );
}

const serif = "font-[family-name:var(--font-serif)]";

/**
 * One box. Square and hairline-bordered like everything else on the page;
 * the gold border on focus is the page's accent doing the work a browser
 * outline would otherwise do badly on a dark background.
 */
const box =
  "h-12 w-full border border-[color:var(--hairline)] bg-black/25 px-4 text-[15px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-[color:var(--accent)] focus:bg-black/40";

function Field({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-1 text-[color:var(--accent)]">
              *
            </span>
          )}
        </span>
        {hint && <span className="text-[11px] text-white/25">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** The select's own arrow, since appearance-none removes the native one. */
function Chevron() {
  return (
    <svg
      viewBox="0 0 12 8"
      aria-hidden="true"
      className="pointer-events-none absolute right-4 top-1/2 h-2 w-3 -translate-y-1/2 fill-none stroke-[color:var(--accent)] stroke-[1.5]"
    >
      <path d="M1 1.5 6 6.5l5-5" />
    </svg>
  );
}
