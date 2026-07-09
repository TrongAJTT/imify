"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getWorkspaceToolsMenuGroups,
  renderWorkspaceToolIcon,
} from "@imify/features/workspace-shell/workspace-tools";
import { buildToolEntryHref } from "@/features/presets/tool-entry-route";
import { Button } from "@imify/ui/ui/button";
import {
  BodyText,
  Heading,
  MutedText,
  Subheading,
} from "@imify/ui/ui/typography";
import { ChevronRight, Sparkles, Chrome } from "lucide-react";
import {
  FEATURE_MEDIA_ASSET_PATHS,
  resolveFeatureMediaAssetUrl,
} from "@imify/features/shared/media-assets";
import { FindOnProductHuntBadge } from "@/features/community/find-us-badges";
import { YoutubePlayerSection } from "@/features/community/youtube-player-section";
import { FaqSection } from "@/features/community/faq-section";
import { useTranslation, Trans } from "@imify/i18n";

function CapabilityItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-4 bg-white p-5 dark:bg-slate-950">
      <Subheading className="text-xl text-blue-600 dark:text-blue-400">
        {title}
      </Subheading>
      <BodyText className="text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </BodyText>
    </div>
  );
}

const TOOL_PREVIEW_IMAGES: Record<string, string> = {
  "single-processor": FEATURE_MEDIA_ASSET_PATHS.processor.previewSingleWebp,
  "batch-processor": FEATURE_MEDIA_ASSET_PATHS.processor.previewBatchWebp,
  splitter: FEATURE_MEDIA_ASSET_PATHS.splitter.preview1Webp,
  splicing: FEATURE_MEDIA_ASSET_PATHS.splicing.previewWebp,
  filling: FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp,
  "pattern-generator": FEATURE_MEDIA_ASSET_PATHS.pattern.previewWebp,
  diffchecker: FEATURE_MEDIA_ASSET_PATHS.diffchecker.previewWebp,
  inspector: FEATURE_MEDIA_ASSET_PATHS.inspector.previewWebp,
  "background-remover": FEATURE_MEDIA_ASSET_PATHS.remover.preview1Webp,
  upscaler: FEATURE_MEDIA_ASSET_PATHS.upscaler.previewWebp,
  "context-menu": FEATURE_MEDIA_ASSET_PATHS.contextMenu.previewWebp,
  "qr-generator": FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng,
  "qr-reader": FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng,
  "seo-audit": FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng,
};

const TOOL_BADGES: Record<string, "highlight" | "new"> = {
  splicing: "highlight",
  splitter: "highlight",
  filling: "highlight",
  diffchecker: "highlight",
  inspector: "highlight",
  "qr-reader": "new",
  "qr-generator": "new",
  "background-remover": "new",
  upscaler: "new",
};

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  badge?: {
    label: string;
    bg: string;
    accent: string;
  } | null;
}

