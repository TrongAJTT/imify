"use client"

import React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Bug, Github, Globe, Heart, LayoutGrid, Library, X } from "lucide-react"
import { IMIFY_LINKS } from "@imify/core"
import { getAppMetadata } from "@imify/core/app-metadata"
import { useDevModeEnabled } from "@imify/features/dev-mode/dev-mode-storage"
import { useToast } from "@imify/core/hooks/use-toast"
import { ToastContainer } from "@imify/ui/components/toast-container"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { Button } from "@imify/ui/ui/button"
import { BodyText, Kicker, MutedText, Subheading } from "@imify/ui/ui/typography"
import { FEATURE_MEDIA_ASSETS, resolveFeatureMediaAssetUrl } from "../shared/media-assets"
import { Tooltip } from "../shared/tooltip"
import { BugReportDialog } from "./bug-report-dialog"
import { WhatsNewDialog } from "./whats-new-dialog"

const appMetadata = getAppMetadata()
const DEV_MODE_CLICK_TARGET = 7
const DEV_MODE_CLICK_TIMEOUT_MS = 3000

interface AboutDialogProps {
  isOpen: boolean
  onClose: () => void
  onOpenAboutAttribution: () => void
  onOpenDonate: () => void
}

function useEasterEggClicker(onActivate: () => void) {
  const clickCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    clickCountRef.current += 1
    if (clickCountRef.current >= DEV_MODE_CLICK_TARGET) {
      clickCountRef.current = 0
      onActivate()
      return
    }
    timerRef.current = setTimeout(() => {
      clickCountRef.current = 0
      timerRef.current = null
    }, DEV_MODE_CLICK_TIMEOUT_MS)
  }, [onActivate])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )
  return handleClick
}

function ActionLink({
  href,
  children,
  emphasized = false,
  className = ""
}: {
  href: string
  children: React.ReactNode
  emphasized?: boolean
  className?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        emphasized
          ? `px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-bold shadow-lg shadow-slate-900/10 dark:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${className}`
          : `px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 ${className}`
      }
    >
      {children}
    </a>
  )
}

