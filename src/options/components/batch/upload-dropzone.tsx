import { Upload } from "lucide-react"

interface BatchUploadDropzoneProps {
  onAppendFiles: (files: FileList | null) => void
}

export function BatchUploadDropzone({ onAppendFiles }: BatchUploadDropzoneProps) {
  return (
    <label
      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 px-4 py-10 text-center transition-colors group"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        onAppendFiles(event.dataTransfer.files)
      }}>
      <input
        className="hidden"
        multiple
        onChange={(event) => onAppendFiles(event.target.files)}
        type="file"
      />
      <div className="bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4 group-hover:-translate-y-1 transition-transform border border-slate-100 dark:border-slate-700/50">
        <Upload size={32} className="text-indigo-500/80 dark:text-indigo-400" />
      </div>
      <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Drop images here or click to browse</p>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Supports JPG, PNG, WebP, AVIF, JXL, BMP</p>
    </label>
  )
}
