"use client"

import React from "react"
import { FileOutput, Images } from "lucide-react"
import { useTranslation } from "@imify/i18n"
import type { PdfStudioMode } from "./types"

interface PdfStudioModeSwitcherProps {
  mode: PdfStudioMode
  onModeChange: (mode: PdfStudioMode) => void
  disabled?: boolean
}

export function PdfStudioModeSwitcher({
  mode,
  onModeChange,
  disabled = false
}: PdfStudioModeSwitcherProps) {
  const { t } = useTranslation("pdfStudio")

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/80">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onModeChange("images-to-pdf")}
        className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
          mode === "images-to-pdf"
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <Images size={15} className={mode === "images-to-pdf" ? "text-red-500" : ""} />
        <span>{t("modeSwitcher.imagesToPdf")}</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onModeChange("pdf-to-images")}
        className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
          mode === "pdf-to-images"
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <FileOutput size={15} className={mode === "pdf-to-images" ? "text-red-500" : ""} />
        <span>{t("modeSwitcher.pdfToImages")}</span>
      </button>
    </div>
  )
}
