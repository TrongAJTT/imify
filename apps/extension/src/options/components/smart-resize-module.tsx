import {
  ASPECT_RATIO_OPTIONS,
  isSameRatio,
  parseAspectRatio,
  ratioFromDimensions,
  toAspectRatioLabel
} from "@imify/features/shared/use-aspect-ratio"
import { useTranslation } from "@imify/i18n"
import { Button } from "@imify/ui/index"
import { ColorPickerPopover } from "@imify/ui/ui/color-picker-popover"
import { NumberInput } from "@imify/ui/ui/number-input"
import { RadioCard } from "@imify/ui/ui/radio-card"
import { SelectInput } from "@imify/ui/ui/select-input"
import { Tooltip } from "@imify/ui/ui/tooltip"
import { LabelText } from "@imify/ui/ui/typography"
import {
  Crop,
  Link2,
  Maximize2,
  Minimize,
  RotateCcw,
  Unlink2
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

export function SmartResizeModule({
  width,
  height,
  aspectMode,
  aspectRatio,
  forceFreeAspect,
  hideRatioControls,
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
  aspectMode: "free" | "original" | "fixed"
  aspectRatio: string
  forceFreeAspect?: boolean
  hideRatioControls?: boolean
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
  const { t } = useTranslation(["processor", "common"])
  const initialWidthRef = useRef(
    Math.max(1, Math.round(originalWidth ?? width))
  )
  const initialHeightRef = useRef(
    Math.max(1, Math.round(originalHeight ?? height))
  )
  const lastLockSignalRef = useRef<number | undefined>(lockSignal)

  const isFreeOnlyMode = Boolean(forceFreeAspect)
  const [isRatioLocked, setIsRatioLocked] = useState(aspectMode !== "free")
  const [lockedRatio, setLockedRatio] = useState<number | null>(
    aspectMode === "original"
      ? ratioFromDimensions(initialWidthRef.current, initialHeightRef.current)
      : aspectMode === "fixed"
        ? parseAspectRatio(aspectRatio)
        : null
  )

  const originalRatio = ratioFromDimensions(
    initialWidthRef.current,
    initialHeightRef.current
  )

  useEffect(() => {
    if (
      typeof originalWidth !== "number" ||
      typeof originalHeight !== "number"
    ) {
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
    onAspectRatioChange(
      toAspectRatioLabel(initialWidthRef.current, initialHeightRef.current)
    )
  }, [height, lockSignal, onAspectModeChange, onAspectRatioChange, width])

  useEffect(() => {
    if (isFreeOnlyMode) {
      setIsRatioLocked(false)
      setLockedRatio(null)
      if (aspectMode !== "free") {
        onAspectModeChange("free")
      }
      return
    }

    if (aspectMode === "free") {
      setIsRatioLocked(false)
      setLockedRatio(null)
      return
    }

    if (aspectMode === "original") {
      const ratio = originalRatio ?? ratioFromDimensions(width, height)
      setIsRatioLocked(Boolean(ratio))
      setLockedRatio(ratio)
      return
    }

    const ratio =
      parseAspectRatio(aspectRatio) ?? ratioFromDimensions(width, height)
    setIsRatioLocked(Boolean(ratio))
    setLockedRatio(ratio)
  }, [
    aspectMode,
    aspectRatio,
    isFreeOnlyMode,
    onAspectModeChange,
    originalRatio,
    width,
    height
  ])

  const selectedAspectSelect = (() => {
    if (aspectMode === "free") {
      return "free"
    }

    if (aspectMode === "original") {
      return "original"
    }

    const parsedCurrent = parseAspectRatio(aspectRatio)
    if (!parsedCurrent) {
      return "free"
    }

    for (const option of ASPECT_RATIO_OPTIONS) {
      if (option.value === "free" || option.value === "original") {
        continue
      }

      if (isSameRatio(parseAspectRatio(option.value), parsedCurrent)) {
        return option.value
      }
    }

    return "free"
  })()

  const isFitModeEnabled = isFreeOnlyMode
    ? true
    : !isSameRatio(
        ratioFromDimensions(width, height),
        ratioFromDimensions(initialWidthRef.current, initialHeightRef.current)
      )

  return (
    <div className="space-y-3">
      <div
        className={`grid items-end gap-1 ${hideRatioControls ? "grid-cols-2" : "grid-cols-[1fr_auto_1fr]"}`}>
        <NumberInput
          label="Width"
          disabled={disabled}
          min={1}
          onChangeValue={(val) => {
            const next = Math.max(1, val || 1)
            onSizeAnchorChange("width")
            onWidthChange(next)

            if (!isFreeOnlyMode && isRatioLocked && lockedRatio) {
              const nextHeight = Math.max(1, Math.round(next / lockedRatio))
              onHeightChange(nextHeight)
            }
          }}
          value={width}
        />

        {!hideRatioControls ? (
          <Tooltip
            content={
              isRatioLocked
                ? t("tooltipUnlockRatio")
                : t("tooltipLockCurrentRatio")
            }
            variant="nowrap">
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (isRatioLocked) {
                  setIsRatioLocked(false)
                  setLockedRatio(null)
                  onAspectModeChange("free")
                  return
                }

                const ratio = ratioFromDimensions(width, height)
                if (!ratio) {
                  return
                }

                setIsRatioLocked(true)
                setLockedRatio(ratio)

                if (isSameRatio(ratio, originalRatio)) {
                  onAspectModeChange("original")
                  onAspectRatioChange(
                    toAspectRatioLabel(
                      initialWidthRef.current,
                      initialHeightRef.current
                    )
                  )
                  return
                }

                onAspectModeChange("fixed")
                onAspectRatioChange(toAspectRatioLabel(width, height))
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700">
              {isRatioLocked ? <Link2 size={18} /> : <Unlink2 size={18} />}
            </button>
          </Tooltip>
        ) : null}

        <NumberInput
          label="Height"
          disabled={disabled}
          min={1}
          onChangeValue={(val) => {
            const next = Math.max(1, val || 1)
            onSizeAnchorChange("height")
            onHeightChange(next)

            if (!isFreeOnlyMode && isRatioLocked && lockedRatio) {
              const nextWidth = Math.max(1, Math.round(next * lockedRatio))
              onWidthChange(nextWidth)
            }
          }}
          value={height}
        />
      </div>

      {!hideRatioControls ? (
        <div className="flex items-center gap-2">
          <SelectInput
            label="Ratio"
            className="w-full flex-1"
            value={selectedAspectSelect}
            disabled={disabled}
            options={ASPECT_RATIO_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label
            }))}
            onChange={(nextValue) => {
              if (nextValue === "free") {
                setIsRatioLocked(false)
                setLockedRatio(null)
                onAspectModeChange("free")
                return
              }

              if (nextValue === "original") {
                const ratio =
                  originalRatio ?? ratioFromDimensions(width, height)
                if (!ratio) {
                  return
                }

                const nextHeight = Math.max(1, Math.round(width / ratio))
                onSizeAnchorChange("width")
                onHeightChange(nextHeight)
                setIsRatioLocked(true)
                setLockedRatio(ratio)
                onAspectModeChange("original")
                onAspectRatioChange(
                  toAspectRatioLabel(
                    initialWidthRef.current,
                    initialHeightRef.current
                  )
                )
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
              onAspectModeChange("fixed")
              onAspectRatioChange(nextValue)
            }}
          />

          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => {
              onWidthChange(initialWidthRef.current)
              onHeightChange(initialHeightRef.current)
              onAspectModeChange("original")
              onSizeAnchorChange("width")
              setIsRatioLocked(false)
              setLockedRatio(null)
            }}
            className="mt-5 inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Reset to original size">
            <RotateCcw size={12} />
            {t("common:reset")}
          </Button>
        </div>
      ) : null}

      <div className="space-y-2">
        <LabelText>Fit mode</LabelText>
        <div className="space-y-2">
          <RadioCard
            icon={<Maximize2 size={14} />}
            title="Fill"
            subtitle="Stretch to exact size"
            value="fill"
            selectedValue={fitMode}
            onChange={(value) =>
              onFitModeChange(value as "fill" | "cover" | "contain")
            }
            disabled={disabled || !isFitModeEnabled}
            tooltipContent={t("tooltipFitModeFill")}
          />
          <RadioCard
            icon={<Crop size={14} />}
            title="Cover"
            subtitle="Keep ratio, crop overflow"
            value="cover"
            selectedValue={fitMode}
            onChange={(value) =>
              onFitModeChange(value as "fill" | "cover" | "contain")
            }
            disabled={disabled || !isFitModeEnabled}
            tooltipContent={t("tooltipFitModeCover")}
          />
          <RadioCard
            icon={<Minimize size={14} />}
            title="Contain"
            subtitle="Keep ratio, add padding"
            value="contain"
            selectedValue={fitMode}
            onChange={(value) =>
              onFitModeChange(value as "fill" | "cover" | "contain")
            }
            disabled={disabled || !isFitModeEnabled}
            tooltipContent={t("tooltipFitModeContain")}
            rightSlot={
              <ColorPickerPopover
                label=""
                value={containBackground}
                onChange={onContainBackgroundChange}
                outputMode="hex"
                enableAlpha={false}
                className={
                  disabled || !isFitModeEnabled || fitMode !== "contain"
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            }
          />
        </div>
      </div>
    </div>
  )
}
