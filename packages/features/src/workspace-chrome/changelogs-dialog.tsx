"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, History, X } from "lucide-react";
import { BaseDialog } from "@imify/ui/ui/base-dialog";
import { Button } from "@imify/ui/ui/button";
import {
  Heading,
  Kicker,
  BodyText,
  MutedText,
  Subheading,
} from "@imify/ui/ui/typography";
import { CHANGELOGS, type ChangelogVersion } from "@imify/core/changelogs";
import {
  FEATURE_MEDIA_ASSETS,
  resolveFeatureMediaAssetUrl,
} from "../shared/media-assets";
import { FeatureMarkdown } from "../shared/feature-markdown";
import { useTranslation } from "@imify/i18n";

interface ChangelogsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SETTINGS_DIALOG_MOBILE_MAX_WIDTH_PX = 599;

export function ChangelogsDialog({ isOpen, onClose }: ChangelogsDialogProps) {
  const { t } = useTranslation("about");
  const [activeVersion, setActiveVersion] = useState<ChangelogVersion | null>(
    null,
  );
  const [markdown, setMarkdown] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isMobileDialog, setIsMobileDialog] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(
      `(max-width: ${SETTINGS_DIALOG_MOBILE_MAX_WIDTH_PX}px)`,
    );
    const handleResize = () => setIsMobileDialog(media.matches);
    handleResize();
    media.addEventListener("change", handleResize);
    return () => media.removeEventListener("change", handleResize);
  }, []);

  // When dialog opens, reset active version to latest and clear state
  useEffect(() => {
    if (isOpen) {
      setActiveVersion(CHANGELOGS[0] || null);
    }
  }, [isOpen]);

  const activeFilePath = activeVersion?.filePath || "";
  const markdownUrl = useMemo(() => {
    if (!activeFilePath) return "";
    return resolveFeatureMediaAssetUrl(activeFilePath as any);
  }, [activeFilePath]);

  useEffect(() => {
    if (!isOpen || !markdownUrl) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    void fetch(markdownUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load changelog: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        if (!isMounted) return;
        setMarkdown(text);
      })
      .catch(() => {
        if (!isMounted) return;
        setError(
          t("changelogsDialog.loadError", "Could not load changelog content."),
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, markdownUrl, t]);

  const mdContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex h-40 items-center justify-center">
          <MutedText>
            {t("changelogsDialog.loadingChangelog", "Loading update logs...")}
          </MutedText>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-center">
          <MutedText className="text-rose-500 dark:text-rose-400">
            {error}
          </MutedText>
        </div>
      );
    }

    if (!markdown.trim()) {
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/30 p-6">
          <MutedText>
            {t(
              "changelogsDialog.noReleaseNotes",
              "No release notes available for this version.",
            )}
          </MutedText>
        </div>
      );
    }

    return <FeatureMarkdown markdown={markdown} markdownUrl={markdownUrl} />;
  }, [error, isLoading, markdown, markdownUrl, t]);

  const appIconSrc = resolveFeatureMediaAssetUrl(
    FEATURE_MEDIA_ASSETS.brand.imifyLogoPng,
  );

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName={
        isMobileDialog
          ? "relative flex h-[calc(100dvh-2rem)] w-full overflow-hidden rounded-xl flex-col"
          : "relative flex h-[720px] w-full max-w-4xl min-h-0 overflow-hidden rounded-xl bg-white dark:bg-slate-900"
      }
    >
      {/* Top Close Button (Desktop Only) */}
      {!isMobileDialog && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 z-20 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={onClose}
          aria-label={t("changelogsDialog.close", "Close")}
        >
          <X size={18} />
        </Button>
      )}

      {/* Left Sidebar: Versions List */}
      {(!isMobileDialog || !activeVersion) && (
        <div
          className={`shrink-0 border-slate-200 bg-white dark:border-slate-850 dark:bg-slate-900 flex flex-col ${
            isMobileDialog
              ? "w-full h-full border-b-0 overflow-y-auto pb-6 pt-4 px-4"
              : "w-56 border-r pt-6 pb-4"
          }`}
        >
          <div
            className={`px-4 ${isMobileDialog ? "mb-4 flex items-center justify-between" : "mb-6"}`}
          >
            <div>
              <Subheading className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {t("changelogsDialog.title", "Changelogs")}
              </Subheading>
              {!isMobileDialog && (
                <MutedText className="text-xs">
                  {t(
                    "changelogsDialog.subtitle",
                    "Latest changes and improvements",
                  )}
                </MutedText>
              )}
            </div>
            {isMobileDialog && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={onClose}
                aria-label={t("changelogsDialog.close", "Close")}
              >
                <X size={18} />
              </Button>
            )}
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {CHANGELOGS.map((item) => {
              const isSelected = activeVersion?.version === item.version;
              return (
                <button
                  key={item.version}
                  onClick={() => {
                    setActiveVersion(item);
                  }}
                  className={`w-full flex items-center rounded-lg transition-all gap-3 px-3 py-2.5 ${
                    isSelected
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm ring-1 ring-slate-300/50 dark:ring-slate-700/50"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <History
                    size={16}
                    className={
                      isSelected ? "text-violet-500" : "text-slate-400"
                    }
                  />
                  <div className="flex-1 text-left min-w-0">
                    <BodyText className="font-semibold leading-tight truncate">
                      {item.version}
                    </BodyText>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                      {item.date}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Right Content: Markdown Viewer */}
      {(!isMobileDialog || activeVersion) && (
        <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-white dark:bg-slate-900">
          {/* Mobile Back / Title Header */}
          {isMobileDialog && activeVersion && (
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveVersion(null)}
                className="rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0"
                aria-label={t("changelogsDialog.back", "Back")}
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="flex flex-col min-w-0">
                <Subheading className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                  {activeVersion.version}
                </Subheading>
                <MutedText className="text-[10px] leading-tight truncate">
                  {t("changelogsDialog.releaseDate", "Release Date")}:{" "}
                  {activeVersion.date}
                </MutedText>
              </div>
            </div>
          )}

          {/* Desktop Header */}
          {!isMobileDialog && activeVersion && (
            <div className="px-8 pt-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center overflow-hidden">
                  <img
                    src={appIconSrc}
                    alt="Imify"
                    className="h-5 w-5 object-contain"
                  />
                </div>
                <div>
                  <Heading className="text-xl leading-tight">
                    {activeVersion.version}
                  </Heading>
                  <Kicker>
                    {t("changelogsDialog.releaseDate", "Release Date")}:{" "}
                    {activeVersion.date}
                  </Kicker>
                </div>
              </div>
            </div>
          )}

          {/* Content Scroll Area */}
          <div
            className={`flex-1 min-h-0 min-w-0 overflow-y-auto bg-slate-50/30 dark:bg-slate-900/30 ${
              isMobileDialog ? "p-4 pt-5 pb-10" : "p-8 pt-6"
            }`}
          >
            {mdContent}
          </div>
        </div>
      )}
    </BaseDialog>
  );
}
