"use client";

import React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Github,
  Globe,
  Heart,
  BadgeQuestionMark,
  Library,
  X,
  Code2,
  Sparkles,
} from "lucide-react";
import { IMIFY_LINKS } from "@imify/core";
import { getAppMetadata } from "@imify/core/app-metadata";
import { useDevModeEnabled } from "@imify/features/dev-mode/dev-mode-storage";
import { toast } from "@imify/stores";
import { BaseDialog } from "@imify/ui/ui/base-dialog";
import { Button } from "@imify/ui/ui/button";
import {
  BodyText,
  Kicker,
  MutedText,
  Subheading,
} from "@imify/ui/ui/typography";
import {
  FEATURE_MEDIA_ASSETS,
  resolveFeatureMediaAssetUrl,
} from "../shared/media-assets";
import { PwaInstallDialog } from "./pwa-install-dialog";
import { ChangelogsDialog } from "./changelogs-dialog";
import { GuidesDialog } from "./guides-dialog";
import { useTranslation, Trans } from "@imify/i18n";
import {
  checkForUpdates,
  getHasUpdateAvailable,
  CHECK_UPDATES_EVENT,
} from "./whats-new-update-notification-gate";

const appMetadata = getAppMetadata();
const DEV_MODE_CLICK_TARGET = 7;
const DEV_MODE_CLICK_TIMEOUT_MS = 3000;

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAboutAttribution: () => void;
  onOpenDonate?: () => void;
}

function useEasterEggClicker(onActivate: () => void) {
  const clickCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clickCountRef.current += 1;
    if (clickCountRef.current >= DEV_MODE_CLICK_TARGET) {
      clickCountRef.current = 0;
      onActivate();
      return;
    }
    timerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
      timerRef.current = null;
    }, DEV_MODE_CLICK_TIMEOUT_MS);
  }, [onActivate]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );
  return handleClick;
}

function ActionLink({
  href,
  children,
  emphasized = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  emphasized?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        emphasized
          ? `px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-bold shadow-lg shadow-slate-900/10 dark:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${className}`
          : `px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 ${className}`
      }
    >
      {children}
    </a>
  );
}

