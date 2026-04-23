import { useCallback, useEffect, useState } from "react"
import { Keyboard } from "lucide-react"

import { Button } from "./button"
import {
  formatShortcutBinding,
  keyboardEventToBinding,
  type ShortcutBinding,
} from "@imify/stores/shortcuts"

interface ShortcutBindingInputProps {
  value: ShortcutBinding | null
  onChange: (value: ShortcutBinding | null) => void
}

export function ShortcutBindingInput({ value, onChange }: ShortcutBindingInputProps) {
  const [isCapturing, setIsCapturing] = useState(false)

  const stopCapture = useCallback(() => {
    setIsCapturing(false)
  }, [])

  useEffect(() => {
    if (!isCapturing) return

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (event.key === "Escape") {
        stopCapture()
        return
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        onChange(null)
        stopCapture()
        return
      }

      const nextBinding = keyboardEventToBinding(event)
      if (!nextBinding) {
        return
      }

      onChange(nextBinding)
      stopCapture()
    }

    window.addEventListener("keydown", onKeyDown, { capture: true })
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true })
  }, [isCapturing, onChange, stopCapture])

  return (
    <div className="w-full">
      <Button
        type="button"
        size="sm"
        variant={isCapturing ? "primary" : "outline"}
        className="w-full min-w-0 justify-start"
        onClick={() => setIsCapturing((current) => !current)}
      >
        <Keyboard size={14} />
        {isCapturing ? "Press shortcut..." : formatShortcutBinding(value)}
      </Button>
    </div>
  )
}
