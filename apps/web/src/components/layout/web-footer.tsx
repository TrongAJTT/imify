"use client";

import React from "react";
import Link from "next/link";
import { getWorkspaceToolsMenuGroups } from "@imify/features/workspace-shell/workspace-tools";
import { getAppMetadata, IMIFY_LINKS } from "@imify/core";
import { useWebPageMode } from "@/hooks/use-web-page-mode";
import { useIsDesktopLayout } from "@imify/features/workspace-chrome";
import {
  FindOnProductHuntBadge,
  FindOnUnikornBadge,
  FindOnJ2TeamLaunchBadge,
} from "@/features/community/find-us-badges";
import { useTranslation } from "@imify/i18n";

export function WebFooter() {
  const appMetadata = getAppMetadata();
  const { isFullFooterPage: isFullFooter, isRecoveryPage, isUpdatePage } = useWebPageMode();
  const isDesktop = useIsDesktopLayout();
  const { t, i18n } = useTranslation("homepage");
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const allTools = React.useMemo(() => {
    const groups = getWorkspaceToolsMenuGroups(isMounted ? undefined : "en");
    return groups.flatMap((g) => g.items);
  }, [i18n.language, isMounted]);

  const moreFeatures = React.useMemo(() => {
    const list = allTools.slice(4, 8).filter((tool) => tool.id !== "filling");
    const pdfStudio = allTools.find((tool) => tool.id === "pdf-studio");
    if (pdfStudio) {
      list.push(pdfStudio);
    }
    return list;
  }, [allTools]);

  if (isRecoveryPage) {
    return null;
  }

  // Hide footer on tool pages on mobile interface (keep visible for /update and landing/extension)
  if (!isFullFooter && !isDesktop && !isUpdatePage) {
    return null;
  }

  const displayVersion = isMounted
    ? appMetadata.cacheVersion || appMetadata.version
    : appMetadata.version;

  if (!isFullFooter) {
    return (
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="flex w-full items-center justify-between px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span
              suppressHydrationWarning
              className="font-semibold text-slate-900 dark:text-slate-100"
            >
              Imify Web v{displayVersion}
            </span>
            <span className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
            <span className="hidden md:inline">{t("footer.shortDesc")}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/recovery"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t("footer.recovery")}
            </Link>
            <Link
              href={IMIFY_LINKS.terms}
              target="_blank"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href={IMIFY_LINKS.privacy}
              target="_blank"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Imify
              </span>
              <span
                suppressHydrationWarning
                className="text-xs text-slate-400 mb-[2px]"
              >
                v{displayVersion}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              {t("footer.fullDesc")}
            </p>
          </div>

          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              {t("footer.tools")}
            </h3>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              {allTools.slice(0, 4).map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={tool.href}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              {t("footer.moreFeatures")}
            </h3>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              {moreFeatures.map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={tool.href}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              {t("footer.findUs")}
            </h3>
            <div className="flex flex-col gap-3">
              <FindOnProductHuntBadge />
              <FindOnUnikornBadge />
              <FindOnJ2TeamLaunchBadge />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            {t("footer.copyright", {
              year: new Date().getFullYear(),
              defaultValue: `© ${new Date().getFullYear()} Imify by TrongAJTT. All rights reserved.`,
            })}
          </p>
          <div className="flex gap-4">
            <Link
              href="/recovery"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t("footer.recoveryPage")}
            </Link>
            <Link
              href={IMIFY_LINKS.privacy}
              target="_blank"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t("footer.privacyPolicy")}
            </Link>
            <Link
              href={IMIFY_LINKS.terms}
              target="_blank"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t("footer.termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
