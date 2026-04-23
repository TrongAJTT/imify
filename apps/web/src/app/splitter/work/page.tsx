import { notFound } from "next/navigation"
import { SplitterWorkPage as SplitterWorkClientPage } from "@/features/wave3/wave3-pages"
import { getRouteId } from "@/features/routing/route-id"

interface WorkPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SplitterWorkPage({ searchParams }: WorkPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <SplitterWorkClientPage presetId={id} />
}
