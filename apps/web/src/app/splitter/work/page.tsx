import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SplitterWorkPage as SplitterWorkClientPage } from "@/features/splitter/splitter-pages"
import { getRouteId } from "@/features/routing/route-id"
import { WEB_ROUTE_METADATA } from "../../seo-metadata"

interface WorkPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = WEB_ROUTE_METADATA.splitterWork

export default async function SplitterWorkPage({ searchParams }: WorkPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <SplitterWorkClientPage presetId={id} />
}
