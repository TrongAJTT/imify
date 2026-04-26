import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProcessorWorkPage } from "@/features/processor/processor-pages"
import { getRouteId } from "@/features/routing/route-id"
import { WEB_ROUTE_METADATA } from "../../seo-metadata"

interface WorkPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = WEB_ROUTE_METADATA.singleProcessorWork

export default async function SingleProcessorWorkPage({ searchParams }: WorkPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <ProcessorWorkPage context="single" presetId={id} />
}
