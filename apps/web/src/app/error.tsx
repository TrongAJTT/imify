"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@imify/ui/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
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
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-6 text-center flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-200">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
            isChunkError
              ? "bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-indigo-500/25"
              : "bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/25"
          }`}
        >
          {isChunkError ? <Sparkles size={24} /> : <AlertTriangle size={24} />}
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {isChunkError ? "New Version Available" : "Something went wrong"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            {isChunkError
              ? "A newer version of this tool was deployed. Please refresh to load the latest changes."
              : "An unexpected error occurred while rendering this page."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-1">
          <Button
            variant="primary"
            className="w-full sm:flex-1 h-10 text-xs font-semibold gap-2"
            onClick={() => (isChunkError ? handleHardRefresh() : reset())}
          >
            <RefreshCw size={14} className={isClearing ? "animate-spin" : ""} />
            {isChunkError ? "Update Now" : "Try Again"}
          </Button>

          <Button
            variant="secondary"
            className="w-full sm:flex-1 h-10 text-xs font-medium gap-2"
            onClick={handleHardRefresh}
            disabled={isClearing}
          >
            <Trash2 size={13} className="text-slate-400" />
            {isClearing ? "Refreshing..." : "Hard Reload"}
          </Button>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 w-full flex items-center justify-center">
          <Link
            href="/recovery"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium"
          >
            <ShieldAlert size={13} />
            <span>Emergency Recovery Center</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
