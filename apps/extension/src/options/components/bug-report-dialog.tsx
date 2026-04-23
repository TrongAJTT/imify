import React from "react"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { Button } from "@imify/ui/ui/button"
import { AlertCircle, Bug, CheckCircle2, ExternalLink, Info, ShieldCheck, Terminal, X } from "lucide-react"
import { Heading, Subheading, BodyText, MutedText, Kicker, LabelText } from "@imify/ui/ui/typography"

// Assets
import devModeEnableVideo from "url:@assets/features/dev_mode-enable.webm"
import devExportStep1 from "url:@assets/images/dev-export-1.webp"
import devExportStep2 from "url:@assets/images/dev-export-2.webp"

interface BugReportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function BugReportDialog({ isOpen, onClose }: BugReportDialogProps) {
  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl w-full"
      contentClassName="p-0 overflow-hidden flex flex-col max-h-[90vh]"
    >
      {/* Header */}
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

      {/* Content - Blog Style */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 scroll-smooth">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          {/* GitHub Section */}
          <section className="mb-12">
            <Subheading className="flex items-center gap-2 text-sky-600 dark:text-sky-400 mb-4 uppercase tracking-tight">
              <ExternalLink size={20} />
              GitHub Issues
            </Subheading>
            <BodyText className="leading-relaxed">
              We use GitHub Issues to track bugs and feature requests. To report a bug, you will need a <strong>GitHub account</strong>.
              Reporting via GitHub allows us to communicate with you directly if we need more information to reproduce the issue.
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

          {/* Privacy & Efficiency Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <section>
              <Subheading className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-4 uppercase tracking-tight">
                <ShieldCheck size={20} />
                Privacy First
              </Subheading>
              <BodyText className="text-sm leading-relaxed">
                Before submitting, please double-check your data for <strong>personally identifiable information (PII)</strong>.
                Under no circumstances should you share sensitive photos, passwords, or other personal information.
              </BodyText>
              <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 flex gap-3">
                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <MutedText className="text-xs m-0 text-amber-700 dark:text-amber-400">
                  If you'd like us to better understand your environment, you may optionally include hardware specs, OS info, and browser version.
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
                  <BodyText className="text-slate-600 dark:text-slate-400"><strong>Visuals:</strong> Screenshots or screen recordings of the bug in action.</BodyText>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[10px] font-black text-violet-600 shrink-0 mt-0.5">2</div>
                  <BodyText className="text-slate-600 dark:text-slate-400"><strong>Logs:</strong> Press <kbd className="px-1 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">F12</kbd>, go to the Console tab, and capture any errors.</BodyText>
                </li>
              </ul>
            </section>
          </div>

          {/* System Log Guide Section */}
          <section className="mb-6 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600">
                <Terminal size={18} />
              </div>
              <Heading className="text-xl tracking-tight">Providing System Logs</Heading>
            </div>

            <BodyText className="mb-8 leading-relaxed">
              For complex issues involving specific configurations, providing a <strong>System Log</strong> is the fastest way for us to help.
              These logs contain sanitized versions of your settings, extension state, and basic <strong>environment information</strong> (such as OS, browser version, and hardware specs).
            </BodyText>

            <div className="space-y-12">
              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Kicker as="span" className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-500">Step 1</Kicker>
                  <LabelText as="h4" className="text-base font-bold m-0 text-slate-800 dark:text-slate-200">Enable Developer Mode</LabelText>
                </div>
                <MutedText className="mb-4">
                  Open the About dialog and click the Imify logo or version badge <strong>7 times</strong> rapidly to unlock the Developer tab.
                </MutedText>
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-xl">
                  <video
                    src={devModeEnableVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="max-w-full h-auto block mx-auto"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Kicker as="span" className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-500">Step 2</Kicker>
                  <LabelText as="h4" className="text-base font-bold m-0 text-slate-800 dark:text-slate-200">Access Export Tool</LabelText>
                </div>
                <MutedText className="mb-4">
                  Navigate to <strong>Settings</strong>, scroll down to the new <strong>Developer</strong> tab, and find the <strong>Export System Log</strong> button.
                </MutedText>
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
                  <img
                    src={devExportStep1}
                    alt="Access Export tool in settings"
                    className="max-w-full h-auto block mx-auto"
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Kicker as="span" className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-500">Step 3</Kicker>
                  <LabelText as="h4" className="text-base font-bold m-0 text-slate-800 dark:text-slate-200">Generate & Download</LabelText>
                </div>
                <MutedText className="mb-4">
                  Customize which features to include in the log (all are selected by default for best coverage) and click <strong>Export</strong> to download the JSON file.
                </MutedText>
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
                  <img
                    src={devExportStep2}
                    alt="Export configuration dialog"
                    className="max-w-full h-auto block mx-auto"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Final Note */}
          <div className="mt-12 p-6 rounded-2xl bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/30 flex gap-4">
            <AlertCircle size={24} className="text-sky-500 shrink-0 mt-1" />
            <div>
              <LabelText as="h5" className="text-sky-900 dark:text-sky-300">Thank you for your support!</LabelText>
              <MutedText className="text-xs m-0 mt-1 leading-relaxed text-sky-700 dark:text-sky-400">
                By providing detailed bug reports, you help make Imify better for everyone. We appreciate your patience and contribution to the open-source community.
              </MutedText>
            </div>
          </div>
        </article>
      </div>

      {/* Footer */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end sticky bottom-0 z-20">
        <Button
          onClick={onClose}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold px-8 rounded-xl"
        >
          Got it
        </Button>
      </div>
    </BaseDialog>
  )
}
