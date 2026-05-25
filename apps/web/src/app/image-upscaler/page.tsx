import type { Metadata } from "next"
import { ImageUpscalerPage as ImageUpscalerFeaturePage } from "@/features/image-upscaler/image-upscaler-pages"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.imageUpscaler

export default function ImageUpscalerPage() {
  return <ImageUpscalerFeaturePage />
}
