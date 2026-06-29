import React from 'react';
import { CloseCircleFilled, DownOutlined } from '@ant-design/icons';

// Dedicated AntD-input-styled closed trigger (D-03/D-04). It forwards the injected `id` to its
// root button and renders the AntD error ring when status==='error' (D-02 — keeps existing Form
// validation working). NEVER renders a live AntD Select/DatePicker with its popup suppressed.

export type SheetTriggerProps = {
    id?: string;
    status?: 'error' | 'warning' | '';
    disabled?: boolean;
    placeholder?: React.ReactNode;
    summary?: React.ReactNode;          // resolved label node; when null/undefined the placeholder shows
    allowClear?: boolean;
    onClear?: () => void;
    onOpen?: () => void;
    glyph?: React.ReactNode;            // idle trailing glyph; defaults to DownOutlined (date passes CalendarOutlined)
};

const PURPLE = '#7436dc';
const BORDER_IDLE = '#d9d9d9';
const ERROR = '#ff4d4f';
const PLACEHOLDER = '#bfbfbf';

const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minHeight: 44,
    padding: '0 11px',
    border: `1px solid ${BORDER_IDLE}`,
    borderRadius: 6,
    background: '#fff',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: '22px',
    textAlign: 'left',
    cursor: 'pointer',
    color: 'rgba(0,0,0,0.88)',
    boxSizing: 'border-box',
    outline: 'none',
    gap: 8,
};

export const SheetTrigger: React.FunctionComponent<SheetTriggerProps> = ({
    id,
    status,
    disabled,
    placeholder,
    summary,
    allowClear,
    onClear,
    onOpen,
    glyph,
}) => {
    const [focused, setFocused] = React.useState(false);
    const isError = status === 'error';
    const hasValue = summary !== undefined && summary !== null && summary !== '';
    const showClear = !!allowClear && hasValue && !disabled;

    const style: React.CSSProperties = { ...baseStyle };
    if (disabled) {
        style.background = '#f5f5f5';
        style.color = 'rgba(0,0,0,0.25)';
        style.cursor = 'not-allowed';
        style.borderColor = BORDER_IDLE;
    } else if (isError) {
        style.borderColor = ERROR;
        if (focused) style.boxShadow = '0 0 0 2px rgba(255,77,79,0.12)';
    } else if (focused) {
        style.borderColor = PURPLE;
        style.boxShadow = '0 0 0 2px rgba(116,54,220,0.12)';
    }

    const handleClick = () => {
        if (disabled) return;
        onOpen?.();
    };

    const handleClear = (event: React.MouseEvent) => {
        // Must NOT open the sheet — clearing is a distinct affordance (D-04).
        event.stopPropagation();
        onClear?.();
    };

    return (
        <button
            type="button"
            id={id}
            disabled={disabled}
            style={style}
            aria-haspopup="dialog"
            aria-expanded={false}
            aria-invalid={isError || undefined}
            onClick={handleClick}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
        >
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: hasValue ? undefined : PLACEHOLDER }}>
                {hasValue ? summary : placeholder}
            </span>
            {showClear ? (
                <span
                    role="button"
                    aria-label="Bỏ chọn"
                    onClick={handleClear}
                    style={{ color: 'rgba(0,0,0,0.25)', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                >
                    <CloseCircleFilled />
                </span>
            ) : (
                <span style={{ color: PLACEHOLDER, display: 'inline-flex', alignItems: 'center' }}>
                    {glyph ?? <DownOutlined />}
                </span>
            )}
        </button>
    );
};
