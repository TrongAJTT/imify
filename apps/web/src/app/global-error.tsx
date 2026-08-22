"use client";

import React, { useEffect, useState } from "react";
import { APP_ROUTES } from "@imify/core";
import {
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { FEATURE_MEDIA_ASSET_PATHS } from "@imify/features/shared/media-assets";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [isChunkError, setIsChunkError] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const errorString = `${error.name} ${error.message}`.toLowerCase();
    const matchesChunk =
      errorString.includes("chunkloaderror") ||
      errorString.includes("loading chunk") ||
      errorString.includes("dynamically imported module") ||
      errorString.includes("text/html");

    setIsChunkError(matchesChunk);

    // If it's a chunk loading error, attempt an immediate smooth recovery
    if (matchesChunk) {
      const now = Date.now();
      const lastRetry = sessionStorage.getItem(
        "__imify_chunk_retry_timestamp__",
      );
      if (!lastRetry || now - Number(lastRetry) > 15000) {
        sessionStorage.setItem("__imify_chunk_retry_timestamp__", String(now));
        window.location.reload();
      }
    }
  }, [error]);

  const handleHardRefresh = async () => {
    setIsClearing(true);
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {
      // Ignore errors during clearing
    }
    window.location.reload();
  };

  return (
    <html lang="en" className="h-full antialiased dark:bg-slate-950">
      <head>
        <title>Imify - System Recovery</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 font-sans selection:bg-indigo-500 selection:text-white">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl p-6 sm:p-8 text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Brand Logo & Icon Indicator */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center p-3 shadow-inner">
              <img
                src={FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng}
                alt="Imify Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div
              className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md ${
                isChunkError ? "bg-indigo-600" : "bg-amber-500"
              }`}
            >
              {isChunkError ? (
                <Sparkles size={14} />
              ) : (
                <AlertTriangle size={14} />
              )}
            </div>
          </div>

          {/* Heading and Description */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {isChunkError ? "New Version Available" : "Application Notice"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              {isChunkError
                ? "Imify was updated with new enhancements. Please refresh to load the latest version."
                : "An unexpected runtime state was encountered. You can safely reload or refresh the workspace."}
            </p>
          </div>

          {/* Technical detail expandable */}
          {error?.message && !isChunkError && (
            <div className="w-full bg-slate-100 dark:bg-slate-950/60 rounded-xl p-3 text-left border border-slate-200 dark:border-slate-800/80">
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 break-words line-clamp-3">
                {error.message}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <button
              type="button"
              onClick={() => (isChunkError ? handleHardRefresh() : reset())}
              className="w-full sm:flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-150"
            >
              <RefreshCw
                size={16}
                className={isClearing ? "animate-spin" : ""}
              />
              {isChunkError ? "Update Now" : "Try Again"}
            </button>

            <button
              type="button"
              onClick={handleHardRefresh}
              disabled={isClearing}
              className="w-full sm:flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] text-slate-700 dark:text-slate-300 text-sm font-medium transition-all duration-150"
            >
              <Trash2 size={15} className="text-slate-400" />
              {isClearing ? "Refreshing..." : "Clear Cache & Reload"}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 w-full flex items-center justify-center">
            <a
              href={APP_ROUTES.RECOVERY}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium"
            >
              <ShieldAlert size={13} />
              <span>Emergency Recovery Center</span>
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
