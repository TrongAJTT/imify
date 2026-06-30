import React from "react";
import { Circle, Expand, Palette, Square } from "lucide-react";

import { AccordionCard } from "@imify/ui";
import { CheckboxCard } from "@imify/ui";
import { ColorPickerPopover } from "@imify/ui";
import { NumberInput } from "@imify/ui";
import { SelectInput } from "@imify/ui";
import { usePatternStore } from "@imify/stores/stores/pattern-store";
import { useTranslation } from "@imify/i18n";

export function PatternAssetSettingsAccordion() {
  const { t } = useTranslation("pattern");
  const assetResize = usePatternStore((state) => state.settings.assetResize);
  const layerColorOverride = usePatternStore(
    (state) => state.settings.layerColorOverride,
  );
  const layerBorderOverride = usePatternStore(
    (state) => state.settings.layerBorderOverride,
  );
  const layerCornerRadiusOverride = usePatternStore(
    (state) => state.settings.layerCornerRadiusOverride,
  );

  const setAssetResize = usePatternStore((state) => state.setAssetResize);
  const setLayerColorOverride = usePatternStore(
    (state) => state.setLayerColorOverride,
  );
  const setLayerBorderOverride = usePatternStore(
    (state) => state.setLayerBorderOverride,
  );
  const setLayerCornerRadiusOverride = usePatternStore(
    (state) => state.setLayerCornerRadiusOverride,
  );

  const activeOverrides = [
    layerColorOverride.enabled ? t("assetSettingsFields.colorOverride") : null,
    layerBorderOverride.enabled
      ? t("assetSettingsFields.borderOverride")
      : null,
    layerCornerRadiusOverride.enabled
      ? t("assetSettingsFields.radiusOverride")
      : null,
  ].filter(Boolean);

  const sublabel =
    activeOverrides.length > 0
      ? `${t("assetSettingsFields.overridesLabel")}: ${activeOverrides.join(", ")}`
      : assetResize.enabled
        ? t("assetSettingsFields.resizeLabel", {
            width: Math.round(assetResize.width),
            height: Math.round(assetResize.height),
          })
        : t("assetSettingsFields.originalSize");

  const colorOverrideModeOptions = [
    { value: "per-asset", label: t("assetSettingsFields.perAsset") },
    { value: "unified", label: t("assetSettingsFields.unified") },
  ];

  return (
    <AccordionCard
      icon={<Expand size={16} />}
      label={t("sidebar.assetSettings")}
      sublabel={sublabel}
      colorTheme="amber"
      defaultOpen={true}
    >
      <div className="space-y-3">
        <CheckboxCard
          title={t("assetSettingsFields.resizeAssets")}
          subtitle={
            assetResize.enabled
              ? t("common.enabled", { defaultValue: "Enabled" })
              : t("common.disabled", { defaultValue: "Disabled" })
          }
          checked={assetResize.enabled}
          onChange={(checked) => setAssetResize({ enabled: checked })}
        />

        <div
          className={`grid grid-cols-2 gap-2 ${
            assetResize.enabled ? "" : "pointer-events-none opacity-60"
          }`}
        >
          <NumberInput
            label={t("canvasFields.width")}
            value={Math.round(assetResize.width)}
            min={1}
            max={4000}
            step={1}
            onChangeValue={(value) => setAssetResize({ width: value })}
          />
          <NumberInput
            label={t("canvasFields.height")}
            value={Math.round(assetResize.height)}
            min={1}
            max={4000}
            step={1}
            onChangeValue={(value) => setAssetResize({ height: value })}
          />
        </div>

        <div className="pt-2 space-y-2">
          <CheckboxCard
            icon={<Palette size={14} />}
            title={t("assetSettingsFields.overrideColor")}
            subtitle={
              layerColorOverride.enabled
                ? `${t("common.enabled", { defaultValue: "Enabled" })} (${layerColorOverride.mode === "per-asset" ? t("assetSettingsFields.perAsset") : t("assetSettingsFields.unified")})`
                : t("common.disabled", { defaultValue: "Disabled" })
            }
            checked={layerColorOverride.enabled}
            onChange={(checked) => setLayerColorOverride({ enabled: checked })}
          />

          {layerColorOverride.enabled && (
            <div className="pb-3 border-b-2 border-slate-200 dark:border-slate-700 space-y-2 grid grid-cols-2 gap-3 items-end">
              <SelectInput
                label={t("assetSettingsFields.overrideMode")}
                value={layerColorOverride.mode}
                options={colorOverrideModeOptions}
                onChange={(value) =>
                  setLayerColorOverride({
                    mode: value as "per-asset" | "unified",
                  })
                }
                tooltipContent={t("tooltips.overrideMode")}
              />
              <ColorPickerPopover
                label={t("assetSettingsFields.overrideColorLabel")}
                value={layerColorOverride.color}
                onChange={(value) => setLayerColorOverride({ color: value })}
                enableGradient={true}
                enableAlpha={true}
                outputMode="rgba"
                appearance="stacked"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <CheckboxCard
            icon={<Square size={14} />}
            title={t("assetSettingsFields.overrideBorders")}
            subtitle={
              layerBorderOverride.enabled
                ? t("common.enabled", { defaultValue: "Enabled" })
                : t("common.disabled", { defaultValue: "Disabled" })
            }
            checked={layerBorderOverride.enabled}
            onChange={(checked) => setLayerBorderOverride({ enabled: checked })}
          />

          {layerBorderOverride.enabled && (
            <div className="pb-3 border-b-2 border-slate-200 dark:border-slate-700 space-y-2 grid grid-cols-2 gap-3 items-end">
              <NumberInput
                label={t("assetSettingsFields.borderWidth")}
                value={Math.round(layerBorderOverride.width * 10) / 10}
                min={0}
                max={200}
                step={0.5}
                onChangeValue={(value) =>
                  setLayerBorderOverride({ width: Math.max(0, value) })
                }
              />
              <ColorPickerPopover
                label={t("assetSettingsFields.borderColor")}
                value={layerBorderOverride.color}
                onChange={(value) => setLayerBorderOverride({ color: value })}
                enableGradient={true}
                enableAlpha={true}
                outputMode="rgba"
                appearance="stacked"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <CheckboxCard
            icon={<Circle size={14} />}
            title={t("assetSettingsFields.overrideRadius")}
            subtitle={
              layerCornerRadiusOverride.enabled
                ? t("common.enabled", { defaultValue: "Enabled" })
                : t("common.disabled", { defaultValue: "Disabled" })
            }
            checked={layerCornerRadiusOverride.enabled}
            onChange={(checked) =>
              setLayerCornerRadiusOverride({ enabled: checked })
            }
          />

          {layerCornerRadiusOverride.enabled && (
            <div className="space-y-2">
              <NumberInput
                label={t("assetSettingsFields.cornerRadius")}
                value={Math.round(layerCornerRadiusOverride.radius * 10) / 10}
                min={0}
                max={2048}
                step={0.5}
                onChangeValue={(value) =>
                  setLayerCornerRadiusOverride({ radius: Math.max(0, value) })
                }
              />
            </div>
          )}
        </div>
      </div>
    </AccordionCard>
  );
}
