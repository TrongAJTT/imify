import { useEffect, useRef, useState } from "react"
import { Link2, RotateCcw, Unlink2 } from "lucide-react"

import { Tooltip } from "@/options/components/tooltip"
import { NumberInput } from "@/options/components/ui/number-input"
import { RadioCard } from "@/options/components/ui/radio-card"
import { LabelText } from "@/options/components/ui/typography"

const ASPECT_RATIO_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "original", label: "Original" },
  { value: "1:1", label: "1:1" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
  { value: "4:5", label: "4:5" },
  { value: "5:4", label: "5:4" },
  { value: "3:4", label: "3:4" },
  { value: "4:3", label: "4:3" },
  { value: "2:3", label: "2:3" },
  { value: "3:2", label: "3:2" },
  { value: "5:7", label: "5:7" },
  { value: "6:5", label: "6:5" },
  { value: "1:2", label: "1:2" },
  { value: "2:1", label: "2:1" }
] as const

const RATIO_EPSILON = 0.0025

function parseAspectRatio(value: string): number | null {
  const matched = /^(\d+)\s*:\s*(\d+)$/.exec(value)
  if (!matched) {
    return null
  }

  const width = Number(matched[1])
  const height = Number(matched[2])

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null
  }

  return width / height
}

function ratioFromDimensions(width: number, height: number): number | null {
  if (width <= 0 || height <= 0) {
    return null
  }

  return width / height
}

function isSameRatio(a: number | null, b: number | null): boolean {
  if (!a || !b) {
    return false
  }

  return Math.abs(a - b) <= RATIO_EPSILON
}

function toAspectRatioLabel(width: number, height: number): string {
  if (width <= 0 || height <= 0) {
    return "16:9"
  }

  const gcd = (a: number, b: number): number => {
    if (!b) {
      return a
    }

    return gcd(b, a % b)
  }

  const safeWidth = Math.max(1, Math.round(width))
  const safeHeight = Math.max(1, Math.round(height))
  const divisor = gcd(safeWidth, safeHeight)

  return `${Math.round(safeWidth / divisor)}:${Math.round(safeHeight / divisor)}`
}

