import { useMemo, useState } from "react"
import { Link2, Loader2, Plus } from "lucide-react"
import { parseHttpUrlsFromText } from "@imify/engine/converter/remote-image-import"
import { Button, MutedText, SecondaryButton } from "@imify/ui"

interface ImageUrlImportControlProps {
  allowMultiple: boolean
  onProcessUrls: (urls: string[]) => Promise<void>
  disabled?: boolean
  className?: string
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return "Unable to import image URL."
}

export function ImageUrlImportControl({ allowMultiple, onProcessUrls, disabled = false, className }: ImageUrlImportControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const nonEmptyLineCount = useMemo(() => inputValue.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).length, [inputValue])
  const parsedUrls = useMemo(() => parseHttpUrlsFromText(inputValue), [inputValue])
  const processLabel = allowMultiple ? "Import URLs" : "Import First URL"
  const handleClose = () => { if (!isSubmitting) { setIsOpen(false); setErrorText(null) } }
  const handleProcess = async () => {
    const urlsToImport = allowMultiple ? parsedUrls : parsedUrls.slice(0, 1)
    if (!urlsToImport.length) { setErrorText("Enter at least one valid http(s) image URL."); return }
    setIsSubmitting(true); setErrorText(null)
    try {
      await onProcessUrls(urlsToImport)
      setInputValue(""); setIsOpen(false)
    } catch (error) {
      setErrorText(toErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" className={className} disabled={disabled} onClick={() => { setIsOpen(true); setErrorText(null) }}>
        <Link2 size={14} />
        Or add image URL
      </Button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Import Image URL</h3>
                <MutedText className="mt-1 text-xs">{allowMultiple ? "Paste one URL per line. All valid image URLs will be imported." : "Paste one or more URLs. The first valid URL will be imported."}</MutedText>
              </div>
              <button type="button" className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300" onClick={handleClose}>✕</button>
            </div>
            <textarea autoFocus className="min-h-[180px] w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100" placeholder={"https://example.com/a.jpg\nhttps://example.com/b.png"} value={inputValue} onChange={(event) => setInputValue(event.target.value)} />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Lines: {nonEmptyLineCount}</span><span>Valid URLs: {parsedUrls.length}</span>
              {!allowMultiple && parsedUrls.length > 1 ? <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">Only first URL will be used in Single Processor</span> : null}
            </div>
            {errorText ? <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-300">{errorText}</div> : null}
            <div className="mt-4 flex items-center justify-end gap-2">
              <SecondaryButton disabled={isSubmitting} onClick={handleClose}>Cancel</SecondaryButton>
              <Button type="button" variant="primary" disabled={isSubmitting} onClick={handleProcess}>{isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}{processLabel}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
