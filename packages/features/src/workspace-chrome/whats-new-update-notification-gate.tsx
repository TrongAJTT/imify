"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { getAppMetadata } from "@imify/core/app-metadata"
import { deferredStorage } from "@imify/core/storage-adapter"
import { WhatsNewDialog } from "./whats-new-dialog"
import { WhatsNewUpdateSummaryDialog } from "./whats-new-update-summary-dialog"

const STORAGE_KEY = "imify_whats_new_seen_v1"

type SeenStateV1 = {
  version: string
  versionType: string
  lastSeenAt: number
}

function parseSemverParts(version: string): number[] {
  // Best-effort numeric parsing: supports "x.y.z" and ignores any suffixes like "-beta".
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

function safeParseSeenState(raw: string): SeenStateV1 | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return null
    const obj = parsed as Partial<SeenStateV1>
    if (typeof obj.version !== "string") return null
    if (typeof obj.versionType !== "string") return null
    if (typeof obj.lastSeenAt !== "number") return null
    return obj as SeenStateV1
  } catch {
    return null
  }
}

export function WhatsNewUpdateNotificationGate() {
  const appMetadata = getAppMetadata()
  const currentVersion = appMetadata.version
  const currentVersionType = appMetadata.versionType

  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false)

  const didCheckRef = useRef(false)
  const didMarkSeenRef = useRef(false)

  const shouldRender = useMemo(() => {
    return isSummaryOpen || isWhatsNewOpen
  }, [isSummaryOpen, isWhatsNewOpen])

  const markSeen = async (): Promise<void> => {
    if (didMarkSeenRef.current) return
    didMarkSeenRef.current = true

    const next: SeenStateV1 = {
      version: currentVersion,
      versionType: currentVersionType,
      lastSeenAt: Date.now()
    }

    try {
      await deferredStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // If storage is unavailable (e.g. restricted contexts), keep UX intact.
    }
  }

  useEffect(() => {
    if (didCheckRef.current) return
    didCheckRef.current = true

    void (async () => {
      try {
        const raw = await deferredStorage.getItem(STORAGE_KEY)
        const seenState = raw ? safeParseSeenState(raw) : null

        // New user (no stored state): persist current version, but do not show update dialog.
        if (!seenState) {
          try {
            await deferredStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                version: currentVersion,
                versionType: currentVersionType,
                lastSeenAt: Date.now()
              })
            )
          } catch {
            // Ignore storage write failures.
          }
          return
        }

        // Show only when current version is newer.
        if (compareSemver(currentVersion, seenState.version) <= 0) {
          return
        }

        setIsSummaryOpen(true)
      } catch {
        // Never block app UI if the gate fails.
      }
    })()
  }, [currentVersion, currentVersionType])

  const content = useMemo(() => {
    if (!shouldRender) return null

    return (
      <>
        <WhatsNewUpdateSummaryDialog
          isOpen={isSummaryOpen}
          onClose={() => {
            void markSeen()
            setIsSummaryOpen(false)
          }}
          onOpenWhatsNew={() => {
            void markSeen()
            setIsSummaryOpen(false)
            setIsWhatsNewOpen(true)
          }}
          version={currentVersion}
        />
        <WhatsNewDialog
          isOpen={isWhatsNewOpen}
          onClose={() => {
            void markSeen()
            setIsWhatsNewOpen(false)
          }}
        />
      </>
    )
  }, [isSummaryOpen, isWhatsNewOpen, shouldRender])

  return content
}

