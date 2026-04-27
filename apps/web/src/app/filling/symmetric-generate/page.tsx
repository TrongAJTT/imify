import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { FillingFlowPage } from "@/features/filling/filling-pages"
import { getRouteId } from "@/features/routing/route-id"
import { WEB_ROUTE_METADATA } from "../../seo-metadata"

interface SymmetricPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = WEB_ROUTE_METADATA.fillingSymmetricGenerate

export default async function FillingSymmetricGeneratePage({ searchParams }: SymmetricPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <FillingFlowPage mode="symmetric-generate" templateId={id} routeBase="/filling" />
}
