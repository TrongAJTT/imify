import type { Metadata } from "next"
import { SplicingLandingPage } from "@/features/splicing/splicing-pages"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.splicing

export default function SplicingPage() {
  return <SplicingLandingPage />
}
