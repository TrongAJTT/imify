import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@imify/core/links";
import { FEATURE_MEDIA_ASSET_PATHS } from "@imify/features/shared/media-assets";

export { DEFAULT_OG_IMAGE };

function createRouteMetadata({
  title,
  description,
  image = DEFAULT_OG_IMAGE,
}: {
  title: string;
  description: string;
  image?: string;
}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Imify",
      images: [
        {
          url: image,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export const HOME_SEO_DESCRIPTION =
  "Imify is a fast, privacy-first online image toolkit for conversion, compression, resizing, batch processing, splitting, splicing, pattern generation, and visual inspection directly in your browser.";

export const WEB_ROUTE_METADATA = {
  home: createRouteMetadata({
    title: "Home Web - The Powerful Image Toolkit",
    description: HOME_SEO_DESCRIPTION,
    image: DEFAULT_OG_IMAGE,
  }),
  extension: createRouteMetadata({
    title: "Browser Extension",
    description:
      "Install the Imify browser extension to process web images from the context menu, run in-page image SEO audits, and send assets to Imify workspaces for faster production workflows.",
    image: DEFAULT_OG_IMAGE,
  }),
  singleProcessor: createRouteMetadata({
    title: "Single Processor",
    description:
      "Process a single image with advanced controls for format conversion, compression, resizing, quality tuning, and export settings optimized for web, social, and product workflows.",
    image: FEATURE_MEDIA_ASSET_PATHS.processor.previewSingleWebp,
  }),
  singleProcessorWork: createRouteMetadata({
    title: "Single Processor Workspace",
    description:
      "Open a saved single-processor preset workspace, fine-tune image processing parameters, preview results, and export optimized files with consistent output quality.",
    image: FEATURE_MEDIA_ASSET_PATHS.processor.previewSingleWebp,
  }),
  batchProcessor: createRouteMetadata({
    title: "Batch Processor",
    description:
      "Create and manage reusable batch presets for bulk image conversion, resizing, compression, and naming logic to accelerate large-scale media production.",
    image: FEATURE_MEDIA_ASSET_PATHS.processor.previewBatchWebp,
  }),
  batchProcessorWork: createRouteMetadata({
    title: "Batch Processor Workspace",
    description:
      "Run high-volume image processing jobs from a selected batch preset workspace with predictable settings for format, quality, dimensions, and export structure.",
    image: FEATURE_MEDIA_ASSET_PATHS.processor.previewBatchWebp,
  }),
  splitter: createRouteMetadata({
    title: "Image Splitter",
    description:
      "Build image splitter presets for Instagram carousels, grids, and multi-tile layouts with precise slicing rules and export-ready segments.",
    image: FEATURE_MEDIA_ASSET_PATHS.splitter.preview1Webp,
  }),
  splitterWork: createRouteMetadata({
    title: "Image Splitter Workspace",
    description:
      "Open a selected splitter workspace to slice images into exact tiles, validate alignment, and export assets ready for carousel posts or visual grids.",
    image: FEATURE_MEDIA_ASSET_PATHS.splitter.preview1Webp,
  }),
  splicing: createRouteMetadata({
    title: "Image Splicing",
    description:
      "Create image splicing presets to combine multiple images into structured compositions, long-form visuals, and platform-specific stitched outputs.",
    image: FEATURE_MEDIA_ASSET_PATHS.splicing.previewWebp,
  }),
  splicingWork: createRouteMetadata({
    title: "Image Splicing Workspace",
    description:
      "Open a splicing workspace to arrange source images, control composition order and spacing, and export clean combined outputs for publishing.",
    image: FEATURE_MEDIA_ASSET_PATHS.splicing.previewWebp,
  }),
  collageMaker: createRouteMetadata({
    title: "Collage Maker",
    description:
      "Create quick photo collages with customizable layouts, spacing, aspect ratios, and export options — 100% client-side.",
    image: FEATURE_MEDIA_ASSET_PATHS.collageMaker.previewWebp,
  }),
  patternGenerator: createRouteMetadata({
    title: "Pattern Generator",
    description:
      "Design seamless pattern generator presets from image sources with control over repetition, spacing, and output resolution for branding and backgrounds.",
    image: FEATURE_MEDIA_ASSET_PATHS.pattern.previewWebp,
  }),
  patternGeneratorWork: createRouteMetadata({
    title: "Pattern Generator Workspace",
    description:
      "Open a pattern workspace to generate repeatable textures and seamless backgrounds, then export production-ready pattern assets in your preferred format.",
    image: FEATURE_MEDIA_ASSET_PATHS.pattern.previewWebp,
  }),
  filling: createRouteMetadata({
    title: "Image Filling",
    description:
      "Manage image filling templates and quickly launch fill workflows to place, align, and render visual layers with reusable preset logic.",
    image: FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp,
  }),
  fillingFill: createRouteMetadata({
    title: "Image Filling Workspace",
    description:
      "Open a fill-template workspace to populate target layouts, adjust configuration layers, and generate consistent filled image outputs at scale.",
    image: FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp,
  }),
  fillingEdit: createRouteMetadata({
    title: "Image Filling Editor",
    description:
      "Edit image filling templates with manual visual controls for layer position, boundaries, spacing, and composition behavior before generating output.",
    image: FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp,
  }),
  fillingSymmetricGenerate: createRouteMetadata({
    title: "Image Filling Symmetric Generator",
    description:
      "Generate symmetric fill layouts from a selected template to produce balanced visual compositions suitable for catalogs, ads, and storefront creatives.",
    image: FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp,
  }),
  fillingGridDesign: createRouteMetadata({
    title: "Image Filling Grid Designer",
    description:
      "Generate structured grid-based fill layouts from compact row definitions to build bento-style compositions with reusable template logic.",
    image: FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp,
  }),
  diffchecker: createRouteMetadata({
    title: "Difference Checker",
    description:
      "Compare two images side by side to detect visual differences, validate edits, and quickly catch pixel-level changes before publishing.",
    image: FEATURE_MEDIA_ASSET_PATHS.diffchecker.previewWebp,
  }),
  inspector: createRouteMetadata({
    title: "Image Inspector",
    description:
      "Inspect image metadata, dimensions, and visual properties to verify asset quality, technical consistency, and readiness for delivery channels.",
    image: FEATURE_MEDIA_ASSET_PATHS.inspector.previewWebp,
  }),
  pdfStudio: createRouteMetadata({
    title: "PDF Studio",
    description:
      "Convert images to PDF and extract PDF pages as images directly in your browser. Reorder, set paper size, and choose export DPI — 100% locally with zero server upload.",
    image: FEATURE_MEDIA_ASSET_PATHS.pdfStudio.previewWebp,
  }),
  backgroundRemover: createRouteMetadata({
    title: "Background Remover",
    description:
      "Isolate subjects from their background instantly using state-of-the-art AI that runs entirely on your browser for maximum privacy.",
    image: FEATURE_MEDIA_ASSET_PATHS.remover.preview1Webp,
  }),
  upscaler: createRouteMetadata({
    title: "Upscaler",
    description:
      "Magnify and restore your images locally in your web browser using state-of-the-art super-resolution neural networks.",
    image: FEATURE_MEDIA_ASSET_PATHS.upscaler.previewWebp,
  }),
  qrGenerator: createRouteMetadata({
    title: "QR Generator",
    description:
      "Generate customizable, static QR codes directly in your browser with support for URL, text, contact cards (vCard), Wi-Fi logins, and custom logo embedding.",
    image: FEATURE_MEDIA_ASSET_PATHS.illustrations.qrGeneratorSvg,
  }),
  qrReader: createRouteMetadata({
    title: "QR Reader",
    description:
      "Scan QR codes instantly using your device's camera or by uploading image files (PNG/SVG) to decode links, Wi-Fi details, and contact cards locally.",
    image: FEATURE_MEDIA_ASSET_PATHS.illustrations.qrReaderSvg,
  }),
  recovery: createRouteMetadata({
    title: "Recovery Center",
    description:
      "Emergency troubleshooting tool to resolve data conflicts, clear local caches, and recover application state in Imify.",
    image: DEFAULT_OG_IMAGE,
  }),
  update: createRouteMetadata({
    title: "App Update",
    description:
      "Clear stale caches and refresh Imify Web to load the latest application version.",
    image: DEFAULT_OG_IMAGE,
  }),
} satisfies Record<string, Metadata>;
