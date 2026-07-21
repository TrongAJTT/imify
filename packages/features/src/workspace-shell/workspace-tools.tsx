import React from "react";
import {
  ArrowLeftRight,
  Image,
  Layers,
  LayoutGrid,
  ListTree,
  ScanSearch,
  Scissors,
  Search,
  Stamp,
  Workflow,
  Eraser,
  Sparkles,
  QrCode,
  Scan,
} from "lucide-react";

export const WORKSPACE_PRIMARY_TOOL_IDS = [
  "single",
  "batch",
  "splicing",
  "splitter",
  "filling",
  "pattern",
  "diffchecker",
  "inspector",
  "background-remover",
  "upscaler",
  "context-menu",
  "qr-generator",
  "qr-reader",
] as const;

export type WorkspacePrimaryToolId =
  (typeof WORKSPACE_PRIMARY_TOOL_IDS)[number];
export type WorkspaceToolCategoryId =
  | "image-processing"
  | "layout-composition"
  | "extension-exclusive"
  | "utilities";

export interface WorkspaceToolDefinition {
  id: string;
  label: string;
  href: string;
  categoryId: WorkspaceToolCategoryId;
  iconColorClassName: string;
  extTabId?: WorkspacePrimaryToolId;
  showOnWebToolsMenu?: boolean;
  showOnExtSidebar?: boolean;
}

export const PRESET_RECENT_ENTRY_TOOL_IDS = [
  "single-processor",
  "batch-processor",
  "splitter",
  "splicing",
  "pattern-generator",
] as const;

export type PresetRecentEntryToolId =
  (typeof PRESET_RECENT_ENTRY_TOOL_IDS)[number];

export interface WorkspaceToolCategoryDefinition {
  id: WorkspaceToolCategoryId;
  label: string;
}

export const WORKSPACE_TOOL_CATEGORIES: WorkspaceToolCategoryDefinition[] = [
  { id: "image-processing", label: "Image Processing" },
  { id: "layout-composition", label: "Layout & Composition" },
  { id: "utilities", label: "Utilities" },
  { id: "extension-exclusive", label: "Extension Exclusive" },
];