export function AboutDialog({
  isOpen,
  onClose,
  onOpenAboutAttribution,
  onOpenDonate,
}: AboutDialogProps) {
  const { t } = useTranslation("about");
  const appMetadata = getAppMetadata();
  const iconSrc = resolveFeatureMediaAssetUrl(
    FEATURE_MEDIA_ASSETS.brand.imifyLogoPng,
  );
  const [devModeEnabled, setDevModeEnabled] = useDevModeEnabled();
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [isChangelogsDialogOpen, setIsChangelogsDialogOpen] = useState(false);
  const [isGuidesDialogOpen, setIsGuidesDialogOpen] = useState(false);

  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setHasUpdate(getHasUpdateAvailable());

    const handleUpdateCheck = () => {
      setHasUpdate(getHasUpdateAvailable());
    };

    window.addEventListener(CHECK_UPDATES_EVENT, handleUpdateCheck);
    window.addEventListener("storage", handleUpdateCheck);
    return () => {
      window.removeEventListener(CHECK_UPDATES_EVENT, handleUpdateCheck);
      window.removeEventListener("storage", handleUpdateCheck);
    };
  }, [isOpen]);

  const activateDevMode = useCallback(async () => {
    if (devModeEnabled) {
      toast.warning(
        "Developer Mode",
        "Already enabled. Go to Settings -> Developer.",
      );
      return;
    }
    await setDevModeEnabled(true);
    toast.success(
      "Developer Mode enabled!",
      "Open Settings to access the Developer tab.",
      4000,
    );
  }, [devModeEnabled, setDevModeEnabled]);

  const handleIconClick = useEasterEggClicker(activateDevMode);

  const handleVersionClick = async () => {
    if (isCheckingUpdate) return;
    setIsCheckingUpdate(true);
    try {
      const hasUpdateResult = await checkForUpdates(true);
      setHasUpdate(hasUpdateResult);
      if (!hasUpdateResult) {
        toast.success(t("noUpdateTitle"), t("noUpdateDesc"), 3500);
      }
    } catch {
      // Ignore network errors
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      mobileFullscreen
      contentClassName="p-6 md:p-8"
    >
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleIconClick}
            className="p-1 rounded-2xl focus:outline-none select-none cursor-default"
            tabIndex={-1}
            aria-label="App Icon"
          >
            {iconSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={iconSrc}
                alt="Imify Logo"
                className="w-20 h-20 rounded-2xl shadow-md rotate-3 bg-white p-1 pointer-events-none"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl shadow-md rotate-3 bg-slate-100 dark:bg-slate-800" />
            )}
          </button>
          <div>
            <Subheading className="text-3xl font-black tracking-tight">
              {t("title", "Imify")}
            </Subheading>
            <Kicker className="text-sm text-sky-500 dark:text-sky-400 tracking-widest">
              {t("subtitle", "The Powerful Image Toolkit")}
            </Kicker>
            <div className="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleVersionClick}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 select-none cursor-pointer focus:outline-none active:scale-90 transition-all duration-100"
                tabIndex={-1}
                aria-label="App version"
                title={t("checkUpdateTooltip")}
                disabled={isCheckingUpdate}
              >
                {isCheckingUpdate
                  ? t("checkingUpdate", "Checking...")
                  : `v${appMetadata.cacheVersion || appMetadata.version}`}
              </button>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 select-none">
                {appMetadata.versionType}
              </span>
              {hasUpdate ? (
                <button
                  type="button"
                  onClick={handleVersionClick}
                  title={t(
                    "updateAvailableTooltip",
                    t("updateAvailableDialog.title", "New version available!"),
                  )}
                  className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60 inline-flex items-center justify-center select-none cursor-pointer border border-amber-300 dark:border-amber-700/50 motion-safe:animate-pulse transition-all hover:scale-105 active:scale-95"
                >
                  <Sparkles
                    size={13}
                    className="text-amber-500 fill-amber-500 shrink-0"
                  />
                </button>
              ) : null}
              {devModeEnabled ? (
                <span
                  title={t("devModeOn", "Developer Mode is enabled")}
                  className="p-1 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50 inline-flex items-center justify-center select-none cursor-default border border-violet-200/60 dark:border-violet-800/40 transition-all hover:scale-105"
                >
                  <Code2 size={13} className="shrink-0" />
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-600 dark:text-slate-300">
          <div className="space-y-4">
            <Kicker className="text-xs tracking-widest">
              {t("aboutTitle", "About the project")}
            </Kicker>
            <BodyText className="leading-relaxed">{t("aboutText1")}</BodyText>
            <BodyText className="leading-relaxed">{t("aboutText2")}</BodyText>
          </div>
          <div className="space-y-4">
            <Kicker className="text-xs tracking-widest">
              {t("techTitle", "Key Technologies")}
            </Kicker>
            <ul className="grid grid-cols-1 gap-2">
              {[
                "Plasmo Extension Framework",
                "OffscreenCanvas API",
                "Rust/WASM Image Engines",
                "Modern AVIF & JXL Support",
                "TypeScript + Tailwind CSS",
              ].map((label) => (
                <li key={label} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-8 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-4">
            <Kicker className="text-xs tracking-widest text-center text-slate-400 uppercase">
              {t("linksTitle")}
            </Kicker>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Official Website button */}
              <ActionLink
                href={IMIFY_LINKS.website}
                className="bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50"
              >
                <Globe size={16} />
                {t("officialWebsite")}
              </ActionLink>

              {/* GitHub Repository button */}
              <ActionLink
                href={IMIFY_LINKS.repository}
                className="bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900/50"
              >
                <Github size={16} />
                {t("githubRepository")}
              </ActionLink>

              {/* Sponsor Author button */}
              <ActionLink
                href={IMIFY_LINKS.sponsor}
                className="bg-rose-50/50 text-rose-500 border-rose-200 hover:bg-rose-100/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50"
              >
                <Heart size={16} fill="currentColor" />
                {t("sponsorAuthor")}
              </ActionLink>

              {/* Attribution button */}
              <button
                type="button"
                onClick={onOpenAboutAttribution}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Library size={16} />
                {t("attribution")}
              </button>

              {/* Guides button */}
              <button
                type="button"
                onClick={() => setIsGuidesDialogOpen(true)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <BadgeQuestionMark size={16} />
                {t("guides")}
              </button>

              {/* Install App button */}
              <button
                type="button"
                onClick={() => setIsInstallDialogOpen(true)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} />
                {t("installApp")}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 text-center">
            <div className="space-y-1 space-x-1">
              <Kicker className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {t("craftedBy", "Crafted with passion by")}
              </Kicker>
              <a
                href={IMIFY_LINKS.authorProfile}
                target="_blank"
                rel="noreferrer"
                className="text-xl text-slate-900 dark:text-white font-bold hover:text-sky-500 dark:hover:text-sky-400 transition-all"
              >
                TrongAJTT
              </a>
            </div>

            <MutedText className="flex items-center justify-center gap-4 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setIsChangelogsDialogOpen(true)}
                className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              >
                {t("changelogs")}
              </button>
              <span className="text-slate-200 dark:text-slate-800">/</span>
              <a
                href={IMIFY_LINKS.terms}
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              >
                {t("termsOfUse")}
              </a>
              <span className="text-slate-200 dark:text-slate-800">/</span>
              <a
                href={IMIFY_LINKS.privacy}
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              >
                {t("privacyPolicy")}
              </a>
            </MutedText>
          </div>
        </div>
      </div>

      <PwaInstallDialog
        isOpen={isInstallDialogOpen}
        onClose={() => setIsInstallDialogOpen(false)}
      />
      <ChangelogsDialog
        isOpen={isChangelogsDialogOpen}
        onClose={() => setIsChangelogsDialogOpen(false)}
      />
      <GuidesDialog
        isOpen={isGuidesDialogOpen}
        onClose={() => setIsGuidesDialogOpen(false)}
      />
    </BaseDialog>
  );
}
