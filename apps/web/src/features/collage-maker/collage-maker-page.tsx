"use client";

import React, { useCallback, useEffect } from "react";
import { CollageMakerWorkspace } from "@imify/features/collage-maker/workspace";
import { useWorkspaceSidebarContext } from "@/components/layout/workspace-layout";
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb";
import { useTranslation } from "@imify/i18n";
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid";

export function CollageMakerLandingPage() {
  const { t } = useTranslation(["collageMaker", "common"]);
  const enableWideSidebarGrid = useWideSidebarGridEnabled();
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection);
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb);
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);
  const sidebarContext = useWorkspaceSidebarContext();

  useEffect(() => {
    setHeaderSection("Tạo ảnh ghép");
    setHeaderBreadcrumb(
      <FeatureBreadcrumb compact rootToolId="collage-maker" />
    );
    return () => resetHeader();
  }, [resetHeader, setHeaderBreadcrumb, setHeaderSection]);

  const handleSidebarChange = useCallback(
    (sidebar: React.ReactNode, title?: string) => {
      sidebarContext?.setRightSidebar(sidebar);
      if (title !== undefined) {
        sidebarContext?.setRightSidebarTitle(title);
      }
    },
    [sidebarContext],
  );

  return (
    <CollageMakerWorkspace
      onSidebarChange={handleSidebarChange}
      enableWideSidebarGrid={enableWideSidebarGrid}
    />
  );
}
