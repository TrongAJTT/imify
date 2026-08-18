import type { Metadata } from "next";
import { Suspense } from "react";
import { CollageMakerLandingPage } from "@/features/collage-maker/collage-maker-page";
import { WorkspaceLoadingState } from "@imify/ui/ui/workspace-loading-state";

import { WEB_ROUTE_METADATA } from "../seo-metadata";

export const metadata: Metadata = WEB_ROUTE_METADATA.collageMaker;

export default function CollageMakerPage() {
  return (
    <Suspense fallback={<WorkspaceLoadingState />}>
      <CollageMakerLandingPage />
    </Suspense>
  );
}
