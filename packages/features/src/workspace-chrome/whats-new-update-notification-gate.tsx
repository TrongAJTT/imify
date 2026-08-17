"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { getAppMetadata } from "@imify/core/app-metadata"
import { deferredStorage } from "@imify/core/storage-adapter"
import { ChangelogsDialog } from "./changelogs-dialog"
import { WhatsNewUpdateSummaryDialog } from "./whats-new-update-summary-dialog"

const STORAGE_KEY_V2 = "imify_whats_new_seen_v2"
const STORAGE_KEY_V1 = "imify_whats_new_seen_v1"
const FETCH_RATE_LIMIT_MS = 1 * 60 * 60 * 1000 // 1 hour

export type SeenStateV2 = {
  version: string
  versionType: string
  findVersionAt: number
  remindAt: number
  cacheVersion: string
  resetCacheAt: number
  lastFetchVersionAt: number
}

function parseSemverParts(version: string): number[] {
  return version
    .split(".")
    .map((part) => {
      const match = part.match(/^(\d+)/)
      return match ? Number(match[1]) : 0
    })
    .slice(0, 3)
}

export function compareSemver(a: string, b: string): number {
  const aParts = parseSemverParts(a)
  const bParts = parseSemverParts(b)
  const len = Math.max(aParts.length, bParts.length)
  for (let i = 0; i < len; i++) {
    const av = aParts[i] ?? 0
    const bv = bParts[i] ?? 0
    if (av > bv) return 1
    if (av < bv) return -1
  }
  return 0
}

function getNextMidnightTimestamp(): number {
  const nextMidnight = new Date()
  nextMidnight.setHours(24, 0, 0, 0)
  return nextMidnight.getTime()
}

function safeParseSeenStateV2(raw: string): SeenStateV2 | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return null
    const obj = parsed as Partial<SeenStateV2>
    if (typeof obj.version !== "string") return null
    if (typeof obj.versionType !== "string") return null
    if (typeof obj.findVersionAt !== "number") return null
    if (typeof obj.remindAt !== "number") return null
    if (typeof obj.cacheVersion !== "string") return null
    if (typeof obj.resetCacheAt !== "number") return null
    if (typeof obj.lastFetchVersionAt !== "number") return null
    return obj as SeenStateV2
  } catch {
    return null
  }
}

async function fetchLatestPackageMetadata(): Promise<{ version: string; versionType: string } | null> {
  if (typeof window === "undefined") return null
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const res = await fetch("/version.json", {
      signal: controller.signal,
      cache: "no-store"
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (typeof data?.version === "string" && data.version.trim() !== "") {
        return {
          version: data.version,
          versionType: typeof data?.versionType === "string" ? data.versionType : "Stable"
        }
      }
    }
    return null
  } catch {
    return null
  }
}

export const CHECK_UPDATES_EVENT = "imify:check-for-updates"

export function getHasUpdateAvailable(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false
  try {
    const rawV2 = window.localStorage.getItem(STORAGE_KEY_V2)
    const state = rawV2 ? safeParseSeenStateV2(rawV2) : null
    if (!state) return false
    return compareSemver(state.version, state.cacheVersion) > 0
  } catch {
    return false
  }
}

