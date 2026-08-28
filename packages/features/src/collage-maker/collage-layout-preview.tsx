import React, { memo } from "react";
import type { GridDesignParams, VectorLayer } from "../filling/types";
import { generateGridLayers } from "../filling/grid-designer/generator";
import { resolveLayerShapePoints } from "../filling/shape-generators";

const PREVIEW_CACHE = new Map<string, VectorLayer[]>();

export function getCachedLayoutLayers(
  presetId: string,
  params: GridDesignParams,
): VectorLayer[] {
  let layers = PREVIEW_CACHE.get(presetId);
  if (!layers) {
    layers = generateGridLayers(
      {
        ...params,
        outerPadding: 5,
        gapX: 6,
        gapY: 6,
      },
      100,
      100,
    );
    PREVIEW_CACHE.set(presetId, layers);
  }
  return layers;
}

export interface CollageLayoutPreviewProps {
  presetId: string;
  params: GridDesignParams;
  className?: string;
  fill?: string;
  rx?: number;
}

export const CollageLayoutPreview = memo(function CollageLayoutPreview({
  presetId,
  params,
  className = "",
  fill = "#cbd5e1",
  rx = 2,
}: CollageLayoutPreviewProps) {
  const layers = getCachedLayoutLayers(presetId, params);

  return (
    <svg viewBox="0 0 100 100" className={className}>
      {layers.map((layer) => {
        if (layer.shapeType === "rectangle") {
          return (
            <rect
              key={layer.id}
              x={layer.x}
              y={layer.y}
              width={layer.width}
              height={layer.height}
              rx={rx}
              fill={fill}
            />
          );
        }

        const pts = resolveLayerShapePoints(layer);
        const pointsStr = pts
          .map(
            (p) =>
              `${Math.round((layer.x + p.x) * 100) / 100},${Math.round((layer.y + p.y) * 100) / 100}`,
          )
          .join(" ");

        return <polygon key={layer.id} points={pointsStr} fill={fill} />;
      })}
    </svg>
  );
});
