import { Check, ChevronDown, Download, FileText, Save } from "lucide-react"
import type { RefObject } from "react"
import { ChevronsRight } from 'lucide-react'

import type { BatchExportAction, BatchSummary } from "@/options/components/batch/types"
import { Button } from "@imify/ui/ui/button"
import { Subheading, MutedText, Heading, Kicker } from "@imify/ui/ui/typography"

interface BatchSummaryCardProps {
  summary: BatchSummary
  successfulCount: number
  targetFormat: string
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
  targetFormat,
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
  const supportsPdfExport = ["jpg", "png", "webp", "bmp"].includes(targetFormat.toLowerCase())

  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500 text-white rounded-full shadow-sm">
          <Check size={20} />
        </div>
        <div>
          <Heading className="text-lg leading-tight">Batch Completed</Heading>
          <MutedText className="mt-0.5">
            Successfully processed {summary.success} files in {(summary.durationMs / 1000).toFixed(1)}s.
          </MutedText>
        </div>
      </div>

      {successfulCount > 0 ? (
        <>
          <div className="my-4 border-t border-emerald-200/80 dark:border-emerald-800/60" />
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Kicker>Result</Kicker>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                    reductionPercent >= 0
                      ? "text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30"
                      : "text-orange-600 dark:text-orange-500 bg-orange-100 dark:bg-orange-900/30"
                  }`}>
                  {reductionPercent >= 0 ? "Saved" : "Increased"} {Math.abs(reductionPercent).toFixed(1)}%
                </span>
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
              <Button
                variant="primary"
                disabled={isExporting}
                onClick={onDownloadAsZip}
              >
                <Download size={16} className="mr-2" />
                {activeExportAction === "zip" ? "Preparing ZIP..." : `Download ZIP (${successfulCount})`}
              </Button>

              <Button
                variant="secondary"
                disabled={isExporting}
                onClick={onDownloadIndividually}
              >
                <Save size={16} className="mr-2" />
                {activeExportAction === "one_by_one" ? "Exporting files..." : "One by one"}
              </Button>

              {supportsPdfExport ? (
                <div className="relative" ref={pdfSplitRef}>
                  <div className="inline-flex shadow-sm">
                    <Button
                      variant="secondary"
                      className="rounded-r-none border-r-0"
                      disabled={isExporting}
                      onClick={onMergeIntoPdf}
                    >
                      <FileText size={16} className="text-red-500 mr-2" />
                      {activeExportAction === "merge_pdf" ? "Merging PDF..." : "Merge into single PDF"}
                    </Button>
                    <Button
                      variant="secondary"
                      className="rounded-l-none px-2.5"
                      aria-label="Open PDF export options"
                      disabled={isExporting}
                      onClick={onTogglePdfSplit}
                    >
                      <ChevronDown size={16} />
                    </Button>
                  </div>

                  {isPdfSplitOpen ? (
                    <div className="absolute right-0 z-10 mt-2 min-w-[220px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-1.5 flex flex-col">
                      <Button
                        variant="ghost"
                        className="w-full justify-start font-normal"
                        disabled={isExporting}
                        onClick={onDownloadIndividualPdfs}
                      >
                        {activeExportAction === "individual_pdf"
                          ? "Preparing Individual PDFs..."
                          : `Individual PDF (${successfulCount})`}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
