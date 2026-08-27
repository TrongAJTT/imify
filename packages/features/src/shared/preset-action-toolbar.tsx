import React from "react";
import { Edit2, Pin, PinOff, Tag, Download, Trash2 } from "lucide-react";
import { CardActionToolbar, CardActionButton } from "@imify/ui";
import { useTranslation } from "@imify/i18n";

export interface PresetActionToolbarProps {
  /**
   * Whether the preset is currently pinned.
   */
  isPinned?: boolean;
  /**
   * Callback when user toggles the pin status.
   */
  onTogglePin?: () => void;
  /**
   * Callback when user clicks the edit button.
   */
  onEdit?: () => void;
  /**
   * Callback when user clicks rename / tag button.
   */
  onRename?: () => void;
  /**
   * Callback when user clicks export button.
   */
  onExport?: () => void;
  /**
   * Whether export is in progress.
   */
  isExporting?: boolean;
  /**
   * Callback when user clicks delete button.
   */
  onDelete?: () => void;
  /**
   * Custom tooltip for edit.
   */
  editTooltip?: string;
  /**
   * Custom tooltip for rename / tag.
   */
  renameTooltip?: string;
  /**
   * Custom tooltip for export.
   */
  exportTooltip?: string;
  /**
   * Custom tooltip for delete.
   */
  deleteTooltip?: string;
  /**
   * Custom tooltip for pin.
   */
  pinTooltip?: string;
  /**
   * Custom tooltip for unpin.
   */
  unpinTooltip?: string;
  /**
   * Whether toolbar should always be visible (e.g. Card is active or pinned).
   */
  alwaysVisible?: boolean;
  /**
   * Additional class name for outer container.
   */
  className?: string;
  /**
   * Additional action buttons placed before delete.
   */
  extraActions?: React.ReactNode;
}

export function PresetActionToolbar({
  isPinned = false,
  onTogglePin,
  onEdit,
  onRename,
  onExport,
  isExporting = false,
  onDelete,
  editTooltip,
  renameTooltip,
  exportTooltip,
  deleteTooltip,
  pinTooltip,
  unpinTooltip,
  alwaysVisible,
  className = "",
  extraActions,
}: PresetActionToolbarProps) {
  const { t } = useTranslation("common");

  const defaultEditTooltip =
    editTooltip || t("editPreset", { defaultValue: "Edit preset" });
  const defaultRenameTooltip =
    renameTooltip || t("renamePreset", { defaultValue: "Rename preset" });
  const defaultExportTooltip =
    exportTooltip || t("exportPreset", { defaultValue: "Export preset" });
  const defaultDeleteTooltip =
    deleteTooltip || t("deletePreset", { defaultValue: "Delete preset" });
  const defaultPinTooltip =
    pinTooltip || t("pinPreset", { defaultValue: "Pin preset" });
  const defaultUnpinTooltip =
    unpinTooltip || t("unpinPreset", { defaultValue: "Unpin preset" });

  return (
    <CardActionToolbar
      alwaysVisible={alwaysVisible ?? isPinned}
      className={className}
    >
      {onEdit && (
        <CardActionButton
          icon={<Edit2 size={13} />}
          tooltip={defaultEditTooltip}
          onClick={onEdit}
          ariaLabel={defaultEditTooltip}
        />
      )}

      {onRename && (
        <CardActionButton
          icon={<Tag size={13} />}
          tooltip={defaultRenameTooltip}
          onClick={onRename}
          ariaLabel={defaultRenameTooltip}
        />
      )}

      {onExport && (
        <CardActionButton
          icon={<Download size={13} />}
          tooltip={defaultExportTooltip}
          onClick={onExport}
          disabled={isExporting}
          ariaLabel={defaultExportTooltip}
        />
      )}

      {onTogglePin && (
        <CardActionButton
          icon={
            isPinned ? (
              <Pin size={13} className="fill-amber-500 rotate-45" />
            ) : (
              <Pin size={13} />
            )
          }
          activePin={isPinned}
          tooltip={isPinned ? defaultUnpinTooltip : defaultPinTooltip}
          onClick={onTogglePin}
          ariaLabel={isPinned ? defaultUnpinTooltip : defaultPinTooltip}
        />
      )}

      {extraActions}

      {onDelete && (
        <CardActionButton
          icon={<Trash2 size={13} />}
          destructive
          tooltip={defaultDeleteTooltip}
          onClick={onDelete}
          ariaLabel={defaultDeleteTooltip}
        />
      )}
    </CardActionToolbar>
  );
}
