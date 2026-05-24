import React, { useMemo, useState } from "react"
import {
  AccordionCard,
  MutedText,
  Button,
  BaseDialog,
  Heading,
  SidebarCard,
  Shield
} from "@imify/ui"
import { useImifyNavigation } from "../shared/use-imify-navigation"
import { Bookmark, Sparkles, Plus, RotateCcw, X } from "lucide-react"
import { useBatchStore, type SavedSetupPreset } from "@imify/stores/stores/batch-store"
import { ProcessorPresetDetail } from "./processor-preset-detail"
import { PresetCard } from "./preset-card"

interface PresetSelectorProps {
  label?: string
  sublabel?: string
  icon?: React.ReactNode
  tooltipLabel?: string
  tooltipContent?: string
  theme?: "pink" | "blue" | "purple" | "amber" | "sky" | "orange"
  defaultPreset?: SavedSetupPreset
  formatFilter?: string[]
  activePresetId: string | null
  onSelect: (preset: SavedSetupPreset) => void
  onReset?: () => void
}

export function PresetSelector({
  label = "Select Preset",
  sublabel,
  icon = <Bookmark size={16} />,
  tooltipLabel,
  tooltipContent,
  theme = "blue",
  defaultPreset,
  formatFilter,
  activePresetId,
  onSelect,
  onReset
}: PresetSelectorProps) {
  const { presets, togglePinPreset } = useBatchStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<string>("all")

  const formats = useMemo(() => {
    const baseFormats = ["all", "png", "webp", "avif", "jxl", "jpg", "bmp", "ico", "tiff"]
    if (!formatFilter) return baseFormats

    // Include 'all' plus any format allowed by formatFilter
    return ["all", ...baseFormats.slice(1).filter(f => {
      const target = f === "jpg" ? "mozjpeg" : f
      return formatFilter.includes(target)
    })]
  }, [formatFilter])

  // Filter and sort presets by context "single" and optional format filter + dialog filter
  const sortedAvailablePresets = useMemo(() => {
    const list = presets.filter(p => {
      const contextMatch = p.context === "single"
      const propFormatMatch = !formatFilter || formatFilter.includes(p.config.targetFormat)

      let dialogFormatMatch = true
      if (selectedFormat !== "all") {
        const fmt = p.config.targetFormat === "mozjpeg" ? "jpg" : p.config.targetFormat
        dialogFormatMatch = fmt === selectedFormat
      }

      return contextMatch && propFormatMatch && dialogFormatMatch
    })

    return [...list].sort((a, b) => {
      const pinA = a.pinned ? 1 : 0
      const pinB = b.pinned ? 1 : 0
      if (pinA !== pinB) {
        return pinB - pinA
      }
      return b.updatedAt - a.updatedAt
    })
  }, [presets, formatFilter, selectedFormat])

  const activePreset = activePresetId
    ? presets.find(p => p.id === activePresetId)
    : (activePresetId === null && defaultPreset ? defaultPreset : null)

  const { openSingleProcessor } = useImifyNavigation()

  const handleCreatePreset = () => {
    openSingleProcessor()
  }

  const refreshPresets = async () => {
    // Manually trigger a rehydration of the presets list from storage.
    // This allows picking up new presets from other tabs without a full page reload.
    if ((useBatchStore as any).persist?.rehydrate) {
      await (useBatchStore as any).persist.rehydrate()
    }
  }

  return (
    <>
      <div className="space-y-2">
        <AccordionCard
          label={label}
          sublabel={sublabel || (activePreset ? `Active: ${activePreset.name}` : "No preset selected")}
          icon={icon}
          defaultOpen={true}
          colorTheme={theme}
          childrenClassName="p-3 space-y-3"
        >
          <div className="space-y-3" style={{ "--preset-color": activePreset?.highlightColor || "#3b82f6" } as React.CSSProperties}>
            <SidebarCard
              label={activePreset ? activePreset.name : "Choose a Preset..."}
              sublabel={activePreset ? `Format: ${activePreset.config.targetFormat.toUpperCase()}` : "No preset selected"}
              icon={<Bookmark size={14} />}
              theme={theme}
              onClick={() => setIsDialogOpen(true)}
              className="border-dashed"
              tooltipLabel={tooltipLabel}
              tooltipContent={tooltipContent}
            />

            {activePreset && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className={theme === "pink" ? "text-pink-500" : "text-blue-500"} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Configuration Details
                    </span>
                  </div>
                  {onReset && defaultPreset && activePresetId !== null && (
                    <button
                      onClick={onReset}
                      className="text-[10px] font-medium text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-0.5"
                    >
                      <RotateCcw size={10} />
                      Reset
                    </button>
                  )}
                </div>

                <ProcessorPresetDetail preset={activePreset} context="single" alwaysVibrant={true} />
              </div>
            )}
          </div>
        </AccordionCard>
      </div>

      <BaseDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <div className="flex flex-col h-[800px] max-h-[90vh]">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Bookmark className={theme === "pink" ? "text-pink-500" : "text-blue-500"} size={20} />
              <Heading className="text-lg whitespace-nowrap">{label}</Heading>
            </div>
            
            <button 
              onClick={() => setIsDialogOpen(false)} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0 -mr-2"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            {/* Format Filter Shield (Relocated to Content) */}
            <div className="flex justify-start">
              <Shield
                left="Filter"
                size="sm"
                leftBg="bg-slate-700 dark:bg-slate-800"
                leftColor="text-white"
                rightBg="bg-slate-100 dark:bg-slate-800"
                rightColor="text-slate-600 dark:text-slate-400"
                className="border border-slate-200 dark:border-slate-700"
                right={
                  <div className="flex items-center gap-1.5 h-full">
                    {formats.map((f, i) => (
                      <React.Fragment key={f}>
                        <button
                          type="button"
                          onClick={() => setSelectedFormat(f)}
                          className={`transition-colors hover:text-sky-500 py-1 ${selectedFormat === f ? "text-sky-600 dark:text-sky-400 font-extrabold" : ""}`}
                        >
                          {f.toUpperCase()}
                        </button>
                        {i < formats.length - 1 && <span className="opacity-30">•</span>}
                      </React.Fragment>
                    ))}
                  </div>
                }
              />
            </div>

            {sortedAvailablePresets.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {sortedAvailablePresets.map(preset => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    context="single"
                    isActive={preset.id === activePresetId}
                    showActions={false}
                    onSelect={() => {
                      onSelect(preset)
                      setIsDialogOpen(false)
                    }}
                    onTogglePin={() => togglePinPreset(preset.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Bookmark size={32} className="text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Presets Found</h3>
                <MutedText className="max-w-[280px] mb-6">
                  You haven't saved any Single Processor presets for the required formats ({formatFilter?.join(", ") || "any"}).
                </MutedText>
                <Button onClick={handleCreatePreset} variant="primary" className="gap-2">
                  <Plus size={16} />
                  Create Your First And Refresh
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {onReset && defaultPreset && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onReset()
                    setIsDialogOpen(false)
                  }}
                  className="gap-2 h-9"
                >
                  <RotateCcw size={14} />
                  Reset
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={refreshPresets}
                className="gap-2 h-9"
              >
                <RotateCcw size={14} className="scale-x-[-1]" />
                Refresh
              </Button>
            </div>
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)} className="h-9">
              Close
            </Button>
          </div>
        </div>
      </BaseDialog>
    </>
  )
}
