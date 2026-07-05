import React from "react";
import { Brain, Cpu, Settings2 } from "lucide-react";
import { AccordionCard, SidebarCard, CheckboxCard, MutedText } from "@imify/ui";

interface AiEngineAccordionCardProps {
  label: string;
  sublabel: string;
  colorTheme: "pink" | "purple";
  modelName: string;
  variantLabel: string;
  onConfigureClick: () => void;
  unloadModelChecked: boolean;
  onUnloadModelChange: (val: boolean) => void;
  unloadModelTitle: string;
  unloadModelSubtitle: string;
  currentSelectionHeader: string;
  modelLabelText: string;
  modelDescription: string;
  variantLabelText: string;
  variantDescription?: string;
  suitableForLabelText: string;
  suitableForDescription: string;
}

export function AiEngineAccordionCard({
  label,
  sublabel,
  colorTheme,
  modelName,
  variantLabel,
  onConfigureClick,
  unloadModelChecked,
  onUnloadModelChange,
  unloadModelTitle,
  unloadModelSubtitle,
  currentSelectionHeader,
  modelLabelText,
  modelDescription,
  variantLabelText,
  variantDescription,
  suitableForLabelText,
  suitableForDescription,
}: AiEngineAccordionCardProps) {
  const iconColorClass =
    colorTheme === "pink" ? "text-pink-500" : "text-purple-500";
  const bulletBgClass = colorTheme === "pink" ? "bg-pink-400" : "bg-purple-400";

  return (
    <AccordionCard
      label={label}
      sublabel={sublabel}
      icon={<Brain size={16} />}
      defaultOpen={true}
      colorTheme={colorTheme}
      childrenClassName="p-3 space-y-3"
    >
      <SidebarCard
        label={`${modelLabelText} ${modelName}`}
        sublabel={variantLabel}
        icon={<Brain size={16} className={iconColorClass} />}
        onClick={onConfigureClick}
        className="cursor-pointer"
      />

      <CheckboxCard
        checked={unloadModelChecked}
        onChange={onUnloadModelChange}
        title={unloadModelTitle}
        subtitle={unloadModelSubtitle}
        icon={<Cpu size={16} />}
      />

      <div className="relative p-3.5 rounded-lg bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 border-2 border-slate-200/60 dark:border-slate-700/50 shadow-sm space-y-3 transition-all">
        <div className="flex items-center gap-2">
          <Settings2 className={iconColorClass} size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {currentSelectionHeader}
          </span>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div
              className={`mt-1 w-1.5 h-1.5 rounded-full ${bulletBgClass} shrink-0`}
            />
            <MutedText className="text-[11px] leading-relaxed">
              <strong>{modelLabelText}</strong> {modelDescription}
            </MutedText>
          </div>
          <div className="flex items-start gap-2.5">
            <div
              className={`mt-1 w-1.5 h-1.5 rounded-full ${bulletBgClass} shrink-0`}
            />
            <MutedText className="text-[11px] leading-relaxed">
              <strong>{variantLabelText}</strong> {variantLabel}
              {variantDescription && (
                <span className="opacity-85 italic ml-1">
                  - {variantDescription}
                </span>
              )}
            </MutedText>
          </div>
          <div className="flex items-start gap-2.5">
            <div
              className={`mt-1 w-1.5 h-1.5 rounded-full ${bulletBgClass} shrink-0`}
            />
            <MutedText className="text-[11px] leading-relaxed">
              <strong>{suitableForLabelText}</strong> {suitableForDescription}
            </MutedText>
          </div>
        </div>
      </div>
    </AccordionCard>
  );
}
