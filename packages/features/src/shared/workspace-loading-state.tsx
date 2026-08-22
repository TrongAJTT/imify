"use client";

import React, { useEffect, useState } from "react";
import { APP_ROUTES } from "@imify/core";
import { useTranslation } from "@imify/i18n";
import { WorkspaceLoadingStateView } from "@imify/ui";

export interface WorkspaceLoadingStateProps {
  title?: string;
  subtitle?: string;
  className?: string;
  timeoutMs?: number;
}

export function WorkspaceLoadingState({
  title,
  subtitle,
  className,
  timeoutMs = 5000,
}: WorkspaceLoadingStateProps) {
  const { t } = useTranslation("common");
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimedOut(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [timeoutMs]);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleGoToRecovery = () => {
    if (typeof window !== "undefined") {
      window.location.href = APP_ROUTES.RECOVERY;
    }
  };

  const displayTitle = !isTimedOut
    ? (title ?? t("workspaceLoading.defaultTitle"))
    : t("workspaceLoading.timeoutTitle");

  const displaySubtitle = !isTimedOut
    ? (subtitle ?? t("workspaceLoading.defaultSubtitle"))
    : t("workspaceLoading.timeoutSubtitle");

  return (
    <WorkspaceLoadingStateView
      title={displayTitle}
      subtitle={displaySubtitle}
      className={className}
      isTimedOut={isTimedOut}
      reloadButtonText={t("workspaceLoading.reloadPage")}
      recoveryButtonText={t("workspaceLoading.goToRecovery")}
      onReload={handleReload}
      onGoToRecovery={handleGoToRecovery}
    />
  );
}
