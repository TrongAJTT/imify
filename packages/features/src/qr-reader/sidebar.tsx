import React, { useState } from "react";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  AccordionCard,
  Button,
  SecondaryButton,
  Tooltip,
  MutedText,
  ToastContainer,
  BaseDialog,
} from "@imify/ui";
import {
  Trash2,
  Clock,
  ChevronDown,
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
} from "lucide-react";
import { useQrReaderStore } from "@imify/stores";
import { parseQrString, type ParsedQrResult, type ParsedQrType } from "./qr-parser";
import { useToast } from "@imify/core/hooks/use-toast";
import { useTranslation } from "@imify/i18n";
import { ControlledPopover } from "@imify/ui/ui/controlled-popover";

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
      return parsed.raw.startsWith("tel:") ? parsed.raw.substring(4) : parsed.raw;
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
      return parsed.raw.length > 40 ? parsed.raw.substring(0, 37) + "..." : parsed.raw;
  }
}

export function QrReaderSidebar({
  enableWideSidebarGrid = false,
  autoWideSidebarGridMinWidthPx = null,
}: QrReaderSidebarProps) {
  const { t } = useTranslation("qrReader");
  const {
    savedHistory,
    deleteFromHistory,
    clearHistory,
    clearHistoryOlderThan,
    setLastScanResult,
    lastScanResult,
  } = useQrReaderStore();
  const { toasts, success, error, hide } = useToast();

  const [pendingClearMode, setPendingClearMode] = useState<"all" | "3days" | "7days" | "30days" | null>(null);

  const handleRequestClear = (mode: "all" | "3days" | "7days" | "30days") => {
    setPendingClearMode(mode);
  };

  const executeClear = () => {
    if (!pendingClearMode) return;

    if (pendingClearMode === "all") {
      clearHistory();
      success(t("history.title"), t("history.clearSuccess"));
    } else if (pendingClearMode === "3days") {
      clearHistoryOlderThan(3);
      success(t("history.title"), t("history.clearOlderSuccess"));
    } else if (pendingClearMode === "7days") {
      clearHistoryOlderThan(7);
      success(t("history.title"), t("history.clearOlderSuccess"));
    } else if (pendingClearMode === "30days") {
      clearHistoryOlderThan(30);
      success(t("history.title"), t("history.clearOlderSuccess"));
    }

    setPendingClearMode(null);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFromHistory(id);
    success(t("history.title"), t("history.deleteSuccess"));
  };

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
          return (
            <div
              key={item.id}
              onClick={() => setLastScanResult(item.raw)}
              className={`flex items-start justify-between p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer group relative ${
                isSelected
                  ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/20"
                  : "border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-900/80"
              }`}
            >
              <div className="flex flex-col min-w-0 pr-6 gap-1 select-none">
                <div className="flex items-center gap-1.5">
                  {getQrTypeIcon(parsed.type)}
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    {t(`sidebar.typeLabels.${parsed.type}`)}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate block">
                  {getHistoryItemSummary(parsed, t)}
                </span>
                <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                  {formatHistoryTime(item.timestamp, t)}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => handleDeleteItem(item.id, e)}
                className="absolute right-2 top-2 h-5 w-5 rounded-md flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 transition-all opacity-0 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
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
          {/* Header toolbar */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {t("history.stats", { count: savedHistory.length })}
            </span>

            {/* Split delete button */}
            <div className="flex items-center gap-0.5">
              <Tooltip content={t("history.clearAll")}>
                <SecondaryButton
                  onClick={() => handleRequestClear("all")}
                  disabled={savedHistory.length === 0}
                  className="h-7 w-7 p-0 flex items-center justify-center border-slate-200 dark:border-slate-800 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 rounded-r-none border-r-0"
                >
                  <Trash2 size={13} />
                </SecondaryButton>
              </Tooltip>
              
              <ControlledPopover
                preset="dropdown"
                align="end"
                disabled={savedHistory.length === 0}
                trigger={
                  <SecondaryButton
                    disabled={savedHistory.length === 0}
                    className="h-7 w-5 p-0 flex items-center justify-center border-slate-200 dark:border-slate-800 rounded-l-none"
                  >
                    <ChevronDown size={11} />
                  </SecondaryButton>
                }
              >
                <div className="p-1 flex flex-col min-w-[150px] bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 text-xs select-none">
                  <button
                    onClick={() => handleRequestClear("3days")}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors text-slate-700 dark:text-slate-200"
                  >
                    {t("history.clearOlderThan3Days")}
                  </button>
                  <button
                    onClick={() => handleRequestClear("7days")}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors text-slate-700 dark:text-slate-200"
                  >
                    {t("history.clearOlderThan7Days")}
                  </button>
                  <button
                    onClick={() => handleRequestClear("30days")}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors text-slate-700 dark:text-slate-200"
                  >
                    {t("history.clearOlderThan1Month")}
                  </button>
                </div>
              </ControlledPopover>
            </div>
          </div>

          {/* History list content */}
          {renderHistoryContent()}
        </AccordionCard>
      ),
    },
  ];

  return (
    <>
      <WorkspaceConfigSidebarPanel
        title={t("history.title")}
        items={sidebarItems}
        twoColumn={false}
      />
      <ToastContainer toasts={toasts} onRemove={hide} />

      {/* Confirmation Dialog */}
      <BaseDialog
        isOpen={pendingClearMode !== null}
        onClose={() => setPendingClearMode(null)}
        contentClassName="w-full max-w-sm rounded-xl p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-2xl select-none"
      >
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">
            {pendingClearMode === "all" ? t("history.confirmClearTitle") : t("history.confirmClearOlderTitle")}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {pendingClearMode === "all"
              ? t("history.confirmClearMsg")
              : t("history.confirmClearOlderMsg", {
                  days: pendingClearMode === "3days" ? 3 : pendingClearMode === "7days" ? 7 : 30,
                })}
          </p>
        </div>
        <div className="flex justify-end gap-2.5">
          <SecondaryButton onClick={() => setPendingClearMode(null)} className="text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-800">
            {t("history.cancel")}
          </SecondaryButton>
          <Button onClick={executeClear} className="text-xs px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg">
            {t("history.confirm")}
          </Button>
        </div>
      </BaseDialog>
    </>
  );
}
