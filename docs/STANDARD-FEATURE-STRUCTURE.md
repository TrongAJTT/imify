# Imify Feature Architecture Standardization

This document outlines the standard structure for implementing new features (tools) within the Imify monorepo. Following this pattern ensures platform parity (Web & Extension), simplifies state management, and prevents hydration/layout issues.

## Core Philosophy: "Logic in Packages, Shell in Apps"

1.  **Business Logic & Presentational Components**: Reside in `packages/features`.
2.  **Platform Integration (Shell/Router)**: Reside in `apps/web` and `apps/extension`.
3.  **Communication**: Use the **Render Props** pattern in shared page components to decouple logic from layout containers.

---

## 1. Feature Structure in `packages/features/src/[feature-name]`

A standard feature directory should contain:

| File | Responsibility |
| :--- | :--- |
| `page.tsx` | **Logic Controller**. Manages local state, hooks, and data processing. Exports a `Shared[Name]Page` component. |
| `workspace.tsx` | **Main UI**. Presentational component for the tool's workspace. |
| `drop-zone.tsx` | **Initial State**. UI for when no file is loaded (Dropzone/Empty state). |
| `sidebar.tsx` | **Controls**. UI for the sidebar settings/actions. |
| `use-[name].ts` | **Custom Hook**. Encapsulates complex logic (e.g., worker interaction, AI pipeline). |
| `worker.ts` | **Background Task**. Offloads heavy computation to a Web Worker. |
| `index.ts` | **Public API**. Exports all necessary components for consumption by apps. |

### The `SharedPage` Pattern

The shared page should follow this pattern:

```tsx
// packages/features/src/[feature]/page.tsx
export interface Shared[Feature]RenderProps {
  sourceFile: File | null
  isProcessing: boolean
  // ... other state
  onLoadFile: (file: File) => void
  onClear: () => void
  // ... other handlers
}

interface Shared[Feature]PageProps {
  renderWorkspace: (props: Shared[Feature]RenderProps) => ReactNode
}

export function Shared[Feature]Page({ renderWorkspace }: Shared[Feature]PageProps) {
  // 1. Manage State
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  
  // 2. Business Logic (Hooks)
  const { process, isProcessing } = use[Feature]Logic()

  // 3. Render via Prop
  return renderWorkspace({
    sourceFile,
    isProcessing,
    onLoadFile: (file) => { /* logic */ },
    onClear: () => { /* logic */ }
  })
}
```

---

## 2. Platform Integration

### Web App (`apps/web/src/features/[feature]`)

Integrate using the `WorkspaceLayout` provided by the web app's shell.

```tsx
// apps/web/src/features/[feature]/[feature]-pages.tsx
import { Shared[Feature]Page, Workspace, DropZone } from "@imify/features/[feature]"

export function Web[Feature]Page() {
  return (
    <Shared[Feature]Page
      renderWorkspace={(props) => (
        <WorkspaceLayout 
          sidebar={<FeatureSidebar />}
          header={<FeatureHeader />}
        >
          {!props.sourceFile ? (
            <DropZone onLoadFile={props.onLoadFile} />
          ) : (
            <Workspace {...props} />
          )}
        </WorkspaceLayout>
      )}
    />
  )
}
```

### Browser Extension (`apps/extension/src/options/index.tsx`)

Integrate into the `OptionsPage` router.

```tsx
// apps/extension/src/options/index.tsx
case "[feature]":
  return (
    <ProcessorWorkspaceShell
      context="single"
      workspace={
        <Shared[Feature]Page
          renderWorkspace={(props) => (
            <>
              {!props.sourceFile ? (
                <DropZone onLoadFile={props.onLoadFile} />
              ) : (
                <Workspace {...props} />
              )}
            </>
          )}
        />
      }
    />
  )
```

---

## 3. Best Practices

1.  **Avoid Nested Shells**: Do not include `WorkspaceShell` or `WorkspaceLayout` inside the `packages/features` components. These should be provided by the host app to avoid hydration errors.
2.  **Platform-Specific APIs**: If a feature needs a platform API (e.g., `chrome.storage`), abstract it into an adapter or pass it as a prop to the `SharedPage`.
3.  **Consistent IDs**: Use stable IDs for toasts and progress payloads to ensure smooth UI updates.
4.  **Zustand for Global State**: Only use global stores (`@imify/stores`) for cross-feature settings (e.g., Theme, Layout Preferences). Use local state or dedicated feature stores for tool-specific data.
