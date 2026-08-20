"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SplicingPresetSelectView } from "@imify/features/splicing/splicing-preset-select-view";
import { SplicingSidebarShell } from "@imify/features/splicing/splicing-sidebar-shell";
import { SplicingTab } from "@imify/features/splicing/splicing-tab";
import {
  useSplicingPresetStore,
  type SplicingPresetConfig,
} from "@imify/stores/stores/splicing-preset-store";
import { useSplicingStore } from "@imify/stores/stores/splicing-store";
import { WorkspaceNotFoundState } from "@imify/ui";
import { WorkspaceLoadingState } from "@imify/features";
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout";
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import { useWorkspaceSettingsDialogStore } from "@imify/stores/stores/workspace-settings-dialog-store";
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb";
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid";
import { usePerformancePreferences } from "@/hooks/use-performance-preferences";
import { PresetNotFoundRedirectAction } from "@/features/presets/preset-not-found-redirect-action";
import { useTranslation } from "@imify/i18n/index";

function useSplicingPresetHydrated(): boolean {
  // Keep the first render deterministic across SSR/CSR to avoid hydration mismatch.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(useSplicingPresetStore.persist.hasHydrated());

    const unsubStart = useSplicingPresetStore.persist.onHydrate(() => {
      setHydrated(false);
    });
    const unsubFinish = useSplicingPresetStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return () => {
      unsubStart();
      unsubFinish();
    };
  }, []);

  return hydrated;
}

function extractSplicingPresetConfig(splicingState: any): SplicingPresetConfig {
  return {
    preset: splicingState.layout.preset,
    primaryDirection: splicingState.layout.primaryDirection,
    secondaryDirection: splicingState.layout.secondaryDirection,
    gridCount: splicingState.layout.gridCount,
    flowMaxSize: splicingState.layout.flowMaxSize,
    flowSplitOverflow: splicingState.layout.flowSplitOverflow,
    alignment: splicingState.layout.alignment,
    imageAppearanceDirection: splicingState.layout.imageAppearanceDirection,
    canvasPadding: splicingState.canvas.padding,
    mainSpacing: splicingState.canvas.mainSpacing,
    crossSpacing: splicingState.canvas.crossSpacing,
    canvasBorderRadius: splicingState.canvas.borderRadius,
    canvasBorderWidth: splicingState.canvas.borderWidth,
    canvasBorderColor: splicingState.canvas.borderColor,
    backgroundColor: splicingState.canvas.backgroundColor,
    imageResize: splicingState.image.resizeMode,
    imageFitValue: splicingState.image.fitValue,
    imageApplyTo: splicingState.image.applyTo,
    imagePadding: splicingState.image.padding,
    imagePaddingColor: splicingState.image.paddingColor,
    imageBorderRadius: splicingState.image.borderRadius,
    imageBorderWidth: splicingState.image.borderWidth,
    imageBorderColor: splicingState.image.borderColor,
    exportFormat: splicingState.exportSettings?.format ?? "png",
    exportMode: splicingState.exportSettings?.exportMode ?? "single",
    exportTrimBackground: splicingState.exportSettings?.trimBackground ?? false,
    exportConcurrency: splicingState.exportSettings?.concurrency ?? 2,
    exportFileNamePattern: splicingState.exportSettings?.fileNamePattern ?? "spliced-[Index]",
    previewQualityPercent: splicingState.previewQualityPercent ?? 20,
    previewShowImageNumber: splicingState.previewShowImageNumber ?? false,
  };
}

