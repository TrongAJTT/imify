import type { Metadata } from "next";
import { CollageMakerLandingPage } from "@/features/collage-maker/collage-maker-page";

export const metadata: Metadata = {
  title: "Collage Maker - Imify",
  description: "Create quick photo collages with customizable layouts, spacing, and output formats.",
};

export default function CollageMakerPage() {
  return <CollageMakerLandingPage />;
}
