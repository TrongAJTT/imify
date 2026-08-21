import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ClipboardPaste,
  ImagePlus,
  Layers,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Type,
  X,
} from "lucide-react";

import type {
  FillingTemplate,
  ImageTransform,
  LayerFillState,
  TextLayer,
  VectorLayer,
} from "@imify/features/filling/types";
import {
  DEFAULT_IMAGE_TRANSFORM,
  DEFAULT_TEXT_LAYER_CONFIG,
} from "@imify/features/filling/types";
import { regenerateLayerShapePoints } from "@imify/features/filling/shape-generators";
import {
  buildFillRuntimeItems,
  type FillRuntimeItem,
} from "@imify/features/filling/fill/runtime-items";
import { FillTransformControls } from "@imify/features/filling/fill/transform-controls";
import { useShortcutActions } from "@imify/features/filling/use-shortcut-actions";
import { useShortcutPreferences } from "@imify/stores/use-shortcut-preferences";
import { useFillingStore } from "@imify/stores/stores/filling-store";
import {
  useFillUiStore,
  type FillCustomizationTab,
} from "@imify/stores/stores/fill-ui-store";
import { AccordionCard } from "@imify/ui/ui/accordion-card";
import { Button } from "@imify/ui/ui/button";
import { ColorPickerPopover } from "@imify/ui/ui/color-picker-popover";
import { NumberInput } from "@imify/ui/ui/number-input";
import { TextInput } from "@imify/ui/ui/text-input";
import { Tooltip } from "@imify/ui/ui/tooltip";
import {
  SHORTCUT_DEFINITION_MAP,
  type ShortcutActionId,
} from "@imify/stores/shortcuts";
import { useTranslation } from "@imify/i18n";
import {
  CaptionConfigSections,
  type CaptionConfigData,
} from "../../shared/caption-config-sections";
import {
  COMMON_IMAGE_ACCEPT,
  getFirstCommonImageFileFromDataTransfer,
  hasFileDragPayload,
  isCommonImageFile,
} from "../../shared/image-file-utils";

interface FillLayerCustomizationAccordionProps {
  template: FillingTemplate;
}

interface LayerTransformBase {
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
}

const TAB_SHORTCUT_ACTION: Record<FillCustomizationTab, ShortcutActionId> = {
  image: "fill.customization.tab_image",
  border: "fill.customization.tab_border",
  layer: "fill.customization.tab_layer",
};

function safeRevokeObjectUrl(value: string | null | undefined) {
  if (!value || !value.startsWith("blob:")) return;
  URL.revokeObjectURL(value);
}

function clampSize(value: number): number {
  return Math.max(1, Math.round(value));
}

