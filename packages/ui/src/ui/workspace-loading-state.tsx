import React from "react";
import { AlertTriangle, RotateCw, Wrench } from "lucide-react";
import { AnimatingSpinner } from "../components/animating-spinner";
import { Heading, MutedText } from "./typography";
import { Button } from "./button";
import { SecondaryButton } from "./secondary-button";

export interface WorkspaceLoadingStateViewProps {
  title?: string;
  subtitle?: string;
  className?: string;
  isTimedOut?: boolean;
  reloadButtonText?: string;
  recoveryButtonText?: string;
  onReload?: () => void;
  onGoToRecovery?: () => void;
}

export function WorkspaceLoadingStateView({
  title = "Loading data...",
  subtitle = "Loading data for the current workspace, please wait.",
  className = "",
  isTimedOut = false,
  reloadButtonText = "Reload page",
  recoveryButtonText = "Emergency recovery",
  onReload,
  onGoToRecovery,
}: WorkspaceLoadingStateViewProps) {
  return (
    <div
      className={`flex min-h-[60vh] w-full items-center justify-center px-4 py-6 ${className}`}
    >
      <div className="flex max-w-md flex-col items-center justify-center px-4 py-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {!isTimedOut ? (
          <>
            <div className="mb-4 p-3 text-sky-500">
              <AnimatingSpinner size={24} />
            </div>
            <Heading className="text-base font-semibold">{title}</Heading>
            <MutedText className="mt-1.5">{subtitle}</MutedText>
          </>
        ) : (
          <>
            <div className="mb-4 rounded-full border border-rose-200 bg-rose-50 p-3.5 text-rose-500 shadow-sm dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-400 animate-in bounce-in duration-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <Heading className="text-base font-semibold text-rose-600 dark:text-rose-400">
              {title}
            </Heading>
            <MutedText className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {subtitle}
            </MutedText>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {onReload ? (
                <Button
                  type="button"
                  onClick={onReload}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:bg-rose-600 dark:hover:bg-rose-500"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  {reloadButtonText}
                </Button>
              ) : null}

              {onGoToRecovery ? (
                <SecondaryButton
                  type="button"
                  onClick={onGoToRecovery}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  {recoveryButtonText}
                </SecondaryButton>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Alias for backward compatibility if directly consumed
export const WorkspaceLoadingState = WorkspaceLoadingStateView;
