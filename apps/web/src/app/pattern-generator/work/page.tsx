import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PatternWorkPage as PatternWorkClientPage } from "@/features/pattern/pattern-pages"
import { getRouteId } from "@/features/routing/route-id"
import { WEB_ROUTE_METADATA } from "../../seo-metadata"

interface WorkPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = WEB_ROUTE_METADATA.patternGeneratorWork

export default async function PatternWorkPage({ searchParams }: WorkPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <PatternWorkClientPage presetId={id} />
}
