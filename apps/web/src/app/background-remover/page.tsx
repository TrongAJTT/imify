import type { Metadata } from "next"
import { BackgroundRemoverPage as BackgroundRemoverFeaturePage } from "@/features/background-remover/background-remover-pages"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.backgroundRemover

export default function BackgroundRemoverPage() {
  return <BackgroundRemoverFeaturePage />
}
