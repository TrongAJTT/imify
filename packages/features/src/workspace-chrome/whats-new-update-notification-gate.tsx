"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { getAppMetadata } from "@imify/core/app-metadata"
import { deferredStorage } from "@imify/core/storage-adapter"
import { ChangelogsDialog } from "./changelogs-dialog"
import { WhatsNewUpdateSummaryDialog } from "./whats-new-update-summary-dialog"

const STORAGE_KEY_V2 = "imify_whats_new_seen_v2"
const STORAGE_KEY_V1 = "imify_whats_new_seen_v1"
const REMOTE_PACKAGE_JSON_URL = "https://raw.githubusercontent.com/trongajtt/imify/main/package.json"
const FETCH_RATE_LIMIT_MS = 3 * 60 * 60 * 1000 // 3 hours

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

function compareSemver(a: string, b: string): number {
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
      await deferredStorage.setItem(STORAGE_KEY_V2, JSON.stringify(nextState))
    } catch {
      // Ignore storage write failures
    }
  }

  // 1. Listen for Service Worker activation broadcast to safely set cacheVersion
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_CACHE_READY" && typeof event.data.version === "string") {
        const swVer = event.data.version
        const current = seenStateRef.current
        if (current && current.cacheVersion !== swVer) {
          void persistState({
            ...current,
            cacheVersion: swVer,
            resetCacheAt: Date.now()
          })
        }
      }
    }

    navigator.serviceWorker.addEventListener("message", handleSwMessage)
    return () => navigator.serviceWorker.removeEventListener("message", handleSwMessage)
  }, [])

  // 2. Main initialization and check flow
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
              const v1Ver = parsedV1?.version || currentBundleVersion
              const v1Type = parsedV1?.versionType || currentBundleVersionType
              state = {
                version: v1Ver,
                versionType: v1Type,
                findVersionAt: now,
                remindAt: 0,
                cacheVersion: v1Ver,
                resetCacheAt: now,
                lastFetchVersionAt: 0
              }
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

        // Check if we need to fetch the latest version from remote repository
        if (now - state.lastFetchVersionAt >= FETCH_RATE_LIMIT_MS) {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 6000)
            const res = await fetch(REMOTE_PACKAGE_JSON_URL, {
              signal: controller.signal,
              cache: "no-store"
            })
            clearTimeout(timeoutId)

            if (res.ok) {
              const remotePkg = await res.json()
              const remoteVer = typeof remotePkg.version === "string" ? remotePkg.version : null
              const remoteType = remotePkg.imifyMetadata?.versionType || "Stable"

              let nextVersion = state.version
              let nextType = state.versionType
              let nextFindVersionAt = state.findVersionAt
              let nextRemindAt = state.remindAt

              if (remoteVer && compareSemver(remoteVer, state.version) > 0) {
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
              await persistState(state)
            }
          } catch {
            // Failed remote fetch (offline or network error) -> just record attempt
            state = {
              ...state,
              lastFetchVersionAt: now
            }
            await persistState(state)
          }
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
    const current = seenStateRef.current
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
    const current = seenStateRef.current
    const now = Date.now()

    if (current) {
      await persistState({
        ...current,
        cacheVersion: current.version,
        resetCacheAt: now
      })
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
