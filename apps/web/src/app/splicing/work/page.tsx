import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SplicingWorkPage as SplicingWorkClientPage } from "@/features/splicing/splicing-pages"
import { getRouteId } from "@/features/routing/route-id"
import { WEB_ROUTE_METADATA } from "../../seo-metadata"

interface WorkPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = WEB_ROUTE_METADATA.splicingWork

export default async function SplicingWorkPage({ searchParams }: WorkPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <SplicingWorkClientPage presetId={id} />
}
