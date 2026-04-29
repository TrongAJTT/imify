type PreventableWheelEvent = {
  preventDefault: () => void
  stopPropagation: () => void
}

/**
 * Ensure wheel doesn't bubble to the page (prevents outer scroll).
 * Works for both React WheelEvent and native WheelEvent when used in non-passive listeners.
 */
export function preventWheelEvent(event: PreventableWheelEvent): void {
  event.preventDefault()
  event.stopPropagation()
}

