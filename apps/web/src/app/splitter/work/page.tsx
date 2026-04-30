import type { Metadata } from "next"
import { Suspense } from "react"
import { QueryIdPageGuard } from "@/features/routing/query-id-page-guard"
import { WEB_ROUTE_METADATA } from "../../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.splitterWork

export default function SplitterWorkPage() {
  return (
    <Suspense fallback={null}>
      <QueryIdPageGuard target="splitter-work" />
    </Suspense>
  )
}
