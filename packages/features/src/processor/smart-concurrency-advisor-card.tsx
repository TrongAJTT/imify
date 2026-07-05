import React, { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Settings2,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

import type { FormatCodecOptions } from "@imify/core/types";
import { Button, ControlledPopover } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import {
  calculateConcurrencyAdvisor,
  type AdvisorTargetFormat,
  type ConcurrencyAdvisorResult,
  type PerformancePreferences,
} from "./performance-preferences";
import { usePopoverTriggerBehavior } from "./use-popover-trigger-behavior";

interface SmartConcurrencyAdvisorCardProps {
  advisor?: ConcurrencyAdvisorResult;
  targetFormat: AdvisorTargetFormat;
  selectedConcurrency: number;
  formatOptions?: FormatCodecOptions;
  performancePreferences: PerformancePreferences;
  onApplyRecommended?: (value: number) => void;
  onOpenSettings?: () => void;
  disabled?: boolean;
}

const TONE_MAP = {
  optimal: {
    chip: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
    popover:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950 dark:text-emerald-200",
    subtle: "text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  caution: {
    chip: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700/70 dark:bg-amber-950/20 dark:text-amber-200 dark:hover:bg-amber-900/30",
    popover:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/70 dark:bg-slate-900 dark:text-amber-100",
    subtle: "text-amber-700 dark:text-amber-200",
    icon: Zap,
  },
  danger: {
    chip: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-700/70 dark:bg-rose-950/20 dark:text-rose-200 dark:hover:bg-rose-900/35",
    popover:
      "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700/70 dark:bg-slate-900 dark:text-rose-100",
    subtle: "text-rose-700 dark:text-rose-200",
    icon: AlertTriangle,
  },
} as const;

function translateReason(reason: string, t: any): string {
  if (reason === "Custom resize")
    return t("concurrencyAdvisor.reasons.customResize", {
      defaultValue: reason,
    });
  if (reason === "Resize cover crop")
    return t("concurrencyAdvisor.reasons.resizeCover", {
      defaultValue: reason,
    });
  if (reason === "Resize contain")
    return t("concurrencyAdvisor.reasons.resizeContain", {
      defaultValue: reason,
    });
  if (reason === "Paper-size resize")
    return t("concurrencyAdvisor.reasons.paperSizeResize", {
      defaultValue: reason,
    });
  if (reason.startsWith("Resize scale ")) {
    const scale = reason.replace("Resize scale ", "").replace("%", "");
    return t("concurrencyAdvisor.reasons.resizeScale", {
      scale,
      defaultValue: reason,
    });
  }
  if (reason === "Resize enabled")
    return t("concurrencyAdvisor.reasons.resizeEnabled", {
      defaultValue: reason,
    });
  if (reason === "Lanczos3 resampling")
    return t("concurrencyAdvisor.reasons.lanczos3", { defaultValue: reason });
  if (reason === "Magic Kernel resampling")
    return t("concurrencyAdvisor.reasons.magicKernel", {
      defaultValue: reason,
    });
  if (reason === "HQX resampling")
    return t("concurrencyAdvisor.reasons.hqx", { defaultValue: reason });
  if (reason === "MozJPEG progressive scan")
    return t("concurrencyAdvisor.reasons.mozjpegProgressive", {
      defaultValue: reason,
    });
  if (reason === "MozJPEG 4:4:4 chroma")
    return t("concurrencyAdvisor.reasons.mozjpegChroma444", {
      defaultValue: reason,
    });
  if (reason === "MozJPEG 4:2:2 chroma")
    return t("concurrencyAdvisor.reasons.mozjpegChroma422", {
      defaultValue: reason,
    });
  if (reason.startsWith("AVIF speed ")) {
    const speed = reason.replace("AVIF speed ", "").split(" ")[0];
    return t("concurrencyAdvisor.reasons.avifSpeed", {
      speed,
      defaultValue: reason,
    });
  }
  if (reason === "AVIF lossless")
    return t("concurrencyAdvisor.reasons.avifLossless", {
      defaultValue: reason,
    });
  if (reason === "AVIF high alpha quality")
    return t("concurrencyAdvisor.reasons.avifHighAlpha", {
      defaultValue: reason,
    });
  if (reason === "AVIF alpha quality >=95")
    return t("concurrencyAdvisor.reasons.avifAlpha95", {
      defaultValue: reason,
    });
  if (reason === "AVIF chroma 4:2:2")
    return t("concurrencyAdvisor.reasons.avifChroma422", {
      defaultValue: reason,
    });
  if (reason === "AVIF chroma 4:4:4")
    return t("concurrencyAdvisor.reasons.avifChroma444", {
      defaultValue: reason,
    });
  if (reason.startsWith("JXL effort ")) {
    const effort = reason.replace("JXL effort ", "");
    return t("concurrencyAdvisor.reasons.jxlEffort", {
      effort,
      defaultValue: reason,
    });
  }
  if (reason === "JXL lossless")
    return t("concurrencyAdvisor.reasons.jxlLossless", {
      defaultValue: reason,
    });
  if (reason === "JXL progressive")
    return t("concurrencyAdvisor.reasons.jxlProgressive", {
      defaultValue: reason,
    });
  if (reason.startsWith("JXL EPF ")) {
    const epf = reason.replace("JXL EPF ", "");
    return t("concurrencyAdvisor.reasons.jxlEpf", {
      epf,
      defaultValue: reason,
    });
  }
  if (reason === "PNG tiny mode")
    return t("concurrencyAdvisor.reasons.pngTiny", { defaultValue: reason });
  if (reason.startsWith("PNG dithering ")) {
    const dither = reason.replace("PNG dithering ", "").replace("%", "");
    return t("concurrencyAdvisor.reasons.pngDither", {
      dither,
      defaultValue: reason,
    });
  }
  if (reason === "OxiPNG compression")
    return t("concurrencyAdvisor.reasons.oxipng", { defaultValue: reason });
  if (reason === "PNG progressive interlaced")
    return t("concurrencyAdvisor.reasons.pngInterlaced", {
      defaultValue: reason,
    });
  if (reason === "PNG clean transparent pixels")
    return t("concurrencyAdvisor.reasons.pngCleanTransparent", {
      defaultValue: reason,
    });
  if (reason === "PNG auto grayscale")
    return t("concurrencyAdvisor.reasons.pngGrayscale", {
      defaultValue: reason,
    });
  if (reason.startsWith("WebP effort ")) {
    const effort = reason.replace("WebP effort ", "");
    return t("concurrencyAdvisor.reasons.webpEffort", {
      effort,
      defaultValue: reason,
    });
  }
  if (reason === "WebP lossless")
    return t("concurrencyAdvisor.reasons.webpLossless", {
      defaultValue: reason,
    });
  if (reason === "WebP Sharp YUV")
    return t("concurrencyAdvisor.reasons.webpSharpYuv", {
      defaultValue: reason,
    });
  if (reason === "WebP preserve exact alpha")
    return t("concurrencyAdvisor.reasons.webpExactAlpha", {
      defaultValue: reason,
    });
  if (reason === "BMP 32-bit")
    return t("concurrencyAdvisor.reasons.bmp32", { defaultValue: reason });
  if (reason === "BMP 1-bit dithering")
    return t("concurrencyAdvisor.reasons.bmp1Dither", { defaultValue: reason });
  if (reason === "TIFF grayscale")
    return t("concurrencyAdvisor.reasons.tiffGrayscale", {
      defaultValue: reason,
    });
  if (reason.startsWith("ICO ") && reason.endsWith(" layers")) {
    const count = reason.replace("ICO ", "").replace(" layers", "");
    return t("concurrencyAdvisor.reasons.icoLayers", {
      count,
      defaultValue: reason,
    });
  }
  if (reason === "ICO web toolkit")
    return t("concurrencyAdvisor.reasons.icoWebkit", { defaultValue: reason });
  if (reason === "ICO internal PNG optimization")
    return t("concurrencyAdvisor.reasons.icoInternalPng", {
      defaultValue: reason,
    });

  return reason;
}

export function SmartConcurrencyAdvisorCard({
  advisor: advisorOverride,
  targetFormat,
  selectedConcurrency,
  formatOptions,
  performancePreferences,
  onApplyRecommended,
  onOpenSettings,
  disabled,
}: SmartConcurrencyAdvisorCardProps) {
  const { t } = useTranslation("processor");

  const advisor = useMemo(
    () =>
      advisorOverride ??
      calculateConcurrencyAdvisor({
        targetFormat,
        selectedConcurrency,
        formatOptions,
        preferences: performancePreferences,
        t,
      }),
    [
      advisorOverride,
      targetFormat,
      selectedConcurrency,
      formatOptions,
      performancePreferences,
      t,
    ],
  );

  const ToneIcon = TONE_MAP[advisor.riskLevel].icon;

  const riskLabel =
    advisor.riskLevel === "optimal"
      ? t("concurrencyAdvisor.riskOptimal")
      : advisor.riskLevel === "caution"
        ? t("concurrencyAdvisor.riskCaution")
        : t("concurrencyAdvisor.riskDanger");

  const TriggerIcon = advisor.usingFallbackProfile ? Gauge : Sparkles;
  const popoverBehavior = usePopoverTriggerBehavior();

  return (
    <ControlledPopover
      trigger={
        <button
          type="button"
          className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[10px] font-semibold transition-colors ${TONE_MAP[advisor.riskLevel].chip}`}
          disabled={disabled}
        >
          <TriggerIcon size={10} />
          <span>{riskLabel}</span>
        </button>
      }
      preset="inspector"
      behavior={popoverBehavior}
      contentClassName={`z-[9999] w-[320px] rounded-md border p-3 shadow-xl ${TONE_MAP[advisor.riskLevel].popover}`}
    >
      <div className="space-y-2 text-xs">
        <p className="flex items-center gap-1.5 font-semibold">
          {advisor.usingFallbackProfile ? (
            <Gauge size={14} />
          ) : (
            <ToneIcon size={14} />
          )}
          <span>{advisor.advisorName}</span>
        </p>
        <p className="font-semibold">
          {t("concurrencyAdvisor.recommended", {
            recommended: advisor.recommended,
            min: advisor.recommendedMin,
            max: advisor.recommendedMax,
          })}
        </p>
        <p className={TONE_MAP[advisor.riskLevel].subtle}>
          {advisor.summaryText}
        </p>
        <p className="leading-relaxed">{advisor.statusText}</p>
        <p className="text-slate-600 dark:text-slate-400">
          {advisor.detailText}
        </p>
        {advisor.reasons.length > 0 && (
          <p className="leading-relaxed">
            {t("concurrencyAdvisor.heavyFactors", {
              factors: advisor.reasons
                .slice(0, 3)
                .map((r) => translateReason(r, t))
                .join(", "),
            })}
          </p>
        )}
        {advisor.usingFallbackProfile && onOpenSettings && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onOpenSettings}
            disabled={disabled}
            className="w-full border-2"
          >
            <Settings2 size={14} />
            {t("concurrencyAdvisor.enableSmartAdvisor")}
          </Button>
        )}
        {onApplyRecommended && selectedConcurrency !== advisor.recommended && (
          <Button
            type="button"
            size="sm"
            variant={advisor.riskLevel === "danger" ? "warning" : "outline"}
            onClick={() => onApplyRecommended(advisor.recommended)}
            disabled={disabled}
            className="w-full mt-2 border-2"
          >
            <Wand2 size={14} />
            {t("concurrencyAdvisor.applyRecommended", {
              recommended: advisor.recommended,
            })}
          </Button>
        )}
      </div>
    </ControlledPopover>
  );
}
