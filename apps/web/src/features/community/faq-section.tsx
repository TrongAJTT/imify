"use client";

import React, { useState } from "react";
import { Heading, BodyText } from "@imify/ui/ui/typography";
import { ChevronDown } from "lucide-react";
import { cn } from "@imify/ui/ui/utils";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useTranslation } from "@imify/i18n";
import { IMIFY_LINKS } from "@imify/core";
import { FeatureMarkdown } from "@imify/features";

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Collapsible.Root open={isOpen} onOpenChange={onToggle} className="w-full">
      <div
        className={cn(
          "border-b border-slate-200 dark:border-slate-800 transition-all duration-200",
          isOpen
            ? "bg-slate-50/50 dark:bg-slate-900/20"
            : "bg-white dark:bg-slate-950",
        )}
      >
        <Collapsible.Trigger asChild>
          <button className="flex w-full items-center justify-between px-6 py-5 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 group">
            <span
              className={cn(
                "text-lg font-semibold transition-colors",
                isOpen
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-900 dark:text-slate-100 group-hover:text-blue-500",
              )}
            >
              {question}
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-slate-400 transition-transform duration-300",
                isOpen && "rotate-180 text-blue-500",
              )}
            />
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <div className="px-6 pb-6 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed text-base">
            <FeatureMarkdown markdown={answer} />
          </div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  );
}

export function FaqSection() {
  const { t } = useTranslation("homepage");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems = React.useMemo(() => {
    const raw = t("faq.items", {
      returnObjects: true,
      recoveryUrl: "/recovery",
      updateUrl: "/update",
      chromeUrl: IMIFY_LINKS.chromeClearCookiesGuide,
      edgeUrl: IMIFY_LINKS.edgeClearCookiesGuide,
      firefoxUrl: IMIFY_LINKS.firefoxClearCookiesGuide,
      githubIssuesUrl: IMIFY_LINKS.githubIssuesNew,
    }) as Array<{
      question: string;
      answer: string;
    }>;
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [t]);

  return (
    <section className="mx-auto max-w-4xl px-4 space-y-12 pb-18">
      <div className="text-center space-y-3">
        <Heading className="text-2xl md:text-4xl">
          {t("faq.sectionTitle")}
        </Heading>
        <BodyText className="text-slate-500 text-lg md:text-xl">
          {t("faq.sectionDesc")}
        </BodyText>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-950">
        {faqItems.map((item, index) => (
          <FaqItem
            key={index}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </section>
  );
}
