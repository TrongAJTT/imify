import React, { useState, useCallback, useRef } from "react"
import { RenameInputDialog } from "../ui/rename-input-dialog"

export function useRenameInputPrompt() {
  const [isOpen, setIsOpen] = useState(false)
  const [pattern, setPattern] = useState("")
  const pendingActionRef = useRef<((value: string) => void) | null>(null)

  const checkAndPrompt = useCallback((
    renamePattern: string,
    onConfirm: (inputValue: string) => void,
    onSkip?: () => void
  ) => {
    console.log("[useRenameInputPrompt] checkAndPrompt called with pattern:", renamePattern)
    const matches = /\[input\]/i.test(renamePattern)
    console.log("[useRenameInputPrompt] matches [input] (case-insensitive):", matches)
    if (matches) {
      setPattern(renamePattern)
      pendingActionRef.current = onConfirm
      setIsOpen(true)
      console.log("[useRenameInputPrompt] setIsOpen(true) called, returning true")
      return true // Prompted
    } else {
      console.log("[useRenameInputPrompt] Calling skip/confirm directly, returning false")
      if (onSkip) {
        onSkip()
      } else {
        onConfirm("")
      }
      return false // Not prompted
    }
  }, [])

  const handleConfirm = useCallback((value: string) => {
    console.log("[useRenameInputPrompt] handleConfirm called with value:", value)
    if (pendingActionRef.current) {
      pendingActionRef.current(value)
    }
    setIsOpen(false)
    pendingActionRef.current = null
  }, [])

  const handleClose = useCallback(() => {
    console.log("[useRenameInputPrompt] handleClose called")
    setIsOpen(false)
    pendingActionRef.current = null
  }, [])

  console.log("[useRenameInputPrompt] render - isOpen:", isOpen, "pattern:", pattern)

  const renameInputPrompt = (
    <RenameInputDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      renamePattern={pattern}
    />
  )

  return {
    checkAndPrompt,
    renameInputPrompt,
    isOpen
  }
}

