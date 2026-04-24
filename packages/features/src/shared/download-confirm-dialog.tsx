import { useState } from "react"
import { AlertCircle, Download, X } from "lucide-react"
import { Button, BodyText, Subheading, MutedText } from "@imify/ui"
import { useBatchStore } from "@imify/stores/stores/batch-store"

interface BatchDownloadConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  count: number
}

export function BatchDownloadConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  count
}: BatchDownloadConfirmDialogProps) {
  const setSkipDownloadConfirm = useBatchStore((state) => state.setSkipDownloadConfirm)
  const [localSkip, setLocalSkip] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (localSkip) {
      setSkipDownloadConfirm(true)
    }
    onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 shrink-0">
                <AlertCircle size={26} />
              </div>
              <Subheading className="text-xl">
                Download Confirmation
              </Subheading>
            </div>
            
            <div className="space-y-3">
              <BodyText className="text-slate-600 dark:text-slate-400">
                You are about to download <span className="font-bold text-slate-900 dark:text-white">{count} files</span> at the same time.
              </BodyText>
              
              <div className="space-y-3">
                <MutedText className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-400">
                  HINT
                </MutedText>
                
                <BodyText className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Make sure you have <span className="font-bold text-slate-900 dark:text-slate-100">disabled</span> the option <b>"Ask where to save each file before downloading"</b> in your browser settings.
                </BodyText>

                <MutedText className="text-[12px] italic">
                  Otherwise, you will encounter {count} popups asking for the save location.
                </MutedText>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer group w-fit select-none pt-2">
                <input
                  type="checkbox"
                  checked={localSkip}
                  onChange={(e) => setLocalSkip(e.target.checked)}
                  className="rounded border-slate-300 text-sky-500 focus:ring-sky-500/20 w-4 h-4 cursor-pointer transition-all"
                />
                <MutedText className="text-xs group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  Don't show this warning again
                </MutedText>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80">
          <Button 
            variant="secondary" 
            onClick={onClose}
            className="text-sm px-4"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="text-sm px-5 bg-sky-600 hover:bg-sky-700 text-white gap-2 shadow-md shadow-sky-600/20"
          >
            <Download size={16} />
            Download Now
          </Button>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
