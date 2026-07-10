import { Metadata } from "next"
import { WEB_ROUTE_METADATA } from "../seo-metadata"
import { ExtensionClient } from "./extension-client"

export const metadata: Metadata = WEB_ROUTE_METADATA.extension

export default function ExtensionPage() {
  return <ExtensionClient />
}