export async function checkForUpdates(force = false): Promise<boolean> {
  const appMetadata = getAppMetadata()
  const currentBundleVersion = appMetadata.version
  const currentBundleVersionType = appMetadata.versionType
  const now = Date.now()

  let rawV2 = typeof window !== "undefined" && window.localStorage ? window.localStorage.getItem(STORAGE_KEY_V2) : null
  if (!rawV2) {
    rawV2 = await deferredStorage.getItem(STORAGE_KEY_V2)
  }
  let state = rawV2 ? safeParseSeenStateV2(rawV2) : null

  if (!state) {
    let rawV1 = typeof window !== "undefined" && window.localStorage ? window.localStorage.getItem(STORAGE_KEY_V1) : null
    if (!rawV1) {
      rawV1 = await deferredStorage.getItem(STORAGE_KEY_V1)
    }
    if (rawV1) {
      try {
        const parsedV1 = JSON.parse(rawV1)
        // Migrate v1→v2: cacheVersion = currentBundleVersion because the user has already
        // loaded this bundle. v1's version was "last seen changelog version", unrelated to
        // SW cache staleness. Never set remindAt = now here to avoid locking scroll on load.
        state = {
          version: currentBundleVersion,
          versionType: currentBundleVersionType,
          findVersionAt: now,
          remindAt: 0,
          cacheVersion: currentBundleVersion,
          resetCacheAt: typeof parsedV1?.lastSeenAt === "number" ? parsedV1.lastSeenAt : now,
          lastFetchVersionAt: 0
        }
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem(STORAGE_KEY_V1)
        }
        await deferredStorage.removeItem(STORAGE_KEY_V1)
      } catch {
        // Ignore parse error
      }
    }

    if (!state) {
      state = {
        version: currentBundleVersion,
        versionType: currentBundleVersionType,
        findVersionAt: now,
        remindAt: 0,
        cacheVersion: currentBundleVersion,
        resetCacheAt: now,
        lastFetchVersionAt: 0
      }
    }
  }

  // If forced or cooldown has passed, fetch latest version from /version.json
  if (force || now - state.lastFetchVersionAt >= FETCH_RATE_LIMIT_MS) {
    const latestPkg = await fetchLatestPackageMetadata()
    if (latestPkg) {
      const remoteVer = latestPkg.version
      const remoteType = latestPkg.versionType

      let nextVersion = state.version
      let nextType = state.versionType
      let nextFindVersionAt = state.findVersionAt
      let nextRemindAt = state.remindAt

      if (compareSemver(remoteVer, state.version) > 0) {
        nextVersion = remoteVer
        nextType = remoteType
        nextFindVersionAt = now
        nextRemindAt = now // Ready to prompt
      }

      state = {
        ...state,
        version: nextVersion,
        versionType: nextType,
        findVersionAt: nextFindVersionAt,
        remindAt: nextRemindAt,
        lastFetchVersionAt: now
      }
    } else {
      state = {
        ...state,
        lastFetchVersionAt: now
      }
    }

    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state))
    }
    await deferredStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state))
  }

  const hasUpdate = compareSemver(state.version, state.cacheVersion) > 0
  if (hasUpdate) {
    window.dispatchEvent(new CustomEvent(CHECK_UPDATES_EVENT))
  }
  return hasUpdate
}

