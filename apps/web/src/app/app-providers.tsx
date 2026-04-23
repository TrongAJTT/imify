"use client"

import { useEffect, useMemo, useState } from "react"
import { registerStorageAdapter } from "@imify/core/storage-adapter"
import { localStorageAdapter } from "../adapters/local-storage-adapter"

interface AppProvidersProps {
  children: React.ReactNode
}

function canAccessLocalStorage(): boolean {
  if (typeof window === "undefined") return false
  try {
    const probeKey = "__imify_web_storage_probe__"
    window.localStorage.setItem(probeKey, "1")
    window.localStorage.removeItem(probeKey)
    return true
  } catch {
    return false
  }
}

export function AppProviders({ children }: AppProvidersProps) {
  const [isReady, setIsReady] = useState(false)
  const hasLocalStorage = useMemo(() => canAccessLocalStorage(), [])

  useEffect(() => {
    if (hasLocalStorage) {
      registerStorageAdapter(localStorageAdapter)
    }
    setIsReady(true)
  }, [hasLocalStorage])

  if (!isReady) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Initializing Imify Web...</div>
  }

  if (process.env.NODE_ENV !== "production" && !hasLocalStorage) {
    return (
      <div className="m-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
        Local storage is unavailable in this browser context. Persisted web stores are disabled.
      </div>
    )
  }

  return <>{children}</>
}
