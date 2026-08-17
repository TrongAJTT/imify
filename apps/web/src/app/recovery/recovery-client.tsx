"use client";

import React, { useState, useRef } from "react";
import {
  Trash2,
  RefreshCw,
  Home,
  Download,
  Upload,
  Bug,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  WifiOff,
} from "lucide-react";
import { Button } from "@imify/ui/ui/button";
import { getAppMetadata, IMIFY_LINKS } from "@imify/core";
import { FEATURE_MEDIA_ASSET_PATHS } from "@imify/features/shared/media-assets";
import { useTranslation } from "@imify/i18n";

export function RecoveryClient() {
  const { t } = useTranslation("common");
  const appMetadata = getAppMetadata();

  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheClearSuccess, setCacheClearSuccess] = useState(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [storageCount, setStorageCount] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
    try {
      setStorageCount(localStorage.length);
      setIsOnline(navigator.onLine);
    } catch {
      // Ignore errors reading diagnostics
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── 1. Clear Cache & Service Worker ─────────────────────────────────────────
  const handleClearCache = async () => {
    if (isOnline === false) return;
    setIsClearingCache(true);
    setCacheClearSuccess(false);
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      sessionStorage.clear();
      setCacheClearSuccess(true);
      setTimeout(() => setCacheClearSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to clear cache:", err);
    } finally {
      setIsClearingCache(false);
    }
  };

  // ─── 2. Factory Reset / Clear All Data ───────────────────────────────────────
  const handleFactoryReset = async () => {
    setIsResettingData(true);
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("indexedDB" in window && typeof indexedDB.databases === "function") {
        try {
          const dbs = await indexedDB.databases();
          dbs.forEach((db) => {
            if (db.name) indexedDB.deleteDatabase(db.name);
          });
        } catch {
          // IndexedDB database enumeration might fail on some platforms
        }
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }

      setResetSuccess(true);
      setShowResetConfirm(false);
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      console.error("Failed to reset application data:", err);
      setIsResettingData(false);
    }
  };

  // ─── 3. Export Data Backup ───────────────────────────────────────────────────
  const handleExportBackup = () => {
    try {
      const dump: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          dump[key] = localStorage.getItem(key) || "";
        }
      }

      const payload = {
        app: "Imify",
        version: appMetadata.version,
        versionType: appMetadata.versionType,
        exportedAt: new Date().toISOString(),
        data: dump,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `imify_backup_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export backup:", err);
    }
  };

  // ─── 4. Import Data Backup ───────────────────────────────────────────────────
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== "object" || !parsed.data) {
          throw new Error("Invalid payload format");
        }

        const data = parsed.data as Record<string, string>;
        Object.entries(data).forEach(([k, v]) => {
          if (typeof v === "string") {
            localStorage.setItem(k, v);
          }
        });

        setImportStatus({
          type: "success",
          message: t(
            "recovery.importSuccess",
            "Đã khôi phục dữ liệu thành công! Ứng dụng sẽ tự động tải lại...",
          ),
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch {
        setImportStatus({
          type: "error",
          message: t(
            "recovery.importInvalidFile",
            "Tệp sao lưu không hợp lệ hoặc dữ liệu bị hỏng.",
          ),
        });
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 font-sans selection:bg-indigo-500 selection:text-white">
      {/* ─── Top Brand Header ───────────────────────────────────────────────── */}
      <header className="w-full max-w-3xl flex flex-col items-center text-center pt-3 sm:pt-6 pb-3 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="relative mb-3 group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-sky-500/20 blur-lg opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="relative w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center p-2.5 sm:p-3 transition-transform group-hover:scale-105 duration-300">
            <img
              src={FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng}
              alt="Imify Logo"
              className="w-full h-full object-contain drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center justify-center">
          <span>{t("recovery.title", "Trung Tâm Khôi Phục")}</span>
        </h1>

        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
          {t(
            "recovery.subtitle",
            "Công cụ khẩn cấp giúp giải quyết xung đột dữ liệu, xóa cache lỗi và phục hồi ứng dụng.",
          )}
        </p>
      </header>

      {/* ─── Main Content Container ─────────────────────────────────────────── */}
      <main className="w-full max-w-3xl flex flex-col gap-5 my-auto">
        {/* ─── System Diagnostics Bar (Moved to top) ────────────────────────── */}
        <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 p-3 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 font-mono shadow-2xs">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-slate-400" />
            <span className="font-medium">
              {t("recovery.systemInfo", "Thông tin hệ thống")}:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Storage Keys:{" "}
              {isMounted && storageCount !== null ? storageCount : "-"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Online:{" "}
              {isMounted && isOnline !== null ? (
                isOnline ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Yes
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold inline-flex items-center gap-0.5">
                    <WifiOff size={11} />
                    No
                  </span>
                )
              ) : (
                "-"
              )}
            </span>
          </div>
        </section>

        {/* Status Alerts */}
        {cacheClearSuccess && (
          <div className="w-full p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
            <CheckCircle2
              size={18}
              className="text-emerald-600 dark:text-emerald-400 shrink-0"
            />
            <span>{t("recovery.clearCacheSuccess")}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="w-full p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3 text-indigo-800 dark:text-indigo-300 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
            <RotateCcw
              size={18}
              className="text-indigo-600 dark:text-indigo-400 animate-spin shrink-0"
            />
            <span>{t("recovery.resetSuccess")}</span>
          </div>
        )}

        {importStatus && (
          <div
            className={`w-full p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm ${
              importStatus.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {importStatus.type === "success" ? (
              <CheckCircle2 size={18} className="shrink-0" />
            ) : (
              <AlertTriangle size={18} className="shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        {/* ─── 1. Major Action Cards Section ────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("recovery.majorOptions", "Tùy chọn Khôi phục Chính")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Clear Cache Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <RefreshCw
                    size={20}
                    className="text-sky-600 dark:text-sky-400 shrink-0"
                  />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t("recovery.clearCacheTitle")}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t("recovery.clearCacheDesc")}
                </p>
                {isOnline === false && (
                  <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium pt-1">
                    <WifiOff size={12} className="shrink-0" />
                    <span>Không có kết nối Internet</span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full rounded-xl border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 font-semibold text-xs h-10 gap-2"
                onClick={handleClearCache}
                disabled={
                  isClearingCache || isResettingData || isOnline === false
                }
                title={
                  isOnline === false
                    ? "Cần có kết nối Internet để dọn dẹp và tải lại cache mới"
                    : undefined
                }
              >
                {isOnline === false ? (
                  <>
                    <WifiOff size={14} className="text-rose-500" />
                    <span className="text-rose-500">Mất kết nối Internet</span>
                  </>
                ) : (
                  <>
                    <RefreshCw
                      size={14}
                      className={
                        isClearingCache ? "animate-spin text-sky-600" : ""
                      }
                    />
                    <span>
                      {isClearingCache
                        ? t("recovery.clearingCache")
                        : t("recovery.clearCacheBtn")}
                    </span>
                  </>
                )}
              </Button>
            </div>

            {/* Factory Reset Card */}
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <Trash2
                    size={20}
                    className="text-rose-600 dark:text-rose-400 shrink-0"
                  />
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    {t("recovery.factoryResetTitle")}
                  </h3>
                </div>
                <p className="text-xs text-rose-700/80 dark:text-rose-300/70 leading-relaxed">
                  {t("recovery.factoryResetDesc")}
                </p>
              </div>

              <Button
                variant="destructive"
                className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-10 gap-2 shadow-xs"
                onClick={() => setShowResetConfirm(true)}
                disabled={isClearingCache || isResettingData}
              >
                <Trash2 size={14} />
                <span>
                  {t("recovery.factoryResetBtn", "Xóa sạch toàn bộ dữ liệu")}
                </span>
              </Button>
            </div>

            {/* Go to Home Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <Home
                    size={20}
                    className="text-indigo-600 dark:text-indigo-400 shrink-0"
                  />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t("recovery.homeTitle")}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t("recovery.homeDesc")}
                </p>
              </div>

              <Button
                variant="default"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 gap-2 shadow-xs"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                <Home size={14} />
                <span>{t("recovery.homeBtn", "Về Trang Chủ")}</span>
                <ArrowRight size={14} className="ml-auto" />
              </Button>
            </div>
          </div>
        </section>

        {/* ─── 2. Minor / Secondary Utilities Section ───────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("recovery.utilities")}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 shadow-xs flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
            {/* Export Backup Item */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Download size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t("recovery.exportBackupTitle")}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("recovery.exportBackupDesc")}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-medium h-9 px-3 gap-1.5 shrink-0 whitespace-nowrap"
                onClick={handleExportBackup}
              >
                <Download size={13} />
                <span>{t("recovery.exportBackupBtn")}</span>
              </Button>
            </div>

            {/* Import Backup Item */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
                  <Upload size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t("recovery.importBackupTitle")}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("recovery.importBackupDesc")}
                  </p>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-medium h-9 px-3 gap-1.5 shrink-0 w-full sm:w-auto whitespace-nowrap"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={13} />
                  <span>{t("recovery.importBackupBtn")}</span>
                </Button>
              </div>
            </div>

            {/* Report Bug Item */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Bug size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t("recovery.reportBugTitle")}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("recovery.reportBugDesc")}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium h-9 px-3 shrink-0 whitespace-nowrap"
                asChild
              >
                <a
                  href={IMIFY_LINKS.githubIssuesNew}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>
                    {t("recovery.reportBugBtn", "Báo cáo lỗi trên GitHub")}
                  </span>
                  <ExternalLink size={13} className="shrink-0" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer Copyright ───────────────────────────────────────────────── */}
      <footer className="w-full text-center py-4 text-xs text-slate-400 dark:text-slate-600">
        <span>
          © {new Date().getFullYear()} Imify v{appMetadata.version}
          {appMetadata.versionType ? ` (${appMetadata.versionType})` : ""} by
          TrongAJTT. Emergency Recovery Module.
        </span>
      </footer>

      {/* ─── Confirmation Modal for Factory Reset ───────────────────────────── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  {t("recovery.confirmResetTitle")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Imify Reset Guard
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("recovery.confirmResetDesc")}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                className="rounded-xl text-xs font-semibold h-10 px-4"
                onClick={() => setShowResetConfirm(false)}
                disabled={isResettingData}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-10 px-4 gap-2"
                onClick={handleFactoryReset}
                disabled={isResettingData}
              >
                <Trash2
                  size={14}
                  className={isResettingData ? "animate-spin" : ""}
                />
                <span>
                  {isResettingData
                    ? "Cleaning..."
                    : t("recovery.confirmResetBtn")}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
