import { useToast } from "@/core/hooks/use-toast"
import { ToastContainer } from "@/core/components/toast-container"

/**
 * useToast Hook Documentation
 *
 * A standardized toast notification system for the Imify project.
 *
 * ## Usage
 *
 * ```tsx
 * function MyComponent() {
 *   const { toasts, colorCopied, copyFailed, success, error, warning } = useToast()
 *
 *   const handleCopyColor = async (hex: string) => {
 *     try {
 *       await navigator.clipboard.writeText(hex)
 *       colorCopied(hex, 2000) // Show for 2 seconds
 *     } catch {
 *       copyFailed("Clipboard access denied", 2000)
 *     }
 *   }
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData()
 *       success("Saved", "Your changes have been saved", 2000)
 *     } catch (err) {
 *       error("Save failed", err.message, 3000)
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={() => handleCopyColor("#FF0000")}>Copy Color</button>
 *       <button onClick={handleSave}>Save</button>
 *       <ToastContainer toasts={toasts} onRemove={(id) => remove(id)} />
 *     </div>
 *   )
 * }
 * ```
 *
 * ## Toast Types
 *
 * ### Color Copied
 * ```tsx
 * const toastId = colorCopied("#FF0000", 2000)
 * // Shows: "Color copied" with HEX chip "#FF0000" and countdown bar
 * ```
 *
 * ### Copy Failed
 * ```tsx
 * const toastId = copyFailed("Clipboard access denied", 2000)
 * // Shows: error toast with message
 * ```
 *
 * ### Success
 * ```tsx
 * const toastId = success("Saved", "Your changes have been saved", 2000)
 * // Shows: success toast with title and message
 * ```
 *
 * ### Error
 * ```tsx
 * const toastId = error("Operation failed", "Something went wrong", 3000)
 * // Shows: error toast with title and message
 * ```
 *
 * ### Warning
 * ```tsx
 * const toastId = warning("Heavy format", "This may slow down your system", 3000)
 * // Shows: warning toast with title and message
 * ```
 *
 * ### Custom Toast
 * ```tsx
 * const toastId = show({
 *   type: "notification",
 *   title: "Custom message",
 *   message: "Additional details",
 *   duration: 2000
 * })
 * ```
 *
 * ## Features
 *
 * - Multiple toasts stack vertically
 * - Auto-hide after specified duration
 * - Countdown progress bar
 * - Color chip display for hex values
 * - Smooth animations
 * - Support for different toast types (success, error, warning, color-chip, notification)
 * - Manual hide capability via `onRemove`
 *
 * ## Styling
 *
 * All toasts are styled with:
 * - Dark background (#0f172a)
 * - Accent colors based on type
 * - Backdrop blur effect
 * - Slide-in animation from right
 * - Fixed position at bottom-right corner
 */

export const TOAST_HOOK_DOCUMENTATION = {
  usage:
    "Import useToast hook and ToastContainer component, then use them in your component"
}
