import type { Metadata } from "next"
import { Suspense } from "react"
import { WorkspaceLoadingState } from "@imify/ui"
import { QueryIdPageGuard } from "@/features/routing/query-id-page-guard"
import { WEB_ROUTE_METADATA } from "../../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.patternGeneratorWork

export default function PatternWorkPage() {
  return (
    <Suspense fallback={<WorkspaceLoadingState />}>
      <QueryIdPageGuard target="pattern-work" />
    </Suspense>
  )
}
