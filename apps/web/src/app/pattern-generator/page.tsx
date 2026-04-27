import type { Metadata } from "next"
import { PatternLandingPage } from "@/features/pattern/pattern-pages"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.patternGenerator

export default function PatternGeneratorPage() {
  return <PatternLandingPage />
}
