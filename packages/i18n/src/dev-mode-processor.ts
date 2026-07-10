import type { PostProcessorModule } from "i18next"

// Singleton flag - updated by the DevModeStore subscriber
let _showDebugKeys = false

export function setShowI18nDebugKeys(v: boolean): void {
  _showDebugKeys = v
}

export function getShowI18nDebugKeys(): boolean {
  return _showDebugKeys
}

export const devModePostProcessor: PostProcessorModule = {
  type: "postProcessor",
  name: "imifyDevMode",
  process(value, key) {
    if (_showDebugKeys) {
      const keyStr = Array.isArray(key) ? key[0] : key
      return `${value} [${keyStr}]`
    }
    return value
  }
}
