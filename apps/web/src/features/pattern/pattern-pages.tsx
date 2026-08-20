"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PatternPresetSelectView } from "@imify/features/pattern/pattern-preset-select-view";
import { PatternSidebarShell } from "@imify/features/pattern/pattern-sidebar-shell";
import {
  clonePatternPresetConfig,
  type PatternPresetConfig,
  usePatternPresetStore,
} from "@imify/stores/stores/pattern-preset-store";
import { usePatternStore } from "@imify/stores/stores/pattern-store";
import { WorkspaceNotFoundState } from "@imify/ui";
import { WorkspaceLoadingState } from "@imify/features";
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout";
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb";
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid";
import { PresetNotFoundRedirectAction } from "@/features/presets/preset-not-found-redirect-action";
import { useTranslation } from "@imify/i18n/index";

const AUTO_SAVE_DELAY_MS = 420;
const PatternTab = dynamic(
  () =>
    import("@imify/features/pattern/pattern-tab").then(
      (module) => module.PatternTab,
    ),
  { ssr: false },
);

function usePatternPresetHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(usePatternPresetStore.persist.hasHydrated());
    const unsubStart = usePatternPresetStore.persist.onHydrate(() =>
      setHydrated(false),
    );
    const unsubFinish = usePatternPresetStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    return () => {
      unsubStart();
      unsubFinish();
    };
  }, []);

  return hydrated;
}

function extractPatternPresetConfig(
  patternState: ReturnType<typeof usePatternStore.getState>,
): PatternPresetConfig {
  return clonePatternPresetConfig({
    canvas: patternState.canvas,
    settings: patternState.settings,
    exportFormat: patternState.exportFormat,
  });
}

function applyPatternPresetConfig(config: PatternPresetConfig): void {
  const nextConfig = clonePatternPresetConfig(config);

  usePatternStore.setState((state) => ({
    ...state,
    canvas: {
      ...nextConfig.canvas,
      backgroundImageUrl: null,
    },
    settings: nextConfig.settings,
    visualBoundaryVisibility: {
      inbound: false,
      outbound: false,
    },
    activeVisualBoundary: null,
    exportFormat: nextConfig.exportFormat,
  }));
}

export function PatternLandingPage() {
  const { t } = useTranslation("common");
  const enableWideSidebarGrid = useWideSidebarGridEnabled();
  const router = useRouter();
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection);
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions);
  const setHeaderBreadcrumb = useWorkspaceHeaderStore(
    (state) => state.setBreadcrumb,
  );
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);
  const isHydrated = usePatternPresetHydrated();
  const presets = usePatternPresetStore((state) => state.presets);
  const ensureDefaultPreset = usePatternPresetStore(
    (state) => state.ensureDefaultPreset,
  );
  const setPresetViewMode = usePatternPresetStore(
    (state) => state.setPresetViewMode,
  );
  const applyPreset = usePatternPresetStore((state) => state.applyPreset);
  const saveCurrentPreset = usePatternPresetStore(
    (state) => state.saveCurrentPreset,
  );
  const updatePresetMeta = usePatternPresetStore(
    (state) => state.updatePresetMeta,
  );
  const togglePresetPin = usePatternPresetStore(
    (state) => state.togglePresetPin,
  );
  const deletePreset = usePatternPresetStore((state) => state.deletePreset);
  const patternState = usePatternStore();

  useWorkspaceSidebar(
    <PatternSidebarShell enableWideSidebarGrid={enableWideSidebarGrid} />,
    t("aboutThisTool"),
  );

  useEffect(() => {
    return () => {
      resetHeader();
    };
  }, [resetHeader]);

  useEffect(() => {
    setHeaderSection("Pattern Generator");
    setHeaderActions(null);
    setHeaderBreadcrumb(
      <FeatureBreadcrumb compact rootToolId="pattern-generator" />,
    );
  }, [setHeaderActions, setHeaderBreadcrumb, setHeaderSection]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    ensureDefaultPreset();

    setPresetViewMode("select");
  }, [ensureDefaultPreset, isHydrated, setPresetViewMode]);

  if (!isHydrated) {
    return <WorkspaceLoadingState />;
  }

  return (
    <PatternPresetSelectView
      presets={presets}
      activePresetId={null}
      onOpenPreset={(id) => {
        const preset = presets.find((entry) => entry.id === id);
        if (!preset) return;
        applyPatternPresetConfig(preset.config);
        applyPreset(id);
        router.push(`/pattern-generator/work?id=${id}`);
      }}
      onCreatePreset={(name, color) => {
        const createdId = saveCurrentPreset({
          name,
          highlightColor: color,
          config: extractPatternPresetConfig(patternState),
        });
        router.push(`/pattern-generator/work?id=${createdId}`);
      }}
      onUpdatePresetMeta={updatePresetMeta}
      onTogglePresetPin={togglePresetPin}
      onDeletePreset={deletePreset}
    />
  );
}

