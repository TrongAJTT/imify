"use client";

import React, { useState, useRef, type ChangeEvent } from "react";
import { Upload, AlertCircle, Languages } from "lucide-react";
import { BaseDialog } from "@imify/ui/ui/base-dialog";
import { Button } from "@imify/ui/ui/button";
import {
  importLanguageAtRuntime,
  calculateImportedStats,
  type LanguageMeta,
} from "@imify/i18n";
import i18n from "i18next";
import { useI18nStore } from "@imify/stores";
import { unzip } from "fflate";

interface I18nRuntimeImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (meta: LanguageMeta) => void;
}

export function I18nRuntimeImportDialog({
  isOpen,
  onClose,
  onSuccess,
}: I18nRuntimeImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [completionStats, setCompletionStats] = useState<{
    completed: number;
    total: number;
    rate: number;
  } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadError(null);
    setParsedData(null);
    setCompletionStats(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = new Uint8Array(event.target?.result as ArrayBuffer);
        unzip(buffer, (err, unzipped) => {
          if (err) {
            setUploadError("Failed to unzip file. Please upload a valid zip.");
            setSelectedFile(null);
            return;
          }

          try {
            let meta: LanguageMeta | null = null;
            const data: Record<string, any> = {};
            const decoder = new TextDecoder("utf-8");

            // 1. Find and parse _meta.json
            for (const filePath of Object.keys(unzipped)) {
              if (filePath.endsWith("_meta.json")) {
                const text = decoder.decode(unzipped[filePath]);
                meta = JSON.parse(text);
                break;
              }
            }

            if (!meta) {
              throw new Error("Missing _meta.json file inside zip.");
            }
            if (!meta.languageCode || !meta.languageName) {
              throw new Error(
                "Invalid metadata: languageCode and languageName are required in _meta.json.",
              );
            }

            // 2. Parse all other namespace JSON files
            for (const filePath of Object.keys(unzipped)) {
              if (
                filePath.includes("__MACOSX") ||
                filePath.includes(".DS_Store")
              ) {
                continue;
              }
              if (
                filePath.endsWith(".json") &&
                !filePath.endsWith("_meta.json")
              ) {
                const baseName = filePath
                  .split("/")
                  .pop()
                  ?.replace(".json", "");
                if (baseName) {
                  const text = decoder.decode(unzipped[filePath]);
                  data[baseName] = JSON.parse(text);
                }
              }
            }

            // Set parsed data mimicking the original structure for dialog preview
            const mockParsedData = {
              _meta: meta,
              ...data,
            };
            setParsedData(mockParsedData);

            const stats = calculateImportedStats(data);
            const rate = stats.total === 0 ? 1.0 : stats.completed / stats.total;
            setCompletionStats({
              completed: stats.completed,
              total: stats.total,
              rate,
            });
          } catch (innerErr: any) {
            setUploadError(innerErr.message || "Failed to parse zip files.");
            setSelectedFile(null);
          }
        });
      } catch (err: any) {
        setUploadError(err.message || "Failed to read zip file.");
        setSelectedFile(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleApply = async () => {
    if (!selectedFile) return;
    setIsApplying(true);
    setUploadError(null);
    try {
      const meta = await importLanguageAtRuntime(selectedFile);
      useI18nStore.getState().setLanguage(meta.languageCode);
      onSuccess?.(meta);
      handleClose();
    } catch (err: any) {
      setUploadError(err.message || "Failed to import language bundle.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    if (isApplying) return;
    setSelectedFile(null);
    setUploadError(null);
    setParsedData(null);
    setCompletionStats(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            <span>Import Custom Translation</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload a translated ZIP file containing JSON files to apply it at
            runtime.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Select Translation ZIP
            </label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 gap-2 border-slate-200 dark:border-slate-800"
              >
                <Upload className="w-4 h-4" />
                <span>Choose ZIP</span>
              </Button>
              <span className="text-xs text-slate-500 truncate">
                {selectedFile ? selectedFile.name : "No file selected"}
              </span>
              <input
                type="file"
                accept=".zip"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {uploadError && (
              <div className="flex items-center gap-2 text-red-500 text-xs mt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {parsedData && completionStats && (
            <div className="mt-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 space-y-3 animate-in fade-in duration-200">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {parsedData._meta.languageName} (
                  {parsedData._meta.languageCode})
                </span>
                <span className="text-xs text-slate-500">
                  Version {parsedData._meta.version || "1.0.0"}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                  <span>Completion Progress</span>
                  <span>
                    {Math.round(completionStats.rate * 100)}% (
                    {completionStats.completed}/{completionStats.total} keys)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-350"
                    style={{ width: `${completionStats.rate * 100}%` }}
                  />
                </div>
              </div>

              {parsedData._meta.maintainers &&
                parsedData._meta.maintainers.length > 0 && (
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold block mb-0.5 text-slate-600 dark:text-slate-400">
                      Maintainers:
                    </span>
                    {parsedData._meta.maintainers.map((m: any, idx: number) => (
                      <div key={idx}>
                        • {m.name} ({m.role}) -{" "}
                        <a
                          href={m.github}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-500 hover:underline"
                        >
                          {m.github}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
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
            onClick={handleApply}
            disabled={!selectedFile || isApplying}
            className="bg-sky-500 hover:bg-sky-600 text-white gap-2"
          >
            {isApplying && (
              <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
            )}
            <span>Apply Language</span>
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
}
