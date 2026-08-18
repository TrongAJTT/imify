"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Home, RefreshCw, Sparkles, WifiOff } from "lucide-react";
import { useTranslation } from "@imify/i18n";
import { Button } from "@imify/ui/ui/button";
import { Heading, Kicker, MutedText } from "@imify/ui/ui/typography";
import { FEATURE_MEDIA_ASSETS, resolveFeatureMediaAssetUrl } from "@imify/features/shared/media-assets";

type UpdateStatus = "checking" | "offline" | "clearing" | "success";

const COUNTDOWN_SECONDS = 5;

async function clearAllAppCaches(): Promise<void> {
  // 1. Delete all browser CacheStorage instances
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheKeys = await window.caches.keys();
      await Promise.all(cacheKeys.map((name) => window.caches.delete(name)));
    } catch {
      // Ignore cache deletion errors
    }
  }

  // 2. Notify active Service Worker to skip waiting
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      }
    } catch {
      // Ignore SW message errors
    }
  }

  // 3. Update seen state so version matches and doesn't prompt stale dialog
  try {
    const rawV2 = window.localStorage.getItem("imify_whats_new_seen_v2");
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (parsed && typeof parsed === "object") {
        parsed.cacheVersion = parsed.version;
        parsed.resetCacheAt = Date.now();
        window.localStorage.setItem("imify_whats_new_seen_v2", JSON.stringify(parsed));
      }
    }
  } catch {
    // Ignore storage update errors
  }
}

export function UpdateClient() {
  const { t } = useTranslation("common");
  const [status, setStatus] = useState<UpdateStatus>("checking");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appIconSrc = resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.brand.imifyLogoPng);

  const handleReturnHome = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    window.location.href = "/";
  };

  const startCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setCountdown(COUNTDOWN_SECONDS);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    let isMounted = true;

    const executeUpdateFlow = async () => {
      // 1. Check network connection
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (!isMounted) return;
        setStatus("offline");
        startCountdown();
        return;
      }

      // 2. Perform cache clearing with minimum 2 seconds delay
      setStatus("clearing");
      const minDelayPromise = new Promise((resolve) => setTimeout(resolve, 2000));
      const clearPromise = clearAllAppCaches();

      await Promise.all([minDelayPromise, clearPromise]);

      if (!isMounted) return;
      setStatus("success");
      startCountdown();
    };

    void executeUpdateFlow();

    // Listen for online events in case connection recovers while on offline state
    const handleOnline = () => {
      if (status === "offline") {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
        void executeUpdateFlow();
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      isMounted = false;
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const progressPercent = Math.max(0, Math.min(100, ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100));

  return (
    <main className="relative flex-1 min-h-[calc(100dvh-9rem)] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-sky-500/15 via-violet-500/15 to-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-center -translate-y-6 sm:-translate-y-10 animate-in fade-in zoom-in-95 duration-300">
        {/* App Logo & Header */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shadow-inner overflow-hidden">
            <img src={appIconSrc} alt="Imify" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <Heading className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("updatePage.title")}
            </Heading>
            <Kicker className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("updatePage.subtitle")}
            </Kicker>
          </div>
        </div>

        {/* State Visualizer Card */}
        <div className="my-6 p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center justify-center min-h-[180px]">
          {status === "offline" && (
            <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-sm">
                <WifiOff size={28} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {t("updatePage.noInternetTitle")}
                </div>
                <MutedText className="text-xs leading-relaxed max-w-xs text-slate-600 dark:text-slate-400">
                  {t("updatePage.noInternetDesc")}
                </MutedText>
              </div>
            </div>
          )}

          {(status === "checking" || status === "clearing") && (
            <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 flex items-center justify-center border border-sky-500/20 shadow-sm">
                <RefreshCw size={28} className="animate-spin text-sky-500" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t("updatePage.clearingCacheTitle")}
                </div>
                <MutedText className="text-xs leading-relaxed max-w-xs text-slate-600 dark:text-slate-400">
                  {t("updatePage.clearingCacheDesc")}
                </MutedText>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-3 animate-in zoom-in-75 duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                <CheckCircle2 size={30} className="text-emerald-500" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-500" />
                  {t("updatePage.successTitle")}
                </div>
                <MutedText className="text-xs leading-relaxed max-w-xs text-slate-600 dark:text-slate-400">
                  {t("updatePage.successDesc")}
                </MutedText>
              </div>
            </div>
          )}
        </div>

        {/* Action Button & Countdown */}
        {(status === "offline" || status === "success") && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Visual countdown progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  status === "offline" ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <Button
              variant={status === "offline" ? "outline" : "primary"}
              className="w-full text-xs font-semibold py-2.5 gap-2 shadow-md"
              onClick={handleReturnHome}
            >
              {status === "offline" ? <ArrowLeft size={16} /> : <Home size={16} />}
              {t("updatePage.returnHome", { seconds: countdown })}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
