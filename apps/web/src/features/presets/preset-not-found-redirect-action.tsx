"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@imify/ui/ui/button"

interface PresetNotFoundRedirectActionProps {
  routeBase: string
  onBeforeRedirect?: () => void
  buttonLabel?: string
}

export function PresetNotFoundRedirectAction({
  routeBase,
  onBeforeRedirect,
  buttonLabel = "Back to preset list",
}: PresetNotFoundRedirectActionProps) {
  const router = useRouter()
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  useEffect(() => {
    setRedirectCountdown(5)
    const interval = window.setInterval(() => {
      setRedirectCountdown((current) => Math.max(0, current - 1))
    }, 1000)
    const timeout = window.setTimeout(() => {
      onBeforeRedirect?.()
      router.push(routeBase)
    }, 5000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [onBeforeRedirect, routeBase, router])

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => {
        onBeforeRedirect?.()
        router.push(routeBase)
      }}
    >
      <span className="inline-flex items-center gap-1 tabular-nums text-slate-500 dark:text-slate-400">
        <Loader2 size={14} className="animate-spin" />
        {redirectCountdown}
      </span>
      {buttonLabel}
    </Button>
  )
}
