"use client";

import React, { useEffect, useState } from "react";
import {
  SharedUpscalerPage,
  UpscalerWorkspace,
  UpscalerDropZone,
  UpscalerSidebarShell,
} from "@imify/features/upscaler";

import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb";
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout";
import { useRouter } from "next/navigation";
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid";
import { WorkspaceLoadingState } from "@imify/features";
import { useTranslation } from "@imify/i18n";
import { useImageUpscalerStore } from "@imify/stores/stores/image-upscaler-store";

function UpscalerHardwareNoticeCard() {
  const { t } = useTranslation("upscaler");
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/5">
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
        {t("hardwareNotice.title")}
      </div>
      <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>{t("hardwareNotice.item1")}</p>
        <p>{t("hardwareNotice.item2")}</p>
        <p>{t("hardwareNotice.item3")}</p>
      </div>
    </div>
  );
}

export function UpscalerPage() {
  const { t } = useTranslation("upscaler");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(useImageUpscalerStore.persist.hasHydrated());
    const unsubStart = useImageUpscalerStore.persist.onHydrate(() =>
      setHydrated(false),
    );
    const unsubFinish = useImageUpscalerStore.persist.onFinishHydration(() =>
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
    <UpscalerSidebarShell enableWideSidebarGrid={enableWideSidebarGrid} />,
    t("sidebar.title"),
  );

  React.useEffect(() => {
    return () => {
      resetHeader();
    };
  }, [resetHeader]);

  React.useEffect(() => {
    setHeaderSection(t("title"));
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootToolId="upscaler"
        onRootClick={() => router.push("/upscaler")}
      />,
    );
  }, [router, setHeaderBreadcrumb, setHeaderSection, t]);

  if (!hydrated) {
    return <WorkspaceLoadingState />;
  }

  return (
    <SharedUpscalerPage
      renderWorkspace={(props) => (
        <>
          {
            !props.sourceFile ? (
              <div className="space-y-4">
                <UpscalerDropZone
                  onLoadFile={(file) => void props.onLoadFile(file)}
                />
                <UpscalerHardwareNoticeCard />
              </div>
            ) : props.sourceImageData ? (
              <UpscalerWorkspace
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
