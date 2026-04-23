/**
import { notFound } from "next/navigation"
import { FillingFlowPage } from "@/features/filling/filling-pages"
import { getRouteId } from "@/features/routing/route-id"

interface FillPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function FillingFillPage({ searchParams }: FillPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <FillingFlowPage mode="fill" templateId={id} routeBase="/filling" />
}
 */

import { FillingDisabledState } from "@/features/filling/filling-disabled-state"

export default function FillingFillPage() {
  return <FillingDisabledState />
}
