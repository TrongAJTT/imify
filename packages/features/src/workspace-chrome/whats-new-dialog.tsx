"use client"

import React, { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { Button } from "@imify/ui/ui/button"
import { Heading, Kicker, MutedText } from "@imify/ui/ui/typography"
import { FEATURE_MEDIA_ASSETS, resolveFeatureMediaAssetUrl } from "../shared/media-assets"
import { FeatureMarkdown } from "../shared/feature-markdown"
import { extractWhatsNewBodyBelowSummary } from "./whats-new-markdown-split"

interface WhatsNewDialogProps {
  isOpen: boolean
  onClose: () => void
}

const WHATS_NEW_MARKDOWN_PATH = "/assets/WHATS_NEW.md"

export function WhatsNewDialog({ isOpen, onClose }: WhatsNewDialogProps) {
  const [markdown, setMarkdown] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const markdownUrl = resolveFeatureMediaAssetUrl(WHATS_NEW_MARKDOWN_PATH)
  const appIconSrc = resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.brand.imifyLogoPng)

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    setIsLoading(true)
    setError(null)

    void fetch(markdownUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load changelog: ${response.status}`)
        }
        return response.text()
      })
      .then((text) => {
        if (!isMounted) return
        setMarkdown(extractWhatsNewBodyBelowSummary(text))
      })
      .catch(() => {
        if (!isMounted) return
        setError("Could not load What's New content.")
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, markdownUrl])

  const content = useMemo(() => {
    if (isLoading) {
      return <MutedText>Loading updates...</MutedText>
    }

    if (error) {
      return <MutedText className="text-rose-500 dark:text-rose-400">{error}</MutedText>
    }

    if (!markdown.trim()) {
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/30 p-6">
          <MutedText>No release notes available for this version.</MutedText>
        </div>
      )
    }

    return <FeatureMarkdown markdown={markdown} markdownUrl={markdownUrl} />
  }, [error, isLoading, markdown, markdownUrl])

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl w-full"
      contentClassName="p-0 overflow-hidden flex flex-col max-h-[90vh]"
    >
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center overflow-hidden">
            <img src={appIconSrc} alt="Imify" className="h-5 w-5 object-contain" />
          </div>
          <div>
            <Heading className="text-xl leading-tight">What's New</Heading>
            <Kicker>Latest changes and improvements</Kicker>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={onClose}
          aria-label="Close what's new dialog"
        >
          <X size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-3 bg-slate-50/50 dark:bg-slate-900/50">
        {content}
      </div>
    </BaseDialog>
  )
}

