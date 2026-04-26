import type { Metadata } from "next"
import { DiffcheckerPage as DiffcheckerFeaturePage } from "@/features/diffchecker/diffchecker-page"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.diffchecker

export default function DiffcheckerPage() {
  return <DiffcheckerFeaturePage />
}
