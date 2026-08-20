"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CollageMakerWorkspace } from "@imify/features/collage-maker/workspace";
import { useWorkspaceSidebarContext } from "@/components/layout/workspace-layout";
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import { useTranslation } from "@imify/i18n";
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid";
import { WorkspaceLoadingState } from "@imify/features";

export function CollageMakerLandingPage() {
  const { t } = useTranslation(["collageMaker", "common"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const enableWideSidebarGrid = useWideSidebarGridEnabled();
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);
  const sidebarContext = useWorkspaceSidebarContext();

  const stepParam = searchParams.get("step");
  const stage = stepParam === "3" ? 3 : stepParam === "2" ? 2 : 1;

  const handleStageChange = useCallback(
    (nextStage: 1 | 2 | 3) => {
      if (nextStage === 1) {
        router.push("/collage-maker");
      } else {
        router.push(`/collage-maker?step=${nextStage}`);
      }
    },
    [router],
  );

  useEffect(() => {
    setMounted(true);
    return () => resetHeader();
  }, [resetHeader]);

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
    return <WorkspaceLoadingState />;
  }

  return (
    <CollageMakerWorkspace
      stage={stage}
      onStageChange={handleStageChange}
      onSidebarChange={handleSidebarChange}
      enableWideSidebarGrid={enableWideSidebarGrid}
    />
  );
}
