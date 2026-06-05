import React, { useRef, useEffect, useState } from "react";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  AccordionCard,
  SliderInput,
  RadioCard,
  ColorPickerPopover,
  Button,
  CheckboxCard,
  DiscreteSlider,
  LabelText,
  SelectInput,
  TextInput,
  GridIconSelector,
} from "@imify/ui";
import {
  Palette,
  Image as ImageIcon,
  Trash2,
  Upload,
  Type,
  Grid2X2,
  Settings2,
} from "lucide-react";
import { useQrGeneratorStore, useFontStore } from "@imify/stores";
import * as Icons from "./design-icons";

interface QrGeneratorSidebarProps {
  enableWideSidebarGrid?: boolean;
  autoWideSidebarGridMinWidthPx?: number | null;
}

const ERROR_CORRECTION_TOOLTIPS = {
  Low: "Low: Recovers up to 7% of data capacity if damaged or dirty.",
  Medium: "Medium: Recovers up to 15% of data capacity if damaged or dirty.",
  Quartile:
    "Quartile: Recovers up to 25% of data capacity if damaged or dirty.",
  High: "High: Recovers up to 30% of data capacity. Best for logos.",
};

const LEVEL_MAP = {
  L: "Low",
  M: "Medium",
  Q: "Quartile",
  H: "High",
} as const;

const REVERSE_LEVEL_MAP = {
  Low: "L",
  Medium: "M",
  Quartile: "Q",
  High: "H",
} as const;

const RESOLUTION_OPTIONS = [
  { value: 256, label: "256" },
  { value: 512, label: "512" },
  { value: 768, label: "768" },
  { value: 1024, label: "1K" },
  { value: 1280, label: "1.25K" },
  { value: 1536, label: "1.5K" },
] as const;

