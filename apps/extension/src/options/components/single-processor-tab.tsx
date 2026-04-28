import { consumePendingInspectorOptimizeFile } from "@/options/shared/inspector-optimize-bridge"
import { SingleProcessorWorkspace } from "@imify/features/processor/single-processor-workspace"

function consumePendingSingleProcessorImportUrl(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  const params = new URLSearchParams(window.location.search)
  const tab = params.get("tab")
  const importUrl = params.get("importUrl")

  if (tab !== "single" || !importUrl) {
    return null
  }

  params.delete("importUrl")
  const nextSearch = params.toString()
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`
  window.history.replaceState(null, "", nextUrl)

  return importUrl
}

export function SingleProcessorTab() {
  return (
    <SingleProcessorWorkspace
      consumePendingOptimizeFile={consumePendingInspectorOptimizeFile}
      consumePendingImportUrl={consumePendingSingleProcessorImportUrl}
    />
  )
}
