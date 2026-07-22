import React from "react";
import type {
  DiffAlignAnchor,
  DiffAlignMode,
  DiffComputeResult,
  DiffImageItem,
  DiffViewMode,
  MultiImageLayout2,
  MultiImageLayout3,
  MultiImageLayout4,
} from "./types";
import { DiffStatsBar } from "./diff-stats-bar";
import { ImageDropPair } from "./image-drop-pair";
import { PixelCompareWorkspace } from "./pixel-compare-workspace";
import { ViewerDiff } from "./viewer-diff";
import { ViewerShell } from "./viewer-shell";

export interface DiffcheckerWorkspaceProps {
  imageA: DiffImageItem | null;
  imageB: DiffImageItem | null;
  imageC?: DiffImageItem | null;
  imageD?: DiffImageItem | null;
  imageDataA: ImageData | null;
  imageDataB: ImageData | null;
  imageDataC?: ImageData | null;
  imageDataD?: ImageData | null;
  diffResult: DiffComputeResult | null;
  viewMode: DiffViewMode;
  alignAnchor?: DiffAlignAnchor;
  alignMode?: DiffAlignMode;
  splitPosition: number;
  overlayOpacity: number;
  isComputing: boolean;
  zoom: number;
  panX: number;
  panY: number;
  multiImageLayout2?: MultiImageLayout2;
  multiImageLayout3?: MultiImageLayout3;
  multiImageLayout4?: MultiImageLayout4;
  onLoadA: (files: File[]) => void;
  onLoadB: (files: File[]) => void;
  onLoadC?: (files: File[]) => void;
  onLoadD?: (files: File[]) => void;
  onClearA: () => void;
  onClearB: () => void;
  onClearC?: () => void;
  onClearD?: () => void;
  onSplitChange: (position: number) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (x: number, y: number) => void;
}

export function DiffcheckerWorkspace(props: DiffcheckerWorkspaceProps) {
  const activeImagesList = [
    props.imageA ? { label: "Image A", url: props.imageA.url } : null,
    props.imageB ? { label: "Image B", url: props.imageB.url } : null,
    props.imageC ? { label: "Image C", url: props.imageC.url } : null,
    props.imageD ? { label: "Image D", url: props.imageD.url } : null,
  ].filter((item): item is { label: string; url: string } => item !== null);

  const imageCount = activeImagesList.length;
  const isMultiImage = imageCount >= 3;
  const effectiveViewMode = isMultiImage ? "side_by_side" : props.viewMode;

  const displayDataA = props.diffResult?.alignedDataA ?? props.imageDataA;
  const displayDataB = props.diffResult?.alignedDataB ?? props.imageDataB;

  return (
    <div className="space-y-3">
      <ImageDropPair
        imageA={props.imageA}
        imageB={props.imageB}
        imageC={props.imageC ?? null}
        imageD={props.imageD ?? null}
        onLoadA={props.onLoadA}
        onLoadB={props.onLoadB}
        onLoadC={props.onLoadC}
        onLoadD={props.onLoadD}
        onClearA={props.onClearA}
        onClearB={props.onClearB}
        onClearC={props.onClearC}
        onClearD={props.onClearD}
      />
      {imageCount >= 2 ? (
        <>
          {(effectiveViewMode === "split" ||
            effectiveViewMode === "side_by_side" ||
            effectiveViewMode === "overlay") && (
            <PixelCompareWorkspace
              mode={effectiveViewMode}
              imageDataA={displayDataA}
              imageDataB={displayDataB}
              splitPosition={props.splitPosition}
              onSplitChange={props.onSplitChange}
              overlayOpacity={props.overlayOpacity}
              zoom={props.zoom}
              panX={props.panX}
              panY={props.panY}
              onZoomChange={props.onZoomChange}
              onPanChange={props.onPanChange}
              preferredMimeTypeA={props.imageA?.file.type}
              preferredMimeTypeB={props.imageB?.file.type}
              isProcessing={props.isComputing}
              multiImages={isMultiImage ? activeImagesList : undefined}
              alignAnchor={props.alignAnchor}
              alignMode={props.alignMode}
              multiImageLayout2={props.multiImageLayout2}
              multiImageLayout3={props.multiImageLayout3}
              multiImageLayout4={props.multiImageLayout4}
            />
          )}
          {effectiveViewMode === "difference" && !isMultiImage ? (
            <ViewerShell
              zoom={props.zoom}
              panX={props.panX}
              panY={props.panY}
              onZoomChange={props.onZoomChange}
              onPanChange={props.onPanChange}
            >
              {props.diffResult ? (
                <ViewerDiff
                  diffImageUrl={props.diffResult.diffImageUrl}
                  zoom={props.zoom}
                  panX={props.panX}
                  panY={props.panY}
                />
              ) : null}
            </ViewerShell>
          ) : null}
          {!isMultiImage ? (
            <DiffStatsBar
              stats={props.diffResult?.stats ?? null}
              isComputing={props.isComputing}
              diffWidth={props.diffResult?.width ?? 0}
              diffHeight={props.diffResult?.height ?? 0}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
