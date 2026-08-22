"use client";

import React, { type ReactNode } from "react";
import {
  BaseTriggerButton,
  type BaseTriggerButtonProps,
  useBaseTriggerState,
  type BaseTriggerMode,
  type BaseTriggerState,
  type UseBaseTriggerOptions,
} from "@imify/ui";
import { useTranslation } from "@imify/i18n";

export type TriggerMode = BaseTriggerMode;
export type TriggerState = BaseTriggerState;
export type UseTriggerOptions = UseBaseTriggerOptions;
export const useTriggerState = useBaseTriggerState;

export interface TriggerButtonProps extends BaseTriggerButtonProps {
  /** Optional custom tooltip title/label. Defaults to `label` if passed. */
  tooltipLabel?: ReactNode;
}

export function TriggerButton(props: TriggerButtonProps) {
  const {
    mode = "double_tap",
    tooltipLabel,
    tooltipContent,
    tooltip,
    label,
    ...rest
  } = props;

  const { t } = useTranslation("common");

  const defaultTooltipContent =
    mode === "toggle"
      ? t("triggerButton.toggleHelp")
      : mode === "per_tap"
        ? t("triggerButton.perTapHelp")
        : t("triggerButton.doubleTapHelp");

  const resolvedTooltipLabel = tooltipLabel ?? label;
  const resolvedTooltipContent =
    tooltipContent ?? tooltip ?? defaultTooltipContent;

  return (
    <BaseTriggerButton
      mode={mode}
      label={label}
      tooltipLabel={resolvedTooltipLabel}
      tooltipContent={resolvedTooltipContent}
      {...rest}
    />
  );
}
