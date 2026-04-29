import React from "react"

import type { SetupContext } from "@imify/stores/stores/batch-store"
import { PresetInfoShowcasePanel } from "../shared/preset-info-showcase-panel"

interface ProcessorPresetInfoPanelProps {
  context: SetupContext
}

export function ProcessorPresetInfoPanel({ context }: ProcessorPresetInfoPanelProps) {
  if (context === "single") {
    return (
      <PresetInfoShowcasePanel
        previewSrc="/assets/features/preview-single_processor.webp"
        previewAlt="Single Processor preview"
        previewAspectRatio="16 / 9"
        title="Single Processor in one view"
        subtitle="Optimize one image with live preview, conversion, resize, watermark, EXIF policy, and smart export naming."
        tips={[
          "You can start instantly by pasting from clipboard or importing an image URL.",
          "Enable watermark to apply copyright protection before conversion.",
          "Turn on Strip EXIF when you need to remove camera or location metadata.",
          "Use Split View to quickly detect over-compression artifacts.",
          "For transparent assets, compare WebP and PNG to balance quality and file size."
        ]}
        featureChips={[
          "Format Convert",
          "Resize and Crop",
          "Watermark",
          "Quality Tuning",
          "Strip EXIF",
          "Smart Rename",
          "Live Compare"
        ]}
        faqs={[
          {
            question: "What is the difference between Single and Batch Processor?",
            answer: "Single Processor is built for one-image iterative optimization with live visual feedback. Batch Processor applies the same preset strategy to multiple files."
          },
          {
            question: "How can I import an image into this tool?",
            answer: "You can drag and drop, browse from disk, paste from clipboard, import by image URL, or send an image from Image Inspector optimize actions."
          },
          {
            question: "Why is preview unavailable for some outputs?",
            answer: "Some output formats are not directly previewable in the browser. Processing still succeeds and you can verify the final result after download."
          },
          {
            question: "Why do Single and Batch share many settings?",
            answer: "Both tools use the same configuration store so presets stay consistent between single-image and batch workflows."
          }
        ]}
      />
    )
  }

  return (
    <PresetInfoShowcasePanel
      previewSrc="/assets/features/preview-batch_processor.webp"
      previewAlt="Batch Processor preview"
      previewAspectRatio="39 / 35"
      title="Batch Processor for high-throughput workflows"
      subtitle="Queue many files, process in parallel, monitor progress, and export results as ZIP, PDF merge, or individual files."
      tips={[
        "Paste multiple images from clipboard or import many URLs directly into the queue.",
        "Use failed mode to retry only errored items instead of rerunning the full queue.",
        "If the concurrency field is locked, your current preset or device guardrails are enforcing a safe range.",
        "Use Smart Advisor to get a recommended worker count, then apply it directly to avoid unstable spikes.",
        "Heavy formats like AVIF or PDF export can increase memory pressure on low-spec devices.",
        "After processing, choose the best export strategy: ZIP, merge to one PDF, or individual files."
      ]}
      featureChips={[
        "Parallel Processing",
        "ZIP and PDF Export",
        "Smart Retry",
        "Format and Resize",
        "OOM Guard",
        "Smart Naming"
      ]}
      faqs={[
        {
          question: "How is Batch Processor different from Single Processor?",
          answer: "Batch Processor is optimized for throughput and queue execution across many files. Single Processor focuses on one-image iterative preview and fine-grained tuning."
        },
        {
          question: "What are my export options after a batch run?",
          answer: "You can download one ZIP, export files one by one, merge all supported outputs into one PDF, or package individual PDFs in a ZIP."
        },
        {
          question: "What does the OOM warning mean?",
          answer: "It is a safety guard that warns when total queued size exceeds the recommended threshold. Split the queue into smaller runs for better stability."
        },
        {
          question: "Why is concurrency locked in my preset?",
          answer: "A lock means your current profile is constrained by safety rules or managed preset settings. This helps prevent browser instability when file size, format complexity, or device limits are high."
        },
        {
          question: "How should I choose the right concurrency value?",
          answer: "Start with Smart Advisor and keep the value inside its recommended range. Increase gradually only when your runs stay stable, and lower it if you see memory warnings or failed conversions."
        },
        {
          question: "Can I pause or cancel while processing?",
          answer: "Yes. You can pause, resume, or request cancellation safely from the batch action bar."
        }
      ]}
    />
  )
}

