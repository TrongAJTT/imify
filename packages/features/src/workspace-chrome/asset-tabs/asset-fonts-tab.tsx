"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  CloudDownload,
  Trash2,
  Monitor,
  Upload,
  Search,
  Type,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Button, BodyText, MutedText, Subheading, BaseDialog } from "@imify/ui";
import { formatFileSize } from "@imify/core";
import { useToast } from "@imify/core/hooks/use-toast";
import { ToastContainer } from "@imify/ui/components/toast-container";
import { useFontStore } from "@imify/stores/stores/font-store";
import { isLocalFontAccessSupported } from "@imify/core/browser-detection";
import {
  CURATED_GOOGLE_FONTS,
  fetchGoogleFontWoff2,
  getSystemFonts,
  fetchSystemFontBlob,
  convertToWoff2IfNeeded,
  type SystemFontInfo,
  type GoogleFontCurated,
} from "../../shared/font-service";
import { DownloadFontDialog } from "./asset-fonts-download-dialog";

export function AssetFontsTab() {
  const { toasts, hide, success, error } = useToast();

  const installedFonts = useFontStore((state) => state.installedFonts);
  const addFont = useFontStore((state) => state.addFont);
  const removeFont = useFontStore((state) => state.removeFont);
  const resetToDefault = useFontStore((state) => state.resetToDefault);
  const isLoadingFonts = useFontStore((state) => state.isLoadingFonts);

  // Search & Filter state for Google Fonts
  const [googleSearch, setGoogleSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal states
  const [fontToDownload, setFontToDownload] =
    useState<GoogleFontCurated | null>(null);
  const [isSystemPickerOpen, setIsSystemPickerOpen] = useState(false);
  const [systemFonts, setSystemFonts] = useState<SystemFontInfo[]>([]);
  const [isLoadingSystemFonts, setIsLoadingSystemFonts] = useState(false);
  const [isLocalAccessSupported, setIsLocalAccessSupported] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Collapse state for sections: 'import-custom', 'installed-offline', 'google-library'
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if queryLocalFonts is supported
    setIsLocalAccessSupported(
      typeof window !== "undefined" && "queryLocalFonts" in window,
    );
  }, []);

  // Filter Google Fonts list
  const filteredGoogleFonts = CURATED_GOOGLE_FONTS.filter((font) => {
    const matchesSearch = font.family
      .toLowerCase()
      .includes(googleSearch.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || font.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Check if a font is already installed
  const isInstalled = (family: string) => {
    return installedFonts.some(
      (f) => f.name.toLowerCase() === family.toLowerCase(),
    );
  };

  // Find installed font id
  const getInstalledId = (family: string) => {
    return (
      installedFonts.find((f) => f.name.toLowerCase() === family.toLowerCase())
        ?.id || ""
    );
  };

  // Handle Google Font download confirmation
  const handleDownloadConfirm = async () => {
    if (!fontToDownload) return;
    const font = fontToDownload;
    setFontToDownload(null);
    setIsDownloading(font.family);

    success("Download started", `Downloading WOFF2 file for ${font.family}...`);

    try {
      const { data, fileName } = await fetchGoogleFontWoff2(
        font.family,
        font.defaultWeight,
      );
      const id = `google_${font.family.toLowerCase().replace(/\s+/g, "_")}`;

      const entry = {
        id,
        name: font.family,
        fileName,
        source: "google" as const,
        weight: font.defaultWeight,
        data,
        fileSize: data.byteLength,
        addedAt: Date.now(),
      };

      await addFont(entry);
      success("Font installed", `"${font.family}" is now available offline.`);
    } catch (err: any) {
      console.error(`Failed to install ${font.family}:`, err);
      error(
        "Download failed",
        err.message || `Failed to fetch "${font.family}".`,
      );
    } finally {
      setIsDownloading(null);
    }
  };

  // Handle System Fonts fetch & open picker
  const handleOpenSystemPicker = async () => {
    if (!isLocalAccessSupported) {
      error(
        "Not supported",
        "Your browser does not support Local Font Access API (Chrome/Edge recommended).",
      );
      return;
    }

    setIsLoadingSystemFonts(true);
    setIsSystemPickerOpen(true);
    try {
      const fonts = await getSystemFonts();
      setSystemFonts(fonts);
    } catch (err) {
      console.error("System fonts fetch failed:", err);
      error("Fetch failed", "Failed to retrieve local system fonts.");
    } finally {
      setIsLoadingSystemFonts(false);
    }
  };

  // Import selected system font
  const handleImportSystemFont = async (familyName: string) => {
    setIsSystemPickerOpen(false);

    // Find family members
    const familyFonts = systemFonts.filter((f) => f.family === familyName);
    if (familyFonts.length === 0) return;

    // Prioritize Bold (700) or Black (900), fallback to Regular/first
    const preferred =
      familyFonts.find((f) => {
        const style = f.style.toLowerCase();
        return style.includes("bold") || style.includes("700");
      }) ||
      familyFonts.find((f) => {
        const style = f.style.toLowerCase();
        return (
          style.includes("black") ||
          style.includes("900") ||
          style.includes("heavy")
        );
      }) ||
      familyFonts.find((f) => {
        const style = f.style.toLowerCase();
        return (
          style.includes("regular") ||
          style.includes("400") ||
          style === "normal"
        );
      }) ||
      familyFonts[0];

    success("Importing", `Extracting system font "${preferred.fullName}"...`);

    try {
      const blob = await fetchSystemFontBlob(preferred.postscriptName);
      if (!blob) {
        throw new Error("Could not retrieve font data blob from system.");
      }

      const arrayBuffer = await blob.arrayBuffer();
      const fontData = await convertToWoff2IfNeeded(arrayBuffer);

      // Determine weight
      let weight = 400;
      const styleLower = preferred.style.toLowerCase();
      if (styleLower.includes("bold") || styleLower.includes("700"))
        weight = 700;
      else if (
        styleLower.includes("black") ||
        styleLower.includes("900") ||
        styleLower.includes("heavy")
      )
        weight = 900;
      else if (styleLower.includes("light") || styleLower.includes("300"))
        weight = 300;

      const id = `system_${preferred.postscriptName.toLowerCase().replace(/[-_]/g, "_")}`;
      const entry = {
        id,
        name: preferred.family,
        fileName: `${preferred.postscriptName}.woff2`,
        source: "custom" as const,
        weight,
        data: fontData,
        fileSize: fontData.byteLength,
        addedAt: Date.now(),
      };

      await addFont(entry);
      success(
        "Font imported",
        `"${preferred.family}" has been successfully imported.`,
      );
    } catch (err: any) {
      console.error(`Failed to import system font ${familyName}:`, err);
      error(
        "Import failed",
        err.message || `Failed to import system font "${familyName}".`,
      );
    }
  };

  // Handle Custom File Upload
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "ttf" && ext !== "otf" && ext !== "woff2") {
      error(
        "Invalid file format",
        "Please upload a TTF, OTF, or WOFF2 font file.",
      );
      return;
    }

    try {
      success("Importing", `Processing file "${file.name}"...`);
      const arrayBuffer = await file.arrayBuffer();
      const isWoff2File =
        arrayBuffer.byteLength >= 4 &&
        new DataView(arrayBuffer).getUint8(0) === 0x77 &&
        new DataView(arrayBuffer).getUint8(1) === 0x4f &&
        new DataView(arrayBuffer).getUint8(2) === 0x46 &&
        new DataView(arrayBuffer).getUint8(3) === 0x32;

      const fontData = await convertToWoff2IfNeeded(arrayBuffer);

      const rawName = file.name
        .substring(0, file.name.lastIndexOf("."))
        .replace(/[-_]/g, " ");
      const formattedName = rawName
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      // Determine weight
      let weight = 400;
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes("bold") || lowerName.includes("700")) weight = 700;
      else if (
        lowerName.includes("black") ||
        lowerName.includes("900") ||
        lowerName.includes("heavy")
      )
        weight = 900;
      else if (lowerName.includes("light") || lowerName.includes("300"))
        weight = 300;

      const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const entry = {
        id,
        name: formattedName,
        fileName: isWoff2File
          ? file.name
          : `${file.name.substring(0, file.name.lastIndexOf("."))}.woff2`,
        source: "custom" as const,
        weight,
        data: fontData,
        fileSize: fontData.byteLength,
        addedAt: Date.now(),
      };

      await addFont(entry);
      success("Font imported", `"${formattedName}" is now available offline.`);
    } catch (err: any) {
      console.error("File import failed:", err);
      error("Import failed", err.message || "Failed to process the font file.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle Font Deletion
  const handleDeleteFont = async (id: string, name: string) => {
    const shouldDelete = window.confirm(
      `Remove font "${name}"? It will no longer be available offline.`,
    );
    if (!shouldDelete) return;

    try {
      await removeFont(id);
      success("Font removed", `"${name}" has been deleted from local storage.`);
    } catch (err) {
      console.error(`Failed to delete font ${name}:`, err);
      error("Delete failed", `Failed to delete "${name}".`);
    }
  };

  // Clear all custom fonts
  const handleClearAll = async () => {
    const shouldReset = window.confirm(
      "Are you sure you want to delete ALL installed fonts?",
    );
    if (!shouldReset) return;

    try {
      await resetToDefault();
      success("Storage cleared", "All installed fonts have been removed.");
    } catch (err) {
      error("Clear failed", "Failed to clear font storage.");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/80 dark:bg-slate-950/40">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Header Note */}
        <div className="bg-white dark:bg-violet-500/10 p-5 rounded-xl flex gap-4 border border-slate-200 dark:border-violet-500/20 shadow-sm">
          <Type className="text-violet-500 shrink-0" size={20} />
          <div className="space-y-1 flex-1">
            <BodyText className="text-sm font-bold text-slate-800 dark:text-violet-300">
              Font Management & QR Customization
            </BodyText>
            <MutedText className="text-xs leading-relaxed">
              Install custom fonts to style the text printed beneath your QR
              codes. Google Fonts can be fetched directly, or you can import
              system-wide local fonts and OTF/TTF files which are converted
              inline to lightweight WOFF2 format.
            </MutedText>
          </div>
        </div>

        {/* Section 2: Custom Fonts Action Cards */}
        <div className="space-y-4">
          <button
            onClick={() => toggleSection("import-custom")}
            className="flex w-full items-center justify-between gap-2.5 px-1 py-1 group cursor-pointer hover:opacity-80 transition-opacity text-left"
          >
            <div className="flex items-center gap-2.5">
              <Upload size={16} className="text-violet-500" />
              <Subheading className="text-sm font-extrabold tracking-tight uppercase text-slate-800 dark:text-slate-200">
                Import Custom Fonts
              </Subheading>
            </div>
            {collapsedSections.has("import-custom") ? (
              <ChevronRight
                size={16}
                className="text-slate-400 group-hover:text-violet-500 transition-colors"
              />
            ) : (
              <ChevronDown
                size={16}
                className="text-slate-400 group-hover:text-violet-500 transition-colors"
              />
            )}
          </button>

          {!collapsedSections.has("import-custom") && (
           <div className={`grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300 ${isLocalFontAccessSupported() ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
             {/* Card 1: System Font */}
             {isLocalFontAccessSupported() && (
               <div
                 onClick={handleOpenSystemPicker}
                 className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-violet-500 dark:hover:border-violet-500 transition-all cursor-pointer flex gap-4 items-center group"
               >
                 <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-500 group-hover:scale-105 transition-transform">
                   <Monitor size={22} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <BodyText className="text-sm font-bold text-slate-800 dark:text-slate-100">
                     Import System Font
                   </BodyText>
                   <MutedText className="text-xs truncate">
                     Import any font installed on your computer
                   </MutedText>
                 </div>
               </div>
             )}

              {/* Card 2: File Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-violet-500 dark:hover:border-violet-500 transition-all cursor-pointer flex gap-4 items-center group"
              >
                <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-500 group-hover:scale-105 transition-transform">
                  <Upload size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <BodyText className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Upload Font File
                  </BodyText>
                  <MutedText className="text-xs truncate">
                    Import local .ttf, .otf, or .woff2 files
                  </MutedText>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileImport}
                  accept=".ttf,.otf,.woff2"
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Custom Installed Fonts List */}
        {installedFonts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleSection("installed-offline")}
                className="flex items-center gap-2.5 px-1 py-1 group cursor-pointer hover:opacity-80 transition-opacity text-left"
              >
                <CheckCircle2 size={16} className="text-emerald-500" />
                <Subheading className="text-sm font-extrabold tracking-tight uppercase text-slate-800 dark:text-slate-200">
                  Installed Offline Fonts
                </Subheading>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {installedFonts.length}
                </span>
                {collapsedSections.has("installed-offline") ? (
                  <ChevronRight
                    size={16}
                    className="text-slate-400 group-hover:text-violet-500 transition-colors"
                  />
                ) : (
                  <ChevronDown
                    size={16}
                    className="text-slate-400 group-hover:text-violet-500 transition-colors"
                  />
                )}
              </button>

              {!collapsedSections.has("installed-offline") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Clear All
                </Button>
              )}
            </div>

            {!collapsedSections.has("installed-offline") && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                {installedFonts.map((font) => (
                  <div
                    key={font.id}
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-semibold text-slate-800 dark:text-slate-100"
                          style={{ fontFamily: font.name }}
                        >
                          {font.name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded capitalize font-semibold border ${
                            font.source === "google"
                              ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                              : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                          }`}
                        >
                          {font.source}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          Weight: {font.weight}
                        </span>
                      </div>
                      {/* Live Preview */}
                      <div
                        className="mt-1 text-slate-500 dark:text-slate-400 text-xs truncate"
                        style={{
                          fontFamily: font.name,
                          fontWeight: font.weight,
                        }}
                      >
                        The quick brown fox jumps over the lazy dog
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatFileSize(font.fileSize)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFont(font.id, font.name)}
                        className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 1: Google Fonts Curated List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              onClick={() => toggleSection("google-library")}
              className="flex items-center gap-2.5 px-1 py-1 group cursor-pointer hover:opacity-80 transition-opacity text-left"
            >
              <Type size={16} className="text-violet-500" />
              <Subheading className="text-sm font-extrabold tracking-tight uppercase text-slate-800 dark:text-slate-200">
                Google Fonts Library
              </Subheading>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {CURATED_GOOGLE_FONTS.length}
              </span>
              {collapsedSections.has("google-library") ? (
                <ChevronRight
                  size={16}
                  className="text-slate-400 group-hover:text-violet-500 transition-colors"
                />
              ) : (
                <ChevronDown
                  size={16}
                  className="text-slate-400 group-hover:text-violet-500 transition-colors"
                />
              )}
            </button>

            {/* Search and Filters */}
            {!collapsedSections.has("google-library") && (
              <div className="flex gap-2">
                <div className="relative flex-1 sm:w-60">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search Google fonts..."
                    value={googleSearch}
                    onChange={(e) => setGoogleSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="all">All Styles</option>
                  <option value="sans-serif">Sans-Serif</option>
                  <option value="serif">Serif</option>
                  <option value="handwriting">Handwriting</option>
                  <option value="display">Display</option>
                </select>
              </div>
            )}
          </div>

          {/* Grid */}
          {!collapsedSections.has("google-library") &&
            (filteredGoogleFonts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {filteredGoogleFonts.map((font) => {
                  const installed = isInstalled(font.family);
                  const downloading = isDownloading === font.family;

                  return (
                    <div
                      key={font.family}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate pr-2">
                            {font.family}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 capitalize shrink-0">
                            {font.category}
                          </span>
                        </div>

                        {/* Sample Preview */}
                        <div className="h-12 flex items-center justify-center border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-lg mt-1.5 select-none">
                          <span
                            className="text-sm truncate text-slate-800 dark:text-slate-200"
                            style={{
                              fontFamily: font.family,
                              fontWeight: font.defaultWeight,
                            }}
                          >
                            Sample Text
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          License:{" "}
                          {font.license
                            .replace("-1.1", "")
                            .replace("-License", "")}
                        </span>

                        {installed ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={12} /> Installed
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteFont(
                                  getInstalledId(font.family),
                                  font.family,
                                )
                              }
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 h-7 w-7 rounded-full"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={downloading}
                            onClick={() => setFontToDownload(font)}
                            className="text-violet-600 dark:text-violet-400 flex items-center gap-1 text-xs h-8 px-2.5 rounded-lg"
                          >
                            {downloading ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />{" "}
                                Fetching...
                              </>
                            ) : (
                              <>
                                <CloudDownload size={14} /> Download
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-sm animate-in fade-in duration-300">
                No fonts match your search criteria.
              </div>
            ))}
        </div>
      </div>

      {/* Download Confirmation Dialog */}
      {fontToDownload && (
        <DownloadFontDialog
          isOpen={!!fontToDownload}
          onClose={() => setFontToDownload(null)}
          onConfirm={handleDownloadConfirm}
          font={fontToDownload}
        />
      )}

      {/* System Fonts Picker Dialog */}
      <BaseDialog
        isOpen={isSystemPickerOpen}
        onClose={() => setIsSystemPickerOpen(false)}
        className="max-w-lg"
        contentClassName="p-6 space-y-4 h-[75vh] max-h-[600px] flex flex-col"
      >
        <div className="flex flex-col gap-1">
          <Subheading className="text-base font-bold text-slate-800 dark:text-slate-100">
            Import Local System Font
          </Subheading>
          <BodyText className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
            Select an installed font from your system. Imify will automatically
            convert its Bold (700) or Black (900) style to lightweight WOFF2
            format for canvas rendering.
          </BodyText>
        </div>

        {/* Local Fonts Status Check */}
        {isLoadingSystemFonts ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-violet-500" />
            <BodyText className="text-sm">Querying system fonts...</BodyText>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search system fonts..."
                value={googleSearch} // Reuse search state temporarily
                onChange={(e) => setGoogleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800/50">
              {Array.from(new Set(systemFonts.map((f) => f.family)))
                .sort()
                .filter((family) =>
                  family.toLowerCase().includes(googleSearch.toLowerCase()),
                )
                .map((family) => (
                  <button
                    key={family}
                    onClick={() => handleImportSystemFont(family)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group"
                  >
                    <span
                      className="text-slate-700 dark:text-slate-300 font-medium"
                      style={{ fontFamily: family }}
                    >
                      {family}
                    </span>
                    <span className="text-xs text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Import &rarr;
                    </span>
                  </button>
                ))}
              {systemFonts.length === 0 && (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                  <AlertCircle size={20} className="text-slate-300" />
                  <BodyText className="text-xs">
                    No local fonts discovered. Ensure permission is granted.
                  </BodyText>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/50">
          <Button variant="ghost" onClick={() => setIsSystemPickerOpen(false)}>
            Close
          </Button>
        </div>
      </BaseDialog>

      <ToastContainer toasts={toasts} onRemove={hide} />
    </div>
  );
}
