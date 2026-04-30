"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import { getRouteId } from "./route-id"
import { PatternWorkPage as PatternWorkClientPage } from "@/features/pattern/pattern-pages"
import { ProcessorWorkPage } from "@/features/processor/processor-pages"
import { SplitterWorkPage as SplitterWorkClientPage } from "@/features/splitter/splitter-pages"
import { SplicingWorkPage as SplicingWorkClientPage } from "@/features/splicing/splicing-pages"
import { FillingFlowPage } from "@/features/filling/filling-pages"

type QueryIdRouteTarget =
  | "pattern-work"
  | "single-work"
  | "batch-work"
  | "splitter-work"
  | "splicing-work"
  | "filling-edit"
  | "filling-fill"
  | "filling-grid-design"
  | "filling-symmetric-generate"

interface QueryIdPageGuardProps {
  target: QueryIdRouteTarget
}

export function QueryIdPageGuard({ target }: QueryIdPageGuardProps) {
  const searchParams = useSearchParams()
  const id = getRouteId({ id: searchParams.get("id") ?? undefined })

  if (!id) {
    return null
  }

  switch (target) {
    case "pattern-work":
      return <PatternWorkClientPage presetId={id} />
    case "single-work":
      return <ProcessorWorkPage context="single" presetId={id} />
    case "batch-work":
      return <ProcessorWorkPage context="batch" presetId={id} />
    case "splitter-work":
      return <SplitterWorkClientPage presetId={id} />
    case "splicing-work":
      return <SplicingWorkClientPage presetId={id} />
    case "filling-edit":
      return <FillingFlowPage mode="edit" templateId={id} routeBase="/filling" />
    case "filling-fill":
      return <FillingFlowPage mode="fill" templateId={id} routeBase="/filling" />
    case "filling-grid-design":
      return <FillingFlowPage mode="grid-design" templateId={id} routeBase="/filling" />
    case "filling-symmetric-generate":
      return <FillingFlowPage mode="symmetric-generate" templateId={id} routeBase="/filling" />
    default:
      return null
  }
}
