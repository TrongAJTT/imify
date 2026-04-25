import { notFound } from "next/navigation"
import { FillingFlowPage } from "@/features/filling/filling-pages"
import { getRouteId } from "@/features/routing/route-id"

interface EditPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function FillingEditPage({ searchParams }: EditPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <FillingFlowPage mode="edit" templateId={id} routeBase="/filling" />
}
