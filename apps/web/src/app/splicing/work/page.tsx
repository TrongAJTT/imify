import type { Metadata } from "next"
import { Suspense } from "react"
import { QueryIdPageGuard } from "@/features/routing/query-id-page-guard"
import { WEB_ROUTE_METADATA } from "../../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.splicingWork

export default function SplicingWorkPage() {
  return (
    <Suspense fallback={null}>
      <QueryIdPageGuard target="splicing-work" />
    </Suspense>
  )
}
