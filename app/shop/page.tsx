import Showcase from "@/components/showcase/Showcase";
import { alderRunner } from "@/lib/showcase/alder-runner";
import { showcaseMetadata } from "@/lib/showcase/metadata";

export const metadata = showcaseMetadata(alderRunner);

export default function ShopPage() {
  return <Showcase config={alderRunner} />;
}
