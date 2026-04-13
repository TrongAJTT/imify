import { useCallback, useState } from "react"
import { Grid3x3, PenTool, X } from "lucide-react"

import type { FillingTemplate } from "@/features/filling/types"
import { generateId } from "@/features/filling/types"
import { templateStorage } from "@/features/filling/template-storage"
import { useFillingStore } from "@/options/stores/filling-store"
import { BaseDialog } from "@/options/components/ui/base-dialog"
import { TextInput } from "@/options/components/ui/text-input"
import { Button } from "@/options/components/ui/button"
import { Subheading, MutedText } from "@/options/components/ui/typography"

type CreationMethod = "manual" | "symmetric"

interface TemplateMethodDialogProps {
  isOpen: boolean
  onClose: () => void
  canvasWidth: number
  canvasHeight: number
  onRefresh: () => Promise<void>
}

export function TemplateMethodDialog({
  isOpen,
  onClose,
  canvasWidth,
  canvasHeight,
  onRefresh,
}: TemplateMethodDialogProps) {
  const [name, setName] = useState("")
  const [method, setMethod] = useState<CreationMethod>("manual")
  const setFillingStep = useFillingStore((s) => s.setFillingStep)
  const setEditingTemplateId = useFillingStore((s) => s.setEditingTemplateId)

  const handleCreate = useCallback(async () => {
    const templateName = name.trim() || "Untitled Template"
    const id = generateId("tmpl")
    const now = Date.now()

    const template: FillingTemplate = {
      id,
      name: templateName,
      canvasWidth,
      canvasHeight,
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
    onClose()
  }, [name, method, canvasWidth, canvasHeight, onRefresh, setEditingTemplateId, setFillingStep, onClose])

  return (
    <BaseDialog isOpen={isOpen} onClose={onClose} contentClassName="rounded-xl w-[460px] max-w-[95vw]">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <Subheading>Create Template</Subheading>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <MutedText className="mb-4 text-xs">
          Canvas: {canvasWidth} x {canvasHeight} px
        </MutedText>

        <div className="mb-5">
          <TextInput
            label="Template Name"
            value={name}
            onChange={setName}
            placeholder="e.g. My Photo Grid"
            autoFocus
          />
        </div>

        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Creation Method
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <MethodCard
            icon={<PenTool size={20} />}
            title="Manual Editor"
            description="Add and arrange shape layers on the canvas by hand"
            selected={method === "manual"}
            onClick={() => setMethod("manual")}
          />
          <MethodCard
            icon={<Grid3x3 size={20} />}
            title="Symmetric Generator"
            description="Generate parallelogram layouts using parametric controls"
            selected={method === "symmetric"}
            onClick={() => setMethod("symmetric")}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreate}>
            Create
          </Button>
        </div>
      </div>
    </BaseDialog>
  )
}

function MethodCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-all ${
        selected
          ? "border-sky-400 bg-sky-50 dark:border-sky-600 dark:bg-sky-500/10"
          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className={`${selected ? "text-sky-500" : "text-slate-400 dark:text-slate-500"}`}>
        {icon}
      </div>
      <div className={`text-xs font-semibold ${selected ? "text-sky-700 dark:text-sky-300" : "text-slate-700 dark:text-slate-300"}`}>
        {title}
      </div>
      <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
        {description}
      </div>
    </button>
  )
}
