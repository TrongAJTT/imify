import { Check, ChevronDown, Download, FileText, Save } from "lucide-react"
import type { RefObject } from "react"
import { ChevronsRight } from 'lucide-react'

import type { BatchExportAction, BatchSummary } from "@/options/components/batch/types"

interface BatchSummaryCardProps {
  summary: BatchSummary
  successfulCount: number
  reductionPercent: number
  sourceTotalAfterRun: number
  outputTotalAfterRun: number
  formatBytes: (sizeInBytes: number) => string
  isExporting: boolean
  activeExportAction: BatchExportAction | null
  isPdfSplitOpen: boolean
  pdfSplitRef: RefObject<HTMLDivElement>
  onDownloadAsZip: () => void
  onDownloadIndividually: () => void
  onMergeIntoPdf: () => void
  onTogglePdfSplit: () => void
  onDownloadIndividualPdfs: () => void
}

export function BatchSummaryCard({
  summary,
  successfulCount,
  reductionPercent,
  sourceTotalAfterRun,
  outputTotalAfterRun,
  formatBytes,
  isExporting,
  activeExportAction,
  isPdfSplitOpen,
  pdfSplitRef,
  onDownloadAsZip,
  onDownloadIndividually,
  onMergeIntoPdf,
  onTogglePdfSplit,
  onDownloadIndividualPdfs
}: BatchSummaryCardProps) {
  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500 text-white rounded-full shadow-sm">
          <Check size={20} />
        </div>
        <div>
          <p className="font-semibold text-lg text-slate-900 dark:text-white leading-tight">Batch Completed</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Successfully processed {summary.success} files in {(summary.durationMs / 1000).toFixed(1)}s.
          </p>
        </div>
      </div>

      {successfulCount > 0 ? (
        <>
          <div className="my-4 border-t border-emerald-200/80 dark:border-emerald-800/60" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Result</p>
                <p
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                    reductionPercent >= 0
                      ? "text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30"
                      : "text-orange-600 dark:text-orange-500 bg-orange-100 dark:bg-orange-900/30"
                  }`}>
                  {reductionPercent >= 0 ? "Saved" : "Increased"} {Math.abs(reductionPercent).toFixed(1)}%
                </p>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatBytes(sourceTotalAfterRun)}</span>
                <ChevronsRight size={16} className="text-slate-500" />
                <span
                  className={`text-xl font-bold ${
                    reductionPercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"
                  }`}>
                  {formatBytes(outputTotalAfterRun)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isExporting}
                onClick={onDownloadAsZip}
                type="button">
                <Download size={16} />
                {activeExportAction === "zip" ? "Preparing ZIP..." : `Download ZIP (${successfulCount})`}
              </button>

              <button
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isExporting}
                onClick={onDownloadIndividually}
                type="button">
                <Save size={16} />
                {activeExportAction === "one_by_one" ? "Exporting files..." : "One by one"}
              </button>

              <div className="relative" ref={pdfSplitRef}>
                <div className="inline-flex rounded-lg shadow-sm">
                  <button
                    className="rounded-l-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={isExporting}
                    onClick={onMergeIntoPdf}
                    type="button">
                    <FileText size={16} className="text-red-500" />
                    {activeExportAction === "merge_pdf" ? "Merging PDF..." : "Merge into single PDF"}
                  </button>
                  <button
                    aria-label="Open PDF export options"
                    className="rounded-r-lg border-y border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isExporting}
                    onClick={onTogglePdfSplit}
                    type="button">
                    <ChevronDown size={16} />
                  </button>
                </div>

                {isPdfSplitOpen ? (
                  <div className="absolute right-0 z-10 mt-2 min-w-[220px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-1.5">
                    <button
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
                      disabled={isExporting}
                      onClick={onDownloadIndividualPdfs}
                      type="button">
                      {activeExportAction === "individual_pdf"
                        ? "Preparing Individual PDFs..."
                        : `Individual PDF (${successfulCount})`}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