export const WORKSPACE_TOOLS: WorkspaceToolDefinition[] = [
  {
    id: "single-processor",
    label: "Single Processor",
    href: "/single-processor",
    categoryId: "image-processing",
    iconColorClassName: "text-sky-500",
    extTabId: "single",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
  {
    id: "batch-processor",
    label: "Batch Processor",
    href: "/batch-processor",
    categoryId: "image-processing",
    iconColorClassName: "text-violet-500",
    extTabId: "batch",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
  {
    id: "splicing",
    label: "Image Splicing",
    href: "/splicing",
    categoryId: "layout-composition",
    iconColorClassName: "text-indigo-500",
    extTabId: "splicing",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
  {
    id: "splitter",
    label: "Image Splitter",
    href: "/splitter",
    categoryId: "image-processing",
    iconColorClassName: "text-orange-500",
    extTabId: "splitter",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
  {
    id: "filling",
    label: "Image Filling",
    href: "/filling",
    categoryId: "layout-composition",
    iconColorClassName: "text-cyan-500",
    extTabId: "filling",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
  {
    id: "pattern-generator",
    label: "Pattern Generator",
    href: "/pattern-generator",
    categoryId: "layout-composition",
    iconColorClassName: "text-emerald-500",
    extTabId: "pattern",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
  {
    id: "diffchecker",
    label: "Difference Checker",
    href: "/diffchecker",
    categoryId: "utilities",
    iconColorClassName: "text-rose-500",
    extTabId: "diffchecker",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
  {
    id: "inspector",
    label: "Image Inspector",
    href: "/inspector",
    categoryId: "utilities",
    iconColorClassName: "text-teal-500",
    extTabId: "inspector",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
  {
    id: "context-menu",
    label: "Context Menu",
    href: "/extension",
    categoryId: "extension-exclusive",
    iconColorClassName: "text-blue-500",
    extTabId: "context-menu",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
  {
    id: "seo-audit",
    label: "SEO Audit",
    href: "/extension",
    categoryId: "extension-exclusive",
    iconColorClassName: "text-fuchsia-500",
    showOnWebToolsMenu: true,
    showOnExtSidebar: false,
  },
  {
    id: "background-remover",
    label: "Background Remover",
    href: "/background-remover",
    categoryId: "image-processing",
    iconColorClassName: "text-pink-500",
    extTabId: "background-remover",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
  {
    id: "upscaler",
    label: "Upscaler",
    href: "/upscaler",
    categoryId: "image-processing",
    iconColorClassName: "text-indigo-500",
    extTabId: "upscaler",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
  {
    id: "qr-generator",
    label: "QR Generator",
    href: "/qr-generator",
    categoryId: "utilities",
    iconColorClassName: "text-amber-500",
    extTabId: "qr-generator",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
  {
    id: "qr-reader",
    label: "QR Reader",
    href: "/qr-reader",
    categoryId: "utilities",
    iconColorClassName: "text-blue-500",
    extTabId: "qr-reader",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true,
  },
];

export function renderWorkspaceWorkspaceIcon(
  toolId: string,
  size = 16,
): React.ReactNode {
  // Backwards compatibility alias helper
  return renderWorkspaceToolIcon(toolId, size);
}

export function renderWorkspaceToolIcon(
  toolId: string,
  size = 16,
): React.ReactNode {
  const tool = WORKSPACE_TOOLS.find((entry) => entry.id === toolId);
  const className = tool?.iconColorClassName;

  switch (toolId) {
    case "single-processor":
      return <Image size={size} className={className} />;
    case "batch-processor":
      return <Workflow size={size} className={className} />;
    case "splicing":
      return <LayoutGrid size={size} className={className} />;
    case "splitter":
      return <Scissors size={size} className={className} />;
    case "filling":
      return <Layers size={size} className={className} />;
    case "pattern-generator":
      return <Stamp size={size} className={className} />;
    case "diffchecker":
      return <ArrowLeftRight size={size} className={className} />;
    case "inspector":
      return <ScanSearch size={size} className={className} />;
    case "context-menu":
      return <ListTree size={size} className={className} />;
    case "seo-audit":
      return <Search size={size} className={className} />;
    case "background-remover":
      return <Eraser size={size} className={className} />;
    case "upscaler":
      return <Sparkles size={size} className={className} />;
    case "qr-generator":
      return <QrCode size={size} className={className} />;
    case "qr-reader":
      return <Scan size={size} className={className} />;
    default:
      return <Workflow size={size} className={className} />;
  }
}

import i18n from "i18next";

function getCategoryIdKey(id: string): string {
  switch (id) {
    case "image-processing":
      return "categories.imageProcessing";
    case "layout-composition":
      return "categories.layoutComposition";
    case "utilities":
      return "categories.utilities";
    case "extension-exclusive":
      return "categories.extensionExclusive";
    default:
      return `categories.${id}`;
  }
}

function getToolIdKey(id: string): string {
  switch (id) {
    case "single-processor":
      return "tools.singleProcessor.label";
    case "batch-processor":
      return "tools.batchProcessor.label";
    case "splicing":
      return "tools.splicing.label";
    case "splitter":
      return "tools.splitter.label";
    case "filling":
      return "tools.filling.label";
    case "pattern-generator":
      return "tools.patternGenerator.label";
    case "diffchecker":
      return "tools.diffchecker.label";
    case "inspector":
      return "tools.inspector.label";
    case "context-menu":
      return "tools.contextMenu.label";
    case "seo-audit":
      return "tools.seoAudit.label";
    case "background-remover":
      return "tools.backgroundRemover.label";
    case "upscaler":
      return "tools.upscaler.label";
    case "qr-generator":
      return "tools.qrGenerator.label";
    case "qr-reader":
      return "tools.qrReader.label";
    default:
      return `tools.${id}.label`;
  }
}

export function getWorkspaceToolLabel(
  toolId: string,
  lng?: string,
): string | null {
  const key = getToolIdKey(toolId);
  if (i18n.isInitialized) {
    const translated = i18n.t(`workspace:${key}`, { lng });
    if (translated && translated !== `workspace:${key}`) {
      return translated;
    }
  }
  const tool = WORKSPACE_TOOLS.find((entry) => entry.id === toolId);
  return tool?.label ?? null;
}

export function getWorkspaceToolsMenuGroups(lng?: string): Array<{
  title: string;
  items: Array<{ id: string; href: string; label: string }>;
}> {
  return WORKSPACE_TOOL_CATEGORIES.map((category) => {
    const categoryLabelKey = getCategoryIdKey(category.id);
    const title = i18n.isInitialized
      ? i18n.t(`workspace:${categoryLabelKey}`, {
          lng,
          defaultValue: category.label,
        })
      : category.label;

    return {
      title,
      items: WORKSPACE_TOOLS.filter(
        (tool) => tool.categoryId === category.id && tool.showOnWebToolsMenu,
      ).map((tool) => {
        const toolLabelKey = getToolIdKey(tool.id);
        const label = i18n.isInitialized
          ? i18n.t(`workspace:${toolLabelKey}`, {
              lng,
              defaultValue: tool.label,
            })
          : tool.label;
        return { id: tool.id, href: tool.href, label };
      }),
    };
  }).filter((group) => group.items.length > 0);
}

export function getExtensionSidebarToolGroups(lng?: string): Array<{
  title: string;
  items: Array<{ id: string; label: string; tabId: WorkspacePrimaryToolId }>;
}> {
  return WORKSPACE_TOOL_CATEGORIES.map((category) => {
    const categoryLabelKey = getCategoryIdKey(category.id);
    const title = i18n.isInitialized
      ? i18n.t(`workspace:${categoryLabelKey}`, {
          lng,
          defaultValue: category.label,
        })
      : category.label;

    return {
      title,
      items: WORKSPACE_TOOLS.filter(
        (tool) =>
          tool.categoryId === category.id &&
          tool.showOnExtSidebar &&
          tool.extTabId,
      ).map((tool) => {
        const toolLabelKey = getToolIdKey(tool.id);
        const label = i18n.isInitialized
          ? i18n.t(`workspace:${toolLabelKey}`, {
              lng,
              defaultValue: tool.label,
            })
          : tool.label;
        return {
          id: tool.id,
          label,
          tabId: tool.extTabId as WorkspacePrimaryToolId,
        };
      }),
    };
  }).filter((group) => group.items.length > 0);
}