export function PatternWorkPage({ presetId }: { presetId: string }) {
  const { t } = useTranslation(["pattern", "common"]);
  const enableWideSidebarGrid = useWideSidebarGridEnabled();
  const isHydrated = usePatternPresetHydrated();
  const router = useRouter();
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection);
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions);
  const setHeaderBreadcrumb = useWorkspaceHeaderStore(
    (state) => state.setBreadcrumb,
  );
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);
  const presets = usePatternPresetStore((state) => state.presets);
  const activePresetId = usePatternPresetStore((state) => state.activePresetId);
  const applyPreset = usePatternPresetStore((state) => state.applyPreset);
  const setPresetViewMode = usePatternPresetStore(
    (state) => state.setPresetViewMode,
  );
  const syncActivePresetConfig = usePatternPresetStore(
    (state) => state.syncActivePresetConfig,
  );
  const ensureDefaultPreset = usePatternPresetStore(
    (state) => state.ensureDefaultPreset,
  );
  const appliedPresetIdRef = useRef<string | null>(null);
  const patternState = usePatternStore();

  const sidebarContent = useMemo(
    () => <PatternSidebarShell enableWideSidebarGrid={enableWideSidebarGrid} />,
    [enableWideSidebarGrid],
  );

  useWorkspaceSidebar(
    sidebarContent,
    `${t("common:toolSettings")} - ${t("title")}`,
  );

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
    setHeaderSection("Pattern Generator");
    setHeaderActions(null);
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootToolId="pattern-generator"
        activeLabel={preset?.name ?? null}
        onRootClick={() => router.push("/pattern-generator")}
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
    if (!isHydrated) {
      return;
    }
    if (presets.length === 0) {
      ensureDefaultPreset();
    }
  }, [ensureDefaultPreset, isHydrated, presets.length]);

  useEffect(() => {
    if (!isHydrated || !preset) {
      return;
    }
    if (appliedPresetIdRef.current === preset.id) {
      return;
    }
    applyPatternPresetConfig(preset.config);
    applyPreset(preset.id);
    setPresetViewMode("workspace");
    appliedPresetIdRef.current = preset.id;
  }, [applyPreset, isHydrated, preset, setPresetViewMode]);

  useEffect(() => {
    if (!isHydrated || !preset || activePresetId !== preset.id) {
      return;
    }

    const timeout = window.setTimeout(() => {
      syncActivePresetConfig(extractPatternPresetConfig(patternState));
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    activePresetId,
    isHydrated,
    patternState,
    preset,
    syncActivePresetConfig,
  ]);

  if (!isHydrated) {
    return <WorkspaceLoadingState />;
  }

  if (!preset) {
    return (
      <WorkspaceNotFoundState
        title="Preset not found"
        message="This pattern preset id does not exist."
        action={
          <PresetNotFoundRedirectAction
            routeBase="/pattern-generator"
            onBeforeRedirect={() => setPresetViewMode("select")}
          />
        }
      />
    );
  }

  if (activePresetId !== preset.id) {
    return <WorkspaceLoadingState />;
  }

  return <PatternTab />;
}
