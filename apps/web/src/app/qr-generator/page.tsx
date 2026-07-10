import type { Metadata } from "next"
import { QrGeneratorPage as QrGeneratorFeaturePage } from "@/features/qr-generator/qr-generator-pages"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.qrGenerator

export default function QrGeneratorPage() {
  return <QrGeneratorFeaturePage />
}
