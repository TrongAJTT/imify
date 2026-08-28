"use client";

import React, { useState } from "react";
import {
  CloudDownload,
  ShieldCheck,
  Wifi,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button, BodyText, MutedText, Subheading, BaseDialog } from "@imify/ui";
import { type GoogleFontCurated } from "../../shared/font-service";
import { useTranslation } from "@imify/i18n";

interface DownloadFontDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  font: GoogleFontCurated;
}

export function DownloadFontDialog({
  isOpen,
  onClose,
  onConfirm,
  font,
}: DownloadFontDialogProps) {
  const { t } = useTranslation("workspace");
  const [agreed, setAgreed] = useState(false);
  const licenseUrl = `https://fonts.google.com/specimen/${font.family.replace(/\s+/g, "+")}/license`;

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      contentClassName="w-full p-0 overflow-hidden"
    >
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 rounded-full flex items-center justify-center text-violet-500">
            <CloudDownload size={32} />
          </div>
          <div className="space-y-1">
            <Subheading className="text-xl font-bold">
              {t("assets.downloadDialog.title")}
            </Subheading>
            <MutedText className="text-sm">
              {font.family} (
              {font.defaultWeight === 700 ? "Bold 700" : "Regular 400"})
            </MutedText>
          </div>
        </div>

        {/* Font Info Table */}
        <div className="space-y-3">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium tracking-tight">
                {t("assets.downloadDialog.source")}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {t("assets.downloadDialog.library")}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium tracking-tight">
                {t("assets.downloadDialog.size")}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                ~20 KB - 50 KB
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium tracking-tight">
                {t("assets.downloadDialog.license")}
              </span>
              <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                {font.license}
                <a
                  href={licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-500 hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 px-1">
            <Info size={12} className="text-violet-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-500 italic leading-relaxed">
              {t("assets.downloadDialog.directDownloadNote")}
            </p>
          </div>
        </div>

        {/* Details and Cards */}
        <div className="space-y-4">
          <div className="flex gap-3 items-start p-3 rounded-lg border border-amber-100 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5">
            <ShieldCheck className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <BodyText className="text-[11px] font-semibold !text-amber-800 dark:!text-amber-400">
                {t("assets.downloadDialog.privacyTitle")}
              </BodyText>
              <MutedText className="text-[10px] leading-relaxed !text-amber-700/80 dark:!text-amber-400/80">
                {t("assets.downloadDialog.privacyDesc")}
              </MutedText>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 rounded-lg border border-sky-100 bg-sky-50/50 dark:border-sky-500/20 dark:bg-sky-500/5">
            <Wifi className="text-sky-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <BodyText className="text-[11px] font-semibold !text-sky-800 dark:!text-sky-400">
                {t("assets.downloadDialog.connectionTitle")}
              </BodyText>
              <MutedText className="text-[10px] leading-relaxed !text-sky-700/80 dark:!text-sky-400/80">
                {t("assets.downloadDialog.connectionDesc")}
              </MutedText>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer group select-none">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 bg-white transition-all checked:border-violet-500 checked:bg-violet-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <svg
                className="absolute left-1 top-1 h-3 w-3 fill-white opacity-0 transition-opacity peer-checked:opacity-100"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
              {t("assets.downloadDialog.agreementPrefix")}
              <a
                href={licenseUrl}
                target="_blank"
                rel="noreferrer"
                className="text-violet-500 hover:underline"
              >
                {t("assets.downloadDialog.agreementLink")}
              </a>
              .
            </span>
          </label>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
        <Button variant="ghost" onClick={onClose} className="flex-1">
          {t("assets.downloadDialog.cancel")}
        </Button>
        <Button
          variant="default"
          onClick={onConfirm}
          disabled={!agreed}
          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
        >
          {t("assets.downloadDialog.download")}
        </Button>
      </div>
    </BaseDialog>
  );
}
