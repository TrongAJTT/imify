import { notFound } from "next/navigation"
import { PatternWorkPage as PatternWorkClientPage } from "@/features/wave3/wave3-pages"
import { getRouteId } from "@/features/routing/route-id"

interface WorkPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function PatternWorkPage({ searchParams }: WorkPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <PatternWorkClientPage presetId={id} />
}