export function WhatsNewUpdateNotificationGate() {
  const appMetadata = getAppMetadata()
  const currentBundleVersion = appMetadata.version
  const currentBundleVersionType = appMetadata.versionType

  const [seenState, setSeenState] = useState<SeenStateV2 | null>(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const didCheckRef = useRef(false)
  const seenStateRef = useRef<SeenStateV2 | null>(null)
  seenStateRef.current = seenState

  const persistState = async (nextState: SeenStateV2) => {
    setSeenState(nextState)
    seenStateRef.current = nextState
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(nextState))
      }
      await deferredStorage.setItem(STORAGE_KEY_V2, JSON.stringify(nextState))
    } catch {
      // Ignore storage write failures
    }
  }

  // 1. Sync state if modified externally (e.g. via DevTools or other tabs)
  useEffect(() => {
    if (typeof window === "undefined") return
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_V2 && e.newValue) {
        const parsed = safeParseSeenStateV2(e.newValue)
        if (parsed) {
          setSeenState(parsed)
          seenStateRef.current = parsed
        }
      }
    }

    const handleManualCheck = () => {
      let rawV2 = window.localStorage.getItem(STORAGE_KEY_V2)
      let state = rawV2 ? safeParseSeenStateV2(rawV2) : seenStateRef.current
      if (state) {
        setSeenState(state)
        seenStateRef.current = state
        if (compareSemver(state.version, state.cacheVersion) > 0) {
          setIsSummaryOpen(true)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener(CHECK_UPDATES_EVENT, handleManualCheck)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener(CHECK_UPDATES_EVENT, handleManualCheck)
    }
  }, [])

  // 2. Listen for Service Worker activation broadcast to notify new available version
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_CACHE_READY" && typeof event.data.version === "string") {
        const swVer = event.data.version
        const current = seenStateRef.current
        if (!current) return

        if (compareSemver(swVer, current.version) > 0) {
          void persistState({
            ...current,
            version: swVer,
            findVersionAt: Date.now(),
            remindAt: Date.now()
          }).then(() => {
            setIsSummaryOpen(true)
          })
        }
      }
    }

    navigator.serviceWorker.addEventListener("message", handleSwMessage)
    return () => navigator.serviceWorker.removeEventListener("message", handleSwMessage)
  }, [])

  // 3. Main initialization and check flow
  useEffect(() => {
    if (didCheckRef.current) return
    didCheckRef.current = true

    void (async () => {
      try {
        const now = Date.now()
        const rawV2 = await deferredStorage.getItem(STORAGE_KEY_V2)
        let state = rawV2 ? safeParseSeenStateV2(rawV2) : null

        // If no v2 state, check for v1 migration or initialize fresh
        if (!state) {
          const rawV1 = await deferredStorage.getItem(STORAGE_KEY_V1)
          if (rawV1) {
            try {
              const parsedV1 = JSON.parse(rawV1)
              // Migrate v1→v2: cacheVersion = currentBundleVersion because the user has already
              // loaded this bundle. v1's version was "last seen changelog version", unrelated to
              // SW cache staleness. Never set remindAt = now here to avoid locking scroll on load.
              state = {
                version: currentBundleVersion,
                versionType: currentBundleVersionType,
                findVersionAt: now,
                remindAt: 0,
                cacheVersion: currentBundleVersion,
                resetCacheAt: typeof parsedV1?.lastSeenAt === "number" ? parsedV1.lastSeenAt : now,
                lastFetchVersionAt: 0
              }
              if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.removeItem(STORAGE_KEY_V1)
              }
              await deferredStorage.removeItem(STORAGE_KEY_V1)
            } catch {
              // Ignore parse error
            }
          }

          if (!state) {
            // Brand new installation: mark current bundle as up-to-date, do not prompt
            state = {
              version: currentBundleVersion,
              versionType: currentBundleVersionType,
              findVersionAt: now,
              remindAt: 0,
              cacheVersion: currentBundleVersion,
              resetCacheAt: now,
              lastFetchVersionAt: now
            }
          }

          await persistState(state)
        }

        // Check if we need to fetch the latest version from /version.json
        if (now - state.lastFetchVersionAt >= FETCH_RATE_LIMIT_MS) {
          const latestPkg = await fetchLatestPackageMetadata()
          if (latestPkg) {
            const remoteVer = latestPkg.version
            const remoteType = latestPkg.versionType

            let nextVersion = state.version
            let nextType = state.versionType
            let nextFindVersionAt = state.findVersionAt
            let nextRemindAt = state.remindAt

            if (compareSemver(remoteVer, state.version) > 0) {
              nextVersion = remoteVer
              nextType = remoteType
              nextFindVersionAt = now
              nextRemindAt = now // Ready to prompt
            }

            state = {
              ...state,
              version: nextVersion,
              versionType: nextType,
              findVersionAt: nextFindVersionAt,
              remindAt: nextRemindAt,
              lastFetchVersionAt: now
            }
          } else {
            state = {
              ...state,
              lastFetchVersionAt: now
            }
          }
          await persistState(state)
        }

        // 3. Evaluate whether to show the Update Available dialog
        // Condition: cacheVersion does not match target version, and now >= remindAt
        if (compareSemver(state.version, state.cacheVersion) > 0 && now >= state.remindAt) {
          setIsSummaryOpen(true)
        }
      } catch {
        // Never block app UI
      }
    })()
  }, [currentBundleVersion, currentBundleVersionType])

  const handleSnooze = async () => {
    setIsSummaryOpen(false)
    let current = seenStateRef.current
    if (!current && typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY_V2)
      if (raw) current = safeParseSeenStateV2(raw)
    }
    if (!current) return
    const nextMidnight = getNextMidnightTimestamp()
    await persistState({
      ...current,
      remindAt: nextMidnight
    })
  }

  const handleOpenChangelog = () => {
    setIsWhatsNewOpen(true)
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    const now = Date.now()

    let current = seenStateRef.current
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY_V2)
      if (raw) {
        const parsed = safeParseSeenStateV2(raw)
        if (parsed) current = parsed
      }
    }

    if (current) {
      const nextState: SeenStateV2 = {
        ...current,
        cacheVersion: current.version,
        resetCacheAt: now
      }
      await persistState(nextState)
    }

    try {
      // 1. Clear all Cache Storage instances
      if ("caches" in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))
      }

      // 2. Tell active Service Worker to skip waiting
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" })
      }
    } catch {
      // Ignore cache clearing errors
    }

    // 3. Hard reload to load fresh assets
    window.location.reload()
  }

  const shouldRender = useMemo(() => {
    return isSummaryOpen || isWhatsNewOpen
  }, [isSummaryOpen, isWhatsNewOpen])

  if (!shouldRender) return null

  const targetVersion = seenState?.version || currentBundleVersion

  return (
    <>
      <WhatsNewUpdateSummaryDialog
        isOpen={isSummaryOpen}
        onSnooze={() => void handleSnooze()}
        onOpenWhatsNew={handleOpenChangelog}
        onUpdate={() => void handleUpdate()}
        version={targetVersion}
        isUpdating={isUpdating}
      />
      <ChangelogsDialog
        isOpen={isWhatsNewOpen}
        onClose={() => setIsWhatsNewOpen(false)}
      />
    </>
  )
}
