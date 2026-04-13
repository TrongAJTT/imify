import { useCallback, useEffect, useState } from "react"
import { Edit, MoreVertical, Pin, PinOff, Trash2 } from "lucide-react"

import type { FillingTemplate } from "@/features/filling/types"
import { templateStorage } from "@/features/filling/template-storage"
import { useFillingStore } from "@/options/stores/filling-store"

interface TemplateCardProps {
  template: FillingTemplate
  onRefresh: () => Promise<void>
}

export function TemplateCard({ template, onRefresh }: TemplateCardProps) {
  const setFillingStep = useFillingStore((s) => s.setFillingStep)
  const setActiveTemplateId = useFillingStore((s) => s.setActiveTemplateId)
  const setEditingTemplateId = useFillingStore((s) => s.setEditingTemplateId)
  const initFillStatesForTemplate = useFillingStore((s) => s.initFillStatesForTemplate)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

  useEffect(() => {
    let revoked = false
    templateStorage.getThumbnail(template.id).then((blob) => {
      if (blob && !revoked) {
        setThumbnailUrl(URL.createObjectURL(blob))
      }
    })
    return () => {
      revoked = true
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl)
    }
  }, [template.id])

  const handleSelect = useCallback(() => {
    setActiveTemplateId(template.id)
    initFillStatesForTemplate(template)
    setFillingStep("fill")
  }, [template, setActiveTemplateId, initFillStatesForTemplate, setFillingStep])

  const handleEdit = useCallback(() => {
    setEditingTemplateId(template.id)
    setFillingStep("create_manual")
    setMenuOpen(false)
  }, [template.id, setEditingTemplateId, setFillingStep])

  const handleTogglePin = useCallback(async () => {
    await templateStorage.togglePin(template.id)
    await onRefresh()
    setMenuOpen(false)
  }, [template.id, onRefresh])

  const handleDelete = useCallback(async () => {
    await templateStorage.remove(template.id)
    useFillingStore.getState().removeTemplate(template.id)
    await onRefresh()
    setConfirmDelete(false)
    setMenuOpen(false)
  }, [template.id, onRefresh])

  const usageText = template.usageCount === 1 ? "1 export" : `${template.usageCount} exports`
  const lastUsedText = template.lastUsedAt
    ? `Last used ${formatRelativeTime(template.lastUsedAt)}`
    : "Never used"

  return (
    <div className="group relative rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={handleSelect}
        className="w-full text-left"
      >
        <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={template.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <TemplatePreviewSvg template={template} />
          )}
        </div>

        <div className="p-3">
          <div className="flex items-center gap-1.5">
            {template.isPinned && (
              <Pin size={12} className="text-sky-500 shrink-0" />
            )}
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {template.name}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {template.canvasWidth} x {template.canvasHeight} &middot; {template.layers.length} layer{template.layers.length !== 1 ? "s" : ""}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {usageText} &middot; {lastUsedText}
          </p>
        </div>
      </button>

      {/* Action menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
          className="p-1.5 rounded-md bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <MoreVertical size={14} className="text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setMenuOpen(false); setConfirmDelete(false) }} />
          <div className="absolute top-10 right-2 z-50 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1">
            <MenuButton icon={<Edit size={13} />} label="Edit template" onClick={handleEdit} />
            <MenuButton
              icon={template.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
              label={template.isPinned ? "Unpin" : "Pin to top"}
              onClick={handleTogglePin}
            />
            {!confirmDelete ? (
              <MenuButton
                icon={<Trash2 size={13} />}
                label="Delete"
                onClick={() => setConfirmDelete(true)}
                destructive
              />
            ) : (
              <MenuButton
                icon={<Trash2 size={13} />}
                label="Confirm delete?"
                onClick={handleDelete}
                destructive
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function MenuButton({
  icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
        destructive
          ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function TemplatePreviewSvg({ template }: { template: FillingTemplate }) {
  const scaleX = 240 / template.canvasWidth
  const scaleY = 135 / template.canvasHeight
  const scale = Math.min(scaleX, scaleY) * 0.85

  return (
    <svg width="240" height="135" viewBox="0 0 240 135" className="text-slate-300 dark:text-slate-600">
      <rect
        x={(240 - template.canvasWidth * scale) / 2}
        y={(135 - template.canvasHeight * scale) / 2}
        width={template.canvasWidth * scale}
        height={template.canvasHeight * scale}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="4 2"
        rx="2"
      />
      {template.layers.slice(0, 12).map((layer) => (
        <rect
          key={layer.id}
          x={(240 - template.canvasWidth * scale) / 2 + layer.x * scale}
          y={(135 - template.canvasHeight * scale) / 2 + layer.y * scale}
          width={layer.width * scale}
          height={layer.height * scale}
          fill="currentColor"
          opacity={0.3}
          rx="1"
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
