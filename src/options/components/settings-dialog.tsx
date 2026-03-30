import { useState } from "react"
import { useBatchStore } from "@/options/stores/batch-store"
import { APP_CONFIG } from "@/core/config"
import { Button } from "@/options/components/ui/button"
import { Kicker, MutedText, Subheading } from "@/options/components/ui/typography"
import { ShieldAlert, X } from "lucide-react"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {      
  const skipDownloadConfirm = useBatchStore((state) => state.skipDownloadConfirm)
  const setSkipDownloadConfirm = useBatchStore((state) => state.setSkipDownloadConfirm)
  const skipOomWarning = useBatchStore((state) => state.skipOomWarning)
  const setSkipOomWarning = useBatchStore((state) => state.setSkipOomWarning)
  const skipSplicingHeavyPreviewQualityWarning = useBatchStore(
    (state) => state.skipSplicingHeavyPreviewQualityWarning
  )
  const setSkipSplicingHeavyPreviewQualityWarning = useBatchStore(
    (state) => state.setSkipSplicingHeavyPreviewQualityWarning
  )

  const [activeTab, setActiveTab] = useState<"warnings">("warnings")

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl flex overflow-hidden min-h-[500px]">
        
        {/* Sidebar */}
        <div className="w-56 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col pt-6 pb-4 shrink-0">
          <div className="px-5 mb-6">
            <Subheading className="text-xl font-bold text-slate-800 dark:text-slate-100">Settings</Subheading>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            <button
              onClick={() => setActiveTab("warnings")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "warnings"
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <ShieldAlert size={16} />
              Warnings
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative bg-white dark:bg-slate-900">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"      
            onClick={onClose}
            aria-label="Close settings dialog">
            <X size={18} />
          </Button>
          
          <div className="flex-1 overflow-y-auto p-8 pt-12">
            
            {activeTab === "warnings" && (
              <div className="animate-in fade-in duration-300">
                <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-5">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 mb-2">Warning Dialogs</h2>
                  <MutedText>Control how warning dialogs appear during batch processing.</MutedText>
                </div>

                <section className="space-y-4">
                  <div>
                    <Kicker className="mb-1">PREFERENCES</Kicker>
                    <MutedText className="text-sm">
                      These preferences are saved automatically. Batch options apply across Single/Batch setup; Image Splicing uses the preview-quality warning here as well.
                    </MutedText>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between gap-4 py-3 rounded-lg transition-colors cursor-pointer select-none group">
                      <div className="flex-1 pr-6">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-900 transition-colors">
                          Show download confirmation dialog
                        </p>
                        <MutedText className="text-sm mt-0.5 leading-relaxed">
                          Warn before downloading more than {APP_CONFIG.BATCH.DOWNLOAD_CONFIRM_THRESHOLD} images one by one to avoid overwhelming your browser.
                        </MutedText>
                      </div>
                      <div className="flex items-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!skipDownloadConfirm}
                          onClick={() => setSkipDownloadConfirm(!skipDownloadConfirm)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${!skipDownloadConfirm ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!skipDownloadConfirm ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    </label>

                    <label className="flex items-center justify-between gap-4 py-3 rounded-lg transition-colors cursor-pointer select-none group">
                      <div className="flex-1 pr-6">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-900 transition-colors">
                          Show memory (OOM) warning dialog
                        </p>
                        <MutedText className="text-sm mt-0.5 leading-relaxed">
                          Warn when selected batch size exceeds ~{APP_CONFIG.BATCH.OOM_WARNING_MB} MB to prevent out-of-memory crashes.
                        </MutedText>
                      </div>
                      <div className="flex items-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!skipOomWarning}
                          onClick={() => setSkipOomWarning(!skipOomWarning)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${!skipOomWarning ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!skipOomWarning ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    </label>

                    <label className="flex items-center justify-between gap-4 py-3 rounded-lg transition-colors cursor-pointer select-none group">
                      <div className="flex-1 pr-6">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-900 transition-colors">
                          Show Image Splicing high preview quality warning
                        </p>
                        <MutedText className="text-sm mt-0.5 leading-relaxed">
                          When choosing preview quality 50% or higher, warn if there are more than{" "}
                          {APP_CONFIG.SPLICING.HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT} images or total area exceeds
                          ~{APP_CONFIG.SPLICING.HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS / 1_000_000}M px².
                        </MutedText>
                      </div>
                      <div className="flex items-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!skipSplicingHeavyPreviewQualityWarning}
                          onClick={() => setSkipSplicingHeavyPreviewQualityWarning(!skipSplicingHeavyPreviewQualityWarning)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${!skipSplicingHeavyPreviewQualityWarning ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!skipSplicingHeavyPreviewQualityWarning ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    </label>
                  </div>
                </section>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  )
}
