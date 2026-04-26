import type { Metadata } from "next"

type SeoMetadataEntry = Pick<Metadata, "title" | "description">

export const WEB_ROUTE_METADATA = {
  home: {
    title: "Home",
    description:
      "Imify is a fast, privacy-first online image toolkit for conversion, compression, resizing, batch processing, splitting, splicing, pattern generation, and visual inspection directly in your browser."
  },
  extension: {
    title: "Browser Extension",
    description:
      "Install the Imify browser extension to process web images from the context menu, run in-page image SEO audits, and send assets to Imify workspaces for faster production workflows."
  },
  singleProcessor: {
    title: "Single Processor",
    description:
      "Process a single image with advanced controls for format conversion, compression, resizing, quality tuning, and export settings optimized for web, social, and product workflows."
  },
  singleProcessorWork: {
    title: "Single Processor Workspace",
    description:
      "Open a saved single-processor preset workspace, fine-tune image processing parameters, preview results, and export optimized files with consistent output quality."
  },
  batchProcessor: {
    title: "Batch Processor",
    description:
      "Create and manage reusable batch presets for bulk image conversion, resizing, compression, and naming logic to accelerate large-scale media production."
  },
  batchProcessorWork: {
    title: "Batch Processor Workspace",
    description:
      "Run high-volume image processing jobs from a selected batch preset workspace with predictable settings for format, quality, dimensions, and export structure."
  },
  splitter: {
    title: "Image Splitter",
    description:
      "Build image splitter presets for Instagram carousels, grids, and multi-tile layouts with precise slicing rules and export-ready segments."
  },
  splitterWork: {
    title: "Image Splitter Workspace",
    description:
      "Open a selected splitter workspace to slice images into exact tiles, validate alignment, and export assets ready for carousel posts or visual grids."
  },
  splicing: {
    title: "Image Splicing",
    description:
      "Create image splicing presets to combine multiple images into structured compositions, long-form visuals, and platform-specific stitched outputs."
  },
  splicingWork: {
    title: "Image Splicing Workspace",
    description:
      "Open a splicing workspace to arrange source images, control composition order and spacing, and export clean combined outputs for publishing."
  },
  patternGenerator: {
    title: "Pattern Generator",
    description:
      "Design seamless pattern generator presets from image sources with control over repetition, spacing, and output resolution for branding and backgrounds."
  },
  patternGeneratorWork: {
    title: "Pattern Generator Workspace",
    description:
      "Open a pattern workspace to generate repeatable textures and seamless backgrounds, then export production-ready pattern assets in your preferred format."
  },
  filling: {
    title: "Image Filling",
    description:
      "Manage image filling templates and quickly launch fill workflows to place, align, and render visual layers with reusable preset logic."
  },
  fillingFill: {
    title: "Image Filling Workspace",
    description:
      "Open a fill-template workspace to populate target layouts, adjust configuration layers, and generate consistent filled image outputs at scale."
  },
  fillingEdit: {
    title: "Image Filling Editor",
    description:
      "Edit image filling templates with manual visual controls for layer position, boundaries, spacing, and composition behavior before generating output."
  },
  fillingSymmetricGenerate: {
    title: "Image Filling Symmetric Generator",
    description:
      "Generate symmetric fill layouts from a selected template to produce balanced visual compositions suitable for catalogs, ads, and storefront creatives."
  },
  diffchecker: {
    title: "Difference Checker",
    description:
      "Compare two images side by side to detect visual differences, validate edits, and quickly catch pixel-level changes before publishing."
  },
  inspector: {
    title: "Image Inspector",
    description:
      "Inspect image metadata, dimensions, and visual properties to verify asset quality, technical consistency, and readiness for delivery channels."
  }
} satisfies Record<string, SeoMetadataEntry>
