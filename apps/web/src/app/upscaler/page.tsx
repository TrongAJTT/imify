import type { Metadata } from "next"
import { UpscalerPage as UpscalerFeaturePage } from "@/features/upscaler/upscaler-pages"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.upscaler

export default function UpscalerPage() {
  return <UpscalerFeaturePage />
}
