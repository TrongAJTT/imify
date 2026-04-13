import { useEffect, useState } from "react"

import {
  loadSeoAuditSnapshot,
  type SeoAuditReport
} from "@/features/seo-audit"

export function useSeoAuditSnapshot() {
  const [isLoading, setIsLoading] = useState(true)
  const [snapshot, setSnapshot] = useState<SeoAuditReport | null>(null)

  const refreshSnapshot = async () => {
    setIsLoading(true)
    try {
      const report = await loadSeoAuditSnapshot()
      setSnapshot(report)
      return report
    } catch {
      setSnapshot(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshSnapshot()
  }, [])

  return {
    snapshot,
    isLoading,
    refreshSnapshot
  }
}
