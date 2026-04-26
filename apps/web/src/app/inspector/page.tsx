import type { Metadata } from "next"
import { InspectorPage as InspectorFeaturePage } from "@/features/inspector/inspector-page"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.inspector

export default function InspectorPage() {
  return <InspectorFeaturePage />
}
