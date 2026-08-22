"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  FileText,
  AlertCircle,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { Button, AnimatingSpinner } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { formatFileSize } from "../inspector/format-utils";

interface PdfPasswordLockCardProps {
  fileName: string;
  fileSize: number;
  onUnlock: (password: string) => Promise<boolean>;
  onClear: () => void;
  isUnlocking?: boolean;
}

export function PdfPasswordLockCard({
  fileName,
  fileSize,
  onUnlock,
  onClear,
  isUnlocking = false,
}: PdfPasswordLockCardProps) {
  const { t } = useTranslation(["pdfStudio", "common"]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!password.trim() || isSubmitting || isUnlocking) return;

      setHasError(false);
      setIsSubmitting(true);
      try {
        const success = await onUnlock(password);
        if (!success) {
          setHasError(true);
          inputRef.current?.select();
        }
      } catch {
        setHasError(true);
        inputRef.current?.select();
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, isUnlocking, onUnlock, password],
  );

  const loading = isSubmitting || isUnlocking;

  return (
    <div className="flex min-h-[55vh] items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
        {/* Header with Icon */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-8 ring-amber-500/5 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/5">
            <Lock className="h-7 w-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 mb-2">
            <KeyRound className="h-3.5 w-3.5" />
            <span>{t("password.protectedBadge")}</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            {t("password.title")}
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t("password.description")}
          </p>
        </div>

        {/* File Info Pill */}
        <div className="my-5 flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800/80 dark:bg-slate-800/40">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
              {fileName}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {formatFileSize(fileSize)}
            </p>
          </div>
        </div>

        {/* Error message */}
        {hasError && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              {t("password.incorrectPassword")}
            </p>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (hasError) setHasError(false);
              }}
              placeholder={t("password.inputPlaceholder")}
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={loading}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none dark:text-slate-500 dark:hover:text-slate-300"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="space-y-2 pt-1">
            <Button
              type="submit"
              disabled={!password.trim() || loading}
              className="w-full justify-center py-2.5 font-medium shadow-md transition-all active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <span className="mr-2 inline-flex items-center">
                    <AnimatingSpinner size={16} />
                  </span>
                  <span>{t("password.unlockingButton")}</span>
                </>
              ) : (
                <span>{t("password.unlockButton")}</span>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={onClear}
              className="w-full justify-center border-transparent py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              <span>{t("password.chooseAnotherFile")}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
