"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CollageMakerWorkspace } from "@imify/features/collage-maker/workspace";
import { useWorkspaceSidebarContext } from "@/components/layout/workspace-layout";
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb";
import { useTranslation } from "@imify/i18n";
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid";
import { WorkspaceLoadingState } from "@imify/ui";

export function CollageMakerLandingPage() {
  const { t } = useTranslation(["collageMaker", "common"]);
  const [mounted, setMounted] = useState(false);
  const enableWideSidebarGrid = useWideSidebarGridEnabled();
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection);
  const setHeaderBreadcrumb = useWorkspaceHeaderStore(
    (state) => state.setBreadcrumb,
  );
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);
  const sidebarContext = useWorkspaceSidebarContext();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setHeaderSection(t("title"));
    setHeaderBreadcrumb(
      <FeatureBreadcrumb compact rootToolId="collage-maker" />,
    );
    return () => resetHeader();
  }, [resetHeader, setHeaderBreadcrumb, setHeaderSection, t]);

  const handleSidebarChange = useCallback(
    (sidebar: React.ReactNode, title?: string) => {
      sidebarContext?.setRightSidebar(sidebar);
      if (title !== undefined) {
        sidebarContext?.setRightSidebarTitle(title);
      }
    },
    [sidebarContext],
  );

  if (!mounted) {
    return (
      <WorkspaceLoadingState
        title={t("loadingTitle", { defaultValue: "Đang tải Collage Maker..." })}
        subtitle={t("loadingSubtitle", {
          defaultValue: "Khởi tạo công cụ ghép ảnh và bố cục...",
        })}
      />
    );
  }

  return (
    <CollageMakerWorkspace
      onSidebarChange={handleSidebarChange}
      enableWideSidebarGrid={enableWideSidebarGrid}
    />
  );
}
