import React, { useState } from "react";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  AccordionCard,
  MutedText,
  SplitButton,
  type SplitButtonOption,
  Tooltip,
} from "@imify/ui";
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  History,
  ExternalLink,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  User,
  Calendar,
  MessageCircle,
  FileText,
  Copy,
} from "lucide-react";
import { useQrReaderStore, useWorkspaceHeaderStore, toast, confirmDialog } from "@imify/stores";
import {
  parseQrString,
  type ParsedQrResult,
  type ParsedQrType,
} from "./qr-parser";
import { useTranslation } from "@imify/i18n";
import { QrActionsPanel } from "./qr-actions-panel";

interface QrReaderSidebarProps {
  enableWideSidebarGrid?: boolean;
  autoWideSidebarGridMinWidthPx?: number | null;
}

function formatHistoryTime(ts: number, t: any): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return t("history.time.justNow");
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t("history.time.minsAgo", { count: mins });
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return t("history.time.hoursAgo", { count: hours });
  const days = Math.floor(diff / 86400000);
  return t("history.time.daysAgo", { count: days });
}

function getQrTypeIcon(type: ParsedQrType) {
  switch (type) {
    case "url":
      return <ExternalLink size={13} className="text-blue-500" />;
    case "email":
      return <Mail size={13} className="text-emerald-500" />;
    case "phone":
      return <Phone size={13} className="text-indigo-500" />;
    case "sms":
      return <MessageSquare size={13} className="text-purple-500" />;
    case "wifi":
      return <Wifi size={13} className="text-amber-500" />;
    case "vcard":
      return <User size={13} className="text-rose-500" />;
    case "event":
      return <Calendar size={13} className="text-sky-500" />;
    case "messaging":
      return <MessageCircle size={13} className="text-teal-500" />;
    case "text":
    default:
      return <FileText size={13} className="text-slate-400" />;
  }
}

function getHistoryItemSummary(parsed: ParsedQrResult, t: any): string {
  switch (parsed.type) {
    case "url":
      return parsed.raw;
    case "email":
      return parsed.emailData?.to || parsed.raw;
    case "phone":
      return parsed.raw.startsWith("tel:")
        ? parsed.raw.substring(4)
        : parsed.raw;
    case "sms":
      return parsed.smsData?.phone || parsed.raw;
    case "wifi":
      return parsed.wifiData?.ssid || "";
    case "vcard":
      return parsed.vcardData?.name || parsed.raw;
    case "event":
      return parsed.eventData?.title || parsed.raw;
    case "messaging":
      return `${parsed.messagingData?.platform.toUpperCase()}: ${parsed.messagingData?.recipient}`;
    case "text":
    default:
      return parsed.raw.length > 40
        ? parsed.raw.substring(0, 37) + "..."
        : parsed.raw;
  }
}

