import type { Metadata } from "next"
import { HomeClient } from "./home-client"
import { WEB_ROUTE_METADATA } from "./seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.home

export default function Home() {
  return <HomeClient />
}
