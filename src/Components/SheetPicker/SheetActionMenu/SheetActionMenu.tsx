import React from 'react';
import { Sheet, SheetActions } from '@components/Sheet';

/**
 * A single action row in a {@link SheetActionMenu}. It dispatches an action; it
 * does NOT hold a value (the menu is not Form-bound — D-10). `danger` renders
 * the row label + icon in the AntD error red (#ff4d4f).
 */
export type SheetAction = {
    key: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    danger?: boolean;
    onClick: () => void;
};

export type SheetActionMenuProps = {
    open: boolean;
    onClose: () => void;
    title?: string;
    actions: SheetAction[];
    "data-testid"?: string;
};

// iOS action-sheet error red (AntD colorError). Weight stays 400 per UI-SPEC.
const DANGER_COLOR = "#ff4d4f";

const groupSurfaceStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 14,
    overflow: "hidden",
};

const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 16,
    width: "100%",
    minHeight: 44,
    padding: "10px 16px",
    border: "none",
    borderTop: "1px solid #f0f0f0",
    background: "transparent",
    fontSize: 16,
    fontWeight: 400,
    color: "inherit",
    textAlign: "left",
    cursor: "pointer",
};

const iconStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 16,
};

const cancelButtonStyle: React.CSSProperties = {
    ...groupSurfaceStyle,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 44,
    padding: "10px 16px",
    border: "none",
    fontSize: 16,
    fontWeight: 600,
    color: "inherit",
    cursor: "pointer",
};

/**
 * `SheetActionMenu` (PICK-07, D-10): an iOS grouped action-sheet hosted in the
 * Phase 7 native `<Sheet>`. Renders full-width tappable rows in one rounded
 * surface, destructive rows in red, and a detached "Hủy" button below the group.
 *
 * Not Form-bound — it dispatches actions, it does not hold a value. Composes
 * only `<Sheet>` + `SheetActions`; never passes an explicit `zIndex` (Phase 7
 * token-stacking owns z-index).
 */
export const SheetActionMenu: React.FunctionComponent<SheetActionMenuProps> = ({
    open,
    onClose,
    title,
    actions,
    "data-testid": testId,
}) => {
    const handleAction = (action: SheetAction) => () => {
        action.onClick();
        onClose();
    };

    return (
        <Sheet open={open} onClose={onClose} title={title} data-testid={testId}>
            <div style={groupSurfaceStyle}>
                {actions.map((action, index) => (
                    <button
                        key={action.key}
                        type="button"
                        onClick={handleAction(action)}
                        style={{
                            ...rowStyle,
                            // First row keeps the surface's own rounded top edge.
                            borderTop: index === 0 ? "none" : rowStyle.borderTop,
                            color: action.danger ? DANGER_COLOR : rowStyle.color,
                        }}
                    >
                        {action.icon != null && (
                            <span aria-hidden="true" style={iconStyle}>
                                {action.icon}
                            </span>
                        )}
                        <span>{action.label}</span>
                    </button>
                ))}
            </div>
            {/* Detached "Hủy" sits in its own rounded surface below the group,
                separated by a lg/24px gap (UI-SPEC §SheetActionMenu). */}
            <SheetActions style={{ marginTop: 24 }}>
                <button type="button" onClick={onClose} style={cancelButtonStyle}>
                    Hủy
                </button>
            </SheetActions>
        </Sheet>
    );
};
