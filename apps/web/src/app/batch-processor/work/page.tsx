import { notFound } from "next/navigation"
import { FeaturePlaceholderPage } from "@/components/layout/feature-placeholder-page"
import { getRouteId } from "@/features/routing/route-id"

interface WorkPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function BatchProcessorWorkPage({ searchParams }: WorkPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return (
    <FeaturePlaceholderPage
      title="Batch Processor Workspace"
      description={`Loaded preset id "${id}". Full workspace port is in progress for Wave 2.`}
    />
  )
}