export function SplicingLandingPage() {
  const { t } = useTranslation(["splicing", "common"]);
  const enableWideSidebarGrid = useWideSidebarGridEnabled();
  const openSettingsDialog = useWorkspaceSettingsDialogStore(
    (state) => state.openSettingsDialog,
  );
  const performancePreferences = usePerformancePreferences();
  const router = useRouter();
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection);
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions);
  const setHeaderBreadcrumb = useWorkspaceHeaderStore(
    (state) => state.setBreadcrumb,
  );
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);
  const setPresetViewMode = useSplicingPresetStore(
    (state) => state.setPresetViewMode,
  );
  const ensureDefaultPreset = useSplicingPresetStore(
    (state) => state.ensureDefaultPreset,
  );
  const saveCurrentPreset = useSplicingPresetStore(
    (state) => state.saveCurrentPreset,
  );
  const applyPreset = useSplicingPresetStore((state) => state.applyPreset);
  const updatePresetMeta = useSplicingPresetStore(
    (state) => state.updatePresetMeta,
  );
  const deletePreset = useSplicingPresetStore((state) => state.deletePreset);
  const presets = useSplicingPresetStore((state) => state.presets);
  const isRehydrated = useSplicingPresetHydrated();
  const previewQualityHandlerRef = useRef<((next: number) => void) | null>(
    null,
  );
  const splicingState = useSplicingStore();

  const sidebar = useMemo(
    () => (
      <SplicingSidebarShell
        performancePreferences={performancePreferences}
        onPreviewQualityChange={(next) => {
          const handler = previewQualityHandlerRef.current;
          if (handler) {
            handler(next);
            return;
          }
          useSplicingStore.getState().setPreviewQualityPercent(next);
        }}
        onOpenSettings={() => openSettingsDialog("performance")}
        enableWideSidebarGrid={enableWideSidebarGrid}
      />
    ),
    [enableWideSidebarGrid, openSettingsDialog, performancePreferences],
  );

  useWorkspaceSidebar(sidebar, t("common:aboutThisTool"));

  useEffect(() => {
    return () => {
      resetHeader();
    };
  }, [resetHeader]);

  useEffect(() => {
    setHeaderSection("Image Splicing");
    setHeaderActions(null);
    setHeaderBreadcrumb(<FeatureBreadcrumb compact rootToolId="splicing" />);
  }, [setHeaderActions, setHeaderBreadcrumb, setHeaderSection]);

  useEffect(() => {
    if (!isRehydrated) {
      return;
    }
    ensureDefaultPreset();

    setPresetViewMode("select");
  }, [ensureDefaultPreset, isRehydrated, setPresetViewMode]);

  if (!isRehydrated) {
    return <WorkspaceLoadingState />;
  }

  return (
    <SplicingPresetSelectView
      presets={presets}
      activePresetId={null}
      onOpenPreset={(id) => {
        applyPreset(id);
        router.push(`/splicing/work?id=${id}`);
      }}
      onCreatePreset={(name, color) => {
        const config = extractSplicingPresetConfig(splicingState);
        const createdId = saveCurrentPreset({
          name,
          highlightColor: color,
          config,
        });
        router.push(`/splicing/work?id=${createdId}`);
      }}
      onUpdatePresetMeta={updatePresetMeta}
      onDeletePreset={deletePreset}
    />
  );
}

export function SplicingWorkPage({ presetId }: { presetId: string }) {
  const { t } = useTranslation(["splicing", "common"]);
  const enableWideSidebarGrid = useWideSidebarGridEnabled();
  const openSettingsDialog = useWorkspaceSettingsDialogStore(
    (state) => state.openSettingsDialog,
  );
  const performancePreferences = usePerformancePreferences();
  const router = useRouter();
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection);
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions);
  const setHeaderBreadcrumb = useWorkspaceHeaderStore(
    (state) => state.setBreadcrumb,
  );
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);
  const applyPreset = useSplicingPresetStore((state) => state.applyPreset);
  const setPresetViewMode = useSplicingPresetStore(
    (state) => state.setPresetViewMode,
  );
  const presets = useSplicingPresetStore((state) => state.presets);
  const isRehydrated = useSplicingPresetHydrated();
  const previewQualityHandlerRef = useRef<((next: number) => void) | null>(
    null,
  );

  const sidebar = useMemo(
    () => (
      <SplicingSidebarShell
        performancePreferences={performancePreferences}
        onPreviewQualityChange={(next) => {
          const handler = previewQualityHandlerRef.current;
          if (handler) {
            handler(next);
            return;
          }
          useSplicingStore.getState().setPreviewQualityPercent(next);
        }}
        onOpenSettings={() => openSettingsDialog("performance")}
        enableWideSidebarGrid={enableWideSidebarGrid}
      />
    ),
    [enableWideSidebarGrid, openSettingsDialog, performancePreferences],
  );

  useWorkspaceSidebar(sidebar, `${t("common:toolSettings")} - ${t("title")}`);

  const preset = useMemo(
    () => presets.find((entry) => entry.id === presetId) ?? null,
    [presetId, presets],
  );

  useEffect(() => {
    return () => {
      resetHeader();
    };
  }, [resetHeader]);

  useEffect(() => {
    setHeaderSection("Image Splicing");
    setHeaderActions(null);
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootToolId="splicing"
        activeLabel={preset?.name ?? null}
        onRootClick={() => router.push("/splicing")}
      />,
    );
  }, [
    preset?.name,
    router,
    setHeaderActions,
    setHeaderBreadcrumb,
    setHeaderSection,
  ]);

  useEffect(() => {
    if (!isRehydrated || !preset) {
      return;
    }
    applyPreset(preset.id);
    setPresetViewMode("workspace");
  }, [applyPreset, isRehydrated, preset, setPresetViewMode]);

  if (!isRehydrated) {
    return <WorkspaceLoadingState />;
  }

  if (!preset) {
    return (
      <WorkspaceNotFoundState
        title="Preset not found"
        message="This splicing preset id does not exist."
        action={
          <PresetNotFoundRedirectAction
            routeBase="/splicing"
            onBeforeRedirect={() => setPresetViewMode("select")}
          />
        }
      />
    );
  }

  return (
    <SplicingTab
      onRegisterPreviewQualityChangeHandler={(handler) => {
        previewQualityHandlerRef.current = handler;
      }}
      onRootClick={() => router.push("/splicing")}
    />
  );
}