function ToolCard({
  id,
  title,
  description,
  image,
  href,
  badge,
}: ToolCardProps) {
  return (
    <Link
      href={buildToolEntryHref(id, href)}
      className="group relative flex flex-row sm:flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 transition-all hover:shadow-lg hover:border-slate-350 dark:hover:border-slate-700"
    >
      {/* Image container */}
      <div className="relative w-1/3 sm:w-full aspect-[16/9] overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900 border-r sm:border-r-0 sm:border-b border-slate-200 dark:border-slate-800">
        <Image
          src={resolveFeatureMediaAssetUrl(image)}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Badge */}
        {badge && (
          <div
            className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badge.bg} ${badge.accent} shadow-sm z-10`}
          >
            {badge.label}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3.5 sm:p-5 flex flex-col justify-between min-w-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-slate-500 dark:text-slate-400">
              {renderWorkspaceToolIcon(id, 16)}
            </span>
            <Subheading className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </Subheading>
          </div>
          <BodyText className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">
            {description}
          </BodyText>
        </div>
      </div>
    </Link>
  );
}

export function HomeClient() {
  const { t, i18n } = useTranslation(["homepage", "workspace"]);
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const toolGroups = useMemo(
    () => getWorkspaceToolsMenuGroups(isMounted ? undefined : "en"),
    [i18n.language, isMounted],
  );
  const allTools = useMemo(
    () => toolGroups.flatMap((group) => group.items),
    [toolGroups],
  );

  const toolDescriptions = useMemo<Record<string, string>>(
    () => ({
      "single-processor": t("tools.singleProcessor.desc"),
      "batch-processor": t("tools.batchProcessor.desc"),
      splicing: t("tools.splicing.desc"),
      splitter: t("tools.splitter.desc"),
      filling: t("tools.filling.desc"),
      "pattern-generator": t("tools.patternGenerator.desc"),
      diffchecker: t("tools.diffchecker.desc"),
      inspector: t("tools.inspector.desc"),
      "context-menu": t("tools.contextMenu.desc"),
      "seo-audit": t("tools.seoAudit.desc"),
      "background-remover": t("tools.backgroundRemover.desc"),
      upscaler: t("tools.upscaler.desc"),
      "qr-generator": t("tools.qrGenerator.desc"),
      "qr-reader": t("tools.qrReader.desc"),
    }),
    [t],
  );

  const capabilityItems = useMemo(
    () => [
      {
        id: "conversion",
        title: t("capabilities.conversionTitle"),
        description: t("capabilities.conversionDesc"),
      },
      {
        id: "layouts",
        title: t("capabilities.layoutsTitle"),
        description: t("capabilities.layoutsDesc"),
      },
      {
        id: "inspector",
        title: t("capabilities.inspectorTitle"),
        description: t("capabilities.inspectorDesc"),
      },
      {
        id: "watermark",
        title: t("capabilities.watermarkTitle"),
        description: t("capabilities.watermarkDesc"),
      },
    ],
    [t],
  );

  return (
    <div className="space-y-24 py-12 pb-24">
      {/* Hero Section */}
      <section className="mx-auto max-w-4xl text-center space-y-8 px-4">
        <Heading className="text-5xl md:text-6xl font-extrabold tracking-tight">
          <Trans
            i18nKey="heroTitle"
            ns="homepage"
            t={t as any}
            components={{
              1: (
                <span
                  key="hero-highlight"
                  className="text-blue-600 dark:text-blue-500"
                />
              ),
            }}
          />
        </Heading>
        <BodyText className="mx-auto max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-400">
          {t("heroSubtitle")}
        </BodyText>
        <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-4 pt-4 px-4">
          <Button
            size="lg"
            className="w-full md:w-auto rounded-xl px-8 h-12 text-base shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5"
            asChild
          >
            <Link
              href={buildToolEntryHref("single-processor", "/single-processor")}
              className="flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              <span>{t("startProcessing")}</span>
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full md:w-auto rounded-xl px-8 h-12 text-base border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all hover:-translate-y-0.5"
            asChild
          >
            <Link
              href="/extension"
              className="flex items-center justify-center gap-2"
            >
              <Chrome size={18} />
              <span>{t("viewExtension")}</span>
            </Link>
          </Button>
          <div className="flex items-center w-full md:w-auto justify-center">
            <FindOnProductHuntBadge className="w-full md:w-auto" />
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section id="tools" className="mx-auto max-w-7xl px-4 space-y-10">
        <div className="text-center space-y-3">
          <Heading className="text-3xl md:text-4xl">{t("toolsTitle")}</Heading>
          <BodyText className="mx-auto max-w-3xl text-slate-500 text-lg dark:text-slate-400">
            {t("toolsDesc")}
          </BodyText>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allTools.map((tool) => {
            const badgeType = TOOL_BADGES[tool.id];
            let badge = null;
            if (badgeType === "new") {
              badge = {
                label: t("badges.new", "New"),
                bg: "bg-emerald-50 dark:bg-emerald-950/80",
                accent:
                  "text-emerald-600 dark:text-emerald-450 border border-emerald-200/50 dark:border-emerald-800/40",
              };
            } else if (badgeType === "highlight") {
              badge = {
                label: t("badges.highlight", "Highlight"),
                bg: "bg-blue-50 dark:bg-blue-950/80",
                accent:
                  "text-blue-600 dark:text-blue-450 border border-blue-200/50 dark:border-blue-800/40",
              };
            }

            const previewImage =
              TOOL_PREVIEW_IMAGES[tool.id] ||
              FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng;

            return (
              <ToolCard
                key={tool.id}
                id={tool.id}
                title={tool.label}
                description={
                  toolDescriptions[tool.id] || `${tool.label} workspace.`
                }
                image={previewImage}
                href={tool.href}
                badge={badge}
              />
            );
          })}
        </div>
      </section>

      {/* Video Demo Section */}
      <YoutubePlayerSection />

      {/* Features/Highlights Section */}
      <section className="mx-auto max-w-6xl space-y-10 px-4">
        <div className="text-center space-y-4">
          <Heading className="text-3xl md:text-4xl">{t("whyTitle")}</Heading>
          <BodyText className="mx-auto max-w-2xl text-slate-500 text-lg">
            {t("whyDesc")}
          </BodyText>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px]">
            <div className="flex flex-col items-center text-center bg-white p-8 dark:bg-slate-950">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <Subheading className="text-xl mb-2">
                {t("privacyTitle")}
              </Subheading>
              <BodyText className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t("privacyDesc")}
              </BodyText>
            </div>
            <div className="flex flex-col items-center text-center bg-white p-8 dark:bg-slate-950">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <Subheading className="text-xl mb-2">
                {t("experienceTitle")}
              </Subheading>
              <BodyText className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t("experienceDesc")}
              </BodyText>
            </div>
            <div className="flex flex-col items-center text-center bg-white p-8 dark:bg-slate-950">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </div>
              <Subheading className="text-xl mb-2">
                {t("openSourceTitle")}
              </Subheading>
              <BodyText className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t("openSourceDesc")}
              </BodyText>
            </div>
            <div className="flex flex-col items-center text-center bg-white p-8 dark:bg-slate-950">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                <svg
                  xmlns="http://www.w3.org/2000/xl"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2v20" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <Subheading className="text-xl mb-2">{t("freeTitle")}</Subheading>
              <BodyText className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t("freeDesc")}
              </BodyText>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Tool Capabilities */}
      <section className="mx-auto max-w-5xl px-4 space-y-10">
        <div className="text-center space-y-4">
          <Heading className="text-3xl md:text-4xl">{t("compTitle")}</Heading>
          <BodyText className="text-slate-500 text-lg">
            {t("compDesc")}
          </BodyText>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px]">
            {capabilityItems.map((item) => (
              <CapabilityItem
                key={item.id}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection />
    </div>
  );
}
