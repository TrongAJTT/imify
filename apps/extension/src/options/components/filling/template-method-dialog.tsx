import { useCallback, useEffect, useState } from "react"
import { Grid3x3, PenTool, Ruler, X } from "lucide-react"

import type { CanvasSizePreset, CanvasSizeUnit, FillingTemplate } from "@imify/features/filling/types"
import { generateId } from "@imify/features/filling/types"
import { templateStorage } from "@imify/features/filling/template-storage"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import { CanvasSizeDialog } from "@/options/components/filling/canvas-size-dialog"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { TextInput } from "@imify/ui/ui/text-input"
import { NumberInput } from "@imify/ui/ui/number-input"
import { SelectInput } from "@imify/ui/ui/select-input"
import { Button } from "@imify/ui/ui/button"
import { RadioCard } from "@imify/ui/ui/radio-card"
import { Subheading, MutedText } from "@imify/ui/ui/typography"

type CreationMethod = "manual" | "symmetric"

interface TemplateMethodDialogProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => Promise<void>
  initialWidth?: number
  initialHeight?: number
}

const UNIT_OPTIONS: Array<{ value: CanvasSizeUnit; label: string }> = [
  { value: "px", label: "Pixels" },
  { value: "in", label: "Inches" },
  { value: "cm", label: "Centimeters" },
  { value: "mm", label: "Millimeters" },
]

const DPI_DEFAULT = 300

function toPixels(value: number, unit: CanvasSizeUnit, dpi: number): number {
  switch (unit) {
    case "in":
      return Math.round(value * dpi)
    case "cm":
      return Math.round((value / 2.54) * dpi)
    case "mm":
      return Math.round((value / 25.4) * dpi)
    default:
      return Math.round(value)
  }
}

function fromPixels(px: number, unit: CanvasSizeUnit, dpi: number): number {
  switch (unit) {
    case "in":
      return Math.round((px / dpi) * 100) / 100
    case "cm":
      return Math.round(((px / dpi) * 2.54) * 100) / 100
    case "mm":
      return Math.round(((px / dpi) * 25.4) * 10) / 10
    default:
      return px
  }
}

