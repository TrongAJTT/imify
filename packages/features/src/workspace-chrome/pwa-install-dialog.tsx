"use client";

import React from "react";
import { X, Download, ShieldCheck, Zap, Globe } from "lucide-react";
import { BaseDialog } from "@imify/ui/ui/base-dialog";
import { Button } from "@imify/ui/ui/button";
import { Heading, Kicker, BodyText } from "@imify/ui/ui/typography";
import { useTranslation } from "@imify/i18n";
import { isPwaInstallable, triggerPwaInstall } from "@imify/core";
import { useToast } from "@imify/core/hooks/use-toast";

interface PwaInstallDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PwaInstallDialog({ isOpen, onClose }: PwaInstallDialogProps) {
  const { t } = useTranslation("about");
  const { success, error } = useToast();
  const installable = isPwaInstallable();

  const handleInstall = async () => {
    if (!installable) {
      error("Installation Failed", t("pwaDialog.alreadyInstalled"));
      return;
    }
    const accepted = await triggerPwaInstall();
    if (accepted) {
      success("Installation Initiated", "Imify is installing on your system.");
      onClose();
    } else {
      error("Installation Cancelled", "App installation prompt was declined.");
    }
  };

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="w-full max-w-md rounded-2xl p-6 md:p-8 relative"
    >
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 rounded-full border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 z-10"
        onClick={onClose}
        aria-label="Close install dialog"
      >
        <X size={16} />
      </Button>

      <div className="flex flex-col items-center text-center mt-2">
        <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center text-sky-500 mb-4">
          <Download size={22} />
        </div>

        <Heading className="text-xl font-bold tracking-tight mb-2">
          {t("pwaDialog.title")}
        </Heading>

        <BodyText className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {t("pwaDialog.desc")}
        </BodyText>

        <div className="w-full text-left space-y-4 mb-8 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <Kicker className="text-xs tracking-widest text-slate-400 dark:text-slate-500">
            {t("pwaDialog.benefitTitle")}
          </Kicker>

          <div className="space-y-3">
            <div className="flex gap-3">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {t("pwaDialog.benefit1")}
              </span>
            </div>
            <div className="flex gap-3">
              <Zap size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {t("pwaDialog.benefit2")}
              </span>
            </div>
            <div className="flex gap-3">
              <Globe size={16} className="text-sky-500 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {t("pwaDialog.benefit3")}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
          >
            {t("pwaDialog.btnCancel")}
          </Button>
          <Button
            variant="default"
            className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/10"
            onClick={handleInstall}
            disabled={!installable}
          >
            {t("pwaDialog.btnInstall")}
          </Button>
        </div>

        {!installable && (
          <p className="text-[10px] text-amber-600 dark:text-amber-500/80 font-medium mt-3">
            {t("pwaDialog.alreadyInstalled")}
          </p>
        )}
      </div>
    </BaseDialog>
  );
}
