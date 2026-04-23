import { notFound } from "next/navigation"
import { SplicingWorkPage as SplicingWorkClientPage } from "@/features/wave3/wave3-pages"
import { getRouteId } from "@/features/routing/route-id"

interface WorkPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SplicingWorkPage({ searchParams }: WorkPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <SplicingWorkClientPage presetId={id} />
}
