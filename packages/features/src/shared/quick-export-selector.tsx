import React from "react";
import { Download, FileText, Info } from "lucide-react";
import { AccordionCard, TextInput, MutedText } from "@imify/ui";
import type { QuickExportFormat } from "@imify/core";

export interface QuickExportSelectorProps {
  format: QuickExportFormat;
  onFormatChange: (format: QuickExportFormat) => void;
  fileNamePattern?: string;
  onFileNamePatternChange?: (pattern: string) => void;
  availableFormats?: QuickExportFormat[];
  label?: string;
  sublabel?: string;
  theme?: "pink" | "blue" | "purple" | "amber" | "sky" | "orange";
  defaultOpen?: boolean;
}

const ALL_FORMAT_OPTIONS: {
  id: QuickExportFormat;
  label: string;
  badge?: string;
  desc: string;
}[] = [
  {
    id: "png",
    label: "PNG",
    badge: "100%",
    desc: "Nét tuyệt đối, hỗ trợ nền trong suốt (Alpha)",
  },
  {
    id: "jpg",
    label: "JPG",
    badge: "92%",
    desc: "Tối ưu dung lượng nhẹ, phù hợp ảnh chụp/chia sẻ",
  },
  {
    id: "webp",
    label: "WEBP",
    badge: "88%",
    desc: "Định dạng web hiện đại, dung lượng siêu nhỏ",
  },
  {
    id: "webp-lossless",
    label: "WEBP",
    badge: "Lossless",
    desc: "Nét tuyệt đối 100%, nhẹ hơn PNG, giữ nền trong suốt",
  },
];

export function QuickExportSelector({
  format,
  onFormatChange,
  fileNamePattern,
  onFileNamePatternChange,
  availableFormats = ["png", "jpg", "webp", "webp-lossless"],
  label = "Định dạng xuất tệp",
  sublabel,
  theme = "sky",
  defaultOpen = true,
}: QuickExportSelectorProps) {
  const visibleOptions = ALL_FORMAT_OPTIONS.filter((opt) =>
    availableFormats.includes(opt.id)
  );

  const activeMeta = ALL_FORMAT_OPTIONS.find((opt) => opt.id === format);

  return (
    <AccordionCard
      label={label}
      sublabel={sublabel || `Đang chọn: ${format.toUpperCase()}`}
      icon={<Download size={16} />}
      defaultOpen={defaultOpen}
      colorTheme={theme}
      childrenClassName="p-3 space-y-3"
    >
      <div>
        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
          Chọn định dạng
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {visibleOptions.map((opt) => {
            const isSelected = format === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onFormatChange(opt.id)}
                className={`relative flex items-center justify-between px-2.5 py-2 rounded-md border text-left transition-all ${
                  isSelected
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-100 font-semibold shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <span className="text-xs">{opt.label}</span>
                {opt.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      isSelected
                        ? "bg-sky-200 dark:bg-sky-800 text-sky-800 dark:text-sky-200"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {opt.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {activeMeta && (
        <div className="flex items-start gap-2 p-2.5 rounded bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
          <Info size={14} className="text-sky-500 shrink-0 mt-0.5" />
          <MutedText className="text-[11px] leading-tight">
            {activeMeta.desc}
          </MutedText>
        </div>
      )}

      {onFileNamePatternChange && fileNamePattern !== undefined && (
        <div>
          <TextInput
            label="Mẫu tên tệp xuất"
            value={fileNamePattern}
            onChange={(e: any) =>
              onFileNamePatternChange(typeof e === "string" ? e : e.target?.value || "")
            }
            placeholder="[OriginalName]"
          />
        </div>
      )}
    </AccordionCard>
  );
}
