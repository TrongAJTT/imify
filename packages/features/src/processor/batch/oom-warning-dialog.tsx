import { useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button, BodyText, Subheading, MutedText } from "@imify/ui"

interface OOMWarningDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (dontShowAgain: boolean) => void
  totalSize: string
  recommendedSize: string
}

export function OOMWarningDialog({ isOpen, onClose, onConfirm, totalSize, recommendedSize }: OOMWarningDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500"><AlertTriangle size={24} /></div><Subheading className="text-lg font-bold">Memory Warning</Subheading></div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors" title="Close"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <BodyText className="text-slate-600 dark:text-slate-400 leading-relaxed">Selected batch size is <span className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{totalSize} MB</span>. This exceeds the recommended limit of <span className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{recommendedSize} MB</span>.</BodyText>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-4"><MutedText className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed font-medium">Processing very large batches may cause the browser tab to run out of memory (OOM) and crash, especially when converting to heavy formats like AVIF or JXL.</MutedText></div>
              <div className="flex flex-col gap-3">
                <BodyText className="text-sm font-semibold text-slate-700 dark:text-slate-300">Are you sure you want to continue?</BodyText>
                <label className="flex items-center gap-2.5 cursor-pointer group w-fit select-none"><input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} className="rounded border-slate-300 text-amber-600 focus:ring-amber-500/20 w-4 h-4 cursor-pointer transition-all" /><MutedText className="text-xs group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Don't show this warning again</MutedText></label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60">
          <Button variant="ghost" onClick={onClose} className="text-slate-500 font-medium">Cancel</Button>
          <Button onClick={() => { onConfirm(dontShowAgain); onClose() }} className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm shadow-amber-200 dark:shadow-none">Continue anyway</Button>
        </div>
      </div>
    </div>
  )
}
