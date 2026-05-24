import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { SecondaryButton } from "./secondary-button";
import { Button } from "./button";
import { TextInput } from "./text-input";
import { BaseDialog } from "./base-dialog";
import { LabelText } from "./typography";

export interface RenameInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title?: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  renamePattern: string;
}

export function RenameInputDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Custom Filename Input",
  label = "Enter custom input to include in the filename",
  placeholder = "e.g. holiday_trip, instagram_post",
  initialValue = "",
  renamePattern,
}: RenameInputDialogProps) {
  console.log("[RenameInputDialog] render - isOpen:", isOpen, "renamePattern:", renamePattern);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    console.log("[RenameInputDialog] useEffect isOpen:", isOpen, "initialValue:", initialValue);
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleConfirm = () => {
    onConfirm(value.trim());
    onClose();
  };

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="w-full max-w-md rounded-xl overflow-hidden flex flex-col"
    >
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
          {title}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <TextInput
          label={label}
          value={value}
          onChange={setValue}
          placeholder={placeholder}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) {
              handleConfirm();
            }
          }}
        />
      </div>

      <div className="px-6">
        <LabelText className="text-xs">
          Naming pattern: {renamePattern}
        </LabelText>
      </div>

      <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
        <SecondaryButton onClick={onClose} className="px-5">
          Cancel
        </SecondaryButton>
        <Button
          onClick={handleConfirm}
          disabled={!value.trim()}
          className="px-5 flex items-center gap-1.5 shadow-lg shadow-sky-500/10"
        >
          <Check className="w-4 h-4" />
          Confirm & Download
        </Button>
      </div>
    </BaseDialog>
  );
}
