"use client";

import React from "react";
import { ExternalLink, X } from "lucide-react";
import { ATTRIBUTION_CATEGORIES } from "@imify/core/attributions";
import { Button } from "@imify/ui/ui/button";
import { BaseDialog } from "@imify/ui/ui/base-dialog";
import { Tooltip } from "@imify/ui/ui/tooltip";
import { resolveFeatureMediaAssetUrl } from "../shared/media-assets";
import { useTranslation } from "react-i18next";

interface AttributionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AttributionDialog({ isOpen, onClose }: AttributionDialogProps) {
  const { t } = useTranslation("about");
  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="w-full h-[calc(100dvh-2rem)] max-w-3xl rounded-lg p-6"
    >
      <Button
        variant="outline"
        size="icon"
        className="absolute top-6 right-6 rounded-full border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all z-10"
        onClick={onClose}
      >
        <X size={18} />
      </Button>
      <div className="flex flex-col gap-1 mb-6">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {t("attributionDialog.title")}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          {t("attributionDialog.subtitle")}
        </p>
      </div>
      <div className="flex flex-col gap-6 h-[calc(100dvh-13.25rem)] overflow-y-auto pr-2 custom-scrollbar py-1">
        {ATTRIBUTION_CATEGORIES.map((category) => (
          <div key={category.id} className="space-y-3">
            {/* Sticky header */}
            <div className="sticky top-[-5px] bg-white dark:bg-slate-900 z-10 py-2 flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {category.label}
              </span>
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            </div>

            {category.id === "media" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex flex-col rounded-xl border border-slate-200/65 dark:border-slate-800 bg-white dark:bg-slate-950/20 overflow-hidden group hover:border-sky-500/50 hover:bg-sky-500/5 transition-all duration-300 shadow-sm"
                  >
                    {item.image && (
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveFeatureMediaAssetUrl(item.image)}
                          alt={item.name}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-black tracking-wider shadow">
                          {item.license}
                        </span>
                      </div>
                    )}

                    <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                      <div>
                        <span className="block font-bold text-slate-900 dark:text-slate-100 text-[13px] tracking-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors uppercase">
                          {item.name}
                        </span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase">
                          By: {item.author}
                        </span>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-sky-500/10 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-800 transition-all duration-300 group-hover:border-sky-500/30"
                      >
                        <span>View Source</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.items.map((item) => (
                  <Tooltip
                    key={item.name}
                    label={item.name}
                    content={`● By: ${item.author}
                    ● License: ${item.license}`}
                    variant="wide1"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col p-4 rounded-md border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-950/20 hover:border-sky-500/50 hover:bg-sky-500/5 hover:-translate-y-0.5 transition-all duration-300 group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-[13px] tracking-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors uppercase truncate pr-2">
                          {item.name}
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center shrink-0 group-hover:bg-sky-500/10 transition-colors">
                          <ExternalLink
                            size={10}
                            className="text-slate-400 group-hover:text-sky-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate pr-2 uppercase">
                          By: {item.author}
                        </span>
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                          {item.license}
                        </span>
                      </div>
                    </a>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </BaseDialog>
  );
}
