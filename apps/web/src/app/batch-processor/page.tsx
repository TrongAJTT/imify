import type { Metadata } from "next"
import { ProcessorLandingPage } from "@/features/processor/processor-pages"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.batchProcessor

export default function BatchProcessorPage() {
  return <ProcessorLandingPage context="batch" />
}
