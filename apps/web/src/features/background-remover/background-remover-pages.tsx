"use client";

import React, { useEffect, useState } from "react";
import {
  SharedBackgroundRemoverPage,
  BackgroundRemoverWorkspace,
  BackgroundRemoverDropZone,
  BackgroundRemoverSidebarShell,
} from "@imify/features/background-removal";

import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb";
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout";
import { useRouter } from "next/navigation";
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid";
import { WorkspaceLoadingState } from "@imify/ui";
import { useBackgroundRemoverStore } from "@imify/stores/stores/background-remover-store";
import { useTranslation } from "@imify/i18n";

function BackgroundRemoverHardwareNoticeCard() {
  const { t } = useTranslation("backgroundRemover");
  return (
    <div className="rounded-xl border border-pink-200 bg-pink-50/80 p-4 dark:border-pink-500/20 dark:bg-pink-500/5">
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
        {t("hardwareNotice.title")}
      </div>
      <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>{t("hardwareNotice.req1")}</p>
        <p>{t("hardwareNotice.req2")}</p>
        <p>{t("hardwareNotice.req3")}</p>
      </div>
    </div>
  );
}

export function BackgroundRemoverPage() {
  const { t } = useTranslation("backgroundRemover");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(useBackgroundRemoverStore.persist.hasHydrated());
    const unsubStart = useBackgroundRemoverStore.persist.onHydrate(() =>
      setHydrated(false),
    );
    const unsubFinish = useBackgroundRemoverStore.persist.onFinishHydration(
      () => setHydrated(true),
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
    <BackgroundRemoverSidebarShell
      enableWideSidebarGrid={enableWideSidebarGrid}
    />,
    t("title"),
  );

  React.useEffect(() => {
    setHeaderSection(t("title"));
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootToolId="background-remover"
        onRootClick={() => router.push("/background-remover")}
      />,
    );
    return () => resetHeader();
  }, [resetHeader, router, setHeaderBreadcrumb, setHeaderSection, t]);

  if (!hydrated) {
    return <WorkspaceLoadingState title={t("loading")} />;
  }

  return (
    <SharedBackgroundRemoverPage
      renderWorkspace={(props) => (
        <>
          {
            !props.sourceFile ? (
              <div className="space-y-4">
                <BackgroundRemoverDropZone
                  onLoadFile={(file) => void props.onLoadFile(file)}
                />
                <BackgroundRemoverHardwareNoticeCard />
              </div>
            ) : props.sourceImageData ? (
              <BackgroundRemoverWorkspace
                sourceFile={props.sourceFile}
                sourceImageData={props.sourceImageData}
                resultImageData={props.resultImageData}
                isProcessing={props.isProcessing}
                progressPayload={props.progressPayload}
                onClear={props.onClear}
                onStartProcessing={props.onStartProcessing}
                modelId={props.modelId}
              />
            ) : null // Or loading spinner
          }
        </>
      )}
    />
  );
}
