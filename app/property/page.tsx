import type { Metadata } from "next";
import { Spectral } from "next/font/google";
import Property from "@/components/property/Property";
import { amara } from "@/lib/property/amara";

/*
  The serif is set up here, in the route, so it is only downloaded on this
  page. Spectral: a quieter serif than the clinic's, for a developer
  selling something that does not exist yet. Read through --font-serif.
*/
const serif = Spectral({
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: `${amara.project}: an apartment tower, explained in 3D`,
  description: `${amara.hero.tagline} A scroll-driven 3D page for a development that does not exist yet.`,
};

export default function PropertyPage() {
  return (
    <div className={serif.variable}>
      <Property config={amara} />
    </div>
  );
}
