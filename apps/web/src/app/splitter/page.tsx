import type { Metadata } from "next"
import { SplitterLandingPage } from "@/features/splitter/splitter-pages"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.splitter

export default function SplitterPage() {
  return <SplitterLandingPage />
}
