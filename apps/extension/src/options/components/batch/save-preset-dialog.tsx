import React, { useState, useEffect } from "react"
import { Check, Save, X } from "lucide-react"
import { createPortal } from "react-dom"

import { Button } from "@imify/ui/ui/button"
import { useKeyPress } from "@/options/hooks/use-key-press"

interface SavePresetDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, color: string) => void
  defaultName: string
  highlightColors: string[]
  title?: string
}

export const SavePresetDialog: React.FC<SavePresetDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName,
  highlightColors,
  title = "Save Configuration Preset"
}) => {
  const [presetName, setPresetName] = useState(defaultName)
  const [presetColor, setPresetColor] = useState(highlightColors[0])

  useKeyPress("Escape", onClose, isOpen)

  useEffect(() => {
    if (isOpen) {
      setPresetName(defaultName)
    }
  }, [isOpen, defaultName])

  useEffect(() => {
    if (isOpen && !presetColor && highlightColors.length > 0) {
        setPresetColor(highlightColors[0])
    }
  }, [isOpen, presetColor, highlightColors])

  if (!isOpen) return null

  if (typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <button
            type="button"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Preset name
            <input
              autoFocus
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
              placeholder="e.g. Social Media Export"
              onKeyDown={(e) => {
                if (e.key === "Enter" && presetName.trim()) {
                  onSave(presetName, presetColor)
                }
              }}
            />
          </label>

          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">Highlight color</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {highlightColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPresetColor(color)}
                  className={`h-7 w-7 rounded-full border-2 transition-all hover:scale-110 ${
                    presetColor === color ? "border-slate-900 ring-2 ring-slate-900/20 dark:border-slate-100" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select highlight color ${color}`}
                >
                  {presetColor === color ? <Check size={12} className="mx-auto text-white drop-shadow-sm" /> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="px-4">
              Cancel
            </Button>
            <Button 
                size="sm" 
                onClick={() => onSave(presetName, presetColor)} 
                disabled={!presetName.trim()}
                className="gap-1.5 px-4"
            >
              <Save size={14} />
              Save Preset
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
