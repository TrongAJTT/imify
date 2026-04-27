"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useBatchStore } from "@imify/stores/stores/batch-store"
import { usePatternPresetStore } from "@imify/stores/stores/pattern-preset-store"
import { useSplicingPresetStore } from "@imify/stores/stores/splicing-preset-store"
import { useSplitterPresetStore } from "@imify/stores/stores/splitter-preset-store"
import { WorkspaceLoadingState } from "@imify/ui"
import { isPreferRecentPresetEntryEnabled } from "@/features/presets/recent-preset-entry-preference"
import { isPresetToolEntryId, type PresetToolEntryId } from "@/features/presets/tool-entry-route"

function getLandingHref(toolId: PresetToolEntryId): string {
  switch (toolId) {
    case "single-processor":
      return "/single-processor"
    case "batch-processor":
      return "/batch-processor"
    case "splitter":
      return "/splitter"
    case "splicing":
      return "/splicing"
    case "pattern-generator":
      return "/pattern-generator"
  }
}

function getRecentWorkspaceHref(toolId: PresetToolEntryId): string | null {
  if (toolId === "single-processor" || toolId === "batch-processor") {
    const context = toolId === "single-processor" ? "single" : "batch"
    const state = useBatchStore.getState()
    const recentPresetId = state.recentPresetIds[context] ?? null
    if (!recentPresetId) return null
    const canOpenRecent = state.presets.some((preset) => preset.id === recentPresetId && preset.context === context)
    if (!canOpenRecent) return null
    return `${getLandingHref(toolId)}/work?id=${recentPresetId}`
  }

  if (toolId === "splitter") {
    const state = useSplitterPresetStore.getState()
    const recentPresetId = state.recentPresetId
    if (!recentPresetId) return null
    const canOpenRecent = state.presets.some((preset) => preset.id === recentPresetId)
    if (!canOpenRecent) return null
    return `/splitter/work?id=${recentPresetId}`
  }

  if (toolId === "splicing") {
    const state = useSplicingPresetStore.getState()
    const recentPresetId = state.recentPresetId
    if (!recentPresetId) return null
    const canOpenRecent = state.presets.some((preset) => preset.id === recentPresetId)
    if (!canOpenRecent) return null
    return `/splicing/work?id=${recentPresetId}`
  }

  const state = usePatternPresetStore.getState()
  const recentPresetId = state.recentPresetId
  if (!recentPresetId) return null
  const canOpenRecent = state.presets.some((preset) => preset.id === recentPresetId)
  if (!canOpenRecent) return null
  return `/pattern-generator/work?id=${recentPresetId}`
}

export default function RedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [batchHydrated, setBatchHydrated] = useState(false)
  const [splitterHydrated, setSplitterHydrated] = useState(false)
  const [splicingHydrated, setSplicingHydrated] = useState(false)
  const [patternHydrated, setPatternHydrated] = useState(false)
  const toolId = searchParams.get("tool_id") ?? ""

  useEffect(() => {
    setBatchHydrated(useBatchStore.persist.hasHydrated())
    const unsubStart = useBatchStore.persist.onHydrate(() => setBatchHydrated(false))
    const unsubFinish = useBatchStore.persist.onFinishHydration(() => setBatchHydrated(true))
    return () => {
      unsubStart()
      unsubFinish()
    }
  }, [])

  useEffect(() => {
    setSplitterHydrated(useSplitterPresetStore.persist.hasHydrated())
    const unsubStart = useSplitterPresetStore.persist.onHydrate(() => setSplitterHydrated(false))
    const unsubFinish = useSplitterPresetStore.persist.onFinishHydration(() => setSplitterHydrated(true))
    return () => {
      unsubStart()
      unsubFinish()
    }
  }, [])

  useEffect(() => {
    setSplicingHydrated(useSplicingPresetStore.persist.hasHydrated())
    const unsubStart = useSplicingPresetStore.persist.onHydrate(() => setSplicingHydrated(false))
    const unsubFinish = useSplicingPresetStore.persist.onFinishHydration(() => setSplicingHydrated(true))
    return () => {
      unsubStart()
      unsubFinish()
    }
  }, [])

  useEffect(() => {
    setPatternHydrated(usePatternPresetStore.persist.hasHydrated())
    const unsubStart = usePatternPresetStore.persist.onHydrate(() => setPatternHydrated(false))
    const unsubFinish = usePatternPresetStore.persist.onFinishHydration(() => setPatternHydrated(true))
    return () => {
      unsubStart()
      unsubFinish()
    }
  }, [])

  useEffect(() => {
    if (!isPresetToolEntryId(toolId)) {
      router.replace("/")
      return
    }

    if (!batchHydrated || !splitterHydrated || !splicingHydrated || !patternHydrated) {
      return
    }

    const preferRecentPresetEntry = isPreferRecentPresetEntryEnabled()
    if (!preferRecentPresetEntry) {
      router.replace(getLandingHref(toolId))
      return
    }

    const recentWorkspaceHref = getRecentWorkspaceHref(toolId)
    router.replace(recentWorkspaceHref ?? getLandingHref(toolId))
  }, [batchHydrated, patternHydrated, router, splicingHydrated, splitterHydrated, toolId])

  return <WorkspaceLoadingState title="Opening tool..." />
}

