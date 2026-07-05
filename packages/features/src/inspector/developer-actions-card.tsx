import React, { useMemo, useState } from "react"
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
} from "./index"
import { InfoSection } from "./info-section"
import { Tooltip } from "@imify/ui"
import { useTranslation } from "@imify/i18n"

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
  const { t } = useTranslation("inspector")
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
        {state === "copied" ? t("copied") : state === "error" ? t("failed") : label}
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
  const { t } = useTranslation("inspector")
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
    <InfoSection title={t("developerTools")} icon={<Code size={13} />} defaultOpen={true}>
      <div className="space-y-3">
        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t("uiFrontend")}
          </div>
          <div className="space-y-2">
            <ActionButton
              label={t("copyBase64DataUri")}
              icon={<Code size={14} />}
              tooltip={t("tooltips.copyBase64DataUri")}
              getValue={() => imageToBase64(bitmap, mimeType)}
            />
            <ActionButton
              label={t("copyCssDataUri")}
              icon={<Code size={14} />}
              tooltip={t("tooltips.copyCssDataUri")}
              getValue={() => {
                const dataUri = imageToBase64(bitmap, mimeType)
                return dataUri ? toCssDataUri(dataUri) : null
              }}
            />
            {thumbHash && (
              <ActionButton
                label={t("copyThumbHash")}
                icon={<Hash size={14} />}
                tooltip={t("tooltips.copyThumbHash")}
                getValue={() => thumbHash}
              />
            )}
            <ActionButton
              label={t("copyPictureTag")}
              icon={<Image size={14} />}
              tooltip={t("tooltips.copyPictureTag")}
              getValue={() => buildPictureTag(baseName, "Description")}
            />
            <ActionButton
              label={t("copyCssAspectRatio")}
              icon={<Code size={14} />}
              tooltip={t("tooltips.copyCssAspectRatio")}
              getValue={() => buildAspectRatioCss(result.dimensions.width, result.dimensions.height)}
            />
            <ActionButton
              label={t("copyPaletteCssVariables")}
              icon={<Code size={14} />}
              tooltip={t("tooltips.copyPaletteCssVariables")}
              getValue={() => buildPaletteCssVariables(palette)}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t("systemSecurity")}
          </div>
          <div className="space-y-2">
            <ActionButton
              label={t("copySha256Hash")}
              icon={<Fingerprint size={14} />}
              tooltip={t("tooltips.copySha256Hash")}
              getValue={async () => {
                const buffer = await file.arrayBuffer()
                return getSha256(buffer)
              }}
            />
            <ActionButton
              label={t("copyMd5Hash")}
              icon={<Fingerprint size={14} />}
              tooltip={t("tooltips.copyMd5Hash")}
              getValue={async () => {
                const buffer = await file.arrayBuffer()
                return getMd5(buffer)
              }}
            />
            <ActionButton
              label={t("copyMagicNumberSignature")}
              icon={<Shield size={14} />}
              tooltip={t("tooltips.copyMagicNumberSignature")}
              getValue={async () => {
                const buffer = await file.arrayBuffer()
                return getMagicNumber(buffer)
              }}
            />
            <ActionButton
              label={t("copyInspectionJson")}
              icon={<Code size={14} />}
              tooltip={t("tooltips.copyInspectionJson")}
              getValue={() => inspectionJson}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t("optimization")}
          </div>
          <div className="space-y-2">
            <ActionButton
              label={t("copyOptimizedBase64")}
              icon={<Code size={14} />}
              tooltip={t("tooltips.copyOptimizedBase64")}
              getValue={() => buildOptimizedDataUri(bitmap, mimeType)}
            />
          </div>
        </div>
      </div>
    </InfoSection>
  )
}

