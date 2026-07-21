import React, { useEffect, useMemo, useRef } from "react";
import {
  Frame,
  RefreshCcw,
  SquaresExclude,
  SquaresIntersect,
} from "lucide-react";

import { PatternBoundaryControls } from "./pattern-boundary-controls";
import { AccordionCard } from "@imify/ui";
import { Button } from "@imify/ui";
import { usePatternStore } from "@imify/stores/stores/pattern-store";
import { useTranslation } from "@imify/i18n";

export function PatternBoundaryAccordion() {
  const { t } = useTranslation("pattern");
  const inboundBoundary = usePatternStore(
    (state) => state.settings.inboundBoundary,
  );
  const outboundBoundary = usePatternStore(
    (state) => state.settings.outboundBoundary,
  );
  const activeVisualBoundary = usePatternStore(
    (state) => state.activeVisualBoundary,
  );
  const setBoundary = usePatternStore((state) => state.setBoundary);
  const triggerVisualBoundary = usePatternStore(
    (state) => state.triggerVisualBoundary,
  );
  const hideVisualBoundary = usePatternStore(
    (state) => state.hideVisualBoundary,
  );
  const resetBoundariesToCanvas = usePatternStore(
    (state) => state.resetBoundariesToCanvas,
  );

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeVisualBoundary) {
      return;
    }

    const activeBoundary =
      activeVisualBoundary === "inbound" ? inboundBoundary : outboundBoundary;
    if (!activeBoundary.enabled) {
      hideVisualBoundary();
    }
  }, [
    activeVisualBoundary,
    hideVisualBoundary,
    inboundBoundary,
    outboundBoundary,
  ]);

  useEffect(() => {
    if (!activeVisualBoundary) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (cardRef.current?.contains(target)) {
        return;
      }

      const overlayRoot = document.querySelector(
        '[data-pattern-boundary-overlay-root="true"]',
      );
      if (overlayRoot?.contains(target)) {
        return;
      }

      hideVisualBoundary();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [activeVisualBoundary, hideVisualBoundary]);

  const sublabel = useMemo(() => {
    const inboundState = inboundBoundary.enabled
      ? t("boundaryFields.inboundStateOn")
      : t("boundaryFields.inboundStateOff");
    const outboundState = outboundBoundary.enabled
      ? t("boundaryFields.outboundStateOn")
      : t("boundaryFields.outboundStateOff");

    return `${inboundState} • ${outboundState}`;
  }, [inboundBoundary.enabled, outboundBoundary.enabled, t]);

  return (
    <div ref={cardRef}>
      <AccordionCard
        icon={<Frame size={16} />}
        label={t("preset.boundary")}
        sublabel={sublabel}
        colorTheme="orange"
        defaultOpen={true}
      >
        <div className="space-y-3">
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={resetBoundariesToCanvas}
            >
              <RefreshCcw size={13} />
              {t("boundaryFields.resetBoundaries")}
            </Button>
          </div>

          <PatternBoundaryControls
            target="inbound"
            icon={<SquaresIntersect size={14} />}
            label={t("boundaryFields.inboundLabel")}
            boundary={inboundBoundary}
            visualActive={activeVisualBoundary === "inbound"}
            onChange={(partial) => setBoundary("inbound", partial)}
            onShowVisual={triggerVisualBoundary}
          />

          <PatternBoundaryControls
            target="outbound"
            icon={<SquaresExclude size={14} />}
            label={t("boundaryFields.outboundLabel")}
            boundary={outboundBoundary}
            visualActive={activeVisualBoundary === "outbound"}
            onChange={(partial) => setBoundary("outbound", partial)}
            onShowVisual={triggerVisualBoundary}
          />
        </div>
      </AccordionCard>
    </div>
  );
}
