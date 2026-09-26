import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import Clinic from "@/components/clinic/Clinic";
import { sachdeva } from "@/lib/clinic/sachdeva";

/*
  A private preview of the page being built for Dr. Sachdeva's clinic, so he
  can open a live link at any point during the build.

  Not linked from anywhere and kept out of search results: it carries his
  clinic's name and unconfirmed prices, so it must not turn up in Google
  next to his real site. Remove the robots line only when the page moves to
  his own domain with his approval.
*/
const serif = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: `${sachdeva.brand}: dental implants, explained in 3D`,
  robots: { index: false, follow: false },
};

export default function ImplantsPage() {
  return (
    <div className={serif.variable}>
      <Clinic config={sachdeva} />
    </div>
  );
}
