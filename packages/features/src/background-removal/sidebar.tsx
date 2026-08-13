import React, { useEffect, useState } from "react";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  BodyText,
  AccordionCard,
  SliderInput,
  RadioCard,
  ColorPickerPopover,
  SidebarPanel,
} from "@imify/ui";
import { Sliders, Image, Eraser, Palette } from "lucide-react";
import { BACKGROUND_REMOVAL_MODELS } from "./models";
import { QuickExportSelector } from "../shared/quick-export-selector";
import { useBackgroundRemoverStore } from "@imify/stores";
import { ModelVariantDialog } from "./model-variant-dialog";
import { useTranslation } from "@imify/i18n";
import { AiEngineAccordionCard } from "../shared/ai-engine-accordion-card";

import { useBackgroundRemoverShowcaseContent } from "./remover-preset-info-panel";
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel";

import {
  EDGE_REFINEMENT_MIN,
  EDGE_REFINEMENT_MAX,
} from "./config";

export const BACKGROUND_REMOVER_SIDEBAR_PANEL_ID = "bg-remover-settings";

interface BackgroundRemoverSidebarProps {
  enableWideSidebarGrid?: boolean;
  autoWideSidebarGridMinWidthPx?: number | null;
}

export function BackgroundRemoverSidebar({
  enableWideSidebarGrid,
  autoWideSidebarGridMinWidthPx,
}: BackgroundRemoverSidebarProps) {
  const { t } = useTranslation("backgroundRemover");
  const {
    modelId,
    setModelId,
    variantId,
    setVariantId,
    edgeSmoothing,
    setEdgeSmoothing,
    outputFormat,
    setOutputFormat,
    backgroundColor,
    setBackgroundColor,
    unloadModelAfterProcess,
    setUnloadModelAfterProcess,
    exportFormat,
    setExportFormat,
    fileNamePattern,
    setFileNamePattern,
    hasImage,
  } = useBackgroundRemoverStore();

  const selectedModel =
    BACKGROUND_REMOVAL_MODELS.find((m) => m.id === modelId) ??
    BACKGROUND_REMOVAL_MODELS[0];
  const selectedVariant =
    selectedModel.variants.find((v) => v.id === variantId) ??
    selectedModel.variants[0];
  const [isModelVariantDialogOpen, setIsModelVariantDialogOpen] =
    useState(false);

  // Initialize smart default for unloadModelAfterProcess based on hardware
  useEffect(() => {
    const storageKey = "imify-background-remover-settings";
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      const ram = (navigator as any).deviceMemory;
      if (ram && ram <= 4) {
        setUnloadModelAfterProcess(true);
      }
    }
  }, [setUnloadModelAfterProcess]);

  const getModelTranslationKey = (id: string) => {
    const keyMap: Record<string, string> = {
      "onnx-community/BiRefNet_lite-ONNX": "birefnet",
      "onnx-community/ormbg-ONNX": "ormbg",
      "onnx-community/modnet-webnn": "modnet",
      "onnx-community/mediapipe_selfie_segmentation": "selfie",
    };
    return keyMap[id] || "birefnet";
  };

  const modelKey = getModelTranslationKey(selectedModel.id);
  const localizedModelName = t(`models.${modelKey}.name`, {
    defaultValue: selectedModel.name,
  });
  const localizedModelDescription = t(`models.${modelKey}.description`, {
    defaultValue: selectedModel.description,
  });
  const localizedModelUsecase = t(`models.${modelKey}.usecase`, {
    defaultValue: selectedModel.usecase,
  });

  const localizedVariantLabel = t(`variants.${selectedVariant.id}.label`, {
    defaultValue: selectedVariant.label,
  });
  const localizedVariantDescription = selectedVariant.description
    ? t(`variants.${selectedVariant.id}.description`, {
        defaultValue: selectedVariant.description,
      })
    : undefined;

  const showcaseContent = useBackgroundRemoverShowcaseContent();

  // If no image is imported, show the tool's showcase information
  if (!hasImage) {
    return (
      <SidebarPanel title={t("sidebar.aboutThisTool")}>
        <div className="px-1 py-1">
          <PresetInfoShowcasePanel {...showcaseContent} padding={0} />
        </div>
      </SidebarPanel>
    );
  }

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "ai-engine-settings",
      label: "",
      content: (
        <AiEngineAccordionCard
          label={t("sidebar.aiEngine")}
          sublabel={`${localizedModelName} (${localizedVariantLabel})`}
          colorTheme="pink"
          modelName={localizedModelName}
          variantLabel={localizedVariantLabel}
          onConfigureClick={() => setIsModelVariantDialogOpen(true)}
          unloadModelChecked={unloadModelAfterProcess}
          onUnloadModelChange={setUnloadModelAfterProcess}
          unloadModelTitle={t("sidebar.autoUnload")}
          unloadModelSubtitle={t("sidebar.autoUnloadDesc")}
          currentSelectionHeader={t("sidebar.currentSelection")}
          modelLabelText={t("sidebar.modelLabel")}
          modelDescription={localizedModelDescription}
          variantLabelText={t("sidebar.variantLabel")}
          variantDescription={localizedVariantDescription}
          suitableForLabelText={t("sidebar.suitableForLabel")}
          suitableForDescription={localizedModelUsecase}
        />
      ),
    },
    {
      id: "output-preset",
      label: "",
      content: (
        <QuickExportSelector
          format={exportFormat}
          onFormatChange={setExportFormat}
          fileNamePattern={fileNamePattern}
          onFileNamePatternChange={setFileNamePattern}
          theme="pink"
        />
      ),
    },
    {
      id: "output-settings",
      label: "",
      content: (
        <AccordionCard
          label={t("sidebar.processingOutput")}
          sublabel={
            outputFormat === "transparent"
              ? t("sidebar.formatTransparent")
              : t("sidebar.formatSolidColor")
          }
          icon={<Sliders size={16} />}
          defaultOpen={true}
          colorTheme="purple"
          childrenClassName="p-3 space-y-4"
        >
          <SliderInput
            label={t("sidebar.edgeRefinement")}
            value={edgeSmoothing}
            min={EDGE_REFINEMENT_MIN}
            max={EDGE_REFINEMENT_MAX}
            step={1}
            onChange={setEdgeSmoothing}
          />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image size={14} className="text-purple-500" />
              <BodyText className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t("sidebar.backgroundType")}
              </BodyText>
            </div>

            <div className="space-y-2">
              <RadioCard
                title={t("sidebar.transparent")}
                value="transparent"
                selectedValue={outputFormat}
                onChange={(v) => setOutputFormat(v as any)}
                colorTheme="purple"
                icon={<Eraser className="text-gray-500" size={16} />}
              />

              <RadioCard
                title={t("sidebar.solidColor")}
                value="color"
                selectedValue={outputFormat}
                onChange={(v) => setOutputFormat(v as any)}
                colorTheme="purple"
                icon={<Palette size={16} className="text-green-500" />}
                rightSlot={
                  <ColorPickerPopover
                    label=""
                    value={backgroundColor}
                    onChange={setBackgroundColor}
                    enableAlpha={false}
                    enableGradient={false}
                  />
                }
              />
            </div>
          </div>
        </AccordionCard>
      ),
    },
  ];

  return (
    <>
      <WorkspaceConfigSidebarPanel
        title={t("configuration")}
        items={sidebarItems}
        twoColumn={enableWideSidebarGrid}
        autoTwoColumnMinWidthPx={autoWideSidebarGridMinWidthPx}
      />
      <ModelVariantDialog
        isOpen={isModelVariantDialogOpen}
        onClose={() => setIsModelVariantDialogOpen(false)}
        modelId={modelId}
        setModelId={setModelId}
        variantId={variantId}
        setVariantId={setVariantId}
      />
    </>
  );
}
