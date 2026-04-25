"use client"

import React from "react"
import { AlertCircle, Bug, CheckCircle2, ExternalLink, Info, ShieldCheck, Terminal, X } from "lucide-react"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { Button } from "@imify/ui/ui/button"
import { BodyText, Heading, Kicker, LabelText, MutedText, Subheading } from "@imify/ui/ui/typography"
import { FEATURE_MEDIA_ASSETS, resolveFeatureMediaAssetUrl } from "../shared/media-assets"

interface BugReportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function BugReportDialog({
  isOpen,
  onClose
}: BugReportDialogProps) {
  const devModeEnableVideoSrc = resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.devMode.enableVideoWebm)
  const devExportStep1Src = resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.devMode.exportStep1Webp)
  const devExportStep2Src = resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.devMode.exportStep2Webp)
  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl w-full"
      contentClassName="p-0 overflow-hidden flex flex-col max-h-[90vh]"
    >
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
            <Bug size={24} />
          </div>
          <div>
            <Heading className="text-xl leading-tight">Bug Reporting Guide</Heading>
            <Kicker>Help us improve Imify</Kicker>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={onClose}
        >
          <X size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 scroll-smooth">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-12">
            <Subheading className="flex items-center gap-2 text-sky-600 dark:text-sky-400 mb-4 uppercase tracking-tight">
              <ExternalLink size={20} />
              GitHub Issues
            </Subheading>
            <BodyText className="leading-relaxed">
              We use GitHub Issues to track bugs and feature requests. To report a bug, you will need a <strong>GitHub account</strong>.
            </BodyText>
            <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                <LabelText as="span" className="font-medium">Ready to report? Head over to our issue tracker.</LabelText>
              </div>
              <Button
                onClick={() => window.open("https://github.com/TrongAJTT/imify/issues/new/choose", "_blank")}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold gap-2 shrink-0"
              >
                Go to GitHub Issues
                <ExternalLink size={14} />
              </Button>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <section>
              <Subheading className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-4 uppercase tracking-tight">
                <ShieldCheck size={20} />
                Privacy First
              </Subheading>
              <BodyText className="text-sm leading-relaxed">
                Before submitting, please double-check your data for <strong>personally identifiable information (PII)</strong>.
              </BodyText>
              <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 flex gap-3">
                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <MutedText className="text-xs m-0 text-amber-700 dark:text-amber-400">
                  You may optionally include hardware specs, OS info, and browser version.
                </MutedText>
              </div>
            </section>
            <section>
              <Subheading className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-4 uppercase tracking-tight">
                <Terminal size={20} />
                Be Effective
              </Subheading>
              <ul className="text-sm space-y-3 p-0 m-0 list-none">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[10px] font-black text-violet-600 shrink-0 mt-0.5">1</div>
                  <BodyText className="text-slate-600 dark:text-slate-400"><strong>Visuals:</strong> Screenshots or screen recordings.</BodyText>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[10px] font-black text-violet-600 shrink-0 mt-0.5">2</div>
                  <BodyText className="text-slate-600 dark:text-slate-400"><strong>Logs:</strong> capture Console errors from DevTools.</BodyText>
                </li>
              </ul>
            </section>
          </div>

          {devModeEnableVideoSrc || devExportStep1Src || devExportStep2Src ? (
            <section className="mb-6 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600">
                  <Terminal size={18} />
                </div>
                <Heading className="text-xl tracking-tight">Providing System Logs</Heading>
              </div>
              {devModeEnableVideoSrc ? (
                <video src={devModeEnableVideoSrc} autoPlay loop muted playsInline className="rounded-2xl mb-4" />
              ) : null}
              {devExportStep1Src ? <img src={devExportStep1Src} alt="Access export tool" className="rounded-2xl mb-4" /> : null}
              {devExportStep2Src ? <img src={devExportStep2Src} alt="Export configuration" className="rounded-2xl" /> : null}
            </section>
          ) : null}

          <div className="mt-12 p-6 rounded-2xl bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/30 flex gap-4">
            <AlertCircle size={24} className="text-sky-500 shrink-0 mt-1" />
            <div>
              <LabelText as="h5" className="text-sky-900 dark:text-sky-300">Thank you for your support!</LabelText>
              <MutedText className="text-xs m-0 mt-1 leading-relaxed text-sky-700 dark:text-sky-400">
                Detailed bug reports help make Imify better for everyone.
              </MutedText>
            </div>
          </div>
        </article>
      </div>
    </BaseDialog>
  )
}
