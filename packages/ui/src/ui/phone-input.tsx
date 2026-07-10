import React, { useState, useEffect, useRef } from "react";
import { HelpCircle } from "lucide-react";
import { LabelText } from "./typography";

export interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  errorMessage?: string;
  className?: string;
}

export function PhoneInput({
  label,
  value,
  onChange,
  placeholder = "Enter phone number",
  disabled = false,
  errorMessage,
  className = "",
}: PhoneInputProps) {
  const hasError = Boolean(errorMessage);

  // Helper to parse value into country code digits and local number
  const parsePhone = (phoneVal: string) => {
    if (!phoneVal) return { dialCodeDigits: "84", localNumber: "" };

    if (phoneVal.startsWith("+")) {
      // Fallback: match first 1 to 3 digits if it starts with '+'
      const match = phoneVal.match(/^\+(\d{1,3})/);
      if (match) {
        const dial = match[1];
        return {
          dialCodeDigits: dial,
          localNumber: phoneVal.slice(dial.length + 1),
        };
      }
      return { dialCodeDigits: "", localNumber: phoneVal.slice(1) };
    }

    return { dialCodeDigits: "", localNumber: phoneVal };
  };

  const parsed = parsePhone(value);
  const [dialDigits, setDialDigits] = useState(parsed.dialCodeDigits);
  const [localNum, setLocalNum] = useState(parsed.localNumber);

  const isInitialized = useRef(false);

  // Sync state with value prop when it changes from outside
  useEffect(() => {
    if (!isInitialized.current) {
      if (!value) {
        setDialDigits("84");
        setLocalNum("");
      } else {
        const p = parsePhone(value);
        setDialDigits(p.dialCodeDigits);
        setLocalNum(p.localNumber);
      }
      isInitialized.current = true;
      return;
    }

    const prefix = dialDigits ? `+${dialDigits}` : "";
    const combined = prefix + localNum;
    if (value !== combined) {
      if (!value) {
        setDialDigits("84");
        setLocalNum("");
      } else {
        const p = parsePhone(value);
        setDialDigits(p.dialCodeDigits);
        setLocalNum(p.localNumber);
      }
    }
  }, [value]);

  const handleDialCodeDigitsChange = (newDigits: string) => {
    // Only allow digits up to 4 characters
    const filtered = newDigits.replace(/\D/g, "").slice(0, 4);
    setDialDigits(filtered);

    let local = localNum;
    if (local.startsWith("0")) {
      local = local.slice(1);
    }

    const prefix = filtered ? `+${filtered}` : "";
    onChange(prefix + local);
  };

  const handleLocalNumberChange = (newLocal: string) => {
    // Only allow digits, spaces, hyphens, and parentheses in the local number
    const filtered = newLocal.replace(/[^\d\s\-()]/g, "");
    let local = filtered;
    if (local.startsWith("0") && local.length > 1) {
      local = local.slice(1);
    }
    setLocalNum(local);

    const prefix = dialDigits ? `+${dialDigits}` : "";
    onChange(prefix + local);
  };

  const wrapperBorderClass = hasError
    ? "border-rose-300 bg-rose-50 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-500 dark:border-rose-900/60 dark:bg-rose-950/20"
    : "border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500";

  const inputBorderClass = hasError
    ? "border-rose-300 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-100"
    : "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500";

  return (
    <div className={`space-y-1 ${className}`}>
      <LabelText className="text-xs">{label}</LabelText>
      <div className="flex gap-2 items-center">
        <div
          className={`
            flex items-center gap-1 bg-white dark:bg-slate-800/80 rounded-md border px-2.5 h-9 shadow-sm transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${wrapperBorderClass}
          `}
        >
          <span className="text-slate-400 dark:text-slate-500 font-medium select-none text-xs leading-none">
            +
          </span>
          <input
            type="tel"
            value={dialDigits}
            onChange={(e) => handleDialCodeDigitsChange(e.target.value)}
            disabled={disabled}
            placeholder="84"
            className="w-8 bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none text-center font-mono leading-none"
          />
          {!dialDigits && (
            <a
              href="https://countrycode.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer ml-0.5 border-l border-slate-200 dark:border-slate-700 pl-1.5 flex items-center h-full"
              title="Look up country codes"
            >
              <HelpCircle size={12} />
            </a>
          )}
        </div>
        <input
          type="tel"
          value={localNum}
          onChange={(e) => handleLocalNumberChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          className={`
            flex-1 h-9 rounded-md border bg-white dark:bg-slate-800/80
            px-3 text-xs text-slate-700 dark:text-slate-200 outline-none transition-all shadow-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            ${inputBorderClass}
          `}
        />
      </div>
      {hasError && (
        <div className="text-[11px] leading-snug text-rose-600 dark:text-rose-300">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
