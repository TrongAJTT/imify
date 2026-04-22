import { ChevronDown, Download, FileText, Files, Save } from "lucide-react"

import { Button } from "@/options/components/ui/button"
import { ControlledPopover } from "@/options/components/ui/controlled-popover"

export type ExportSplitMode = "zip" | "one_by_one" | "pdf" | "individual_pdf"

interface ExportSplitButtonProps {
  onExport: (mode: ExportSplitMode) => void | Promise<void>
  isLoading?: boolean
  primaryMode?: "zip" | "one_by_one"
  oneByOneCount?: number
  showPdfOptions?: boolean
  label?: string
  loadingLabel?: string
  ariaLabel?: string
}

const BASE_ITEM_CLASS =
  "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"

export function ExportSplitButton({
  onExport,
  isLoading = false,
  primaryMode = "zip",
  oneByOneCount,
  showPdfOptions = false,
  label = "Export",
  loadingLabel = "Exporting...",
  ariaLabel = "Open export options"
}: ExportSplitButtonProps) {
  const dropdownModes: ExportSplitMode[] = ["one_by_one", "pdf", "individual_pdf"].filter((mode) => {
    if (mode === primaryMode) {
      return false
    }
    if (!showPdfOptions && (mode === "pdf" || mode === "individual_pdf")) {
      return false
    }
    return true
  }) as ExportSplitMode[]

  return (
    <div className="inline-flex">
      <Button
        variant="primary"
        size="sm"
        onClick={() => void onExport(primaryMode)}
        disabled={isLoading}
        className={dropdownModes.length > 0 ? "rounded-r-none border-r border-sky-500/60" : undefined}>
        <Download size={14} />
        {isLoading ? loadingLabel : label}
      </Button>

      {dropdownModes.length > 0 ? (
        <ControlledPopover
          trigger={
            <Button
              variant="primary"
              size="sm"
              disabled={isLoading}
              className="rounded-l-none px-2"
              aria-label={ariaLabel}>
              <ChevronDown size={14} />
            </Button>
          }
          preset="dropdown"
          align="end"
          contentClassName="z-[9999] min-w-[240px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-1.5">
          {dropdownModes.map((mode) => {
            if (mode === "one_by_one") {
              return (
                <button
                  key={mode}
                  type="button"
                  className={BASE_ITEM_CLASS}
                  onClick={() => void onExport("one_by_one")}
                  disabled={isLoading}>
                  <span className="inline-flex items-center gap-2">
                    <Save size={14} />
                    One by one
                  </span>
                  {typeof oneByOneCount === "number" ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{oneByOneCount} files</span>
                  ) : null}
                </button>
              )
            }

            if (mode === "pdf") {
              return (
                <button
                  key={mode}
                  type="button"
                  className={BASE_ITEM_CLASS}
                  onClick={() => void onExport("pdf")}
                  disabled={isLoading}>
                  <span className="inline-flex items-center gap-2">
                    <FileText size={14} />
                    Single PDF
                  </span>
                </button>
              )
            }

            return (
              <button
                key={mode}
                type="button"
                className={BASE_ITEM_CLASS}
                onClick={() => void onExport("individual_pdf")}
                disabled={isLoading}>
                <span className="inline-flex items-center gap-2">
                  <Files size={14} />
                  Individual PDF
                </span>
                {typeof oneByOneCount === "number" ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400">{oneByOneCount} files</span>
                ) : null}
              </button>
            )
          })}
        </ControlledPopover>
      ) : null}
    </div>
  )
}
