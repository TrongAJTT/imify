import { consumePendingInspectorOptimizeFile } from "@/options/shared/inspector-optimize-bridge"
import { SingleProcessorWorkspace } from "@imify/features/processor/single-processor-workspace"

export function SingleProcessorTab() {
  return <SingleProcessorWorkspace consumePendingOptimizeFile={consumePendingInspectorOptimizeFile} />
}
