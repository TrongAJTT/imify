import type { Metadata } from "next";
import { Suspense } from "react";
import { CollageMakerLandingPage } from "@/features/collage-maker/collage-maker-page";
import { WorkspaceLoadingState } from "@imify/ui/ui/workspace-loading-state";

export const metadata: Metadata = {
  title: "Collage Maker - Imify",
  description: "Create quick photo collages with customizable layouts, spacing, and output formats.",
};

export default function CollageMakerPage() {
  return (
    <Suspense fallback={<WorkspaceLoadingState />}>
      <CollageMakerLandingPage />
    </Suspense>
  );
}
