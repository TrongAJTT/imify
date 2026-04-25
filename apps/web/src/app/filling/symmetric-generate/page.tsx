import { notFound } from "next/navigation"
import { FillingFlowPage } from "@/features/filling/filling-pages"
import { getRouteId } from "@/features/routing/route-id"

interface SymmetricPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function FillingSymmetricGeneratePage({ searchParams }: SymmetricPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <FillingFlowPage mode="symmetric-generate" templateId={id} routeBase="/filling" />
}
