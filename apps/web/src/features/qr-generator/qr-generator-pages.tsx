"use client";

import React, { useEffect, useState } from "react";
import {
  SharedQrGeneratorPage,
  QrGeneratorWorkspace,
  QrGeneratorSidebarShell,
} from "@imify/features/qr-generator";

import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb";
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout";
import { useRouter } from "next/navigation";
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid";
import { WorkspaceLoadingState } from "@imify/ui";
import { useQrGeneratorStore } from "@imify/stores/stores/qr-generator-store";
import { useTranslation } from "@imify/i18n/index";

export function QrGeneratorPage() {
  const { t } = useTranslation("common");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(useQrGeneratorStore.persist.hasHydrated());
    const unsubStart = useQrGeneratorStore.persist.onHydrate(() =>
      setHydrated(false),
    );
    const unsubFinish = useQrGeneratorStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    return () => {
      try {
        unsubStart();
      } catch {}
      try {
        unsubFinish();
      } catch {}
    };
  }, []);

  const router = useRouter();
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection);
  const setHeaderBreadcrumb = useWorkspaceHeaderStore(
    (state) => state.setBreadcrumb,
  );
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);
  const enableWideSidebarGrid = useWideSidebarGridEnabled();

  // Register sidebar shell
  useWorkspaceSidebar(
    <QrGeneratorSidebarShell enableWideSidebarGrid={enableWideSidebarGrid} />,
    t("toolSettings"),
  );

  useEffect(() => {
    return () => {
      resetHeader();
    };
  }, [resetHeader]);

  useEffect(() => {
    setHeaderSection("QR Generator");
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootToolId="qr-generator"
        onRootClick={() => router.push("/qr-generator")}
      />,
    );
  }, [router, setHeaderBreadcrumb, setHeaderSection]);

  if (!hydrated) {
    return <WorkspaceLoadingState title="Loading QR generator..." />;
  }

  return (
    <SharedQrGeneratorPage renderWorkspace={() => <QrGeneratorWorkspace />} />
  );
}
