import { Archive, Download, FileText, Files, X } from "lucide-react"
import { Button } from "@/options/components/ui/button"

export type SplicingExportMode = "zip" | "one_by_one" | "pdf" | "individual_pdf"

export interface SplicingExportDialogProps {
  isOpen: boolean
  totalImages: number
  showPdfOptions: boolean
  onExport: (mode: SplicingExportMode) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function SplicingExportDialog({
  isOpen,
  totalImages,
  showPdfOptions,
  onExport,
  onCancel,
  isLoading = false
}: SplicingExportDialogProps) {
  if (!isOpen) return null

  const modes: Array<{
    value: SplicingExportMode
    title: string
    description: string
    icon: typeof Download
    colorClass: string
    iconClass: string
  }> = [
    {
      value: "zip",
      title: `Download ZIP (${totalImages})`,
      description: "Package all images into one ZIP archive",
      icon: Archive,
      colorClass: "bg-sky-500 hover:bg-sky-600 text-white border-sky-500 shadow-sm shadow-sky-200/50 dark:shadow-none",
      iconClass: "bg-white/20 text-white"
    },
    {
      value: "one_by_one",
      title: "One by one",
      description: "Download images as separate files",
      icon: Download,
      colorClass: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-sky-400 dark:hover:border-sky-500",
      iconClass: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
    },
    {
      value: "pdf",
      title: "Merge into single PDF",
      description: "Combine all images into one PDF file",
      icon: FileText,
      colorClass: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-rose-400 dark:hover:border-rose-500",
      iconClass: "bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400"
    },
    {
      value: "individual_pdf",
      title: `Individual PDF (${totalImages})`,
      description: "Create one PDF for each exported image",
      icon: Files,
      colorClass: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-violet-400 dark:hover:border-violet-500",
      iconClass: "bg-violet-50 dark:bg-violet-900/20 text-violet-500 dark:text-violet-400"
    }
  ]

  const visibleModes = showPdfOptions
    ? modes
    : modes.filter((mode) => mode.value !== "pdf" && mode.value !== "individual_pdf")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onCancel} 
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Export {totalImages} Image{totalImages !== 1 ? "s" : ""}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Select your preferred export method
            </p>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => void onExport(mode.value)}
                disabled={isLoading}
                className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${mode.colorClass}`}
              >
                <div className={`flex-shrink-0 h-11 w-11 rounded-lg flex items-center justify-center transition-colors ${mode.iconClass}`}>
                  <mode.icon size={22} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-bold text-sm leading-tight mb-1 text-left">{mode.title}</div>
                  <div className="text-xs leading-tight opacity-80 text-left">
                    {mode.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="font-medium"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
