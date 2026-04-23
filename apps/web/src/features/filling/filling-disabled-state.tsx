"use client"

import { useMemo } from "react"
import { Clock3 } from "lucide-react"
import { EmptyDropCard } from "@imify/ui"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"
import { FillingOverviewSidebar } from "./filling-sidebar"

export function FillingDisabledState() {
  const sidebar = useMemo(() => <FillingOverviewSidebar />, [])
  useWorkspaceSidebar(sidebar)

  return (
    <div className="p-6">
      <EmptyDropCard
        icon={<Clock3 className="h-6 w-6 text-slate-500 dark:text-slate-300" />}
        title="Image Filling Is Coming Soon on Web"
        subtitle="This workspace is temporarily unavailable in the web app and will be enabled in an upcoming release."
        className="max-w-3xl"
      />
    </div>
  )
}
