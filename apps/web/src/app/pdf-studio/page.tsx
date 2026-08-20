import type { Metadata } from "next"
import { Suspense } from "react"
import { PdfStudioPage as PdfStudioFeaturePage } from "@/features/pdf-studio/pdf-studio-page"
import { WorkspaceLoadingState } from "@imify/features/shared/workspace-loading-state"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.pdfStudio

export default function PdfStudioPage() {
  return (
    <Suspense fallback={<WorkspaceLoadingState />}>
      <PdfStudioFeaturePage />
    </Suspense>
  )
}
