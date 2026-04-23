"use client"

import { useEffect } from "react"
import { registerStorageAdapter } from "@imify/core/storage-adapter"
import { localStorageAdapter } from "../adapters/local-storage-adapter"

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    registerStorageAdapter(localStorageAdapter)
  }, [])

  return <>{children}</>
}
