"use client"

import React, { useEffect, useState } from "react"
import { ChevronDown, HelpCircle, Lightbulb } from "lucide-react"

interface PresetInfoFaqItem {
  question: string
  answer: string
}

interface PresetInfoPreviewMediaItem {
  src: string
  type: "image" | "video"
  alt?: string
}

interface PresetInfoShowcasePanelProps {
  previewSrc: string
  previewSources?: string[]
  previewMediaSources?: PresetInfoPreviewMediaItem[]
  previewAlt: string
  previewAspectRatio?: string
  afterPreviewContent?: React.ReactNode
  title: string
  subtitle: string
  tips: string[]
  featureChips: string[]
  faqs: PresetInfoFaqItem[],
  padding?: number
}

export function PresetInfoShowcasePanel({
  previewSrc,
  previewSources,
  previewMediaSources,
  previewAlt,
  previewAspectRatio = "16 / 9",
  afterPreviewContent,
  title,
  subtitle,
  tips,
  featureChips,
  faqs,
  padding = 0,
}: PresetInfoShowcasePanelProps) {
  const IMAGE_AUTO_ADVANCE_MS = 6000
  const tipOfTheDay = tips[Math.abs(new Date().getDate()) % Math.max(1, tips.length)] ?? "Tip unavailable."
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [progressRemaining, setProgressRemaining] = useState(1)
  const fallbackPreviewMediaSources: PresetInfoPreviewMediaItem[] =
    Array.isArray(previewSources) && previewSources.length > 0
      ? previewSources.map((src) => ({ src, type: "image", alt: previewAlt }))
      : [{ src: previewSrc, type: "image", alt: previewAlt }]
  const effectivePreviewMediaSources =
    Array.isArray(previewMediaSources) && previewMediaSources.length > 0
      ? previewMediaSources
      : fallbackPreviewMediaSources
  const [renderedPreviewMedia, setRenderedPreviewMedia] = useState<PresetInfoPreviewMediaItem>(
    effectivePreviewMediaSources[0] ?? { src: previewSrc, type: "image", alt: previewAlt }
  )
  const [isPreviewFading, setIsPreviewFading] = useState(false)
  const activePreviewMedia =
    effectivePreviewMediaSources[previewIndex % effectivePreviewMediaSources.length] ?? renderedPreviewMedia
  const hasMultiplePreviews = effectivePreviewMediaSources.length > 1

  useEffect(() => {
    if (previewIndex >= effectivePreviewMediaSources.length) {
      setPreviewIndex(0)
    }
  }, [effectivePreviewMediaSources.length, previewIndex])

  useEffect(() => {
    if (
      activePreviewMedia.src === renderedPreviewMedia.src &&
      activePreviewMedia.type === renderedPreviewMedia.type
    ) {
      return
    }

    setIsPreviewFading(true)
    const timeout = window.setTimeout(() => {
      setRenderedPreviewMedia(activePreviewMedia)
      window.requestAnimationFrame(() => {
        setIsPreviewFading(false)
      })
    }, 140)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [activePreviewMedia, renderedPreviewMedia])

  useEffect(() => {
    if (!hasMultiplePreviews) {
      setProgressRemaining(1)
      return
    }

    setProgressRemaining(1)

    if (activePreviewMedia.type !== "image") {
      return
    }

    const startAt = window.performance.now()
    let rafId = 0
    const autoAdvanceTimeout = window.setTimeout(() => {
      setPreviewIndex((current) => (current + 1) % effectivePreviewMediaSources.length)
    }, IMAGE_AUTO_ADVANCE_MS)

    const tick = () => {
      const elapsedMs = window.performance.now() - startAt
      const remaining = Math.max(0, 1 - elapsedMs / IMAGE_AUTO_ADVANCE_MS)
      setProgressRemaining(remaining)
      if (remaining > 0) {
        rafId = window.requestAnimationFrame(tick)
      }
    }
    rafId = window.requestAnimationFrame(tick)

    return () => {
      window.clearTimeout(autoAdvanceTimeout)
      window.cancelAnimationFrame(rafId)
    }
  }, [activePreviewMedia.src, activePreviewMedia.type, effectivePreviewMediaSources.length, hasMultiplePreviews])

  return (
    <div className={`space-y-5 p-${padding}`}>
      <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="relative">
          <div
            className="flex w-full items-center justify-center bg-slate-100 dark:bg-slate-900/70"
            style={{ aspectRatio: previewAspectRatio }}
          >
            {renderedPreviewMedia.type === "video" ? (
              <video
                key={`${renderedPreviewMedia.type}_${renderedPreviewMedia.src}_${previewIndex}`}
                src={renderedPreviewMedia.src}
                className={`h-full w-full object-contain transition-opacity duration-300 ${isPreviewFading ? "opacity-0" : "opacity-100"}`}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={(event) => {
                  if (activePreviewMedia.type !== "video" || activePreviewMedia.src !== renderedPreviewMedia.src) {
                    return
                  }
                  const durationSec = event.currentTarget.duration
                  if (!Number.isFinite(durationSec) || durationSec <= 0) {
                    setProgressRemaining(1)
                    return
                  }
                  setProgressRemaining(1)
                }}
                onTimeUpdate={(event) => {
                  if (activePreviewMedia.type !== "video" || activePreviewMedia.src !== renderedPreviewMedia.src) {
                    return
                  }
                  const durationSec = event.currentTarget.duration
                  const currentSec = event.currentTarget.currentTime
                  if (!Number.isFinite(durationSec) || durationSec <= 0) {
                    return
                  }
                  const remaining = Math.max(0, 1 - currentSec / durationSec)
                  setProgressRemaining(remaining)
                }}
                onEnded={() => {
                  if (!hasMultiplePreviews) return
                  if (activePreviewMedia.type !== "video" || activePreviewMedia.src !== renderedPreviewMedia.src) {
                    return
                  }
                  setProgressRemaining(1)
                  setPreviewIndex((current) => (current + 1) % effectivePreviewMediaSources.length)
                }}
              />
            ) : (
              <img
                src={renderedPreviewMedia.src}
                alt={renderedPreviewMedia.alt ?? previewAlt}
                className={`h-full w-full object-contain transition-opacity duration-300 ${isPreviewFading ? "opacity-0" : "opacity-100"}`}
              />
            )}
          </div>
          {hasMultiplePreviews ? (
            <>
              <button
                type="button"
                className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
                aria-label="Previous preview"
                onClick={() =>
                  setPreviewIndex((current) =>
                    (current - 1 + effectivePreviewMediaSources.length) % effectivePreviewMediaSources.length
                  )
                }
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
                aria-label="Next preview"
                onClick={() =>
                  setPreviewIndex((current) => (current + 1) % effectivePreviewMediaSources.length)
                }
              />
              <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-center">
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-300/90 bg-white/90 px-2 py-0.5 opacity-60 dark:border-slate-600 dark:bg-slate-900/90">
                {effectivePreviewMediaSources.map((item, index) => (
                  <span
                    key={`${item.type}_${item.src}_${index}`}
                    className={`h-1.5 w-1.5 rounded-full ${index === previewIndex ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-600"}`}
                  />
                ))}
              </div>
              </div>
            </>
          ) : null}
          {hasMultiplePreviews ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-slate-300/30 dark:bg-slate-700/35">
              <div
                className="h-full bg-slate-400/45 transition-[width] duration-100 ease-linear dark:bg-slate-500/40"
                style={{ width: `${Math.max(0, Math.min(1, progressRemaining)) * 100}%`, marginLeft: "auto" }}
              />
            </div>
          ) : null}
        </div>
        {afterPreviewContent ? (
          <div className="border-t border-slate-200 p-2 dark:border-slate-700">
            {afterPreviewContent}
          </div>
        ) : null}
        <div className="space-y-1.5 border-t border-slate-200 p-3 dark:border-slate-700">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
          <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{subtitle}</div>
        </div>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50/70 p-2.5 dark:border-amber-900/60 dark:bg-amber-900/20">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          <Lightbulb size={13} />
          Tip of the day
        </div>
        <div className="mt-1 text-xs leading-relaxed text-amber-900 dark:text-amber-100">{tipOfTheDay}</div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {featureChips.map((chip) => (
          <span
            key={chip}
            className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200"
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          <HelpCircle size={13} />
          FAQs
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {faqs.map((item, index) => {
            const isOpen = openFaqIndex === index
            return (
              <div key={item.question} className="py-1">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 py-2 text-left"
                  onClick={() => setOpenFaqIndex((current) => (current === index ? null : index))}
                >
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-100">{item.question}</span>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen ? (
                  <div className="pb-2 pr-5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.answer}</div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
