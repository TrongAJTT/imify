"use client";

import React, { useState } from "react";
import { Download, AlertCircle, Languages } from "lucide-react";
import { BaseDialog } from "@imify/ui/ui/base-dialog";
import { Button } from "@imify/ui/ui/button";
import { generateEmptyLanguageZip, type LanguageMeta } from "@imify/i18n";

interface I18nTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function I18nTemplateDialog({
  isOpen,
  onClose,
  onSuccess,
}: I18nTemplateDialogProps) {
  const [languageName, setLanguageName] = useState("");
  const [languageCode, setLanguageCode] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorGithub, setAuthorGithub] = useState("");
  const [metaError, setMetaError] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    if (!languageName.trim() || !languageCode.trim()) {
      setMetaError(
        "Language Name and Language Code are required to download template.",
      );
      return;
    }
    setMetaError(null);

    const meta: LanguageMeta = {
      languageName: languageName.trim(),
      languageCode: languageCode.trim().toLowerCase(),
      version: "2.2.0",
      maintainers: authorName.trim()
        ? [
            {
              name: authorName.trim(),
              github: authorGithub.trim() || "https://github.com",
              role: "Contributor",
            },
          ]
        : [],
    };

    try {
      const zipData = generateEmptyLanguageZip(meta);
      const blob = new Blob([zipData as BlobPart], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `imify_locale_${meta.languageCode}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setMetaError(err.message || "Failed to generate template.");
    }
  };

  const handleClose = () => {
    setLanguageName("");
    setLanguageCode("");
    setAuthorName("");
    setAuthorGithub("");
    setMetaError(null);
    onClose();
  };

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-md w-full"
      contentClassName="p-6 flex flex-col gap-6"
    >
      <div className="contents" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Languages className="w-5 h-5 text-sky-500" />
            <span>Generate Language Template</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure language metadata and download a skeleton ZIP translation
            archive.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Language Name
            </label>
            <input
              type="text"
              placeholder="e.g. Français"
              value={languageName}
              onChange={(e) => setLanguageName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Language Code
            </label>
            <input
              type="text"
              placeholder="e.g. fr"
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Author Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. James Thomas"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Github URL (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. https://github.com/jamesthomas"
              value={authorGithub}
              onChange={(e) => setAuthorGithub(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {metaError && (
            <div className="flex items-center gap-2 text-red-500 text-xs mt-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{metaError}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-slate-600 dark:text-slate-400"
          >
            <span>Cancel</span>
          </Button>

          <Button
            onClick={handleDownloadTemplate}
            disabled={!languageName.trim() || !languageCode.trim()}
            className="bg-sky-500 hover:bg-sky-600 text-white gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Template</span>
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
}
