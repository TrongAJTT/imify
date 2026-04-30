import type { Metadata } from "next"
import { Suspense } from "react"
import { WorkspaceLoadingState } from "@imify/ui/ui/workspace-loading-state"
import { QueryIdPageGuard } from "@/features/routing/query-id-page-guard"
import { WEB_ROUTE_METADATA } from "../../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.singleProcessorWork

export default function SingleProcessorWorkPage() {
  return (
    <Suspense fallback={<WorkspaceLoadingState />}>
      <QueryIdPageGuard target="single-work" />
    </Suspense>
  )
}
