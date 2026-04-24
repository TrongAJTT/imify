import { useEffect, useMemo, useRef } from "react"
import { Frame, RefreshCcw } from "lucide-react"

import { PatternBoundaryControls } from "./pattern-boundary-controls"
import { AccordionCard } from "@imify/ui"
import { Button } from "@imify/ui"
import { usePatternStore } from "@imify/stores/stores/pattern-store"

export function PatternBoundaryAccordion() {
  const inboundBoundary = usePatternStore((state) => state.settings.inboundBoundary)
  const outboundBoundary = usePatternStore((state) => state.settings.outboundBoundary)
  const activeVisualBoundary = usePatternStore((state) => state.activeVisualBoundary)
  const setBoundary = usePatternStore((state) => state.setBoundary)
  const triggerVisualBoundary = usePatternStore((state) => state.triggerVisualBoundary)
  const hideVisualBoundary = usePatternStore((state) => state.hideVisualBoundary)
  const resetBoundariesToCanvas = usePatternStore((state) => state.resetBoundariesToCanvas)

  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeVisualBoundary) {
      return
    }

    const activeBoundary = activeVisualBoundary === "inbound" ? inboundBoundary : outboundBoundary
    if (!activeBoundary.enabled) {
      hideVisualBoundary()
    }
  }, [activeVisualBoundary, hideVisualBoundary, inboundBoundary, outboundBoundary])

  useEffect(() => {
    if (!activeVisualBoundary) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) {
        return
      }

      if (cardRef.current?.contains(target)) {
        return
      }

      const overlayRoot = document.querySelector('[data-pattern-boundary-overlay-root="true"]')
      if (overlayRoot?.contains(target)) {
        return
      }

      hideVisualBoundary()
    }

    document.addEventListener("pointerdown", handlePointerDown, true)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true)
    }
  }, [activeVisualBoundary, hideVisualBoundary])

  const sublabel = useMemo(() => {
    const inboundState = inboundBoundary.enabled ? "Inbound on" : "Inbound off"
    const outboundState = outboundBoundary.enabled ? "Outbound on" : "Outbound off"

    return `${inboundState} • ${outboundState}`
  }, [inboundBoundary.enabled, outboundBoundary.enabled])

  return (
    <div ref={cardRef}>
      <AccordionCard
        icon={<Frame size={16} />}
        label="Boundary"
        sublabel={sublabel}
        colorTheme="orange"
        defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={resetBoundariesToCanvas}>
              <RefreshCcw size={13} />
              Reset Boundaries
            </Button>
          </div>

          <PatternBoundaryControls
            target="inbound"
            label="Inbound Boundary"
            boundary={inboundBoundary}
            visualActive={activeVisualBoundary === "inbound"}
            onChange={(partial) => setBoundary("inbound", partial)}
            onShowVisual={triggerVisualBoundary}
          />

          <PatternBoundaryControls
            target="outbound"
            label="Outbound Boundary"
            boundary={outboundBoundary}
            visualActive={activeVisualBoundary === "outbound"}
            onChange={(partial) => setBoundary("outbound", partial)}
            onShowVisual={triggerVisualBoundary}
          />
        </div>
      </AccordionCard>
    </div>
  )
}


