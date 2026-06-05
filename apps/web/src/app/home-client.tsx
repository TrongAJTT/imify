"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  getWorkspaceToolsMenuGroups,
  renderWorkspaceToolIcon
} from "@imify/features/workspace-shell/workspace-tools"
import { buildToolEntryHref } from "@/features/presets/tool-entry-route"
import { Button } from "@imify/ui/ui/button"
import { BodyText, Heading, MutedText, Subheading } from "@imify/ui/ui/typography"
import { ChevronRight, Sparkles, Chrome } from "lucide-react"
import { FEATURE_MEDIA_ASSET_PATHS, resolveFeatureMediaAssetUrl } from "@imify/features/shared/media-assets"
import { FindOnProductHuntBadge } from "@/features/community/find-us-badges"
import { YoutubePlayerSection } from "@/features/community/youtube-player-section"
import { FaqSection } from "@/features/community/faq-section"
import { useTranslation } from "@imify/i18n"

function CapabilityItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-4 bg-white p-10 dark:bg-slate-950">
      <Subheading className="text-xl text-blue-600 dark:text-blue-400">{title}</Subheading>
      <BodyText className="text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </BodyText>
    </div>
  )
}

interface HighlightFeature {
  id: string
  title: string
  description: string
  image: string
  href: string
  accent: string
  bg: string
}