export function QrGeneratorSidebar({
  enableWideSidebarGrid = false,
  autoWideSidebarGridMinWidthPx = null,
}: QrGeneratorSidebarProps) {
  const {
    size,
    setSize,
    bgColor,
    setBgColor,
    fgColor,
    setFgColor,
    setIncludeLogo,
    logoUrl,
    setLogoUrl,
    logoWidth,
    setLogoWidth,
    logoHeight,
    setLogoHeight,
    excavateLogo,
    setExcavateLogo,
    errorCorrectionLevel,
    setErrorCorrectionLevel,

    // Design state
    qrMargin,
    setQrMargin,
    dotType,
    setDotType,
    markerBorderType,
    setMarkerBorderType,
    markerCenterType,
    setMarkerCenterType,
    syncMarkerBorderColorWithForeground,
    setSyncMarkerBorderColorWithForeground,
    markerBorderColor,
    setMarkerBorderColor,
    syncMarkerCenterColorWithForeground,
    setSyncMarkerCenterColorWithForeground,
    markerCenterColor,
    setMarkerCenterColor,

    // Frame state
    frameStyle,
    setFrameStyle,
    frameText,
    setFrameText,
    frameTextScale,
    setFrameTextScale,
    frameFontFamily,
    setFrameFontFamily,
    frameFontId,
    setFrameFontId,
    syncFrameColorWithForeground,
    setSyncFrameColorWithForeground,
    frameColor,
    setFrameColor,
    syncTextColorWithBackground,
    setSyncTextColorWithBackground,
    frameTextColor,
    setFrameTextColor,
  } = useQrGeneratorStore();

  const { installedFonts, loadInstalledFonts } = useFontStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInstalledFonts();
  }, [loadInstalledFonts]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedExtensions = [".png", ".svg", ".jpg", ".jpeg", ".webp"];
      const isAllowed =
        file.type.startsWith("image/") ||
        allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

      if (isAllowed) {
        if (logoUrl) {
          URL.revokeObjectURL(logoUrl);
        }
        const url = URL.createObjectURL(file);
        setLogoUrl(url);
        setIncludeLogo(true);
      }
    }
  };

  const handleRemoveLogo = () => {
    if (logoUrl) {
      URL.revokeObjectURL(logoUrl);
    }
    setLogoUrl(null);
    setIncludeLogo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "qr-design-colors",
      label: "",
      content: (
        <AccordionCard
          label="Colors & Pattern"
          sublabel="Base colors and dot style"
          icon={<Palette size={16} />}
          defaultOpen={true}
          colorTheme="purple"
          childrenClassName="p-3 space-y-3"
        >
          {/* Colors */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <LabelText className="text-xs">Foreground Color</LabelText>
              <ColorPickerPopover
                label=""
                value={fgColor}
                onChange={setFgColor}
                enableAlpha={false}
                enableGradient={false}
              />
            </div>
            <div className="flex items-center justify-between">
              <LabelText className="text-xs">Background Color</LabelText>
              <ColorPickerPopover
                label=""
                value={bgColor}
                onChange={setBgColor}
                enableAlpha={true}
                enableGradient={false}
              />
            </div>
          </div>

          {/* Inner Padding */}
          <SliderInput
            label="Inner Padding"
            value={qrMargin}
            min={0}
            max={100}
            step={1}
            onChange={setQrMargin}
            suffix=" px"
          />

          {/* Dot Pattern */}
          <div className="space-y-1.5">
            <LabelText className="text-xs">Dot Pattern</LabelText>
            <GridIconSelector
              value={dotType}
              onChange={setDotType}
              columns={4}
              options={[
                {
                  value: "square",
                  label: "Square",
                  icon: <Icons.DotSquareIcon />,
                },
                { value: "dots", label: "Dots", icon: <Icons.DotDotsIcon /> },
                {
                  value: "rounded",
                  label: "Rounded",
                  icon: <Icons.DotRoundedIcon />,
                },
                {
                  value: "extra-rounded",
                  label: "Extra Round",
                  icon: <Icons.DotExtraRoundedIcon />,
                },
                {
                  value: "classy",
                  label: "Classy",
                  icon: <Icons.DotClassyIcon />,
                },
                {
                  value: "classy-rounded",
                  label: "Classy Rnd",
                  icon: <Icons.DotClassyRoundedIcon />,
                },
              ]}
            />
          </div>
        </AccordionCard>
      ),
    },
    {
      id: "qr-markers",
      label: "",
      content: (
        <AccordionCard
          label="Markers"
          sublabel="Corner square and center style"
          icon={<Grid2X2 size={16} />}
          defaultOpen={false}
          colorTheme="blue"
          childrenClassName="p-3 space-y-3"
        >
          {/* Marker Border */}
          <div className="space-y-1.5">
            <LabelText className="text-xs">Marker Border</LabelText>
            <GridIconSelector
              value={markerBorderType}
              onChange={setMarkerBorderType}
              columns={4}
              colorTheme="blue"
              options={[
                {
                  value: "square",
                  label: "Square",
                  icon: <Icons.MarkerBorderSquareIcon />,
                },
                {
                  value: "dot",
                  label: "Dot",
                  icon: <Icons.MarkerBorderDotIcon />,
                },
                {
                  value: "extra-rounded",
                  label: "Rounded",
                  icon: <Icons.MarkerBorderExtraRoundedIcon />,
                },
              ]}
            />
          </div>

          {/* Marker Center */}
          <div className="space-y-1.5">
            <LabelText className="text-xs">Marker Center</LabelText>
            <GridIconSelector
              value={markerCenterType}
              onChange={setMarkerCenterType}
              columns={4}
              colorTheme="blue"
              options={[
                {
                  value: "square",
                  label: "Square",
                  icon: <Icons.MarkerCenterSquareIcon />,
                },
                {
                  value: "dot",
                  label: "Dot",
                  icon: <Icons.MarkerCenterDotIcon />,
                },
              ]}
            />
          </div>

          {/* Marker Colors Sync */}
          <div className="space-y-3">
            <div>
              <CheckboxCard
                checked={syncMarkerBorderColorWithForeground}
                onChange={setSyncMarkerBorderColorWithForeground}
                title="Sync Marker Border"
                subtitle="Match marker border color with QR foreground"
                icon={<Palette size={14} className="text-blue-500" />}
              />
              {!syncMarkerBorderColorWithForeground && (
                <div className="flex items-center justify-between pl-6 pr-2 pt-1.5 text-xs">
                  <LabelText className="text-xs">Border Color</LabelText>
                  <ColorPickerPopover
                    label=""
                    value={markerBorderColor}
                    onChange={setMarkerBorderColor}
                    enableAlpha={false}
                    enableGradient={false}
                  />
                </div>
              )}
            </div>

            <div>
              <CheckboxCard
                checked={syncMarkerCenterColorWithForeground}
                onChange={setSyncMarkerCenterColorWithForeground}
                title="Sync Marker Center"
                subtitle="Match marker center color with QR foreground"
                icon={<Palette size={14} className="text-blue-500" />}
              />
              {!syncMarkerCenterColorWithForeground && (
                <div className="flex items-center justify-between pl-6 pr-2 pt-1.5 text-xs">
                  <LabelText className="text-xs">Center Color</LabelText>
                  <ColorPickerPopover
                    label=""
                    value={markerCenterColor}
                    onChange={setMarkerCenterColor}
                    enableAlpha={false}
                    enableGradient={false}
                  />
                </div>
              )}
            </div>
          </div>
        </AccordionCard>
      ),
    },
    {
      id: "qr-quality-export",
      label: "",
      content: (
        <AccordionCard
          label="Quality & Resolution"
          sublabel="Size and error correction"
          icon={<Settings2 size={16} />}
          defaultOpen={true}
          colorTheme="amber"
          childrenClassName="p-3 space-y-3"
        >
          {/* Resolution */}
          <div className="pt-1">
            <DiscreteSlider
              label="Resolution (Size)"
              value={size}
              options={RESOLUTION_OPTIONS}
              onChange={setSize}
              valueFormatter={(opt) => `${opt.value} px`}
            />
          </div>

          {/* Error Correction */}
          <div className="space-y-2">
            <LabelText className="text-xs">Error Correction Level</LabelText>
            <div className="grid grid-cols-2 gap-1">
              {(["Low", "Medium", "Quartile", "High"] as const).map((level) => (
                <RadioCard
                  key={level}
                  title={level}
                  value={level}
                  selectedValue={
                    errorCorrectionLevel in LEVEL_MAP
                      ? LEVEL_MAP[
                          errorCorrectionLevel as keyof typeof LEVEL_MAP
                        ]
                      : "Medium"
                  }
                  onChange={(v) =>
                    setErrorCorrectionLevel(
                      REVERSE_LEVEL_MAP[v as keyof typeof REVERSE_LEVEL_MAP] ||
                        "M",
                    )
                  }
                  colorTheme="amber"
                  tooltipContent={ERROR_CORRECTION_TOOLTIPS[level]}
                  className="flex items-center justify-center p-1.5 h-8 text-[11px]"
                />
              ))}
            </div>
          </div>
        </AccordionCard>
      ),
    },
    {
      id: "qr-logo-embed",
      label: "",
      content: (
        <AccordionCard
          label="Logo Embedding"
          sublabel={logoUrl ? "Logo Active" : "No Logo"}
          icon={<ImageIcon size={16} />}
          defaultOpen={true}
          colorTheme="sky"
          childrenClassName="p-3 space-y-3"
        >
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".png,.svg,.jpg,.jpeg,.webp"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              className="hidden"
            />
            {!logoUrl ? (
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 text-xs py-1.5 h-8 flex items-center justify-center gap-1.5"
                variant="secondary"
              >
                <Upload size={14} />
                <span>Upload Logo</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <div className="h-10 w-10 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded p-1 flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 text-xs py-1 h-8"
                  variant="secondary"
                >
                  Change
                </Button>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded flex items-center justify-center border border-rose-200 dark:border-rose-900/60"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
          {logoUrl && (
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
              <SliderInput
                label="Logo Size"
                value={logoWidth}
                min={10}
                max={120}
                step={2}
                onChange={(val) => {
                  setLogoWidth(val);
                  setLogoHeight(val);
                }}
                suffix=" px"
              />
              <CheckboxCard
                checked={excavateLogo}
                onChange={setExcavateLogo}
                title="Excavate QR Dots"
                subtitle="Removes dots behind logo for better scanning"
                icon={<Palette size={14} className="text-sky-500" />}
              />
            </div>
          )}
        </AccordionCard>
      ),
    },
    {
      id: "qr-frame-text",
      label: "",
      content: (
        <AccordionCard
          label="Frame & Text"
          sublabel={frameStyle === "none" ? "No Frame" : frameStyle}
          icon={<Type size={16} />}
          defaultOpen={false}
          colorTheme="blue"
          childrenClassName="p-3 space-y-3"
        >
          {/* Template Selector */}
          <div className="space-y-1.5">
            <LabelText className="text-xs">Frame Template</LabelText>
            <GridIconSelector
              value={frameStyle}
              onChange={setFrameStyle}
              columns={4}
              colorTheme="blue"
              options={[
                { value: "none", label: "None", icon: <Icons.FrameNoneIcon /> },
                {
                  value: "border",
                  label: "Border",
                  icon: <Icons.FrameBorderIcon />,
                },
                {
                  value: "bottom",
                  label: "Bottom",
                  icon: <Icons.FrameBottomIcon />,
                },
                { value: "top", label: "Top", icon: <Icons.FrameTopIcon /> },
                {
                  value: "tooltip",
                  label: "Tooltip",
                  icon: <Icons.FrameTooltipIcon />,
                },
                {
                  value: "ribbon",
                  label: "Ribbon",
                  icon: <Icons.FrameRibbonIcon />,
                },
              ]}
            />
          </div>

          {frameStyle !== "none" && (
            <>
              {/* Frame Text Input */}
              <TextInput
                label="Frame Text"
                value={frameText}
                onChange={setFrameText}
                placeholder="e.g. SCAN ME"
                onKeyDown={(e) => e.stopPropagation()}
              />

              {/* Font Picker */}
              <SelectInput
                label="Font Family"
                value={frameFontFamily}
                options={[
                  { value: "sans-serif", label: "System Sans-Serif" },
                  ...installedFonts.map((f) => ({
                    value: f.name,
                    label: f.name,
                  })),
                ]}
                onChange={(family) => {
                  setFrameFontFamily(family);
                  const matchingFont = installedFonts.find(
                    (f) => f.name === family,
                  );
                  setFrameFontId(matchingFont?.id || "");
                }}
              />

              {/* Text Scale Slider */}
              <SliderInput
                label="Text Scale"
                value={frameTextScale}
                min={50}
                max={200}
                step={5}
                onChange={setFrameTextScale}
                suffix="%"
              />

              {/* Frame Colors Sync */}
              <div className="space-y-3">
                <CheckboxCard
                  checked={syncFrameColorWithForeground}
                  onChange={setSyncFrameColorWithForeground}
                  title="Sync Frame Color"
                  subtitle="Match frame color with QR foreground"
                  icon={<Palette size={14} className="text-blue-500" />}
                />
                {!syncFrameColorWithForeground && (
                  <div className="flex items-center justify-between pl-6 pr-2 pt-1.5 text-xs">
                    <LabelText className="text-xs">Frame Color</LabelText>
                    <ColorPickerPopover
                      label=""
                      value={frameColor}
                      onChange={setFrameColor}
                      enableAlpha={false}
                      enableGradient={false}
                    />
                  </div>
                )}

                <CheckboxCard
                  checked={syncTextColorWithBackground}
                  onChange={setSyncTextColorWithBackground}
                  title="Sync Text Color"
                  subtitle="Match text color with QR background"
                  icon={<Palette size={14} className="text-blue-500" />}
                />
                {!syncTextColorWithBackground && (
                  <div className="flex items-center justify-between pl-6 pr-2 pt-1.5 text-xs">
                    <LabelText className="text-xs">Text Color</LabelText>
                    <ColorPickerPopover
                      label=""
                      value={frameTextColor}
                      onChange={setFrameTextColor}
                      enableAlpha={false}
                      enableGradient={false}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </AccordionCard>
      ),
    },
  ];

  return (
    <WorkspaceConfigSidebarPanel
      title="CONFIGURATION"
      items={sidebarItems}
      twoColumn={enableWideSidebarGrid}
      autoTwoColumnMinWidthPx={autoWideSidebarGridMinWidthPx}
    />
  );
}
