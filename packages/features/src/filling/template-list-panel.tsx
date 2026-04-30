"use client"

import React, { useEffect, useState } from "react"
import { Download, Edit, Pin, PinOff, Plus, Trash2 } from "lucide-react"
import { Button, EmptyDropCard, SelectInput, Subheading, Tooltip } from "@imify/ui"
import { templateStorage } from "./template-storage"
import { exportToPsd } from "./psd-export"
import { createLayerFillState, DEFAULT_CANVAS_FILL_STATE, type FillingTemplate, type TemplateSortMode } from "./types"
import { resolveLayerShapePoints } from "./shape-generators"

const SORT_OPTIONS: Array<{ value: TemplateSortMode; label: string }> = [
  { value: "usage_count", label: "Most used" },
  { value: "recently_created", label: "Recently created" },
  { value: "recently_used", label: "Recently used" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
]

export function sortFillingTemplates(templates: FillingTemplate[], mode: TemplateSortMode): FillingTemplate[] {
  const pinned = templates.filter((template) => template.isPinned)
  const unpinned = templates.filter((template) => !template.isPinned)

  const sortFn = (list: FillingTemplate[]) => {
    switch (mode) {
      case "recently_created":
        return [...list].sort((a, b) => b.createdAt - a.createdAt)
      case "recently_used":
        return [...list].sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
      case "name_asc":
        return [...list].sort((a, b) => a.name.localeCompare(b.name))
      case "name_desc":
        return [...list].sort((a, b) => b.name.localeCompare(a.name))
      case "usage_count":
      default:
        return [...list].sort((a, b) => b.usageCount - a.usageCount)
    }
  }

  return [...sortFn(pinned), ...sortFn(unpinned)]
}

interface FillingTemplateListPanelProps {
  templates: FillingTemplate[]
  sortMode: TemplateSortMode
  onSortModeChange: (mode: TemplateSortMode) => void
  onCreate: () => void
  onOpenTemplate: (template: FillingTemplate) => void
  onEditTemplate: (template: FillingTemplate) => void
  onRefresh: () => Promise<void>
}

export function FillingTemplateListPanel({
  templates,
  sortMode,
  onSortModeChange,
  onCreate,
  onOpenTemplate,
  onEditTemplate,
  onRefresh,
}: FillingTemplateListPanelProps) {
  const sorted = sortFillingTemplates(templates, sortMode)

  if (templates.length === 0) {
    return (
      <EmptyDropCard
        icon={<Plus size={28} className="text-sky-500" />}
        iconWrapperClassName="bg-sky-100 dark:bg-sky-900/30 border-transparent shadow-none"
        title="No templates yet"
        subtitle="Create your first template to get started"
        onClick={onCreate}
      />
    )
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Subheading>Templates</Subheading>
        <Button type="button" variant="primary" size="sm" onClick={onCreate}>
          <Plus size={14} />
          New Template
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-48">
          <SelectInput
            label="Sort by"
            value={sortMode}
            options={SORT_OPTIONS}
            onChange={(value) => onSortModeChange(value as TemplateSortMode)}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((template) => (
          <FillingTemplateCard
            key={template.id}
            template={template}
            onOpenTemplate={onOpenTemplate}
            onEditTemplate={onEditTemplate}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </>
  )
}

function FillingTemplateCard({
  template,
  onOpenTemplate,
  onEditTemplate,
  onRefresh,
}: {
  template: FillingTemplate
  onOpenTemplate: (template: FillingTemplate) => void
  onEditTemplate: (template: FillingTemplate) => void
  onRefresh: () => Promise<void>
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isExportingPsd, setIsExportingPsd] = useState(false)

  useEffect(() => {
    let disposed = false
    let url: string | null = null

    void templateStorage.getThumbnail(template.id).then((blob) => {
      if (!blob || disposed) {
        return
      }
      url = URL.createObjectURL(blob)
      setThumbnailUrl(url)
    })

    return () => {
      disposed = true
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [template.id])

  const usageText = template.usageCount === 1 ? "1 export" : `${template.usageCount} exports`
  const lastUsedText = template.lastUsedAt ? `Last used ${formatRelativeTime(template.lastUsedAt)}` : "Never used"
  const handleExportPsd = async () => {
    if (isExportingPsd) {
      return
    }

    setIsExportingPsd(true)

    try {
      const layerFillStates = template.layers.map((layer) => createLayerFillState(layer.id))
      const blob = await exportToPsd(template, layerFillStates, DEFAULT_CANVAS_FILL_STATE, new Map())
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = `${toSafeFileName(template.name)}.psd`
      link.click()
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error("Failed to export template PSD", error)
      window.alert("Failed to export PSD for this template.")
    } finally {
      setIsExportingPsd(false)
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <button type="button" onClick={() => onOpenTemplate(template)} className="w-full text-left">
        <div className="flex aspect-video items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={template.name} className="h-full w-full object-contain" />
          ) : (
            <TemplatePreviewSvg template={template} />
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center gap-1.5">
            {template.isPinned && <Pin size={12} className="shrink-0 text-sky-500" />}
            <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{template.name}</h3>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            {template.canvasWidth} x {template.canvasHeight} · {template.layers.length} layer{template.layers.length !== 1 ? "s" : ""}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {usageText} · {lastUsedText}
          </p>
        </div>
      </button>

      <div className="absolute right-2 top-2 translate-y-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white/90 px-1 py-1 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90">
          <ActionIconButton title="Edit template" icon={<Edit size={13} />} onClick={() => onEditTemplate(template)} />
          <ActionIconButton
            title={isExportingPsd ? "Exporting PSD..." : "Export template as PSD"}
            icon={<Download size={13} />}
            onClick={() => void handleExportPsd()}
            disabled={isExportingPsd}
          />
          <ActionIconButton
            title={template.isPinned ? "Unpin template" : "Pin template"}
            icon={template.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
            onClick={() => {
              void templateStorage.togglePin(template.id).then(onRefresh)
            }}
          />
          <ActionIconButton
            title="Delete template"
            icon={<Trash2 size={13} />}
            destructive
            onClick={() => {
              if (!window.confirm(`Delete template "${template.name}"? This action cannot be undone.`)) {
                return
              }
              void templateStorage.remove(template.id).then(onRefresh)
            }}
          />
        </div>
      </div>
    </div>
  )
}

function ActionIconButton({
  icon,
  title,
  onClick,
  destructive = false,
  disabled = false,
}: {
  icon: React.ReactNode
  title: string
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}) {
  return (
    <Tooltip content={title}>
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation()
          if (disabled) {
            return
          }
          onClick()
        }}
        className={`rounded p-1.5 transition-colors ${
          destructive
            ? "text-red-600 hover:bg-red-50/90 dark:text-red-400 dark:hover:bg-red-500/20"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {icon}
      </button>
    </Tooltip>
  )
}

function TemplatePreviewSvg({ template }: { template: FillingTemplate }) {
  const scaleX = 240 / template.canvasWidth
  const scaleY = 135 / template.canvasHeight
  const scale = Math.min(scaleX, scaleY) * 0.85
  const originX = (240 - template.canvasWidth * scale) / 2
  const originY = (135 - template.canvasHeight * scale) / 2

  return (
    <svg width="240" height="135" viewBox="0 0 240 135" className="text-slate-300 dark:text-slate-600">
      <rect
        x={originX}
        y={originY}
        width={template.canvasWidth * scale}
        height={template.canvasHeight * scale}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="4 2"
        rx="2"
      />
      {template.layers.slice(0, 12).map((layer) => (
        <polygon
          key={layer.id}
          points={resolveLayerShapePoints(layer)
            .map((point) => `${originX + (layer.x + point.x) * scale},${originY + (layer.y + point.y) * scale}`)
            .join(" ")}
          fill="currentColor"
          opacity={0.3}
          transform={
            layer.rotation !== 0
              ? `rotate(${layer.rotation} ${originX + (layer.x + layer.width / 2) * scale} ${originY + (layer.y + layer.height / 2) * scale})`
              : undefined
          }
        />
      ))}
    </svg>
  )
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function toSafeFileName(value: string): string {
  const safe = value.trim().replace(/[\\/:*?"<>|]+/g, "_")
  return safe.length > 0 ? safe : "filling-template"
}

