import React from "react";
import { Download, Info } from "lucide-react";
import { AccordionCard, TextInput, Tooltip, TooltipTableContent } from "@imify/ui";
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
  const safeFormat = (format || "png") as QuickExportFormat;
  const visibleOptions = ALL_FORMAT_OPTIONS.filter((opt) =>
    availableFormats.includes(opt.id)
  );

  return (
    <AccordionCard
      label={label}
      sublabel={sublabel || `Đang chọn: ${safeFormat.toUpperCase()}`}
      icon={<Download size={16} />}
      defaultOpen={defaultOpen}
      colorTheme={theme}
      childrenClassName="p-3 space-y-3"
    >
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Chọn định dạng
          </label>
          <Tooltip
            label="Thông tin định dạng xuất"
            variant="wide2"
            content={
              <TooltipTableContent
                firstColumnHeader="Định dạng"
                secondColumnHeader="Đặc điểm & Sử dụng"
                rows={ALL_FORMAT_OPTIONS.map((opt) => ({
                  method: `${opt.label} (${opt.badge || "Mặc định"})`,
                  description: opt.desc,
                }))}
              />
            }
          >
            <button
              type="button"
              className="text-slate-400 hover:text-sky-500 dark:text-slate-500 dark:hover:text-sky-400 transition-colors"
            >
              <Info size={14} />
            </button>
          </Tooltip>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {visibleOptions.map((opt) => {
            const isSelected = safeFormat === opt.id;
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
