import React from "react";
import { AlertTriangle, Info, CheckCircle2, AlertCircle } from "lucide-react";

export type DialogVariant = "info" | "warning" | "destructive" | "success";

export interface DialogVariantStyle {
  icon: React.ReactNode;
  btnClassName: string;
}

export function getDialogVariantStyles(
  variant: DialogVariant = "destructive",
): DialogVariantStyle {
  switch (variant) {
    case "destructive":
      return {
        icon: (
          <AlertTriangle
            size={28}
            className="text-rose-600 dark:text-rose-400 shrink-0"
          />
        ),
        btnClassName:
          "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
      };
    case "warning":
      return {
        icon: (
          <AlertCircle
            size={28}
            className="text-amber-600 dark:text-amber-400 shrink-0"
          />
        ),
        btnClassName:
          "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
      };
    case "success":
      return {
        icon: (
          <CheckCircle2
            size={28}
            className="text-emerald-600 dark:text-emerald-400 shrink-0"
          />
        ),
        btnClassName:
          "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
      };
    case "info":
    default:
      return {
        icon: (
          <Info
            size={28}
            className="text-blue-600 dark:text-blue-400 shrink-0"
          />
        ),
        btnClassName:
          "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
      };
  }
}
