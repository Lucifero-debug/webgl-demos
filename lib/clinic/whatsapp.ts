/**
 * Handing an enquiry to WhatsApp.
 *
 * WHAT THIS DOES AND DOES NOT DO. A page on Vercel cannot *send* a WhatsApp
 * message: delivering one needs the WhatsApp Business API, a verified sender
 * and approved templates. What it can do is open WhatsApp with the message
 * already written, so the patient taps send once.
 *
 * That is not a workaround for the real thing, it is better than it here:
 *
 *   - the thread opens from the PATIENT'S own number, so the clinic can just
 *     reply, which is the whole point of asking on WhatsApp rather than by
 *     email;
 *   - nothing is stored on a server and no form backend exists to break,
 *     leak or go unread;
 *   - the patient sees exactly what is being sent before it goes, which is
 *     the right default when the message carries a phone number and a
 *     treatment they are asking about.
 *
 * The one thing to be honest about: if the patient closes WhatsApp without
 * tapping send, nothing arrives and the clinic never knows. A form that
 * posts to a server would at least record the attempt. Worth revisiting if
 * Dr. Sachdeva wants every enquiry logged whether or not it was sent.
 */

/** Digits only, country code and all. wa.me rejects spaces, +, dashes. */
export const waNumber = (value: string) => String(value ?? "").replace(/\D/g, "");

/**
 * A wa.me link with the message already typed.
 *
 * wa.me opens the app on a phone and web.whatsapp.com on a desktop, so one
 * link serves both and neither needs detecting.
 */
export const waLink = (number: string, text = "") => {
  const to = waNumber(number);
  if (!to) return "";
  const body = String(text ?? "").trim();
  return body
    ? `https://wa.me/${to}?text=${encodeURIComponent(body)}`
    : `https://wa.me/${to}`;
};

/** A tel: link. Keeps the + so a mobile dials the country code. */
export const telLink = (phone: string) => {
  const digits = String(phone ?? "").replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
};

export type Enquiry = {
  name?: string;
  phone?: string;
  subject?: string;
  message?: string;
};

/**
 * The enquiry as a message a human will read on a phone.
 *
 * Plain lines, in the order the clinic needs them: who, what, their number,
 * then whatever they wrote. No markdown and no decoration -- WhatsApp shows
 * asterisks as bold and a stray one mangles the line.
 *
 * Empty fields are left out rather than sent as "Phone: -", which is a line
 * the person reading it has to skip past.
 */
export const enquiryMessage = (enquiry: Enquiry = {}, brand = "") => {
  const clean = (value?: string) => String(value ?? "").replace(/\s+/g, " ").trim();

  const name = clean(enquiry.name);
  const phone = clean(enquiry.phone);
  const subject = clean(enquiry.subject);
  const message = clean(enquiry.message);

  const lines = [
    brand ? `Hello ${clean(brand)},` : "Hello,",
    "",
    name ? `I am ${name}.` : "I would like to enquire.",
  ];

  if (subject) lines.push(`Enquiry about: ${subject}`);
  if (phone) lines.push(`My number: ${phone}`);
  if (message) lines.push("", message);

  return lines.join("\n").trim();
};

/** What is missing before an enquiry can be sent, in words. */
export const enquiryProblems = (enquiry: Enquiry = {}) => {
  const problems: string[] = [];
  const name = String(enquiry.name ?? "").trim();
  const phone = String(enquiry.phone ?? "").trim();

  if (!name) problems.push("Please enter your name.");

  // A number is the point of the form: the clinic rings back. Ten digits is
  // an Indian mobile; a country code or spacing is allowed and stripped.
  const digits = phone.replace(/\D/g, "");
  if (!digits) problems.push("Please enter your phone number.");
  else if (digits.length < 10) problems.push("That phone number looks too short.");
  else if (digits.length > 13) problems.push("That phone number looks too long.");

  return problems;
};
