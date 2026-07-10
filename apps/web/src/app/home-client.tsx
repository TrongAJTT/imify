"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getWorkspaceToolsMenuGroups,
  renderWorkspaceToolIcon,
} from "@imify/features/workspace-shell/workspace-tools";
import { buildToolEntryHref } from "@/features/presets/tool-entry-route";
import { Button } from "@imify/ui/ui/button";
import { BodyText, Heading, Subheading } from "@imify/ui/ui/typography";
import {
  Github,
  Sparkles,
  Chrome,
  Zap,
  Shield,
  CircleDollarSign,
} from "lucide-react";
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

// Single source of truth: all tools with preview image + optional badge
const TOOL_DEFINITIONS: {
  id: string;
  label: string;
  src: string;
  badge?: "highlight" | "new";
}[] = [
  {
    id: "single-processor",
    label: "Single Processor",
    src: FEATURE_MEDIA_ASSET_PATHS.processor.previewSingleWebp,
  },
  {
    id: "batch-processor",
    label: "Batch Processor",
    src: FEATURE_MEDIA_ASSET_PATHS.processor.previewBatchWebp,
  },
  {
    id: "splicing",
    label: "Image Splicing",
    src: FEATURE_MEDIA_ASSET_PATHS.splicing.previewWebp,
    badge: "highlight",
  },
  {
    id: "splitter",
    label: "Image Splitter",
    src: FEATURE_MEDIA_ASSET_PATHS.splitter.preview1Webp,
    badge: "highlight",
  },
  {
    id: "filling",
    label: "Image Filling",
    src: FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp,
    badge: "highlight",
  },
  {
    id: "pattern-generator",
    label: "Pattern Generator",
    src: FEATURE_MEDIA_ASSET_PATHS.pattern.previewWebp,
  },
  {
    id: "diffchecker",
    label: "Diff Checker",
    src: FEATURE_MEDIA_ASSET_PATHS.diffchecker.previewWebp,
    badge: "highlight",
  },
  {
    id: "inspector",
    label: "Image Inspector",
    src: FEATURE_MEDIA_ASSET_PATHS.inspector.previewWebp,
    badge: "highlight",
  },
  {
    id: "context-menu",
    label: "Context Menu",
    src: FEATURE_MEDIA_ASSET_PATHS.contextMenu.previewWebp,
  },
  {
    id: "background-remover",
    label: "Background Remover",
    src: FEATURE_MEDIA_ASSET_PATHS.remover.preview1Webp,
    badge: "new",
  },
  {
    id: "upscaler",
    label: "AI Upscaler",
    src: FEATURE_MEDIA_ASSET_PATHS.upscaler.previewWebp,
    badge: "new",
  },
  {
    id: "qr-generator",
    label: "QR Generator",
    src: FEATURE_MEDIA_ASSET_PATHS.illustrations.qrGeneratorSvg,
    badge: "new",
  },
  {
    id: "qr-reader",
    label: "QR Reader",
    src: FEATURE_MEDIA_ASSET_PATHS.illustrations.qrReaderSvg,
    badge: "new",
  },
  {
    id: "seo-audit",
    label: "SEO Audit",
    src: FEATURE_MEDIA_ASSET_PATHS.illustrations.seoAuditSvg,
  },
];

// Lookup maps derived from TOOL_DEFINITIONS
const TOOL_PREVIEW_IMAGES = Object.fromEntries(
  TOOL_DEFINITIONS.map((t) => [t.id, t.src]),
) as Record<string, string>;

const TOOL_BADGES = Object.fromEntries(
  TOOL_DEFINITIONS.filter((t) => t.badge).map((t) => [t.id, t.badge!]),
) as Record<string, "highlight" | "new">;

const CAROUSEL_INTERVAL_MS = 3000;

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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [fading, setFading] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const goToSlide = useCallback(
    (next: number) => {
      setPrevIndex(carouselIndex);
      setFading(true);
      setTimeout(() => {
        setCarouselIndex(next);
        setFading(false);
        setPrevIndex(null);
      }, 300);
    },
    [carouselIndex],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide((carouselIndex + 1) % TOOL_DEFINITIONS.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [carouselIndex, goToSlide]);

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
    <div className="space-y-24 py-10 pb-24">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left: copy + CTA */}
          <div className="flex-1 min-w-0 text-center lg:text-left space-y-7">
            <Heading className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1]">
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

            <BodyText className="max-w-xl lg:max-w-none text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mx-auto lg:mx-0">
              {t("heroSubtitle")}
            </BodyText>

            <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start items-center gap-3 pt-2">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-xl px-8 h-12 text-base shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5"
                asChild
              >
                <Link
                  href={buildToolEntryHref(
                    "single-processor",
                    "/single-processor",
                  )}
                  className="flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  <span>{t("startProcessing")}</span>
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-xl px-8 h-12 text-base border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all hover:-translate-y-0.5"
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
              <div className="flex items-center w-full sm:w-auto justify-center">
                <FindOnProductHuntBadge className="w-full sm:w-auto" />
              </div>
            </div>
          </div>

          {/* Right: image carousel */}
          <div className="w-full lg:w-[52%] shrink-0 select-none">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 bg-slate-100 dark:bg-slate-900 aspect-[16/10]">
              {/* Active image */}
              {TOOL_DEFINITIONS.map((slide, idx) => (
                <Image
                  key={slide.id}
                  src={resolveFeatureMediaAssetUrl(slide.src)}
                  alt={slide.label}
                  fill
                  priority={idx === 0}
                  className={`object-cover absolute inset-0 transition-opacity duration-300 ${
                    idx === carouselIndex
                      ? fading
                        ? "opacity-0"
                        : "opacity-100"
                      : idx === prevIndex
                        ? "opacity-0"
                        : "opacity-0 pointer-events-none"
                  }`}
                />
              ))}

              {/* Bottom gradient overlay + label */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <span className="text-white text-xs font-bold uppercase tracking-widest opacity-90">
                  {TOOL_DEFINITIONS[carouselIndex]?.label}
                </span>
                {/* Dot indicators */}
                <div className="flex gap-1.5">
                  {TOOL_DEFINITIONS.map((slide, idx) => (
                    <button
                      key={slide.id}
                      onClick={() => goToSlide(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === carouselIndex
                          ? "bg-white w-4"
                          : "bg-white/40 w-1.5 hover:bg-white/70"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Below carousel: thumbnail strip */}
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {TOOL_DEFINITIONS.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(idx)}
                  className={`relative aspect-video rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                    idx === carouselIndex
                      ? "border-blue-500 shadow-md shadow-blue-500/20"
                      : "border-slate-200 dark:border-slate-800 opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image
                    src={resolveFeatureMediaAssetUrl(slide.src)}
                    alt={slide.label}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section id="tools" className="mx-auto max-w-7xl px-4 space-y-10">
        <div className="text-center space-y-3">
          <Heading className="text-2xl md:text-4xl">{t("toolsTitle")}</Heading>
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
          <Heading className="text-2xl md:text-4xl">{t("whyTitle")}</Heading>
          <BodyText className="mx-auto max-w-2xl text-slate-500 text-lg">
            {t("whyDesc")}
          </BodyText>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px]">
            <div className="flex flex-col items-center text-center bg-white p-8 dark:bg-slate-950">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                <Shield size={22} />
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
                <Zap size={22} />
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
                <Github size={22} />
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
                <CircleDollarSign size={22} />
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
          <Heading className="text-2xl md:text-4xl">{t("compTitle")}</Heading>
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