export function SmartResizeModule({
  width,
  height,
  disabled,
  fitMode,
  containBackground,
  onWidthChange,
  onHeightChange,
  onAspectModeChange,
  onAspectRatioChange,
  onSizeAnchorChange,
  onFitModeChange,
  onContainBackgroundChange,
  originalWidth,
  originalHeight,
  lockSignal
}: {
  width: number
  height: number
  disabled?: boolean
  fitMode: "fill" | "cover" | "contain"
  containBackground: string
  onWidthChange: (value: number) => void
  onHeightChange: (value: number) => void
  onAspectModeChange: (value: "free" | "original" | "fixed") => void
  onAspectRatioChange: (value: string) => void
  onSizeAnchorChange: (value: "width" | "height") => void
  onFitModeChange: (value: "fill" | "cover" | "contain") => void
  onContainBackgroundChange: (value: string) => void
  originalWidth?: number
  originalHeight?: number
  lockSignal?: number
}) {
  const initialWidthRef = useRef(Math.max(1, Math.round(originalWidth ?? width)))
  const initialHeightRef = useRef(Math.max(1, Math.round(originalHeight ?? height)))
  const lastLockSignalRef = useRef<number | undefined>(lockSignal)

  const [isRatioLocked, setIsRatioLocked] = useState(false)
  const [lockedRatio, setLockedRatio] = useState<number | null>(null)

  const originalRatio = ratioFromDimensions(initialWidthRef.current, initialHeightRef.current)

  useEffect(() => {
    if (typeof originalWidth !== "number" || typeof originalHeight !== "number") {
      return
    }

    initialWidthRef.current = Math.max(1, Math.round(originalWidth))
    initialHeightRef.current = Math.max(1, Math.round(originalHeight))
  }, [originalHeight, originalWidth])

  useEffect(() => {
    if (typeof lockSignal !== "number") {
      return
    }

    if (lockSignal === lastLockSignalRef.current) {
      return
    }

    lastLockSignalRef.current = lockSignal

    const ratio =
      ratioFromDimensions(initialWidthRef.current, initialHeightRef.current) ??
      ratioFromDimensions(width, height)

    if (!ratio) {
      return
    }

    setIsRatioLocked(true)
    setLockedRatio(ratio)
    onAspectModeChange("original")
    onAspectRatioChange(toAspectRatioLabel(initialWidthRef.current, initialHeightRef.current))
  }, [height, lockSignal, onAspectModeChange, onAspectRatioChange, width])

  const resolveAspectSelectByRatio = (ratio: number | null): { value: string; mode: "free" | "original" | "fixed" } => {
    if (!ratio) {
      return { value: "free", mode: "free" }
    }

    if (isSameRatio(ratio, originalRatio)) {
      return { value: "original", mode: "original" }
    }

    for (const option of ASPECT_RATIO_OPTIONS) {
      if (option.value === "free" || option.value === "original") {
        continue
      }

      const parsed = parseAspectRatio(option.value)
      if (isSameRatio(parsed, ratio)) {
        return { value: option.value, mode: "fixed" }
      }
    }

    return { value: "free", mode: "free" }
  }

  const applyAspectStateFromDimensions = (nextWidth: number, nextHeight: number): void => {
    const detected = resolveAspectSelectByRatio(ratioFromDimensions(nextWidth, nextHeight))
    onAspectModeChange(detected.mode)

    if (detected.mode === "fixed") {
      onAspectRatioChange(detected.value)
    }
  }

  const selectedAspectSelect = resolveAspectSelectByRatio(ratioFromDimensions(width, height)).value
  const isFitModeEnabled = !isSameRatio(
    ratioFromDimensions(width, height),
    ratioFromDimensions(initialWidthRef.current, initialHeightRef.current)
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-1">
        <NumberInput
          label="Width"
          disabled={disabled}
          min={1}
          onChangeValue={(val) => {
            const next = Math.max(1, val || 1)
            onSizeAnchorChange("width")
            onWidthChange(next)

            if (isRatioLocked && lockedRatio) {
              const nextHeight = Math.max(1, Math.round(next / lockedRatio))
              onHeightChange(nextHeight)
              applyAspectStateFromDimensions(next, nextHeight)
              return
            }

            applyAspectStateFromDimensions(next, height)
          }}
          value={width}
        />

        <Tooltip content={isRatioLocked ? "Unlock ratio" : "Lock current ratio"} variant="nowrap">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (isRatioLocked) {
                setIsRatioLocked(false)
                setLockedRatio(null)
                return
              }

              const ratio = ratioFromDimensions(width, height)
              setIsRatioLocked(true)
              setLockedRatio(ratio)
              applyAspectStateFromDimensions(width, height)
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
            {isRatioLocked ? <Link2 size={18} /> : <Unlink2 size={18} />}
          </button>
        </Tooltip>

        <NumberInput
          label="Height"
          disabled={disabled}
          min={1}
          onChangeValue={(val) => {
            const next = Math.max(1, val || 1)
            onSizeAnchorChange("height")
            onHeightChange(next)

            if (isRatioLocked && lockedRatio) {
              const nextWidth = Math.max(1, Math.round(next * lockedRatio))
              onWidthChange(nextWidth)
              applyAspectStateFromDimensions(nextWidth, next)
              return
            }

            applyAspectStateFromDimensions(width, next)
          }}
          value={height}
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="min-w-0 flex-1 text-xs font-medium">
          <LabelText>Ratio</LabelText>
          <select
            className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            disabled={disabled}
            onChange={(event) => {
              const nextValue = event.target.value

              if (nextValue === "free") {
                setIsRatioLocked(false)
                setLockedRatio(null)
                onAspectModeChange("free")
                return
              }

              if (nextValue === "original") {
                const ratio = originalRatio ?? ratioFromDimensions(width, height)
                if (!ratio) {
                  return
                }

                const nextHeight = Math.max(1, Math.round(width / ratio))
                onSizeAnchorChange("width")
                onHeightChange(nextHeight)
                setIsRatioLocked(true)
                setLockedRatio(ratio)
                applyAspectStateFromDimensions(width, nextHeight)
                return
              }

              const ratio = parseAspectRatio(nextValue)
              if (!ratio) {
                return
              }

              const nextHeight = Math.max(1, Math.round(width / ratio))
              onSizeAnchorChange("width")
              onHeightChange(nextHeight)
              setIsRatioLocked(true)
              setLockedRatio(ratio)
              applyAspectStateFromDimensions(width, nextHeight)
            }}
            value={selectedAspectSelect}>
            {ASPECT_RATIO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onWidthChange(initialWidthRef.current)
            onHeightChange(initialHeightRef.current)
            onAspectModeChange("original")
            onSizeAnchorChange("width")
            setIsRatioLocked(false)
            setLockedRatio(null)
          }}
          className="mt-5 inline-flex h-9 items-center gap-1 rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          title="Reset to original size">
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      <div className="space-y-2">
        <LabelText>Fit mode</LabelText>
        <div className="space-y-2">
          <RadioCard
            title="Fill"
            subtitle="Stretch to exact size"
            value="fill"
            selectedValue={fitMode}
            onChange={(value) => onFitModeChange(value as "fill" | "cover" | "contain")}
            disabled={disabled || !isFitModeEnabled}
            tooltip="May distort image when target ratio differs from source ratio."
          />
          <RadioCard
            title="Cover"
            subtitle="Keep ratio, crop overflow"
            value="cover"
            selectedValue={fitMode}
            onChange={(value) => onFitModeChange(value as "fill" | "cover" | "contain")}
            disabled={disabled || !isFitModeEnabled}
            tooltip="Fills the target frame completely by center-cropping extra edges."
          />
          <RadioCard
            title="Contain"
            subtitle="Keep ratio, add padding"
            value="contain"
            selectedValue={fitMode}
            onChange={(value) => onFitModeChange(value as "fill" | "cover" | "contain")}
            disabled={disabled || !isFitModeEnabled}
            tooltip="Fits inside target frame and leaves letterboxing area when needed."
            rightSlot={
              <input
                type="color"
                aria-label="Contain background color"
                disabled={disabled || !isFitModeEnabled || fitMode !== "contain"}
                value={containBackground}
                onChange={(event) => onContainBackgroundChange(event.target.value)}
                className="h-7 w-9 cursor-pointer rounded border border-slate-300 bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
              />
            }
          />
        </div>
      </div>
    </div>
  )
}