export function QrReaderSidebar({
  enableWideSidebarGrid = false,
  autoWideSidebarGridMinWidthPx = null,
}: QrReaderSidebarProps) {
  const { t } = useTranslation(["qrReader", "common"]);
  const {
    savedHistory,
    deleteFromHistory,
    clearHistory,
    clearHistoryOlderThan,
    setLastScanResult,
    lastScanResult,
  } = useQrReaderStore();
  const setIsMobileSidebarOpen = useWorkspaceHeaderStore((s) => s.setIsMobileSidebarOpen);

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const handleRequestClear = async (
    mode: "all" | "3days" | "7days" | "30days",
  ) => {
    const title =
      mode === "all"
        ? t("history.confirmClearTitle")
        : t("history.confirmClearOlderTitle");
    const msg =
      mode === "all"
        ? t("history.confirmClearMsg")
        : t("history.confirmClearOlderMsg", {
            days: mode === "3days" ? 3 : mode === "7days" ? 7 : 30,
          });

    const confirmed = await confirmDialog({
      title,
      description: msg,
      variant: "destructive",
    });

    if (confirmed) {
      if (mode === "all") {
        clearHistory();
        toast.success(t("history.title"), t("history.clearSuccess"));
      } else if (mode === "3days") {
        clearHistoryOlderThan(3);
        toast.success(t("history.title"), t("history.clearOlderSuccess"));
      } else if (mode === "7days") {
        clearHistoryOlderThan(7);
        toast.success(t("history.title"), t("history.clearOlderSuccess"));
      } else if (mode === "30days") {
        clearHistoryOlderThan(30);
        toast.success(t("history.title"), t("history.clearOlderSuccess"));
      }
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFromHistory(id);
    toast.success(t("history.title"), t("history.deleteSuccess"));
  };

  const handleCopyRaw = (raw: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard
      .writeText(raw)
      .then(() => {
        toast.success(t("workspace.copied"), t("workspace.copiedSuccess"));
      })
      .catch(() => {
        toast.error(t("workspace.errorHeader"), t("workspace.copyFailed"));
      });
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const clearOptions: SplitButtonOption[] = [
    {
      id: "3days",
      label: t("history.clearOlderThan3Days"),
      onClick: () => handleRequestClear("3days"),
    },
    {
      id: "7days",
      label: t("history.clearOlderThan7Days"),
      onClick: () => handleRequestClear("7days"),
    },
    {
      id: "30days",
      label: t("history.clearOlderThan1Month"),
      onClick: () => handleRequestClear("30days"),
    },
  ];

  const renderHistoryContent = () => {
    if (savedHistory.length === 0) {
      return (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 text-center space-y-1 select-none">
          <MutedText className="text-xs font-medium">
            {t("history.noHistory")}
          </MutedText>
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {savedHistory.map((item) => {
          const parsed = parseQrString(item.raw);
          const isSelected = lastScanResult === item.raw;
          const isExpanded = !!expandedIds[item.id];
          return (
            <div
              key={item.id}
              onClick={() => {
                setLastScanResult(item.raw);
                setIsMobileSidebarOpen(false);
              }}
              className={`flex flex-col p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer group relative ${
                isSelected
                  ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/20"
                  : "border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-900/80"
              }`}
            >
              <div className="flex flex-col min-w-0 gap-1 select-none w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getQrTypeIcon(parsed.type)}
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      {t(`sidebar.typeLabels.${parsed.type}`)}
                    </span>
                  </div>
                  <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                    {formatHistoryTime(item.timestamp, t)}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                  {getHistoryItemSummary(parsed, t)}
                </span>
              </div>

              {/* Action Toolbar underneath content */}
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 w-full">
                <span className="text-[9px] text-slate-400 font-medium">
                  {parsed.type.toUpperCase()}
                </span>
                <div className="flex items-center gap-1">
                  {/* Copy button */}
                  <Tooltip content={t("workspace.copyRaw")}>
                    <button
                      type="button"
                      onClick={(e) => handleCopyRaw(item.raw, e)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                      <Copy size={11} />
                    </button>
                  </Tooltip>
                  {/* Expand/Collapse button */}
                  <Tooltip
                    content={
                      isExpanded ? t("common:collapse") : t("common:expand")
                    }
                  >
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(item.id, e)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp size={11} />
                      ) : (
                        <ChevronDown size={11} />
                      )}
                    </button>
                  </Tooltip>
                  {/* Delete button */}
                  <Tooltip content={t("common:delete")}>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-rose-450 hover:text-rose-600 dark:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* Render expanded actions using reusable QrActionsPanel component */}
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 w-full">
                  <QrActionsPanel
                    raw={item.raw}
                    buttonSizeClassName="text-[10px] h-8"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "saved-history",
      label: "",
      content: (
        <AccordionCard
          label={t("history.title")}
          icon={<History size={16} />}
          alwaysOpen={true}
          colorTheme="sky"
          childrenClassName="p-3 space-y-3"
        >
          {/* Header toolbar with SplitButton component */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {t("history.stats", { count: savedHistory.length })}
            </span>

            {/* Standardized Reusable SplitButton */}
            <SplitButton
              label={t("history.clearAll")}
              icon={<Trash2 size={12} />}
              onClick={() => handleRequestClear("all")}
              options={clearOptions}
              disabled={savedHistory.length === 0}
              buttonClassName="text-xs px-2.5 py-1 h-7 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
              className="h-7"
            />
          </div>

          {/* History list content */}
          {renderHistoryContent()}
        </AccordionCard>
      ),
    },
  ];

  return (
    <WorkspaceConfigSidebarPanel
      title={t("history.title")}
      items={sidebarItems}
      twoColumn={false}
    />
  );
}