export function FillLayerCustomizationAccordion({
  template,
}: FillLayerCustomizationAccordionProps) {
  const { t } = useTranslation("filling");

  const selectedLayerId = useFillingStore((s) => s.selectedLayerId);
  const setSelectedLayerId = useFillingStore((s) => s.setSelectedLayerId);
  const layerFillStates = useFillingStore((s) => s.layerFillStates);
  const canvasFillState = useFillingStore((s) => s.canvasFillState);
  const updateLayerFillState = useFillingStore((s) => s.updateLayerFillState);

  const activeCustomizationTab = useFillUiStore(
    (s) => s.activeCustomizationTab,
  );
  const setActiveCustomizationTab = useFillUiStore(
    (s) => s.setActiveCustomizationTab,
  );
  const groupRuntimeTransforms = useFillUiStore(
    (s) => s.groupRuntimeTransforms,
  );
  const updateGroupRuntimeTransform = useFillUiStore(
    (s) => s.updateGroupRuntimeTransform,
  );
  const removeGroupRuntimeTransform = useFillUiStore(
    (s) => s.removeGroupRuntimeTransform,
  );
  const { getShortcutLabel } = useShortcutPreferences();
  const sessionTemplate = useFillUiStore((s) => s.sessionTemplate);
  const updateSessionTemplate = useFillUiStore((s) => s.updateSessionTemplate);
  const hiddenLayerIds = useFillUiStore((s) => s.hiddenLayerIds);
  const hideLayerInFill = useFillUiStore((s) => s.hideLayerInFill);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const layerTransformBaseRef = useRef<Map<string, LayerTransformBase>>(
    new Map(),
  );
  const [isDragOverImageDropZone, setIsDragOverImageDropZone] = useState(false);

  const activeTemplate = useMemo(() => {
    if (sessionTemplate && sessionTemplate.id === template.id) {
      return sessionTemplate;
    }

    return template;
  }, [sessionTemplate, template]);

  const hiddenLayerIdSet = useMemo(
    () => new Set(hiddenLayerIds),
    [hiddenLayerIds],
  );
  const runtimeItems = useMemo(
    () => buildFillRuntimeItems(activeTemplate, hiddenLayerIdSet),
    [
      activeTemplate.layers,
      activeTemplate.groups,
      activeTemplate.textLayers,
      hiddenLayerIdSet,
    ],
  );
  const selectedRuntimeItem = useMemo<FillRuntimeItem | null>(
    () => runtimeItems.find((item) => item.id === selectedLayerId) ?? null,
    [runtimeItems, selectedLayerId],
  );
  const selectedLayer =
    selectedRuntimeItem?.kind === "layer" ? selectedRuntimeItem.layer : null;
  const selectedTextLayer =
    selectedRuntimeItem?.kind === "text" ? selectedRuntimeItem.textLayer : null;
  const selectedGroupItem =
    selectedRuntimeItem?.kind === "group" ? selectedRuntimeItem : null;

  const isTextLayer = selectedRuntimeItem?.kind === "text";

  const TAB_ITEMS: Array<{
    id: FillCustomizationTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "image",
      label: isTextLayer
        ? t("fill.tabText", { defaultValue: "Văn bản" })
        : t("fill.tabImage"),
      icon: isTextLayer ? <Type size={14} /> : <ImagePlus size={14} />,
    },
    { id: "border", label: t("fill.tabBorder"), icon: <Palette size={14} /> },
    { id: "layer", label: t("fill.tabLayer"), icon: <Layers size={14} /> },
  ];

  const TAB_INFO_TEXT: Record<FillCustomizationTab, string> = {
    image: isTextLayer
      ? t("fill.tabTextDesc", {
          defaultValue:
            "Tùy chỉnh nội dung, phông chữ, khung nền và vị trí văn bản.",
        })
      : t("fill.tabImageDesc"),
    border: t("fill.tabBorderDesc"),
    layer: t("fill.tabLayerDesc"),
  };

  const selectedGroupTransform = useMemo<ImageTransform | null>(() => {
    if (!selectedGroupItem) {
      return null;
    }

    return (
      groupRuntimeTransforms[selectedGroupItem.id] ?? {
        ...DEFAULT_IMAGE_TRANSFORM,
      }
    );
  }, [groupRuntimeTransforms, selectedGroupItem]);

  const selectedFillState = useMemo(
    () =>
      layerFillStates.find(
        (state) => state.layerId === selectedRuntimeItem?.id,
      ),
    [layerFillStates, selectedRuntimeItem?.id],
  );

  const textConfig: CaptionConfigData = useMemo(() => {
    if (!selectedTextLayer) return {};
    return {
      content: selectedTextLayer.content ?? selectedTextLayer.name,
      fontFamily:
        selectedTextLayer.fontFamily ?? DEFAULT_TEXT_LAYER_CONFIG.fontFamily,
      fontSize:
        selectedTextLayer.fontSize ?? DEFAULT_TEXT_LAYER_CONFIG.fontSize,
      textColor:
        selectedTextLayer.textColor ?? DEFAULT_TEXT_LAYER_CONFIG.textColor,
      paddingV:
        selectedTextLayer.paddingV ?? DEFAULT_TEXT_LAYER_CONFIG.paddingV,
      paddingH:
        selectedTextLayer.paddingH ?? DEFAULT_TEXT_LAYER_CONFIG.paddingH,
      paddingLinked:
        selectedTextLayer.paddingLinked ??
        DEFAULT_TEXT_LAYER_CONFIG.paddingLinked,
      containerColor:
        selectedTextLayer.containerColor ??
        DEFAULT_TEXT_LAYER_CONFIG.containerColor,
      containerOpacity:
        selectedTextLayer.containerOpacity ??
        DEFAULT_TEXT_LAYER_CONFIG.containerOpacity,
      borderRadius:
        selectedTextLayer.borderRadius ??
        DEFAULT_TEXT_LAYER_CONFIG.borderRadius,
      position:
        (selectedTextLayer.position as any) ??
        DEFAULT_TEXT_LAYER_CONFIG.position,
      alignment:
        selectedTextLayer.alignment ?? DEFAULT_TEXT_LAYER_CONFIG.alignment,
      rotate180:
        selectedTextLayer.rotate180 ?? DEFAULT_TEXT_LAYER_CONFIG.rotate180,
      offsetX: selectedTextLayer.offsetX ?? DEFAULT_TEXT_LAYER_CONFIG.offsetX,
      offsetY: selectedTextLayer.offsetY ?? DEFAULT_TEXT_LAYER_CONFIG.offsetY,
    };
  }, [selectedTextLayer]);

  const handleTextLayerConfigChange = useCallback(
    (patch: Partial<CaptionConfigData>) => {
      if (!selectedTextLayer) return;
      const targetId = selectedTextLayer.id;
      updateSessionTemplate((prev) => {
        if (!prev) return prev;
        const updated = (prev.textLayers ?? []).map((tl) => {
          if (tl.id !== targetId) return tl;
          return {
            ...tl,
            ...patch,
            name: patch.content !== undefined ? patch.content : tl.name,
          };
        });
        return {
          ...prev,
          textLayers: updated,
          updatedAt: Date.now(),
        };
      });
    },
    [selectedTextLayer, updateSessionTemplate],
  );

  const textPositionOptions = useMemo(
    () => [
      {
        value: "top",
        label: t("captionFields.posTop", { defaultValue: "Trên" }),
      },
      {
        value: "center",
        label: t("captionFields.posCenter", { defaultValue: "Giữa" }),
      },
      {
        value: "bottom",
        label: t("captionFields.posBottom", { defaultValue: "Dưới" }),
      },
    ],
    [t],
  );

  useShortcutActions([
    {
      actionId: "fill.customization.tab_image",
      handler: () => setActiveCustomizationTab("image"),
    },
    {
      actionId: "fill.customization.tab_border",
      handler: () => setActiveCustomizationTab("border"),
    },
    {
      actionId: "fill.customization.tab_layer",
      handler: () => setActiveCustomizationTab("layer"),
    },
    {
      actionId: "fill.customization.clear_image",
      handler: () => handleClearImage(),
      enabled: Boolean(selectedRuntimeItem && selectedFillState?.imageUrl),
    },
  ]);

  const getLayerTransformBase = useCallback(
    (layer: VectorLayer | TextLayer): LayerTransformBase => {
      const existing = layerTransformBaseRef.current.get(layer.id);
      if (existing) {
        return existing;
      }

      const base: LayerTransformBase = {
        x: layer.x,
        y: layer.y,
        rotation: layer.rotation,
        width: clampSize(layer.width),
        height: clampSize(layer.height),
      };
      layerTransformBaseRef.current.set(layer.id, base);
      return base;
    },
    [],
  );

  const selectedLayerTransform = useMemo<ImageTransform | null>(() => {
    if (!selectedLayer) return null;

    const base = getLayerTransformBase(selectedLayer);
    return {
      x: Math.round((selectedLayer.x - base.x) * 100) / 100,
      y: Math.round((selectedLayer.y - base.y) * 100) / 100,
      rotation:
        Math.round((selectedLayer.rotation - base.rotation) * 100) / 100,
      scaleX: Math.max(0.01, selectedLayer.width / Math.max(1, base.width)),
      scaleY: Math.max(0.01, selectedLayer.height / Math.max(1, base.height)),
    };
  }, [selectedLayer, getLayerTransformBase]);

  const selectedTextLayerTransform = useMemo<ImageTransform | null>(() => {
    if (!selectedTextLayer) return null;

    const base = getLayerTransformBase(selectedTextLayer);
    return {
      x: Math.round((selectedTextLayer.x - base.x) * 100) / 100,
      y: Math.round((selectedTextLayer.y - base.y) * 100) / 100,
      rotation:
        Math.round((selectedTextLayer.rotation - base.rotation) * 100) / 100,
      scaleX: Math.max(0.01, selectedTextLayer.width / Math.max(1, base.width)),
      scaleY: Math.max(
        0.01,
        selectedTextLayer.height / Math.max(1, base.height),
      ),
    };
  }, [selectedTextLayer, getLayerTransformBase]);

  const updateSelectedLayerState = useCallback(
    (partial: Partial<LayerFillState>) => {
      if (!selectedLayerId) return;
      updateLayerFillState(selectedLayerId, partial);
    },
    [selectedLayerId, updateLayerFillState],
  );

  const updateSelectedTemplateLayer = useCallback(
    (partial: Partial<VectorLayer>) => {
      if (!selectedLayer) return;

      let nextSelectedLayer: VectorLayer = { ...selectedLayer, ...partial };

      if (
        partial.width !== undefined ||
        partial.height !== undefined ||
        partial.shapeType !== undefined
      ) {
        nextSelectedLayer = {
          ...nextSelectedLayer,
          points: regenerateLayerShapePoints(
            nextSelectedLayer,
            nextSelectedLayer.width,
            nextSelectedLayer.height,
          ),
        };
      }

      const nextTemplate: FillingTemplate = {
        ...activeTemplate,
        layers: activeTemplate.layers.map((layer) =>
          layer.id === selectedLayer.id ? nextSelectedLayer : layer,
        ),
        updatedAt: Date.now(),
      };

      updateSessionTemplate(() => nextTemplate);
    },
    [activeTemplate, selectedLayer, updateSessionTemplate],
  );

  const handleImageTransformChange = useCallback(
    (partial: Partial<ImageTransform>) => {
      if (!selectedFillState) return;
      updateSelectedLayerState({
        imageTransform: { ...selectedFillState.imageTransform, ...partial },
      });
    },
    [selectedFillState, updateSelectedLayerState],
  );

  const handleLayerTransformChange = useCallback(
    (partial: Partial<ImageTransform>) => {
      if (selectedGroupItem && selectedGroupTransform) {
        updateGroupRuntimeTransform(selectedGroupItem.id, {
          x: partial.x ?? selectedGroupTransform.x,
          y: partial.y ?? selectedGroupTransform.y,
          rotation: partial.rotation ?? selectedGroupTransform.rotation,
          scaleX: partial.scaleX ?? selectedGroupTransform.scaleX,
          scaleY: partial.scaleY ?? selectedGroupTransform.scaleY,
        });
        return;
      }

      if (selectedTextLayer && selectedTextLayerTransform) {
        const base = getLayerTransformBase(selectedTextLayer);
        const nextOffsetX = partial.x ?? selectedTextLayerTransform.x;
        const nextOffsetY = partial.y ?? selectedTextLayerTransform.y;
        const nextRotation =
          partial.rotation ?? selectedTextLayerTransform.rotation;
        const nextScaleX = partial.scaleX ?? selectedTextLayerTransform.scaleX;
        const nextScaleY = partial.scaleY ?? selectedTextLayerTransform.scaleY;

        const nextX = Math.round((base.x + nextOffsetX) * 100) / 100;
        const nextY = Math.round((base.y + nextOffsetY) * 100) / 100;
        const nextRot = Math.round((base.rotation + nextRotation) * 100) / 100;
        const nextWidth = clampSize(base.width * nextScaleX);
        const nextHeight = clampSize(base.height * nextScaleY);

        updateSessionTemplate((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            textLayers: (prev.textLayers ?? []).map((tl) =>
              tl.id === selectedTextLayer.id
                ? {
                    ...tl,
                    x: nextX,
                    y: nextY,
                    rotation: nextRot,
                    width: nextWidth,
                    height: nextHeight,
                  }
                : tl,
            ),
            updatedAt: Date.now(),
          };
        });
        return;
      }

      if (!selectedLayer || !selectedLayerTransform) return;

      const base = getLayerTransformBase(selectedLayer);
      const nextOffsetX = partial.x ?? selectedLayerTransform.x;
      const nextOffsetY = partial.y ?? selectedLayerTransform.y;
      const nextRotation = partial.rotation ?? selectedLayerTransform.rotation;
      const nextScaleX = partial.scaleX ?? selectedLayerTransform.scaleX;
      const nextScaleY = partial.scaleY ?? selectedLayerTransform.scaleY;

      updateSelectedTemplateLayer({
        x: Math.round((base.x + nextOffsetX) * 100) / 100,
        y: Math.round((base.y + nextOffsetY) * 100) / 100,
        rotation: Math.round((base.rotation + nextRotation) * 100) / 100,
        width: clampSize(base.width * nextScaleX),
        height: clampSize(base.height * nextScaleY),
      });
    },
    [
      getLayerTransformBase,
      selectedLayer,
      selectedLayerTransform,
      selectedTextLayer,
      selectedTextLayerTransform,
      selectedGroupItem,
      selectedGroupTransform,
      updateGroupRuntimeTransform,
      updateSelectedTemplateLayer,
      updateSessionTemplate,
    ],
  );

  const triggerImageSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const applyImageFileToSelectedRuntimeItem = useCallback(
    (file: File) => {
      if (!selectedRuntimeItem || !isCommonImageFile(file)) {
        return;
      }

      const nextUrl = URL.createObjectURL(file);
      const previousUrl = selectedFillState?.imageUrl ?? null;

      const img = new Image();
      img.onload = () => {
        const scaleToFit = Math.max(
          Math.max(1, selectedRuntimeItem.bounds.width) / img.naturalWidth,
          Math.max(1, selectedRuntimeItem.bounds.height) / img.naturalHeight,
        );

        updateSelectedLayerState({
          imageUrl: nextUrl,
          imageTransform: {
            x: 0,
            y: 0,
            scaleX: scaleToFit,
            scaleY: scaleToFit,
            rotation: 0,
          },
        });

        safeRevokeObjectUrl(previousUrl);
      };

      img.onerror = () => {
        safeRevokeObjectUrl(nextUrl);
      };

      img.src = nextUrl;
    },
    [
      selectedFillState?.imageUrl,
      selectedRuntimeItem,
      updateSelectedLayerState,
    ],
  );

  const handleSelectImageClick = useCallback(() => {
    triggerImageSelect();
  }, [triggerImageSelect]);

  const handlePasteFromClipboardClick = useCallback(async () => {
    if (!selectedRuntimeItem) {
      return;
    }

    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.read === "function"
      ) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find((type) =>
            type.startsWith("image/"),
          );
          if (imageType) {
            const blob = await item.getType(imageType);
            const ext = imageType.split("/")[1] || "png";
            const file = new File([blob], `pasted_${Date.now()}.${ext}`, {
              type: imageType,
            });
            applyImageFileToSelectedRuntimeItem(file);
            return;
          }
        }
      }
    } catch (err) {
      console.warn(
        "Failed to paste image from clipboard on sidebar button click:",
        err,
      );
    }
  }, [selectedRuntimeItem, applyImageFileToSelectedRuntimeItem]);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        applyImageFileToSelectedRuntimeItem(file);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [applyImageFileToSelectedRuntimeItem],
  );

  const handleImageDropZoneDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!hasFileDragPayload(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setIsDragOverImageDropZone(true);
    },
    [],
  );

  const handleImageDropZoneDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget as Node | null;
      if (nextTarget && event.currentTarget.contains(nextTarget)) {
        return;
      }

      setIsDragOverImageDropZone(false);
    },
    [],
  );

  const handleImageDropZoneDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!hasFileDragPayload(event.dataTransfer)) {
        setIsDragOverImageDropZone(false);
        return;
      }

      event.preventDefault();
      setIsDragOverImageDropZone(false);

      const file = getFirstCommonImageFileFromDataTransfer(event.dataTransfer);
      if (!file) {
        return;
      }

      applyImageFileToSelectedRuntimeItem(file);
    },
    [applyImageFileToSelectedRuntimeItem],
  );

  useEffect(() => {
    setIsDragOverImageDropZone(false);
  }, [selectedRuntimeItem?.id, selectedFillState?.imageUrl]);

  const handleClearImage = useCallback(() => {
    if (!selectedFillState?.imageUrl) return;

    safeRevokeObjectUrl(selectedFillState.imageUrl);
    updateSelectedLayerState({
      imageUrl: null,
      imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
    });
  }, [selectedFillState?.imageUrl, updateSelectedLayerState]);

  const handleClearLayer = useCallback(() => {
    if (!selectedRuntimeItem) return;

    if (selectedFillState?.imageUrl) {
      safeRevokeObjectUrl(selectedFillState.imageUrl);
    }

    updateSelectedLayerState({
      imageUrl: null,
      imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
      borderWidth: 0,
      borderColor: "#000000",
      borderGradient: null,
      cornerRadius: 0,
    });
  }, [
    selectedFillState?.imageUrl,
    selectedRuntimeItem,
    updateSelectedLayerState,
  ]);

  const handleResetImageTransform = useCallback(() => {
    updateSelectedLayerState({
      imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
    });
  }, [updateSelectedLayerState]);

  const handleResetLayerTransform = useCallback(() => {
    if (selectedGroupItem) {
      updateGroupRuntimeTransform(selectedGroupItem.id, {
        ...DEFAULT_IMAGE_TRANSFORM,
      });
      return;
    }

    if (selectedTextLayer) {
      const base = getLayerTransformBase(selectedTextLayer);
      updateSessionTemplate((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          textLayers: (prev.textLayers ?? []).map((tl) =>
            tl.id === selectedTextLayer.id
              ? {
                  ...tl,
                  x: base.x,
                  y: base.y,
                  rotation: base.rotation,
                  width: base.width,
                  height: base.height,
                }
              : tl,
          ),
          updatedAt: Date.now(),
        };
      });
      return;
    }

    if (!selectedLayer) return;

    const base = getLayerTransformBase(selectedLayer);
    updateSelectedTemplateLayer({
      x: base.x,
      y: base.y,
      rotation: base.rotation,
      width: base.width,
      height: base.height,
    });
  }, [
    getLayerTransformBase,
    selectedGroupItem,
    selectedLayer,
    selectedTextLayer,
    updateGroupRuntimeTransform,
    updateSelectedTemplateLayer,
    updateSessionTemplate,
  ]);

  const handleDeleteLayer = useCallback(() => {
    if (!selectedRuntimeItem) return;

    selectedRuntimeItem.memberLayerIds.forEach((layerId) => {
      hideLayerInFill(layerId);
      layerTransformBaseRef.current.delete(layerId);
    });

    if (selectedRuntimeItem.kind === "group") {
      removeGroupRuntimeTransform(selectedRuntimeItem.id);
    }

    const nextRuntimeItems = runtimeItems.filter(
      (item) => item.id !== selectedRuntimeItem.id,
    );
    const nextSelectedLayerId = nextRuntimeItems[0]?.id ?? null;

    setSelectedLayerId(nextSelectedLayerId);
  }, [
    hideLayerInFill,
    removeGroupRuntimeTransform,
    runtimeItems,
    selectedRuntimeItem,
    setSelectedLayerId,
  ]);

  const borderOverridden = canvasFillState.borderOverrideEnabled;
  const cornerRadiusOverridden = canvasFillState.cornerRadiusOverrideEnabled;

  return (
    <AccordionCard
      icon={<SlidersHorizontal size={16} />}
      label={t("fill.layerCustomization")}
      sublabel={
        selectedRuntimeItem
          ? t("fill.selectedLayerLabel", {
              name:
                selectedRuntimeItem.name || t("manualEditor.layerDefaultName"),
            })
          : t("fill.noLayerSelected")
      }
      colorTheme="sky"
      defaultOpen={true}
      childrenClassName="p-2"
    >
      <div>
        {!selectedRuntimeItem ? (
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            {t("fill.selectLayerPrompt")}
          </p>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={COMMON_IMAGE_ACCEPT}
              className="hidden"
              onChange={handleImageUpload}
            />

            <div className="grid grid-cols-3 gap-1 rounded-md border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-900/40">
              {TAB_ITEMS.map((tab) => {
                const isActive = activeCustomizationTab === tab.id;
                const actionId = TAB_SHORTCUT_ACTION[tab.id];
                const definition = SHORTCUT_DEFINITION_MAP[actionId];
                const shortcutLabel = getShortcutLabel(actionId);
                return (
                  <Tooltip
                    key={tab.id}
                    variant="wide1"
                    label={`${definition.label} (${shortcutLabel})`}
                    content={TAB_INFO_TEXT[tab.id]}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveCustomizationTab(tab.id)}
                      className={`w-full inline-flex items-center justify-center gap-1 rounded px-2 py-1.5 text-[11px] font-medium transition-colors ${
                        isActive
                          ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  </Tooltip>
                );
              })}
            </div>

            {activeCustomizationTab === "image" && (
              <div className="space-y-3 mt-3">
                {selectedTextLayer ? (
                  <CaptionConfigSections
                    config={textConfig}
                    onChange={handleTextLayerConfigChange}
                    textInputNode={
                      <TextInput
                        label={t("fill.textContent", {})}
                        value={textConfig.content ?? selectedTextLayer.name}
                        onChange={(val) =>
                          handleTextLayerConfigChange({ content: val })
                        }
                        placeholder={t("fill.textContentPlaceholder", {})}
                      />
                    }
                    positionOptions={textPositionOptions}
                    maxPaddingV={Math.max(
                      1,
                      Math.round(selectedTextLayer.height),
                    )}
                    maxPaddingH={Math.max(
                      1,
                      Math.round(selectedTextLayer.width),
                    )}
                    sectionClassName="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 first:border-t-0 first:pt-0"
                  />
                ) : !selectedFillState?.imageUrl ? (
                  <div
                    className={`rounded-md border border-dashed p-3 transition-colors ${
                      isDragOverImageDropZone
                        ? "border-sky-400 bg-sky-50/70 dark:border-sky-500 dark:bg-sky-500/10"
                        : "border-slate-300 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-900/30"
                    }`}
                    onDragOver={handleImageDropZoneDragOver}
                    onDragLeave={handleImageDropZoneDragLeave}
                    onDrop={handleImageDropZoneDrop}
                  >
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-2">
                      {t("fill.noImagePrompt")}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      {t("fill.dragDropPrompt")}
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleSelectImageClick}
                        className="w-full"
                      >
                        <ImagePlus size={14} />
                        {t("fill.selectImage")}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handlePasteFromClipboardClick}
                        className="w-full"
                      >
                        <ClipboardPaste size={14} />
                        {t("fill.pasteClipboard")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <FillTransformControls
                    transform={selectedFillState.imageTransform}
                    onChange={handleImageTransformChange}
                    onReset={handleResetImageTransform}
                    actions={
                      <>
                        <Tooltip
                          content={`${t("tooltips.clearImage")} (${getShortcutLabel("fill.customization.clear_image")})`}
                        >
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleClearImage}
                          >
                            <X size={14} />
                          </Button>
                        </Tooltip>
                        <Tooltip content={t("tooltips.replaceImage")}>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={triggerImageSelect}
                          >
                            <ImagePlus size={14} />
                          </Button>
                        </Tooltip>
                      </>
                    }
                  />
                )}
              </div>
            )}

            {activeCustomizationTab === "border" && (
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-3 gap-2">
                  <NumberInput
                    label={t("fill.borderWidthLabel")}
                    value={selectedFillState?.borderWidth ?? 0}
                    onChangeValue={(value) =>
                      updateSelectedLayerState({ borderWidth: value })
                    }
                    min={0}
                    max={50}
                    disabled={borderOverridden}
                    tooltipContent={
                      borderOverridden
                        ? t("tooltips.borderDisabled")
                        : undefined
                    }
                  />
                  <NumberInput
                    label={t("fill.radiusLabel")}
                    value={selectedFillState?.cornerRadius ?? 0}
                    onChangeValue={(value) =>
                      updateSelectedLayerState({ cornerRadius: value })
                    }
                    min={0}
                    max={200}
                    disabled={cornerRadiusOverridden}
                    tooltipContent={
                      cornerRadiusOverridden
                        ? t("tooltips.radiusDisabled")
                        : undefined
                    }
                  />
                  <ColorPickerPopover
                    label={t("fill.colorLabel")}
                    value={selectedFillState?.borderColor ?? "#000000"}
                    onChange={(value) =>
                      updateSelectedLayerState({ borderColor: value })
                    }
                    enableAlpha={false}
                    enableGradient
                    outputMode="hex"
                    appearance="stacked"
                  />
                </div>

                {(borderOverridden || cornerRadiusOverridden) && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {t("fill.overrideNotice")}
                  </p>
                )}
              </div>
            )}

            {activeCustomizationTab === "layer" &&
              (selectedLayerTransform ||
                selectedGroupTransform ||
                selectedTextLayerTransform) && (
                <FillTransformControls
                  transform={
                    selectedLayerTransform ??
                    selectedGroupTransform ??
                    selectedTextLayerTransform ?? { ...DEFAULT_IMAGE_TRANSFORM }
                  }
                  onChange={handleLayerTransformChange}
                  onReset={handleResetLayerTransform}
                  actions={
                    <div className="flex gap-1">
                      <Tooltip content={t("fill.clearLayerTooltip")}>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleClearLayer}
                        >
                          <RotateCcw size={14} />
                        </Button>
                      </Tooltip>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleDeleteLayer}
                        className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  }
                />
              )}
          </>
        )}
      </div>
    </AccordionCard>
  );
}

export default FillLayerCustomizationAccordion;
