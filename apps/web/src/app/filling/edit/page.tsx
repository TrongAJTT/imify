import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { FillingFlowPage } from "@/features/filling/filling-pages"
import { getRouteId } from "@/features/routing/route-id"
import { WEB_ROUTE_METADATA } from "../../seo-metadata"

interface EditPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = WEB_ROUTE_METADATA.fillingEdit

export default async function FillingEditPage({ searchParams }: EditPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <FillingFlowPage mode="edit" templateId={id} routeBase="/filling" />
}