export function AboutDialog({
  isOpen,
  onClose,
  onOpenAboutAttribution,
  onOpenDonate
}: AboutDialogProps) {
  const iconSrc = resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.brand.imifyLogoPng)
  const [devModeEnabled, setDevModeEnabled] = useDevModeEnabled()
  const { toasts, hide, success, warning } = useToast()
  const [isBugReportDialogOpen, setIsBugReportDialogOpen] = useState(false)
  const [isWhatsNewDialogOpen, setIsWhatsNewDialogOpen] = useState(false)

  const activateDevMode = useCallback(async () => {
    if (devModeEnabled) {
      warning("Developer Mode", "Already enabled. Go to Settings -> Developer.")
      return
    }
    await setDevModeEnabled(true)
    success("Developer Mode enabled!", "Open Settings to access the Developer tab.", 4000)
  }, [devModeEnabled, setDevModeEnabled, success, warning])

  const handleIconClick = useEasterEggClicker(activateDevMode)
  const handleVersionClick = useEasterEggClicker(activateDevMode)

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="w-full max-w-3xl rounded-2xl p-8 relative overflow-y-auto max-h-[90vh]"
    >
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 rounded-full border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 z-10"
        onClick={onClose}
        aria-label="Close about dialog"
      >
        <X size={16} />
      </Button>

      <div className="flex flex-col">
        <div className="flex items-center gap-5 mb-8">
          <button
            type="button"
            onClick={handleIconClick}
            className="shrink-0 select-none cursor-default focus:outline-none active:scale-90 transition-transform duration-100"
            aria-label="Imify logo"
            tabIndex={-1}
          >
            {iconSrc ? (
              <img
                src={iconSrc}
                alt="Imify Logo"
                className="w-20 h-20 rounded-2xl shadow-md rotate-3 bg-white p-1 pointer-events-none"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl shadow-md rotate-3 bg-slate-100 dark:bg-slate-800" />
            )}
          </button>
          <div>
            <Subheading className="text-3xl font-black tracking-tight">Imify</Subheading>
            <Kicker className="text-sm text-sky-500 dark:text-sky-400 tracking-widest">
              The Powerful Image Toolkit
            </Kicker>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleVersionClick}
                className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 select-none cursor-default focus:outline-none active:scale-90 transition-transform duration-100"
                tabIndex={-1}
                aria-label="App version"
              >
                {`v${appMetadata.version}`}
              </button>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {appMetadata.versionType}
              </span>
              {devModeEnabled ? (
                <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-[10px] font-bold text-violet-600 dark:text-violet-400">
                  DEV MODE ON
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-600 dark:text-slate-300">
          <div className="space-y-4">
            <Kicker className="text-xs tracking-widest">About the project</Kicker>
            <BodyText className="leading-relaxed">
              Imify was born out of a simple need:{" "}
              <span className="text-slate-900 dark:text-white font-medium">Privacy-First</span> image processing.
              Unlike online converters that upload your data to remote servers, Imify handles every single byte{" "}
              <span className="text-slate-900 dark:text-white font-medium">locally</span> right in your browser memory.
            </BodyText>
            <BodyText className="leading-relaxed">
              Built for developers, designers, and privacy enthusiasts who need quick, reliable, and secure image
              formatting without compromise.
            </BodyText>
          </div>
          <div className="space-y-4">
            <Kicker className="text-xs tracking-widest">Key Technologies</Kicker>
            <ul className="grid grid-cols-1 gap-2">
              {[
                "Plasmo Extension Framework",
                "OffscreenCanvas API",
                "Rust/WASM Image Engines",
                "Modern AVIF & JXL Support",
                "TypeScript + Tailwind CSS"
              ].map((label) => (
                <li key={label} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-8 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-4">
            <Kicker className="text-xs tracking-widest text-center text-slate-400 uppercase">Quick Links & Support</Kicker>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ActionLink
                href={IMIFY_LINKS.website}
                className="bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50"
              >
                <Globe size={16} />
                Official Website
              </ActionLink>

              <ActionLink
                href={IMIFY_LINKS.repository}
                emphasized
              >
                <Github size={16} />
                GitHub Repository
              </ActionLink>

              <button
                type="button"
                onClick={onOpenDonate}
                className="w-full h-full px-5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 text-sm font-bold hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition-all flex items-center justify-center gap-2"
              >
                <Heart size={16} fill="currentColor" />
                Sponsor Author
              </button>

              <button
                type="button"
                onClick={onOpenAboutAttribution}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Library size={16} />
                Attribution
              </button>

              <ActionLink href={IMIFY_LINKS.moreApps}>
                <LayoutGrid size={16} />
                More Applications
              </ActionLink>

              <button
                type="button"
                onClick={() => setIsBugReportDialogOpen(true)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Bug size={16} />
                Report Bug
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 text-center">
            <div className="space-y-1 space-x-1">
              <Kicker className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Crafted with passion by</Kicker>
              <a
                href={IMIFY_LINKS.authorProfile}
                target="_blank"
                rel="noreferrer"
                className="text-xl text-slate-900 dark:text-white font-bold hover:text-sky-500 dark:hover:text-sky-400 transition-all"
              >
                TrongAJTT
              </a>
            </div>

            <MutedText className="flex items-center justify-center gap-4 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setIsWhatsNewDialogOpen(true)}
                className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              >
                What&apos;s New
              </button>
              <span className="text-slate-200 dark:text-slate-800">/</span>
              <a
                href={IMIFY_LINKS.terms}
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              >
                Terms of Use
              </a>
              <span className="text-slate-200 dark:text-slate-800">/</span>
              <a
                href={IMIFY_LINKS.privacy}
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              >
                Privacy Policy
              </a>
            </MutedText>
          </div>
        </div>
      </div>

      <BugReportDialog
        isOpen={isBugReportDialogOpen}
        onClose={() => setIsBugReportDialogOpen(false)}
      />
      <WhatsNewDialog
        isOpen={isWhatsNewDialogOpen}
        onClose={() => setIsWhatsNewDialogOpen(false)}
      />
      <ToastContainer toasts={toasts} onRemove={hide} />
    </BaseDialog>
  )
}
