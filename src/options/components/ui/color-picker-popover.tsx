import { useEffect, useMemo, useRef, useState } from "react"
import * as Popover from "@radix-ui/react-popover"
import { HexAlphaColorPicker, HexColorInput, HexColorPicker } from "react-colorful"

import { LabelText } from "@/options/components/ui/typography"

type ColorOutputMode = "rgba" | "hex"

interface ParsedRgba {
  r: number
  g: number
  b: number
  a: number
}

export interface ColorPickerPopoverProps {
  label: string
  value: string
  onChange: (value: string) => void
  enableAlpha?: boolean
  enableGradient?: boolean
  outputMode?: ColorOutputMode
  className?: string
}

type PickerTab = "solid" | "gradient"

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function clampAlpha(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function parseHexColor(hex: string): ParsedRgba | null {
  const normalized = hex.trim().replace("#", "")
  if (normalized.length === 3) {
    return {
      r: parseInt(normalized[0] + normalized[0], 16),
      g: parseInt(normalized[1] + normalized[1], 16),
      b: parseInt(normalized[2] + normalized[2], 16),
      a: 1
    }
  }
  if (normalized.length === 4) {
    return {
      r: parseInt(normalized[0] + normalized[0], 16),
      g: parseInt(normalized[1] + normalized[1], 16),
      b: parseInt(normalized[2] + normalized[2], 16),
      a: parseInt(normalized[3] + normalized[3], 16) / 255
    }
  }
  if (normalized.length === 6) {
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
      a: 1
    }
  }
  if (normalized.length === 8) {
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
      a: parseInt(normalized.slice(6, 8), 16) / 255
    }
  }
  return null
}

function parseRgbaColor(color: string): ParsedRgba | null {
  const match = color
    .trim()
    .match(/^rgba?\(\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*,\s*([+-]?\d+)(?:\s*,\s*([+-]?\d*\.?\d+))?\s*\)$/i)
  if (!match) return null
  return {
    r: clampByte(Number(match[1])),
    g: clampByte(Number(match[2])),
    b: clampByte(Number(match[3])),
    a: clampAlpha(match[4] ? Number(match[4]) : 1)
  }
}

function parseColor(value: string): ParsedRgba {
  return parseHexColor(value) || parseRgbaColor(value) || { r: 255, g: 255, b: 255, a: 1 }
}

function toHex2(channel: number): string {
  return clampByte(channel).toString(16).padStart(2, "0")
}

function toHex6(c: ParsedRgba): string {
  return `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}`
}

function toHex8(c: ParsedRgba): string {
  return `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}${toHex2(Math.round(clampAlpha(c.a) * 255))}`
}

function toRgbaString(c: ParsedRgba): string {
  return `rgba(${clampByte(c.r)}, ${clampByte(c.g)}, ${clampByte(c.b)}, ${clampAlpha(c.a).toFixed(2)})`
}

interface GradientStop {
  id: string
  color: string
  offset: number
}

interface ParsedGradient {
  angle: number
  stops: GradientStop[]
}

