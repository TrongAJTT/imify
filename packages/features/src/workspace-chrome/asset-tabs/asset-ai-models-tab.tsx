"use client";

import React, { useEffect, useState } from "react";
import {
  Trash2,
  Image,
  Cpu,
  Download,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { AccordionCard, Button, BodyText, MutedText } from "@imify/ui";
import { formatFileSize } from "@imify/core";
import {
  BACKGROUND_REMOVAL_MODELS,
  type AIModelMetadata,
} from "../../background-removal/models";
import {
  IMAGE_UPSCALER_MODELS,
  resolveHuggingFaceRepoId,
} from "../../upscaler/models";
import { ModelDownloadDialog } from "../../background-removal/model-download-dialog";
import { toast, confirmDialog } from "@imify/stores";
import { useTranslation } from "@imify/i18n";

export function AssetAIModelsTab() {
  const { t } = useTranslation(["workspace", "common"]);
  const [cachedModelIds, setCachedModelIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [modelToDownload, setModelToDownload] =
    useState<AIModelMetadata | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  const MODEL_CATEGORIES = [
    {
      id: "background-remover",
      label: t("tools.backgroundRemover.label"),
      icon: <Image size={16} className="text-pink-500" />,
      models: BACKGROUND_REMOVAL_MODELS,
    },
    {
      id: "upscaler",
      label: t("tools.upscaler.label"),
      icon: <Sparkles size={16} className="text-indigo-500" />,
      models: IMAGE_UPSCALER_MODELS,
    },
  ];

  const allModels = MODEL_CATEGORIES.flatMap((cat) => cat.models);

  const checkCache = async () => {
    setIsLoading(true);
    try {
      const cache = await caches.open("transformers-cache");
      const keys = await cache.keys();
      const cachedIds = new Set<string>();

      for (const model of allModels) {
        const isUpscaler = IMAGE_UPSCALER_MODELS.some((m) => m.id === model.id);
        const repoId = isUpscaler
          ? resolveHuggingFaceRepoId(model.id).toLowerCase()
          : model.id.toLowerCase();

        for (const variant of model.variants) {
          // A variant is considered cached ONLY if its primary ONNX weights file exists.
          // This prevents false positives from shared metadata files like config.json.
          const isCached = keys.some((request) => {
            const url = request.url.toLowerCase();
            if (!url.includes(repoId)) return false;

            // We only care about the weights files for status checking
            if (!url.endsWith(".onnx")) return false;

            if (variant.quantized) return url.includes("quantized");
            if (variant.dtype === "fp16") return url.includes("fp16");

            // For full precision (usually fp32), it should not have special suffixes in the weights filename
            return !url.includes("quantized") && !url.includes("fp16");
          });

          if (isCached) {
            cachedIds.add(`${model.id}:${variant.id}`);
          }
        }
      }

      setCachedModelIds(cachedIds);
    } catch (error) {
      console.error("Failed to check AI model cache:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkCache();
  }, []);

  const handleDelete = async (model: AIModelMetadata, variant: any) => {
    const shouldDelete = await confirmDialog({
      title: t("assets.aiModels.deleteConfirm", {
        name: model.name,
        variant: variant.label,
      }),
      variant: "destructive",
    });
    if (!shouldDelete) return;

    try {
      const cache = await caches.open("transformers-cache");
      const keys = await cache.keys();

      const isUpscaler = IMAGE_UPSCALER_MODELS.some((m) => m.id === model.id);
      const repoId = isUpscaler
        ? resolveHuggingFaceRepoId(model.id).toLowerCase()
        : model.id.toLowerCase();

      for (const request of keys) {
        const url = request.url.toLowerCase();
        if (!url.includes(repoId)) continue;

        let shouldDelete = false;
        if (variant.quantized) {
          shouldDelete = url.includes("quantized");
        } else if (variant.dtype === "fp16") {
          shouldDelete = url.includes("fp16");
        } else {
          // For full precision, delete files that don't have other variant markers
          // Note: this might delete shared files like config.json, which is okay as they are small
          // and will be re-downloaded if another variant needs them.
          shouldDelete = !url.includes("quantized") && !url.includes("fp16");
        }

        if (shouldDelete) {
          await cache.delete(request);
        }
      }

      await checkCache();
      toast.success(
        t("assets.aiModels.deletedTitle"),
        t("assets.aiModels.deletedDesc", {
          variant: variant.label,
          name: model.name,
        }),
      );
    } catch (err) {
      console.error("Failed to delete model cache:", err);
      toast.error(
        t("assets.aiModels.deleteFailedTitle"),
        t("assets.aiModels.deleteFailedDesc"),
      );
    }
  };

  const handleDownloadConfirm = async () => {
    if (!modelToDownload) return;
    const model = modelToDownload;
    const variantId = selectedVariantId;
    setModelToDownload(null);

    const variant =
      model.variants.find((v) => v.id === variantId) || model.variants[0];
    toast.success(
      t("assets.aiModels.downloadStartedTitle"),
      t("assets.aiModels.downloadStartedDesc", {
        name: model.name,
        variant: variant.label,
      }),
    );

    try {
      const isUpscaler = IMAGE_UPSCALER_MODELS.some((m) => m.id === model.id);
      const workerUrl = isUpscaler
        ? new URL("../../upscaler/image-upscaler.worker.ts", import.meta.url)
        : new URL(
            "../../background-removal/background-removal.worker.ts",
            import.meta.url,
          );

      const worker = new Worker(workerUrl, { type: "module" });

      if (isUpscaler) {
        const repoId = resolveHuggingFaceRepoId(model.id);

        worker.postMessage({
          action: "warm-up",
          payload: {
            options: {
              modelId: repoId,
              dtype: variant.dtype,
              quantized: variant.quantized,
            },
          },
        });

        worker.onmessage = async (e) => {
          if (e.data.action === "warm-up-complete") {
            toast.success(
              t("assets.aiModels.readyTitle"),
              t("assets.aiModels.readyDesc", {
                name: model.name,
                variant: variant.label,
              }),
            );
            setTimeout(async () => {
              await checkCache();
            }, 500);
            worker.terminate();
          } else if (e.data.action === "error") {
            toast.error(
              t("assets.aiModels.downloadFailedTitle"),
              t("assets.aiModels.downloadFailedDesc", { name: model.name }),
            );
            worker.terminate();
          }
        };
      } else {
        // Standard background removal model
        worker.postMessage({
          action: "warm-up",
          payload: {
            options: {
              modelId: model.id,
              dtype: variant.dtype,
              quantized: variant.quantized,
            },
          },
        });

        worker.onmessage = async (e) => {
          if (e.data.action === "warm-up-complete") {
            toast.success(
              t("assets.aiModels.readyTitle"),
              t("assets.aiModels.readyDesc", {
                name: model.name,
                variant: variant.label,
              }),
            );
            setTimeout(async () => {
              await checkCache();
            }, 500);
            worker.terminate();
          } else if (e.data.action === "error") {
            toast.error(
              t("assets.aiModels.downloadFailedTitle"),
              t("assets.aiModels.downloadFailedDesc", { name: model.name }),
            );
            worker.terminate();
          }
        };
      }
    } catch (err) {
      console.error("Failed to start download:", err);
      toast.error(
        t("assets.aiModels.downloadFailedTitle"),
        t("assets.aiModels.downloadInitFailedDesc"),
      );
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/80 dark:bg-slate-950/40">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4 md:space-y-6">
          {/* Header Info Accordion Card */}
          <AccordionCard
            icon={<Cpu size={16} />}
            label={t("assets.aboutAiTitle")}
            sublabel={
              t("assets.aiDesc").length > 80
                ? `${t("assets.aiDesc").slice(0, 80)}...`
                : t("assets.aiDesc")
            }
            colorTheme="purple"
            defaultOpen={
              typeof window !== "undefined" ? window.innerWidth >= 640 : true
            }
          >
            <div className="space-y-2">
              <MutedText className="text-xs text-slate-600 dark:text-purple-300/80 leading-relaxed">
                {t("assets.aiDesc")}
              </MutedText>
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-900/40 border border-purple-100 dark:border-purple-700">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${typeof SharedArrayBuffer !== "undefined" ? "bg-green-500" : "bg-amber-500"}`}
                  />
                  <span className="text-[9px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-tight">
                    {typeof SharedArrayBuffer !== "undefined"
                      ? t("assets.multiThreadActive")
                      : t("assets.asyncifyFallback")}
                  </span>
                </div>
              </div>
            </div>
          </AccordionCard>

          {MODEL_CATEGORIES.map((category) => {
            const isCollapsed = collapsedCategories.has(category.id);

            return (
              <div key={category.id} className="space-y-4">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center justify-between gap-2.5 px-1 py-1 group cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2.5">
                    {category.icon}
                    <Subheading className="text-sm font-extrabold tracking-tight uppercase text-slate-800 dark:text-slate-200">
                      {category.label}
                    </Subheading>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {category.models.length}
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronRight
                      size={16}
                      className="text-slate-400 group-hover:text-pink-500 transition-colors"
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                      className="text-slate-400 group-hover:text-pink-500 transition-colors"
                    />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    {category.models.map((model) => (
                      <div
                        key={model.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col gap-6"
                      >
                        {/* Header: Model Main Info */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-3">
                              <BodyText className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                {model.name}
                              </BodyText>
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                {model.source}
                              </span>
                            </div>
                            <MutedText className="text-sm leading-relaxed max-w-3xl text-slate-600 dark:text-slate-400">
                              {model.description}
                            </MutedText>
                            <div className="flex items-center gap-3 pt-1">
                              <a
                                href={model.authorUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-pink-500 hover:text-pink-600 font-bold transition-colors"
                              >
                                by {model.author}
                              </a>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                              <MutedText className="text-xs font-medium">
                                {model.license} License
                              </MutedText>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                              <MutedText className="text-xs font-medium text-green-600">
                                Suitable for: {model.usecase}
                              </MutedText>
                            </div>
                          </div>
                        </div>

                        {/* Variant Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {model.variants.map((variant) => {
                            const isCached = cachedModelIds.has(
                              `${model.id}:${variant.id}`,
                            );

                            return (
                              <div
                                key={variant.id}
                                className={`group relative p-4 rounded-xl border transition-all duration-300 flex flex-col justify-start gap-1.5 ${
                                  isCached
                                    ? "bg-emerald-50/20 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/30 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.12)]"
                                    : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] hover:border-pink-300 dark:hover:border-pink-500/40"
                                }`}
                              >
                                {/* Absolute Action Button (Only show delete button when cached; hide download button since loading is managed inline inside tools) */}
                                {isCached && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      handleDelete(model, variant);
                                    }}
                                    className="absolute top-2.5 right-2.5 h-8 w-8 rounded-xl shrink-0 border transition-all z-10 bg-emerald-50 border-emerald-100 text-emerald-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-red-500/20 shadow-sm"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                )}

                                {/* Variant Header: Label & Size */}
                                <div className="flex items-start justify-between gap-3 pr-10">
                                  <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
                                    <BodyText
                                      className={`text-[13px] font-black whitespace-nowrap tracking-tight ${isCached ? "text-emerald-700 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"}`}
                                    >
                                      {variant.label}
                                    </BodyText>
                                    <span
                                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${
                                        isCached
                                          ? "bg-emerald-100/50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                                          : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                      }`}
                                    >
                                      {formatFileSize(variant.sizeBytes)}
                                    </span>
                                    {isCached && (
                                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse shrink-0" />
                                    )}
                                  </div>
                                </div>

                                {/* Variant Footer: Description */}
                                {variant.description && (
                                  <MutedText className="text-[12px] leading-relaxed italic font-medium opacity-80 text-slate-500 dark:text-slate-400 break-words">
                                    {variant.description}
                                  </MutedText>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {modelToDownload && (
          <ModelDownloadDialog
            isOpen={!!modelToDownload}
            onClose={() => setModelToDownload(null)}
            onConfirm={handleDownloadConfirm}
            model={modelToDownload}
            variantId={selectedVariantId}
            confirmLabel={t("common:download")}
          />
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <MutedText className="text-xs italic font-medium text-slate-500">
          {t("assets.aiModels.cacheNote")}
        </MutedText>
        <Button
          variant="outline"
          size="sm"
          onClick={checkCache}
          className="h-9 px-4 text-xs font-bold border-slate-200 hover:bg-slate-50 transition-colors"
        >
          {t("common:refresh")}
        </Button>
      </div>
    </div>
  );
}
function Subheading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-slate-900 dark:text-slate-100 ${className}`}>
      {children}
    </h3>
  );
}
