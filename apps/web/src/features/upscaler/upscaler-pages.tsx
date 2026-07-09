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
import { WorkspaceLoadingState } from "@imify/ui";
import { useImageUpscalerStore } from "@imify/stores/stores/image-upscaler-store";

function UpscalerHardwareNoticeCard() {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/5">
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
        This experimental feature brings the power of AI models to your browser.
      </div>
      <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          • This experimental feature is VERY hardware-sensitive, we recommend a
          machine with a strong CPU and at least 12GB of RAM.
        </p>
        <p>
          • Use it patiently if you only need it occasionally as it may take up
          to minutes of processing. For frequent and efficient use, we recommend
          using dedicated software such as Upscayl.
        </p>
        <p>
          • You must download the AI models separately to use them, as we do not
          distribute these models.
        </p>
        <p>
          • Note: This is an experimental feature and may be removed in the
          future before reaching the official Extension release if an optimal
          solution cannot be found.
        </p>
      </div>
    </div>
  );
}

export function UpscalerPage() {
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
    "Upscaler Settings",
  );

  React.useEffect(() => {
    setHeaderSection("Upscaler");
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootToolId="upscaler"
        onRootClick={() => router.push("/upscaler")}
      />,
    );
    return () => resetHeader();
  }, [resetHeader, router, setHeaderBreadcrumb, setHeaderSection]);

  if (!hydrated) {
    return <WorkspaceLoadingState title="Loading upscaler..." />;
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
