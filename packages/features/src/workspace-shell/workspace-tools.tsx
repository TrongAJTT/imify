import React from "react"
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
  Workflow
} from "lucide-react"

export const WORKSPACE_PRIMARY_TOOL_IDS = [
  "single",
  "batch",
  "splicing",
  "splitter",
  "filling",
  "pattern",
  "diffchecker",
  "inspector",
  "context-menu"
] as const

export type WorkspacePrimaryToolId = (typeof WORKSPACE_PRIMARY_TOOL_IDS)[number]
export type WorkspaceToolCategoryId =
  | "image-processing"
  | "layout-composition"
  | "extension-exclusive"

export interface WorkspaceToolDefinition {
  id: string
  label: string
  href: string
  categoryId: WorkspaceToolCategoryId
  iconColorClassName: string
  extTabId?: WorkspacePrimaryToolId
  showOnWebToolsMenu?: boolean
  showOnExtSidebar?: boolean
}

export interface WorkspaceToolCategoryDefinition {
  id: WorkspaceToolCategoryId
  label: string
}

export const WORKSPACE_TOOL_CATEGORIES: WorkspaceToolCategoryDefinition[] = [
  { id: "image-processing", label: "Image Processing" },
  { id: "layout-composition", label: "Layout & Composition" },
  { id: "extension-exclusive", label: "Extension Exclusive" }
]

export const WORKSPACE_TOOLS: WorkspaceToolDefinition[] = [
  {
    id: "single-processor",
    label: "Single Processor",
    href: "/single-processor",
    categoryId: "image-processing",
    iconColorClassName: "text-sky-500",
    extTabId: "single",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true
  },
  {
    id: "batch-processor",
    label: "Batch Processor",
    href: "/batch-processor",
    categoryId: "image-processing",
    iconColorClassName: "text-violet-500",
    extTabId: "batch",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true
  },
  {
    id: "splicing",
    label: "Image Splicing",
    href: "/splicing",
    categoryId: "layout-composition",
    iconColorClassName: "text-indigo-500",
    extTabId: "splicing",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true
  },
  {
    id: "splitter",
    label: "Image Splitter",
    href: "/splitter",
    categoryId: "image-processing",
    iconColorClassName: "text-orange-500",
    extTabId: "splitter",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true
  },
  {
    id: "filling",
    label: "Image Filling",
    href: "/filling",
    categoryId: "layout-composition",
    iconColorClassName: "text-cyan-500",
    extTabId: "filling",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true
  },
  {
    id: "pattern-generator",
    label: "Pattern Generator",
    href: "/pattern-generator",
    categoryId: "layout-composition",
    iconColorClassName: "text-emerald-500",
    extTabId: "pattern",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true
  },
  {
    id: "diffchecker",
    label: "Difference Checker",
    href: "/diffchecker",
    categoryId: "layout-composition",
    iconColorClassName: "text-rose-500",
    extTabId: "diffchecker",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true
  },
  {
    id: "inspector",
    label: "Image Inspector",
    href: "/inspector",
    categoryId: "layout-composition",
    iconColorClassName: "text-teal-500",
    extTabId: "inspector",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true
  },
  {
    id: "context-menu",
    label: "Context Menu",
    href: "/options?tab=context-menu",
    categoryId: "extension-exclusive",
    iconColorClassName: "text-blue-500",
    extTabId: "context-menu",
    showOnWebToolsMenu: true,
    showOnExtSidebar: true
  },
  {
    id: "seo-audit",
    label: "SEO Audit",
    href: "/options?view=sidepanel&panel=audit",
    categoryId: "extension-exclusive",
    iconColorClassName: "text-fuchsia-500",
    showOnWebToolsMenu: true,
    showOnExtSidebar: false
  }
]

export function renderWorkspaceToolIcon(toolId: string, size = 16): React.ReactNode {
  const tool = WORKSPACE_TOOLS.find((entry) => entry.id === toolId)
  const className = tool?.iconColorClassName

  switch (toolId) {
    case "single-processor":
      return <Image size={size} className={className} />
    case "batch-processor":
      return <Workflow size={size} className={className} />
    case "splicing":
      return <LayoutGrid size={size} className={className} />
    case "splitter":
      return <Scissors size={size} className={className} />
    case "filling":
      return <Layers size={size} className={className} />
    case "pattern-generator":
      return <Stamp size={size} className={className} />
    case "diffchecker":
      return <ArrowLeftRight size={size} className={className} />
    case "inspector":
      return <ScanSearch size={size} className={className} />
    case "context-menu":
      return <ListTree size={size} className={className} />
    case "seo-audit":
      return <Search size={size} className={className} />
    default:
      return <Workflow size={size} className={className} />
  }
}

export function getWorkspaceToolsMenuGroups(): Array<{
  title: string
  items: Array<{ id: string; href: string; label: string }>
}> {
  return WORKSPACE_TOOL_CATEGORIES
    .map((category) => ({
      title: category.label,
      items: WORKSPACE_TOOLS.filter(
        (tool) => tool.categoryId === category.id && tool.showOnWebToolsMenu
      ).map((tool) => ({ id: tool.id, href: tool.href, label: tool.label }))
    }))
    .filter((group) => group.items.length > 0)
}

export function getExtensionSidebarToolGroups(): Array<{
  title: string
  items: Array<{ id: string; label: string; tabId: WorkspacePrimaryToolId }>
}> {
  return WORKSPACE_TOOL_CATEGORIES
    .map((category) => ({
      title: category.label,
      items: WORKSPACE_TOOLS.filter(
        (tool) => tool.categoryId === category.id && tool.showOnExtSidebar && tool.extTabId
      ).map((tool) => ({
        id: tool.id,
        label: tool.label,
        tabId: tool.extTabId as WorkspacePrimaryToolId
      }))
    }))
    .filter((group) => group.items.length > 0)
}
