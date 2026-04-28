import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { FillingFlowPage } from "@/features/filling/filling-pages"
import { getRouteId } from "@/features/routing/route-id"
import { WEB_ROUTE_METADATA } from "../../seo-metadata"

interface GridDesignPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = WEB_ROUTE_METADATA.fillingGridDesign

export default async function FillingGridDesignPage({ searchParams }: GridDesignPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <FillingFlowPage mode="grid-design" templateId={id} routeBase="/filling" />
}
