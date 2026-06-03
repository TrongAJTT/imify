import type { Metadata } from "next"
import { QrReaderPage as QrReaderFeaturePage } from "@/features/qr-reader/qr-reader-pages"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.qrReader

export default function QrReaderPage() {
  return <QrReaderFeaturePage />
}
