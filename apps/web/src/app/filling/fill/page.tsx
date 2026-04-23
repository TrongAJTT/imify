import { notFound } from "next/navigation"
import { FeaturePlaceholderPage } from "@/components/layout/feature-placeholder-page"
import { getRouteId } from "@/features/routing/route-id"

interface FillPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function FillingFillPage({ searchParams }: FillPageProps) {
  const id = getRouteId(await searchParams)
  if (!id) notFound()

  return (
    <FeaturePlaceholderPage
      title="Filling Fill Workspace"
      description={`Loaded template id "${id}". Filling route migration continues in Wave 4.`}
    />
  )
}
