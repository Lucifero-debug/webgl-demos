import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import Clinic from "@/components/clinic/Clinic";
import { arden } from "@/lib/clinic/arden";

/*
  The serif is set up here, in the route, so it is only downloaded on this
  page. Fraunces: a soft, warm serif, for a clinic that should feel careful
  rather than clinical. The Clinic component reads it through --font-serif.
*/
const serif = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: `${arden.brand}: dental implants, explained in 3D`,
  description: `${arden.hero.tagline} An interactive 3D look at the implant, abutment and crown.`,
};

export default function ClinicPage() {
  return (
    <div className={serif.variable}>
      <Clinic config={arden} />
    </div>
  );
}