function parseGradient(value: string): ParsedGradient | null {
  const trimmed = value.trim()
  const match = trimmed.match(/^linear-gradient\(\s*([+-]?\d*\.?\d+)deg\s*,\s*(.+)\s*\)$/i)

  if (!match) {
    return null
  }

  const angle = Number(match[1])
  if (!Number.isFinite(angle)) {
    return null
  }

  const rawStops = match[2]
    .split(/,(?![^(]*\))/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (rawStops.length < 2) {
    return null
  }

  const parsedStops = rawStops.map((entry, index) => {
    const stopMatch = entry.match(/^(.*?)(?:\s+([+-]?\d*\.?\d+)%?)?$/)
    const colorPart = stopMatch?.[1]?.trim() || entry
    const fallbackOffset = (index / Math.max(1, rawStops.length - 1)) * 100
    const parsedOffset = Number(stopMatch?.[2])

    return {
      id: `gstop_${index}`,
      color: toHex6(parseColor(colorPart)),
      offset:
        stopMatch?.[2] && Number.isFinite(parsedOffset)
          ? Math.max(0, Math.min(100, parsedOffset))
          : fallbackOffset
    }
  })

  return {
    angle: Math.max(0, Math.min(360, Math.round(angle))),
    stops: parsedStops.sort((a, b) => a.offset - b.offset)
  }
}

function toGradientString(gradient: ParsedGradient): string {
  const stops = [...gradient.stops]
    .sort((a, b) => a.offset - b.offset)
    .map((stop) => `${stop.color} ${Math.round(stop.offset)}%`)
    .join(", ")
  return `linear-gradient(${gradient.angle}deg, ${stops})`
}

export function ColorPickerPopover({
  label,
  value,
  onChange,
  enableAlpha = false,
  enableGradient = true,
  outputMode = "hex",
  className
}: ColorPickerPopoverProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const gradientParsed = useMemo(() => parseGradient(value), [value])
  const [activeTab, setActiveTab] = useState<PickerTab>(
    enableGradient && gradientParsed ? "gradient" : "solid"
  )
  const [activeGradientStopId, setActiveGradientStopId] = useState<string>("")
  const gradientTrackRef = useRef<HTMLDivElement>(null)
  const draggingStopIdRef = useRef<string | null>(null)
  const parsed = useMemo(() => parseColor(value), [value])
  const pickerValue = enableAlpha ? toHex8(parsed) : toHex6(parsed)
  const swatchValue = toRgbaString(parsed)
  const gradientValue: ParsedGradient = gradientParsed ?? {
    angle: 135,
    stops: [
      { id: "gstop_0", color: "#000000", offset: 0 },
      { id: "gstop_1", color: "#ffffff", offset: 100 }
    ]
  }

  useEffect(() => {
    if (!enableGradient) {
      setActiveTab("solid")
      return
    }

    if (gradientParsed) {
      setActiveTab("gradient")
    }
  }, [enableGradient, gradientParsed])

  useEffect(() => {
    if (!enableGradient) {
      return
    }

    const hasActiveStop = gradientValue.stops.some((stop) => stop.id === activeGradientStopId)
    if (!hasActiveStop) {
      setActiveGradientStopId(gradientValue.stops[0]?.id ?? "")
    }
  }, [activeGradientStopId, enableGradient, gradientValue.stops])

  const emitColor = (nextHex: string) => {
    const nextParsed = parseHexColor(nextHex)
    if (!nextParsed) return
    if (!enableAlpha) {
      nextParsed.a = 1
    }
    onChange(outputMode === "rgba" ? toRgbaString(nextParsed) : enableAlpha ? toHex8(nextParsed) : toHex6(nextParsed))
  }

  const emitGradient = (next: ParsedGradient) => {
    onChange(toGradientString(next))
  }

  const selectedStop =
    gradientValue.stops.find((stop) => stop.id === activeGradientStopId) ?? gradientValue.stops[0]
  const gradientStopValue = selectedStop?.color ?? "#000000"

  const updateGradientStop = (stopId: string, patch: Partial<GradientStop>) => {
    emitGradient({
      ...gradientValue,
      stops: gradientValue.stops
        .map((stop) => (stop.id === stopId ? { ...stop, ...patch } : stop))
        .sort((a, b) => a.offset - b.offset)
    })
  }

  const getOffsetFromPointer = (clientX: number): number => {
    const track = gradientTrackRef.current
    if (!track) {
      return 0
    }

    const rect = track.getBoundingClientRect()
    if (rect.width <= 0) {
      return 0
    }

    const ratio = (clientX - rect.left) / rect.width
    return Math.max(0, Math.min(100, ratio * 100))
  }

  const addGradientStop = (offset: number) => {
    const sorted = [...gradientValue.stops].sort((a, b) => a.offset - b.offset)
    let nextColor = sorted[0]?.color ?? "#ffffff"
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const left = sorted[index]
      const right = sorted[index + 1]
      if (offset >= left.offset && offset <= right.offset) {
        const leftColor = parseColor(left.color)
        const rightColor = parseColor(right.color)
        const factor =
          right.offset === left.offset ? 0 : (offset - left.offset) / (right.offset - left.offset)
        const mixed = {
          r: leftColor.r + (rightColor.r - leftColor.r) * factor,
          g: leftColor.g + (rightColor.g - leftColor.g) * factor,
          b: leftColor.b + (rightColor.b - leftColor.b) * factor,
          a: 1
        }
        nextColor = toHex6(mixed)
        break
      }
    }

    const stopId = `gstop_${Date.now()}_${Math.round(offset)}`
    emitGradient({
      ...gradientValue,
      stops: [...gradientValue.stops, { id: stopId, color: nextColor, offset }].sort(
        (a, b) => a.offset - b.offset
      )
    })
    setActiveGradientStopId(stopId)
  }

  const removeActiveStop = () => {
    if (!selectedStop || gradientValue.stops.length <= 2) {
      return
    }

    const remaining = gradientValue.stops.filter((stop) => stop.id !== selectedStop.id)
    emitGradient({
      ...gradientValue,
      stops: remaining
    })
    setActiveGradientStopId(remaining[0]?.id ?? "")
  }

  return (
    <Popover.Root>
      <div className={`relative ${className ?? ""}`.trim()}>
        <div className="flex items-center justify-between gap-2">
          <LabelText className="text-xs">{label}</LabelText>
          <Popover.Trigger asChild>
            <button
              ref={triggerRef}
              type="button"
              className="h-7 w-7 rounded border border-slate-200 dark:border-slate-700 bg-transparent p-0.5 transition-all hover:shadow-sm"
              aria-label={`Pick ${label} color`}
            >
              <span
                className="block h-full w-full rounded-sm"
                style={
                  gradientParsed
                    ? { backgroundImage: toGradientString(gradientParsed) }
                    : { backgroundColor: swatchValue }
                }
              />
            </button>
          </Popover.Trigger>
        </div>

        <Popover.Portal>
          <Popover.Content
            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl p-3 z-[9999]"
            sideOffset={8}
            side="bottom"
            align="center"
            collisionPadding={12}
          >
            <div className="w-[200px]">
              {enableGradient ? (
                <div className="mb-2 grid grid-cols-2 rounded-md border border-slate-200 p-0.5 dark:border-slate-700">
                  <button
                    type="button"
                    className={`rounded px-2 py-1 text-[11px] font-semibold ${activeTab === "solid" ? "bg-sky-500 text-white" : "text-slate-600 dark:text-slate-300"}`}
                    onClick={() => setActiveTab("solid")}
                  >
                    Solid
                  </button>
                  <button
                    type="button"
                    className={`rounded px-2 py-1 text-[11px] font-semibold ${activeTab === "gradient" ? "bg-sky-500 text-white" : "text-slate-600 dark:text-slate-300"}`}
                    onClick={() => setActiveTab("gradient")}
                  >
                    Gradient
                  </button>
                </div>
              ) : null}

              {activeTab === "gradient" && enableGradient ? (
                <>
                  <HexColorPicker
                    color={gradientStopValue}
                    onChange={(nextHex) => selectedStop && updateGradientStop(selectedStop.id, { color: nextHex })}
                  />
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-6 rounded border border-slate-200 px-2 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
                        onClick={removeActiveStop}
                        disabled={gradientValue.stops.length <= 2}
                      >
                        Remove mark
                      </button>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Click bar to add mark
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <LabelText className="text-[11px]">Angle</LabelText>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        step={1}
                        value={gradientValue.angle}
                        onChange={(event) =>
                          emitGradient({ ...gradientValue, angle: Number(event.target.value) })
                        }
                        className="h-2 flex-1"
                      />
                      <span className="w-10 text-right text-[11px] text-slate-600 dark:text-slate-300">
                        {gradientValue.angle}°
                      </span>
                    </div>
                    <div
                      ref={gradientTrackRef}
                      className="relative h-8 cursor-crosshair rounded border border-slate-200 dark:border-slate-700"
                      onClick={(event) => {
                        event.stopPropagation()
                        addGradientStop(getOffsetFromPointer(event.clientX))
                      }}
                      style={{ backgroundImage: toGradientString(gradientValue) }}
                    >
                      {gradientValue.stops.map((stop) => (
                        <button
                          key={stop.id}
                          type="button"
                          className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${selectedStop?.id === stop.id ? "border-sky-500 ring-2 ring-sky-500/30" : "border-white"} shadow`}
                          style={{ left: `${stop.offset}%`, backgroundColor: stop.color }}
                          onClick={(event) => {
                            event.stopPropagation()
                            setActiveGradientStopId(stop.id)
                          }}
                          onPointerDown={(event) => {
                            event.stopPropagation()
                            draggingStopIdRef.current = stop.id
                            event.currentTarget.setPointerCapture(event.pointerId)
                          }}
                          onPointerMove={(event) => {
                            if (draggingStopIdRef.current !== stop.id) {
                              return
                            }
                            updateGradientStop(stop.id, {
                              offset: getOffsetFromPointer(event.clientX)
                            })
                          }}
                          onPointerUp={(event) => {
                            if (draggingStopIdRef.current === stop.id) {
                              draggingStopIdRef.current = null
                            }
                            event.currentTarget.releasePointerCapture(event.pointerId)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {enableAlpha ? (
                    <HexAlphaColorPicker color={pickerValue} onChange={emitColor} />
                  ) : (
                    <HexColorPicker color={pickerValue} onChange={emitColor} />
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <LabelText className="text-[11px]">Hex</LabelText>
                    <HexColorInput
                      color={pickerValue}
                      alpha={enableAlpha}
                      prefixed
                      onChange={emitColor}
                      className="w-[112px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-700 dark:text-slate-200 outline-none"
                    />
                    {enableAlpha ? (
                      <span className="min-w-[38px] text-right text-[11px] text-slate-500 dark:text-slate-400">
                        {Math.round(parsed.a * 100)}%
                      </span>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
  )
}
