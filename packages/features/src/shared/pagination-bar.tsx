"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Search, ArrowRight } from "lucide-react";
import { Button, ControlledPopover } from "@imify/ui";
import { useTranslation } from "@imify/i18n";

export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startItemIndex?: number;
  endItemIndex?: number;
  totalItems?: number;
  className?: string;
}

export function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  startItemIndex,
  endItemIndex,
  totalItems,
  className = "",
}: PaginationBarProps) {
  const { t } = useTranslation("common");
  const [isJumpOpen, setIsJumpOpen] = useState(false);
  const [jumpInput, setJumpInput] = useState(String(currentPage));
  const jumpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setJumpInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    if (isJumpOpen) {
      setTimeout(() => {
        jumpInputRef.current?.focus();
        jumpInputRef.current?.select();
      }, 50);
    }
  }, [isJumpOpen]);

  if (totalPages <= 1) return null;

  const handleJumpSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const pageNum = parseInt(jumpInput, 10);
    if (!Number.isNaN(pageNum)) {
      const clamped = Math.max(1, Math.min(totalPages, pageNum));
      onPageChange(clamped);
    }
    setIsJumpOpen(false);
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-950 ${className}`}
    >
      {/* Left Info Text */}
      {startItemIndex !== undefined &&
      endItemIndex !== undefined &&
      totalItems !== undefined ? (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t("pagination.pageInfo", {
            start: startItemIndex,
            end: endItemIndex,
            totalCount: totalItems,
          })}
        </span>
      ) : (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t("pagination.pageNumber", { page: currentPage })} / {totalPages}
        </span>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          title={t("pagination.previous")}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 7) return true;
              if (p === 1 || p === totalPages) return true;
              return Math.abs(p - currentPage) <= 1;
            })
            .map((p, idx, arr) => {
              const prevP = arr[idx - 1];
              const showEllipsis = prevP && p - prevP > 1;

              return (
                <React.Fragment key={p}>
                  {showEllipsis && (
                    <span className="px-1 text-xs text-slate-400 select-none">
                      &hellip;
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors ${
                      currentPage === p
                        ? "bg-red-600 text-white shadow-xs dark:bg-red-600"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          title={t("pagination.next")}
        >
          <ChevronRight size={16} />
        </button>

        {/* Jump to page search button & Popover */}
        <ControlledPopover
          preset="dropdown"
          align="end"
          side="top"
          sideOffset={8}
          contentClassName="z-[9999] p-0 border-0 bg-transparent shadow-none"
          trigger={
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              title={t("pagination.jumpToPage", { defaultValue: "Đi đến trang" })}
            >
              <Search size={14} />
            </button>
          }
        >
          <form
            onSubmit={handleJumpSubmit}
            className="flex flex-col gap-2 p-3 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {t("pagination.jumpToPage", { defaultValue: "Đi đến trang" })}
              </span>
              <span className="text-[11px] text-slate-400">
                1 - {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <input
                ref={jumpInputRef}
                type="number"
                min={1}
                max={totalPages}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="h-8 px-2.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
              >
                <ArrowRight size={14} />
              </Button>
            </div>
          </form>
        </ControlledPopover>
      </div>
    </div>
  );
}
