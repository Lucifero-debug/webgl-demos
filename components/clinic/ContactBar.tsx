"use client";

import { useEffect, useState } from "react";
import type { ClinicConfig } from "@/lib/clinic/types";
import { telLink, waLink } from "@/lib/clinic/whatsapp";
import EnquiryForm from "./EnquiryForm";
import { PhoneMark, WhatsAppMark } from "./marks";

/**
 * The three ways to get in touch, always within reach.
 *
 * Dr. Sachdeva asked for WhatsApp, a call, and an enquiry form, and for the
 * form to reach him on WhatsApp rather than by email -- "people are
 * generally more comfortable using WhatsApp for quick communication".
 *
 * WHY A FIXED BAR RATHER THAN MORE BUTTONS IN THE PAGE. The page is a long
 * scroll story: a patient convinced at the three-minute mark is wherever the
 * story put them, not next to a button. The existing "Book a consultation"
 * links stay where they are; this sits under everything so the decision can
 * be acted on the moment it is made. On a phone it is a bottom bar, where a
 * thumb already is; on a desktop it tucks into the bottom-right corner.
 *
 * The dialog here and the enquiry section in the page body (EnquirySection)
 * both render the SAME EnquiryForm -- one tap from anywhere for whoever has
 * already decided, a section in the story for whoever reads to the end.
 */
export default function ContactBar({ config }: { config: ClinicConfig }) {
  const contact = config.contact;
  const [open, setOpen] = useState(false);

  if (!contact) return null;

  const chat = waLink(contact.whatsapp, contact.openingMessage || "");
  const call = telLink(contact.phone);

  return (
    <>
      {/* Under the dialog, over everything else. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 print:hidden">
        <div className="pointer-events-auto mx-auto flex w-full items-stretch gap-px border-t border-white/10 bg-black/80 backdrop-blur-md md:mb-5 md:mr-5 md:w-auto md:justify-end md:gap-2 md:border-0 md:bg-transparent md:backdrop-blur-0">
          <a
            href={chat}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 px-3 py-3.5 text-[13px] font-medium text-white md:flex-none md:rounded-full md:bg-[#25D366] md:px-5 md:py-3 md:text-black md:shadow-lg md:shadow-black/30"
          >
            <WhatsAppMark />
            {contact.whatsappLabel || "WhatsApp"}
          </a>

          <a
            href={call}
            className="flex flex-1 items-center justify-center gap-2 border-l border-white/10 px-3 py-3.5 text-[13px] font-medium text-white md:flex-none md:rounded-full md:border-0 md:bg-white md:px-5 md:py-3 md:text-black md:shadow-lg md:shadow-black/30"
          >
            <PhoneMark />
            {contact.callLabel || "Call"}
          </a>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 border-l border-white/10 px-3 py-3.5 text-[13px] font-medium text-white md:flex-none md:rounded-full md:border md:border-white/25 md:bg-black/70 md:px-5 md:py-3 md:backdrop-blur-md"
          >
            {contact.enquireLabel || "Enquire"}
          </button>
        </div>
      </div>

      {open && <EnquiryDialog config={config} onClose={() => setOpen(false)} />}
    </>
  );
}

function EnquiryDialog({
  config,
  onClose,
}: {
  config: ClinicConfig;
  onClose: () => void;
}) {
  const form = config.contact?.form;

  // Escape closes the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={form?.title || "Enquiry"}
      onClick={onClose}
    >
      {/* Square and hairline-bordered, like the page behind it. */}
      <div
        className="max-h-[92svh] w-full max-w-lg overflow-y-auto border border-[color:var(--hairline)] bg-[#0B0C0D] p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {form?.label && (
              <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--accent)]">
                {form.label}
              </p>
            )}
            <h2 className="mt-2.5 font-[family-name:var(--font-serif)] text-[26px] font-light leading-tight text-white">
              {form?.title || "Send an enquiry"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 flex h-9 w-9 items-center justify-center border border-transparent text-[15px] text-white/50 transition-colors hover:border-[color:var(--hairline)] hover:text-white"
          >
            ✕
          </button>
        </div>

        {form?.body && (
          <p className="mt-4 text-[14px] leading-relaxed text-[color:var(--muted)]">
            {form.body}
          </p>
        )}

        <div className="mt-7">
          {/* onSent closes the dialog, so the form skips its own note. */}
          <EnquiryForm config={config} onSent={onClose} autoFocus />
        </div>
      </div>
    </div>
  );
}
