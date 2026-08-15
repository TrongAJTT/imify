import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { APP_CONFIG } from "@imify/core/config";
import { useBatchStore } from "@imify/stores/stores/batch-store";
import { Button, BodyText, Subheading, MutedText } from "@imify/ui";

interface SplicingHeavyPreviewQualityDialogProps {
  isOpen: boolean;
  nextQualityPercent?: number;
  imageCount: number;
  totalPixels: number;
  onClose: () => void;
  onConfirm: (dontShowAgain?: boolean) => void;
}

import { useTranslation } from "@imify/i18n";

export function SplicingHeavyPreviewQualityDialog({
  isOpen,
  nextQualityPercent = 50,
  imageCount,
  totalPixels,
  onClose,
  onConfirm,
}: SplicingHeavyPreviewQualityDialogProps) {
  const { t } = useTranslation("splicing");
  const setSkipSplicingHeavyPreviewQualityWarning = useBatchStore(
    (s) => s.setSkipSplicingHeavyPreviewQualityWarning,
  );
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const fmtM = (n: number) => (n / 1_000_000).toFixed(1);
  const {
    HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT,
    HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS,
  } = APP_CONFIG.SPLICING;

  const handleConfirm = () => {
    if (dontShowAgain) {
      setSkipSplicingHeavyPreviewQualityWarning(true);
    }
    onConfirm(dontShowAgain);
    onClose();
    setDontShowAgain(false);
  };

  const handleClose = () => {
    onClose();
    setDontShowAgain(false);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 shrink-0">
                <AlertTriangle size={26} />
              </div>
              <Subheading className="text-xl">
                {t("heavyDialog.title")}
              </Subheading>
            </div>
            <BodyText className="text-slate-600 dark:text-slate-400">
              {t("heavyDialog.description", { percent: nextQualityPercent })}
            </BodyText>
            <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
              <li>
                {t("heavyDialog.imagesLoaded")}{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {imageCount}
                </span>{" "}
                {t("heavyDialog.warningIfOver", {
                  threshold: HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT,
                })}
              </li>
              <li>
                {t("heavyDialog.combinedArea")}{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  ~{fmtM(totalPixels)}M px²
                </span>{" "}
                {t("heavyDialog.warningIfOver", {
                  threshold: `~${fmtM(HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS)}M px²`,
                })}
              </li>
            </ul>
            <label className="flex items-center gap-2.5 cursor-pointer group w-fit select-none pt-2">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-slate-300 text-sky-500 focus:ring-sky-500/20 w-4 h-4 cursor-pointer transition-all"
              />
              <MutedText className="text-xs group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                {t("heavyDialog.dontShowAgain")}
              </MutedText>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="text-sm px-4"
          >
            {t("heavyDialog.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            className="text-sm px-5 bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20"
          >
            {t("heavyDialog.useQuality", { percent: nextQualityPercent })}
          </Button>
        </div>
      </div>
    </div>
  );
}