export function TemplateMethodDialog({
  isOpen,
  onClose,
  onRefresh,
  initialWidth = 1920,
  initialHeight = 1080,
}: TemplateMethodDialogProps) {
  const [name, setName] = useState("")
  const [method, setMethod] = useState<CreationMethod>("manual")
  const [widthPx, setWidthPx] = useState(initialWidth)
  const [heightPx, setHeightPx] = useState(initialHeight)
  const [unit, setUnit] = useState<CanvasSizeUnit>("px")
  const [dpi, setDpi] = useState(DPI_DEFAULT)
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string | null>(null)
  const [presetDialogOpen, setPresetDialogOpen] = useState(false)

  const setFillingStep = useFillingStore((s) => s.setFillingStep)
  const setEditingTemplateId = useFillingStore((s) => s.setEditingTemplateId)

  const displayWidth = fromPixels(widthPx, unit, dpi)
  const displayHeight = fromPixels(heightPx, unit, dpi)

  const handleWidthChange = useCallback(
    (value: number) => {
      setWidthPx(toPixels(value, unit, dpi))
      setSelectedPresetLabel(null)
    },
    [dpi, unit]
  )

  const handleHeightChange = useCallback(
    (value: number) => {
      setHeightPx(toPixels(value, unit, dpi))
      setSelectedPresetLabel(null)
    },
    [dpi, unit]
  )

  const handleUnitChange = useCallback((value: string) => {
    setUnit(value as CanvasSizeUnit)
  }, [])

  const handlePresetConfirm = useCallback((preset: CanvasSizePreset) => {
    setWidthPx(preset.width)
    setHeightPx(preset.height)
    setSelectedPresetLabel(preset.label)
    setPresetDialogOpen(false)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setName("")
    setMethod("manual")
    setWidthPx(initialWidth)
    setHeightPx(initialHeight)
    setUnit("px")
    setDpi(DPI_DEFAULT)
    setSelectedPresetLabel(null)
    setPresetDialogOpen(false)
  }, [initialHeight, initialWidth, isOpen])

  const handleDialogClose = useCallback(() => {
    setPresetDialogOpen(false)
    onClose()
  }, [onClose])

  const handleCreate = useCallback(async () => {
    if (widthPx < 1 || heightPx < 1) {
      return
    }

    const templateName = name.trim() || "Untitled Template"
    const id = generateId("tmpl")
    const now = Date.now()

    const template: FillingTemplate = {
      id,
      name: templateName,
      canvasWidth: widthPx,
      canvasHeight: heightPx,
      layers: [],
      groups: [],
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      lastUsedAt: null,
      isPinned: false,
    }

    await templateStorage.save(template)
    await onRefresh()

    setEditingTemplateId(id)
    setFillingStep(method === "manual" ? "create_manual" : "create_symmetric")
    setName("")
    setSelectedPresetLabel(null)
    handleDialogClose()
  }, [
    handleDialogClose,
    heightPx,
    method,
    name,
    onRefresh,
    setEditingTemplateId,
    setFillingStep,
    widthPx,
  ])

  return (
    <>
      <BaseDialog isOpen={isOpen} onClose={handleDialogClose} contentClassName="rounded-xl w-[620px] max-w-[96vw]">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <Subheading>Create Template</Subheading>
          <button
            type="button"
            onClick={handleDialogClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="mb-5 space-y-4">
          <TextInput
            label="Template Name"
            value={name}
            onChange={setName}
            placeholder="e.g. My Photo Grid"
            autoFocus
          />

          <section className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Ruler size={14} className="text-sky-500" />
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Canvas Size</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setPresetDialogOpen(true)}
                className="h-8"
              >
                Popular Sizes
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
              <NumberInput
                label="Width"
                value={displayWidth}
                onChangeValue={handleWidthChange}
                min={1}
                max={unit === "px" ? 16384 : 9999}
                step={unit === "px" ? 1 : 0.1}
              />
              <NumberInput
                label="Height"
                value={displayHeight}
                onChangeValue={handleHeightChange}
                min={1}
                max={unit === "px" ? 16384 : 9999}
                step={unit === "px" ? 1 : 0.1}
              />
              <SelectInput
                label="Unit"
                value={unit}
                options={UNIT_OPTIONS}
                onChange={handleUnitChange}
              />
            </div>

            {unit !== "px" && (
              <div className="mb-3 w-36">
                <NumberInput
                  label="DPI"
                  value={dpi}
                  onChangeValue={setDpi}
                  min={72}
                  max={600}
                />
              </div>
            )}

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Final size: {widthPx} x {heightPx} px
            </div>

            {selectedPresetLabel && (
              <MutedText className="text-[11px] mt-1">
                Preset selected: {selectedPresetLabel}
              </MutedText>
            )}
          </section>

          <section>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Creation Method</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <RadioCard
                icon={<PenTool size={16} className="text-sky-500" />}
                title="Manual Editor"
                subtitle="Add and arrange shape layers by hand"
                value="manual"
                selectedValue={method}
                onChange={(value) => setMethod(value as CreationMethod)}
                className="h-full py-2.5"
              />
              <RadioCard
                icon={<Grid3x3 size={16} className="text-sky-500" />}
                title="Symmetric Generator"
                subtitle="Generate structured layouts with controls"
                value="symmetric"
                selectedValue={method}
                onChange={(value) => setMethod(value as CreationMethod)}
                className="h-full py-2.5"
              />
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={handleDialogClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreate}>
            Create
          </Button>
        </div>
      </div>
      </BaseDialog>

      <CanvasSizeDialog
        isOpen={presetDialogOpen}
        onClose={() => setPresetDialogOpen(false)}
        currentWidth={widthPx}
        currentHeight={heightPx}
        onConfirm={handlePresetConfirm}
      />
    </>
  )
}
