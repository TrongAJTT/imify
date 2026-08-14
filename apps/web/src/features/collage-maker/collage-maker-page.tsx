"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CollageMakerWorkspace } from "@imify/features/collage-maker/workspace";
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout";
import { CollageMakerInfoPanel } from "@imify/features/collage-maker/collage-maker-info-panel";
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb";
import { useTranslation } from "@imify/i18n";

export function CollageMakerLandingPage() {
  const { t } = useTranslation(["collageMaker", "common"]);
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection);
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb);
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);

  const [sidebarNode, setSidebarNode] = useState<React.ReactNode>(
    <div className="p-4 space-y-4">
      <CollageMakerInfoPanel />
    </div>,
  );
  const [sidebarTitle, setSidebarTitle] = useState<string>(
    t("common:aboutThisTool"),
  );

  useWorkspaceSidebar(sidebarNode, sidebarTitle);

  useEffect(() => {
    setHeaderSection("Tạo ảnh ghép");
    setHeaderBreadcrumb(
      <FeatureBreadcrumb compact rootToolId="collage-maker" />
    );
    return () => resetHeader();
  }, [resetHeader, setHeaderBreadcrumb, setHeaderSection]);

  const handleSidebarChange = useCallback(
    (sidebar: React.ReactNode, title?: string) => {
      setSidebarNode(sidebar);
      if (title) setSidebarTitle(title);
    },
    [],
  );

  return <CollageMakerWorkspace onSidebarChange={handleSidebarChange} />;
}
