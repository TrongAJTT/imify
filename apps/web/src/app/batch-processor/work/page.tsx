import { notFound } from "next/navigation"
import { ProcessorWorkPage } from "@/features/processor/processor-pages"
import { getRouteId } from "@/features/routing/route-id"

interface WorkPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function BatchProcessorWorkPage({ searchParams }: WorkPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return <ProcessorWorkPage context="batch" presetId={id} />
}
