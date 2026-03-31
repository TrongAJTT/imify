import { Search } from "lucide-react"
import { Heading, MutedText } from "@/options/components/ui/typography"

interface InspectorDropZoneProps {
  onLoadFile: (file: File) => void
}

export function InspectorDropZone({ onLoadFile }: InspectorDropZoneProps) {
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.type.startsWith("image/")) {
      onLoadFile(file)
    }
  }

  return (
    <label
      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 px-4 py-16 text-center transition-colors group"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        type="file"
      />
      <div className="bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4 group-hover:-translate-y-1 transition-transform border border-slate-100 dark:border-slate-700/50 p-4">
        <Search size={32} className="text-indigo-500/80 dark:text-indigo-400" />
      </div>
      <Heading className="text-base font-semibold">
        Drop an image here or click to browse
      </Heading>
      <MutedText className="mt-1.5">
        Supports JPG, PNG, WebP, AVIF, and more
      </MutedText>
    </label>
  )
}
