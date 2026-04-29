import React from "react"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"

interface SplicingPresetInfoPanelProps {
  compact?: boolean
}

const SPLICING_PANEL_CONTENT = {
  previewSrc: "/assets/features/preview-image_splicing.webp",
  previewAlt: "Image Splicing preview",
  previewAspectRatio: "16 / 9",
  title: "Image Splicing for visual composition workflows",
  subtitle: "Combine multiple images into stitched, grid, or bento layouts with advanced styling and export controls.",
  tips: [
    "Your active preset auto-syncs layout, style, and export changes after a short debounce.",
    "Lower preview quality when working with many high-resolution images to reduce RAM and CPU pressure.",
    "You can export as a single combined image, split outputs per row or per column, then download as ZIP or PDF.",
    "Import is flexible: drag and drop, file picker, and clipboard paste are all supported."
  ],
  featureChips: [
    "Stitch, Grid, Bento Layouts",
    "Fine-Grained Canvas Styling",
    "Interactive Preview",
    "ZIP and PDF Export",
    "Worker Pool Concurrency",
    "Full Preset Sync"
  ],
  faqs: [
    {
      question: "What is Image Splicing best for?",
      answer: "It is ideal for combining multiple images into one structured composition, such as long vertical strips, visual boards, social-ready grids, and bento-style layouts."
    },
    {
      question: "How does preset behavior work in this tool?",
      answer: "Each preset stores complete layout, visual styling, and export configuration. While you edit in workspace mode, changes are auto-synced back to the active preset."
    },
    {
      question: "Why does the app warn before large one-by-one downloads?",
      answer: "One-by-one export can trigger many browser download events. The confirmation step is a safety guard to prevent accidental heavy download bursts."
    },
    {
      question: "Can I export to PDF as well as image formats?",
      answer: "Yes. You can export as merged PDF or individual PDFs, in addition to image outputs and ZIP packaging."
    },
    {
      question: "Which layout presets are supported out of the box?",
      answer: "The tool supports Stitch Vertical, Stitch Horizontal, Grid, and Bento presets. Each preset changes how rows/columns are formed and how images flow inside each group."
    },
    {
      question: "What does Flow Split Overflow do in Bento mode?",
      answer: "When enabled, oversized items can be split across flow boundaries instead of forcing a hard wrap. This helps keep group sizing more balanced in constrained layouts."
    },
    {
      question: "What is the difference between per-row and per-col export?",
      answer: "Per-row exports one file per horizontal group, while per-col exports one file per vertical group. It is useful when you want modular outputs instead of one merged canvas."
    },
    {
      question: "When should I enable Trim Background?",
      answer: "Enable Trim Background when exporting grouped outputs to reduce extra empty padding around each exported segment. Keep it off if you need consistent outer canvas margins."
    },
    {
      question: "Does Preview Quality affect final export quality?",
      answer: "No. Preview Quality only controls rendering load in the editor for smoother interaction. Final export still uses your export format, codec settings, and target quality."
    }
  ]
}

export function SplicingPresetInfoPanel({ compact = false }: SplicingPresetInfoPanelProps) {
  if (compact) {
    return <PresetInfoShowcasePanel {...SPLICING_PANEL_CONTENT} />
  }

  return <PresetInfoShowcasePanel {...SPLICING_PANEL_CONTENT} />
}



