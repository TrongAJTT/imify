import React from "react";
import { ControlledPopover } from "./controlled-popover";

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  /** Optional highlighted label displayed above `content` inside the tooltip */
  label?: React.ReactNode;
  variant?: "normal" | "wide1" | "wide2" | "nowrap" | "gif-preview";
};

const variants = {
  normal: "whitespace-pre-line max-w-[200px]",
  wide1: "whitespace-pre-line min-w-[150px] max-w-[350px]",
  wide2: "whitespace-pre-line min-w-[200px] max-w-[400px]",
  nowrap: "whitespace-nowrap",
  "gif-preview": "whitespace-pre-line min-w-[300px] max-w-[650px]",
} as const;

export function Tooltip({
  content,
  children,
  label,
  variant = "normal",
}: TooltipProps) {
  return (
    <ControlledPopover
      trigger={<div className="relative">{children}</div>}
      preset="tooltip"
      contentClassName={`bg-white dark:bg-black/95 text-slate-800 dark:text-white text-[11px] px-2.5 py-2 rounded-lg shadow-2xl border border-slate-200 dark:border-white/10 z-[9999] pointer-events-none ${variants[variant]}`}
    >
      {label ? (
        <div className="text-[12px] font-bold mb-0.5">{label}</div>
      ) : null}
      <div>{content}</div>
    </ControlledPopover>
  );
}

export function TooltipTableContent({
  rows,
  firstColumnHeader = "Option",
  secondColumnHeader = "What it does",
}: {
  rows: ReadonlyArray<{ method: string; description: string }>;
  firstColumnHeader?: string;
  secondColumnHeader?: string;
}) {
  return (
    <table className="w-full border-collapse text-[11px] text-slate-700 dark:text-slate-200">
      <thead>
        <tr className="border-b border-slate-200 dark:border-white/15">
          <th className="w-36 px-2 py-1 text-left font-semibold">
            {firstColumnHeader}
          </th>
          <th className="px-2 py-1 text-left font-semibold">
            {secondColumnHeader}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.method}
            className="border-b border-slate-100 last:border-b-0 dark:border-white/10"
          >
            <td className="px-2 py-1.5 align-top font-medium">{row.method}</td>
            <td className="px-2 py-1.5 align-top">{row.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