function HighlightFeatureCard({
  title,
  description,
  image,
  href,
  accent,
  bg,
  id
}: HighlightFeature) {
  return (
    <Link
      href={buildToolEntryHref(id, href)}
      className="group block relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1"
    >
      <div className="aspect-[16/10] relative overflow-hidden bg-slate-100 dark:bg-slate-900">
        <Image
          src={resolveFeatureMediaAssetUrl(image)}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="border-t border-slate-200 dark:border-slate-800 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Subheading className="text-2xl font-bold">{title}</Subheading>
          <ChevronRight size={16} className={`transition-colors ${accent} transition-transform group-hover:translate-x-1`} />
        </div>
        <BodyText className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          {description}
        </BodyText>
      </div>
      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${bg} ${accent}`}>
        Highlight Feature
      </div>
    </Link>
  )
}

export function HomeClient() {
  const { t, i18n } = useTranslation(["homepage", "workspace"])

  const toolGroups = useMemo(() => getWorkspaceToolsMenuGroups(), [i18n.language])
  const allTools = useMemo(() => toolGroups.flatMap((group) => group.items), [toolGroups])

  const toolDescriptions = useMemo<Record<string, string>>(() => ({
    "single-processor": t("tools.singleProcessor.desc", { defaultValue: "Optimize individual images with professional-grade controls." }),
    "batch-processor": t("tools.batchProcessor.desc", { defaultValue: "Process thousands of images instantly with smart automated presets." }),
    "splicing": t("tools.splicing.desc", { defaultValue: "Combine multiple images into stunning, cohesive layout compositions." }),
    "splitter": t("tools.splitter.desc", { defaultValue: "Slice images into perfect grids or carousels for social media." }),
    "filling": t("tools.filling.desc", { defaultValue: "Smartly pad or fill images to perfectly match any target aspect ratio." }),
    "pattern-generator": t("tools.patternGenerator.desc", { defaultValue: "Generate beautiful, seamless repeating patterns from any image source." }),
    "diffchecker": t("tools.diffchecker.desc", { defaultValue: "Compare two images side-by-side to detect pixel-perfect differences." }),
    "inspector": t("tools.inspector.desc", { defaultValue: "Deep dive into hidden metadata, GPS data, and color palettes." }),
    "context-menu": t("tools.contextMenu.desc", { defaultValue: "Customize your browser-wide quick-access image processing workflow." }),
    "seo-audit": t("tools.seoAudit.desc", { defaultValue: "Audit and optimize web images for maximum search engine performance." })
  }), [t])

  const capabilityItems = useMemo(() => [
    {
      title: t("capabilities.conversionTitle", { defaultValue: "Format Conversion & Optimization" }),
      description: t("capabilities.conversionDesc", { defaultValue: "Convert between PNG, JPEG, WebP, AVIF, and JPEG XL. Adjust quality, strip EXIF metadata for privacy, and fine-tune advanced encoder settings to get the perfect balance of size and quality." })
    },
    {
      title: t("capabilities.layoutsTitle", { defaultValue: "Layouts & Splitting" }),
      description: t("capabilities.layoutsDesc", { defaultValue: "Seamlessly slice images for social media carousels, or splice multiple images together into beautiful bento grids and vertical strips. Perfect for content creators and designers." })
    },
    {
      title: t("capabilities.inspectorTitle", { defaultValue: "Advanced Inspection" }),
      description: t("capabilities.inspectorDesc", { defaultValue: "Uncover hidden metadata, extract GPS coordinates, view the dominant color palette, and check the web performance metrics of your images with our deep Image Inspector." })
    },
    {
      title: t("capabilities.watermarkTitle", { defaultValue: "Watermarking & Resizing" }),
      description: t("capabilities.watermarkDesc", { defaultValue: "Protect your intellectual property with customizable text or image watermarks. Smart resize your images to specific dimensions while maintaining aspect ratios." })
    }
  ], [t])

  const highlightFeatures = useMemo<HighlightFeature[]>(() => [
    {
      id: "batch-processor",
      title: t("features.batchTitle", { defaultValue: "Batch Processor" }),
      description: t("features.batchDesc", { defaultValue: "Scale your workflow by processing thousands of images in parallel. Convert, resize, and optimize in one go with zero server lag." }),
      image: FEATURE_MEDIA_ASSET_PATHS.processor.previewBatchWebp,
      href: "/batch-processor",
      accent: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-800"
    },
    {
      id: "splicing",
      title: t("features.splicingTitle", { defaultValue: "Image Splicing" }),
      description: t("features.splicingDesc", { defaultValue: "Stitch images into beautiful bento grids or vertical strips. Perfect for social media layouts and visual storyboards." }),
      image: FEATURE_MEDIA_ASSET_PATHS.splicing.previewWebp,
      href: "/splicing",
      accent: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-800"
    },
    {
      id: "splitter",
      title: t("features.splitterTitle", { defaultValue: "Image Splitter" }),
      description: t("features.splitterDesc", { defaultValue: "Slice images into perfect grids or carousels for Instagram and social media. Visual guides help you cut with precision." }),
      image: FEATURE_MEDIA_ASSET_PATHS.splitter.preview2Webp,
      href: "/splitter",
      accent: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-50 dark:bg-pink-800"
    },
    {
      id: "filling",
      title: t("features.fillingTitle", { defaultValue: "Image Filling" }),
      description: t("features.fillingDesc", { defaultValue: "Smartly pad or fill images to perfectly match any target aspect ratio without cropping important content." }),
      image: FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp,
      href: "/filling",
      accent: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-800"
    },
    {
      id: "diffchecker",
      title: t("features.diffTitle", { defaultValue: "Difference Checker" }),
      description: t("features.diffDesc", { defaultValue: "Detect pixel-level variations between images. Compare quality, compression artifacts, and visual changes with precision." }),
      image: FEATURE_MEDIA_ASSET_PATHS.diffchecker.previewWebp,
      href: "/diffchecker",
      accent: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-800"
    },
    {
      id: "inspector",
      title: t("features.inspectorTitle", { defaultValue: "Image Inspector" }),
      description: t("features.inspectorDesc", { defaultValue: "Deep audit of hidden metadata, EXIF data, GPS coordinates, and color palettes. Protect your privacy easily." }),
      image: FEATURE_MEDIA_ASSET_PATHS.inspector.previewWebp,
      href: "/inspector",
      accent: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-800"
    }
  ], [t])

  return (
    <div className="space-y-24 py-12 pb-24">
      {/* Hero Section */}
      <section className="mx-auto max-w-4xl text-center space-y-8 px-4">
        <Heading className="text-5xl md:text-6xl font-extrabold tracking-tight">
          {t("heroTitle", { defaultValue: "The Powerful Image Toolkit Built for Your Browser" })}
        </Heading>
        <BodyText className="mx-auto max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-400">
          {t("heroSubtitle", { defaultValue: "Fast, private, and fully client-side. Convert formats, resize, batch process, split, splice, and inspect images without ever uploading them to a server." })}
        </BodyText>
        <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-4 pt-4 px-4">
          <Button size="lg" className="w-full md:w-auto rounded-xl px-8 h-12 text-base shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5" asChild>
            <Link href={buildToolEntryHref("single-processor", "/single-processor")} className="flex items-center justify-center gap-2">
              <Sparkles size={18} />
              <span>{t("startProcessing", { defaultValue: "Start Processing Your Images" })}</span>
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full md:w-auto rounded-xl px-8 h-12 text-base border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all hover:-translate-y-0.5" asChild>
            <Link href="/extension" className="flex items-center justify-center gap-2">
              <Chrome size={18} />
              <span>{t("viewExtension", { defaultValue: "View Extension" })}</span>
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
          <Heading className="text-3xl md:text-4xl">{t("toolsTitle", { defaultValue: "Everything You Need in One Place" })}</Heading>
          <BodyText className="mx-auto max-w-3xl text-slate-500 text-lg">
            {t("toolsDesc", { defaultValue: "Explore our comprehensive suite of professional-grade image processing tools." })}
          </BodyText>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[1px]">
            {allTools.map((tool) => (
              <Link
                key={tool.id}
                href={buildToolEntryHref(tool.id, tool.href)}
                className="group flex flex-col items-center text-center bg-white p-8 transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50">
                  {renderWorkspaceToolIcon(tool.id, 28)}
                </div>
                <Subheading className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
                  {tool.label}
                </Subheading>
                <MutedText className="line-clamp-3 text-xs leading-relaxed opacity-80 font-medium">
                  {toolDescriptions[tool.id] || `${tool.label} workspace.`}
                </MutedText>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <YoutubePlayerSection />

      {/* Features/Highlights Section */}
      <section className="mx-auto max-w-6xl space-y-10 px-4">
        <div className="text-center space-y-4">
          <Heading className="text-3xl md:text-4xl">{t("whyTitle", { defaultValue: "Why Choose Imify?" })}</Heading>
          <BodyText className="mx-auto max-w-2xl text-slate-500 text-lg">
            {t("whyDesc", { defaultValue: "We designed Imify to be the only image utility you'll ever need. Here is what makes it stand out." })}
          </BodyText>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px]">
            <div className="flex flex-col items-center text-center bg-white p-8 dark:bg-slate-950">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
              <Subheading className="text-xl mb-2">{t("privacyTitle", { defaultValue: "100% Privacy" })}</Subheading>
              <BodyText className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t("privacyDesc", { defaultValue: "All processing happens directly in your browser. Your images never leave your device." })}
              </BodyText>
            </div>
            <div className="flex flex-col items-center text-center bg-white p-8 dark:bg-slate-950">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              </div>
              <Subheading className="text-xl mb-2">{t("experienceTitle", { defaultValue: "Seamless experience" })}</Subheading>
              <BodyText className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t("experienceDesc", { defaultValue: "No more upload/download wait times. Apply edits, convert formats, and download results instantly." })}
              </BodyText>
            </div>
            <div className="flex flex-col items-center text-center bg-white p-8 dark:bg-slate-950">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </div>
              <Subheading className="text-xl mb-2">{t("openSourceTitle", { defaultValue: "Open Source" })}</Subheading>
              <BodyText className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t("openSourceDesc", { defaultValue: "Built with transparency and community in mind. All code is publicly available on GitHub for review." })}
              </BodyText>
            </div>
            <div className="flex flex-col items-center text-center bg-white p-8 dark:bg-slate-950">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                <svg xmlns="http://www.w3.org/2000/xl" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
              <Subheading className="text-xl mb-2">{t("freeTitle", { defaultValue: "100% Free" })}</Subheading>
              <BodyText className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t("freeDesc", { defaultValue: "No limits, no subscriptions. All premium features are available to everyone without paywalls." })}
              </BodyText>
            </div>
          </div>
        </div>
      </section>

      {/* Top Features Showcase */}
      <section className="mx-auto max-w-[1400px] px-4 space-y-12">
        <div className="text-center space-y-4">
          <Heading className="text-4xl md:text-5xl">{t("proTitle", { defaultValue: "Tools Built for Professionals" })}</Heading>
          <BodyText className="mx-auto max-w-2xl text-slate-500 text-lg">
            {t("proDesc", { defaultValue: "Experience the precision of high-performance image processing with our signature tools." })}
          </BodyText>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {highlightFeatures.map((feature) => (
            <HighlightFeatureCard key={feature.id} {...feature} />
          ))}
        </div>
      </section>

      {/* Detailed Tool Capabilities */}
      <section className="mx-auto max-w-5xl px-4 space-y-10">
        <div className="text-center space-y-4">
          <Heading className="text-3xl md:text-4xl">{t("compTitle", { defaultValue: "Comprehensive Capabilities" })}</Heading>
          <BodyText className="text-slate-500 text-lg">{t("compDesc", { defaultValue: "Deep dive into what our core modules can do." })}</BodyText>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px]">
            {capabilityItems.map((item) => (
              <CapabilityItem key={item.title} title={item.title} description={item.description} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection />
    </div>
  )
}
