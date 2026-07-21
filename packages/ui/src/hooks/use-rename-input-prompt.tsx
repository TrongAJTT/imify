import React, { useState, useCallback, useRef } from "react";
import { RenameInputDialog } from "../ui/rename-input-dialog";

export function useRenameInputPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [pattern, setPattern] = useState("");
  const pendingActionRef = useRef<((value: string) => void) | null>(null);

  const checkAndPrompt = useCallback(
    (
      renamePattern: string,
      onConfirm: (inputValue: string) => void,
      onSkip?: () => void,
    ) => {
      // State tracking
      // console.log("[useRenameInputPrompt] checkAndPrompt called with pattern:", renamePattern)
      const matches = /\[input\]/i.test(renamePattern);
      // State tracking
      // console.log("[useRenameInputPrompt] matches [input] (case-insensitive):", matches)
      if (matches) {
        setPattern(renamePattern);
        pendingActionRef.current = onConfirm;
        setIsOpen(true);
        // State tracking
        // console.log("[useRenameInputPrompt] setIsOpen(true) called, returning true")
        return true; // Prompted
      } else {
        // State tracking
        // console.log("[useRenameInputPrompt] Calling skip/confirm directly, returning false")
        if (onSkip) {
          onSkip();
        } else {
          onConfirm("");
        }
        return false; // Not prompted
      }
    },
    [],
  );

  const handleConfirm = useCallback((value: string) => {
    // State tracking
    // console.log("[useRenameInputPrompt] handleConfirm called with value:", value)
    if (pendingActionRef.current) {
      pendingActionRef.current(value);
    }
    setIsOpen(false);
    pendingActionRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    // State tracking
    // console.log("[useRenameInputPrompt] handleClose called")
    setIsOpen(false);
    pendingActionRef.current = null;
  }, []);

  // State tracking
  // console.log("[useRenameInputPrompt] render - isOpen:", isOpen, "pattern:", pattern)

  const renameInputPrompt = isOpen ? (
    <RenameInputDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      renamePattern={pattern}
    />
  ) : null;

  return {
    checkAndPrompt,
    renameInputPrompt,
    isOpen,
  };
}
