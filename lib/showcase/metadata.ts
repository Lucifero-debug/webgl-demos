import type { Metadata } from "next";
import type { ShowcaseConfig } from "./types";

/**
 * Page title and description for a showcase, built from its config, so
 * every product page gets accurate link previews (WhatsApp, Slack, Fiverr
 * messages, search results) without anyone remembering to write them.
 *
 * Use in the product's page file:
 *   export const metadata = showcaseMetadata(myProduct);
 */
export function showcaseMetadata(config: ShowcaseConfig): Metadata {
  const title = `${config.product.name}: interactive 3D product page`;
  const description = `${config.product.tagline} Explore the ${config.product.name} in 3D: scroll through its details and try every colourway.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}
