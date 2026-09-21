import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Journey from "@/components/journey/Journey";
import { meridian } from "@/lib/journey/meridian";

/*
  The serif is set up here, in the route, so it is only downloaded on this
  page. The Journey component reads it through --font-serif.
*/
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: `${meridian.brand}: interactive 3D travel journey`,
  description: `${meridian.hero.tagline} Fly across a photoreal globe to each destination as you scroll.`,
};

export default function TravelPage() {
  return (
    <div className={serif.variable}>
      <Journey config={meridian} />
    </div>
  );
}
