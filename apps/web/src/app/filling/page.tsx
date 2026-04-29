import type { Metadata } from "next"
import { FillingHomePage } from "@/features/filling/filling-pages"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.filling

export default function FillingPage() {
  return <FillingHomePage routeBase="/filling" />
}
