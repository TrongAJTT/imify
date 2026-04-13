import { useCallback, useState } from "react"

import { runSeoAuditOnActiveTab, type SeoAuditReport } from "@/features/seo-audit"

interface SeoAuditState {
  report: SeoAuditReport | null
  isRunning: boolean
  error: string | null
}

export function useSeoAudit() {
  const [state, setState] = useState<SeoAuditState>({
    report: null,
    isRunning: false,
    error: null
  })

  const runAudit = useCallback(async () => {
    setState((current) => ({ ...current, isRunning: true, error: null }))

    try {
      const report = await runSeoAuditOnActiveTab()
      setState({ report, isRunning: false, error: null })
      return report
    } catch (error) {
      const message = error instanceof Error ? error.message : "SEO audit request failed."

      setState((current) => ({
        ...current,
        isRunning: false,
        error: message
      }))

      throw new Error(message)
    }
  }, [])

  return {
    report: state.report,
    isRunning: state.isRunning,
    error: state.error,
    runAudit
  }
}
