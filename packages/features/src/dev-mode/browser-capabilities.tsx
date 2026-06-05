"use client";

import React, { useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Info,
  Camera,
  Monitor,
  Type,
  Layers,
  Zap,
  Database,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import {
  isCameraSupported,
  isScreenCaptureSupported,
  isLocalFontAccessSupported,
  isWebWorkerSupported,
  isOffscreenCanvasSupported,
  isSharedArrayBufferSupported,
  isIndexedDBSupported,
  isSecureContext,
  isMobileDevice,
  detectBrowser,
} from "@imify/core/browser-detection";
import { BodyText, MutedText } from "@imify/ui/ui/typography";

interface CapabilityItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  check: () => boolean;
  category: "API" | "Performance" | "Environment";
}

export function BrowserCapabilitiesDashboard() {
  const browser = useMemo(() => detectBrowser(), []);

  const capabilities: CapabilityItem[] = useMemo(
    () => [
      {
        id: "secure-context",
        name: "Secure Context",
        description: "HTTPS or Localhost connection (required for most APIs)",
        icon: ShieldCheck,
        check: isSecureContext,
        category: "Environment",
      },
      {
        id: "mobile-device",
        name: "Mobile Device",
        description: "Detects if current browser is on a mobile platform",
        icon: Smartphone,
        check: isMobileDevice,
        category: "Environment",
      },
      {
        id: "camera",
        name: "Camera (getUserMedia)",
        description: "Permission to access camera devices",
        icon: Camera,
        check: isCameraSupported,
        category: "API",
      },
      {
        id: "screen-capture",
        name: "Screen Capture",
        description: "Access to window or screen sharing API",
        icon: Monitor,
        check: isScreenCaptureSupported,
        category: "API",
      },
      {
        id: "local-fonts",
        name: "Local Font Access",
        description: "Query and load fonts installed on the OS",
        icon: Type,
        check: isLocalFontAccessSupported,
        category: "API",
      },
      {
        id: "indexed-db",
        name: "IndexedDB",
        description: "Large-scale structured data storage in browser",
        icon: Database,
        check: isIndexedDBSupported,
        category: "API",
      },
      {
        id: "web-workers",
        name: "Web Workers",
        description: "Multithreading support for heavy processing",
        icon: Zap,
        check: isWebWorkerSupported,
        category: "Performance",
      },
      {
        id: "offscreen-canvas",
        name: "OffscreenCanvas",
        description: "Canvas rendering outside the main thread",
        icon: Layers,
        check: isOffscreenCanvasSupported,
        category: "Performance",
      },
      {
        id: "shared-array-buffer",
        name: "SharedArrayBuffer",
        description:
          "High-speed shared memory (requires Cross-Origin Isolation)",
        icon: Zap,
        check: isSharedArrayBufferSupported,
        category: "Performance",
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <Info size={16} className="text-sky-500" />
        <MutedText className="text-xs">
          Detected Browser:{" "}
          <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">
            {browser}
          </span>
        </MutedText>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="px-4 py-3 font-semibold">Capability</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">
                Category
              </th>
              <th className="px-4 py-3 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-950/20">
            {capabilities.map((cap) => {
              const isSupported = cap.check();
              return (
                <tr
                  key={cap.id}
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                        <cap.icon size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <BodyText className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {cap.name}
                        </BodyText>
                        <MutedText className="text-[11px] leading-snug mt-0.5 max-w-[280px]">
                          {cap.description}
                        </MutedText>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                        cap.category === "API"
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                          : cap.category === "Performance"
                            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {cap.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {isSupported ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                        <CheckCircle2 size={12} />
                        <span className="text-[10px] font-bold uppercase">
                          Supported
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
                        <XCircle size={12} />
                        <span className="text-[10px] font-bold uppercase">
                          Unsupported
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
