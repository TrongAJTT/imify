import { useMemo, useState } from "react"
import { Check, Code, Copy, Fingerprint, Hash, HelpCircle, Image, Shield } from "lucide-react"
import {
  buildAspectRatioCss,
  buildOptimizedDataUri,
  buildPaletteCssVariables,
  buildPictureTag,
  getMagicNumber,
  getMd5,
  getSha256,
  imageToBase64,
  toCssDataUri,
  type InspectorResult,
  type PaletteColor
} from "@imify/features/inspector"
import { InfoSection } from "./info-section"
import { Tooltip } from "@/options/components/tooltip"
import { INSPECTOR_TOOLTIPS } from "@/options/components/inspector/inspector-tooltips"

interface DeveloperActionsCardProps {
  bitmap: ImageBitmap
  mimeType: string
  thumbHash: string | null
  result: InspectorResult
  palette: PaletteColor[]
  file: File
}

function ActionButton({
  label,
  icon,
  tooltip,
  getValue
}: {
  label: string
  icon: React.ReactNode
  tooltip: string
  getValue: () => string | null | Promise<string | null>
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle")

  const handleCopy = async () => {
    try {
      const val = await getValue()
      if (!val) {
        setState("error")
        setTimeout(() => setState("idle"), 1500)
        return
      }
      await navigator.clipboard.writeText(val)
      setState("copied")
      setTimeout(() => setState("idle"), 1600)
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 1500)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors text-left"
    >
      <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">
        {state === "copied" ? <Check size={14} className="text-emerald-500" /> : icon}
      </span>
      <span className="flex-1 truncate">
        {state === "copied" ? "Copied!" : state === "error" ? "Failed" : label}
      </span>
      <Tooltip content={tooltip} variant="wide1">
        <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">
          <HelpCircle size={14} />
        </span>
      </Tooltip>
      {state === "idle" && <Copy size={12} className="text-slate-400 dark:text-slate-600 flex-shrink-0" />}
    </button>
  )
}

export function DeveloperActionsCard({
  bitmap,
  mimeType,
  thumbHash,
  result,
  palette,
  file
}: DeveloperActionsCardProps) {
  const baseName = useMemo(() => {
    const idx = file.name.lastIndexOf(".")
    return idx > 0 ? file.name.slice(0, idx) : file.name
  }, [file.name])

  const inspectionJson = useMemo(
    () =>
      JSON.stringify(
        {
          basic: result.basic,
          dimensions: result.dimensions,
          resolution: result.resolution,
          color: result.color,
          time: result.time,
          gps: result.gps,
          softwareTags: result.softwareTags,
          exifCount: result.exifEntries.length
        },
        null,
        2
      ),
    [result]
  )

  return (
    <InfoSection title="DEVELOPER TOOLS" icon={<Code size={13} />} defaultOpen={false}>
      <div className="space-y-3">
        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            UI / Frontend
          </div>
          <div className="space-y-2">
            <ActionButton
              label="Copy as Base64 Data URI"
              icon={<Code size={14} />}
              tooltip={INSPECTOR_TOOLTIPS.developerActions.copyBase64DataUri}
              getValue={() => imageToBase64(bitmap, mimeType)}
            />
            <ActionButton
              label="Copy as CSS Data URI"
              icon={<Code size={14} />}
              tooltip={INSPECTOR_TOOLTIPS.developerActions.copyCssDataUri}
              getValue={() => {
                const dataUri = imageToBase64(bitmap, mimeType)
                return dataUri ? toCssDataUri(dataUri) : null
              }}
            />
            {thumbHash && (
              <ActionButton
                label="Copy ThumbHash"
                icon={<Hash size={14} />}
                tooltip={INSPECTOR_TOOLTIPS.developerActions.copyThumbHash}
                getValue={() => thumbHash}
              />
            )}
            <ActionButton
              label={"Copy <picture> Tag"}
              icon={<Image size={14} />}
              tooltip={INSPECTOR_TOOLTIPS.developerActions.copyPictureTag}
              getValue={() => buildPictureTag(baseName, "Description")}
            />
            <ActionButton
              label="Copy CSS Aspect-Ratio"
              icon={<Code size={14} />}
              tooltip={INSPECTOR_TOOLTIPS.developerActions.copyCssAspectRatio}
              getValue={() => buildAspectRatioCss(result.dimensions.width, result.dimensions.height)}
            />
            <ActionButton
              label="Copy Palette as CSS Variables"
              icon={<Code size={14} />}
              tooltip={INSPECTOR_TOOLTIPS.developerActions.copyPaletteCssVariables}
              getValue={() => buildPaletteCssVariables(palette)}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            System / Security
          </div>
          <div className="space-y-2">
            <ActionButton
              label="Copy SHA-256 Hash"
              icon={<Fingerprint size={14} />}
              tooltip={INSPECTOR_TOOLTIPS.developerActions.copySha256Hash}
              getValue={async () => {
                const buffer = await file.arrayBuffer()
                return getSha256(buffer)
              }}
            />
            <ActionButton
              label="Copy MD5 Hash"
              icon={<Fingerprint size={14} />}
              tooltip={INSPECTOR_TOOLTIPS.developerActions.copyMd5Hash}
              getValue={async () => {
                const buffer = await file.arrayBuffer()
                return getMd5(buffer)
              }}
            />
            <ActionButton
              label="Copy Magic Number Signature"
              icon={<Shield size={14} />}
              tooltip={INSPECTOR_TOOLTIPS.developerActions.copyMagicNumberSignature}
              getValue={async () => {
                const buffer = await file.arrayBuffer()
                return getMagicNumber(buffer)
              }}
            />
            <ActionButton
              label="Copy Inspection JSON"
              icon={<Code size={14} />}
              tooltip={INSPECTOR_TOOLTIPS.developerActions.copyInspectionJson}
              getValue={() => inspectionJson}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Optimization
          </div>
          <div className="space-y-2">
            <ActionButton
              label="Copy Base64 (Optimized / Minified)"
              icon={<Code size={14} />}
              tooltip={INSPECTOR_TOOLTIPS.developerActions.copyOptimizedBase64}
              getValue={() => buildOptimizedDataUri(bitmap, mimeType)}
            />
          </div>
        </div>
      </div>
    </InfoSection>
  )
}

