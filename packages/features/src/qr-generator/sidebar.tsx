import React, { useRef } from "react";
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
} from "@imify/ui";
import { Palette, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { useQrGeneratorStore } from "@imify/stores";

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
  { value: 1024, label: "1K" },
  { value: 2048, label: "2K" },
  { value: 3072, label: "3K" },
  { value: 4096, label: "4K" },
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
  } = useQrGeneratorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      id: "qr-colors-design",
      label: "",
      content: (
        <AccordionCard
          label="Design & Colors"
          sublabel="Dots and background colors"
          icon={<Palette size={16} />}
          defaultOpen={true}
          colorTheme="purple"
          childrenClassName="p-3 space-y-4"
        >
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
          <DiscreteSlider
            label="Resolution (Size)"
            value={size}
            options={RESOLUTION_OPTIONS}
            onChange={setSize}
            valueFormatter={(opt) => `${opt.value} px`}
          />
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
                  colorTheme="purple"
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
              <div className="grid grid-cols-1 gap-2">
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
              </div>
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
