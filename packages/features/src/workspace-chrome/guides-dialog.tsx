"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, HelpCircle, X } from "lucide-react";
import { BaseDialog } from "@imify/ui/ui/base-dialog";
import { Button } from "@imify/ui/ui/button";
import {
  Heading,
  Kicker,
  Subheading,
  BodyText,
  MutedText,
} from "@imify/ui/ui/typography";
import {
  resolveFeatureMediaAssetUrl,
  FEATURE_MEDIA_ASSETS,
} from "../shared/media-assets";
import { FeatureMarkdown } from "../shared/feature-markdown";
import { SETTINGS_DIALOG_MOBILE_MAX_WIDTH_PX } from "./desktop-layout";

interface GuideItem {
  id: string;
  label: string;
  path: string;
}

const GUIDES: GuideItem[] = [
  {
    id: "dev-mode-enable",
    label: "Enable Dev Mode",
    path: "/assets/guides/dev-mode-enable.md",
  },
  {
    id: "bug-report",
    label: "How to Report Bugs",
    path: "/assets/guides/bug-report.md",
  },
];

interface GuidesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_ACTIVE_CLASS =
  "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-550 shadow-sm ring-1 ring-slate-300 dark:ring-slate-700";
const DEFAULT_INACTIVE_CLASS =
  "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200";

export function GuidesDialog({ isOpen, onClose }: GuidesDialogProps) {
  const [activeTab, setActiveTab] = useState<string | null>(GUIDES[0].id);
  const [isMobileDialog, setIsMobileDialog] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeGuide = useMemo(
    () => GUIDES.find((g) => g.id === activeTab),
    [activeTab],
  );
  const markdownUrl = useMemo(
    () => (activeGuide ? resolveFeatureMediaAssetUrl(activeGuide.path) : ""),
    [activeGuide],
  );

  const appIconSrc = resolveFeatureMediaAssetUrl(
    FEATURE_MEDIA_ASSETS.brand.imifyLogoPng,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(
      `(max-width: ${SETTINGS_DIALOG_MOBILE_MAX_WIDTH_PX}px)`,
    );
    const update = () => setIsMobileDialog(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (isMobileDialog) setActiveTab(null);
      return;
    }
    if (!isMobileDialog) {
      setActiveTab(GUIDES[0].id);
    } else {
      setActiveTab(null);
    }
  }, [isOpen, isMobileDialog]);

  useEffect(() => {
    if (!isOpen || !markdownUrl) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    void fetch(markdownUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load guide: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        if (!isMounted) return;
        setMarkdown(text);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Could not load guide content.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, markdownUrl]);

  const content = useMemo(() => {
    if (isLoading) {
      return <MutedText>Loading guide...</MutedText>;
    }

    if (error) {
      return (
        <MutedText className="text-rose-500 dark:text-rose-400">
          {error}
        </MutedText>
      );
    }

    if (!markdown.trim()) {
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/30 p-6">
          <MutedText>No content available.</MutedText>
        </div>
      );
    }

    return <FeatureMarkdown markdown={markdown} markdownUrl={markdownUrl} />;
  }, [error, isLoading, markdown, markdownUrl]);

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName={
        "relative flex h-[calc(100dvh-2rem)] w-full min-h-0 overflow-hidden rounded-xl max-w-4xl"
      }
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-3 top-3 z-25 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        onClick={onClose}
        aria-label="Close guides dialog"
      >
        <X size={18} />
      </Button>

      <div
        className={`shrink-0 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${
          isMobileDialog
            ? "w-full border-b border-r-0 pb-2 pt-2"
            : "w-56 border-r pt-6 pb-4"
        }`}
      >
        <div className={`px-4 ${isMobileDialog ? "mb-1" : "mb-6"}`}>
          {isMobileDialog && activeTab ? (
            <div className="flex items-center gap-3 py-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveTab(null)}
                className="rounded-full text-slate-500 hover:bg-slate-205 dark:hover:bg-slate-800 shrink-0"
                aria-label="Back to guides list"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="flex flex-col min-w-0">
                <Subheading className="text-lg font-bold text-slate-850 dark:text-slate-100 leading-tight truncate">
                  {activeGuide?.label}
                </Subheading>
                <MutedText className="text-[10px] leading-tight truncate pr-4">
                  Guides & Tutorials
                </MutedText>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <HelpCircle size={18} />
              </div>
              <Subheading className="text-xl font-bold text-slate-850 dark:text-slate-100">
                Guides
              </Subheading>
            </div>
          )}
        </div>

        {(!isMobileDialog || !activeTab) && (
          <nav
            className={`flex-1 px-3 ${isMobileDialog ? "space-y-3 pb-6 pt-2" : "space-y-1"}`}
          >
            {GUIDES.map((guide) => (
              <button
                key={guide.id}
                onClick={() => setActiveTab(guide.id)}
                className={`flex items-center rounded-lg transition-all ${
                  isMobileDialog
                    ? "w-full gap-3 p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shadow-sm"
                    : "w-full gap-3 px-3 py-2"
                } ${activeTab === guide.id ? DEFAULT_ACTIVE_CLASS : DEFAULT_INACTIVE_CLASS}`}
              >
                <div className="flex-1 text-left">
                  <BodyText
                    className={`font-semibold ${
                      activeTab === guide.id
                        ? isMobileDialog
                          ? ""
                          : "text-slate-900 dark:text-slate-50"
                        : "!text-slate-805 dark:!text-slate-100"
                    }`}
                  >
                    {guide.label}
                  </BodyText>
                </div>
                {isMobileDialog && (
                  <ChevronRight size={16} className="text-slate-300" />
                )}
              </button>
            ))}
          </nav>
        )}
      </div>

      {(!isMobileDialog || activeTab) && (
        <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-slate-50/30 dark:bg-slate-900/30">
          <div
            className={`flex-1 min-h-0 min-w-0 overflow-y-auto ${
              isMobileDialog ? "p-4 pt-5 pb-10" : "p-8 pt-10"
            }`}
          >
            {content}
          </div>
        </div>
      )}
    </BaseDialog>
  );
}
