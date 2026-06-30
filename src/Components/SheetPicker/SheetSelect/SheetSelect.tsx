import React from 'react';
import { Input } from 'antd';
import { CheckOutlined, DownOutlined, SearchOutlined } from '@ant-design/icons';
import { Sheet } from '@components/Sheet';
import { SheetTrigger } from '../shared/SheetTrigger';
import { useSheetPickerField, SheetFieldStatus } from '../shared/useSheetPickerField';
import { getTriggerSummary } from '../shared/optionLabel';
import { normalizeDiacritics } from '../shared/normalizeDiacritics';
import { iosTokens } from '@theme';

// SheetSelect (PICK-01/02, D-05): single-select sheet picker. Tap an option row ->
// checkmark on that row -> onChange(value) -> sheet auto-dismisses. A search field
// auto-appears for long lists (threshold 8 or showSearch) and filters
// diacritic-insensitively. allowClear renders a leading "Bỏ chọn" row. Controlled,
// AntD-Form-bindable child (D-02) composing the Wave-1 shared primitives.
//
// IMPORTANT: never pass an explicit zIndex to <Sheet> — Phase 7 token-stacks sheets
// automatically; an explicit zIndex breaks nested stacking (RESEARCH anti-pattern).

const PURPLE = '#7436dc';
const CLEAR_LABEL = '#64748b';
const MUTED = '#64748b';
const SEARCH_THRESHOLD = 8;

export type SheetSelectOption = {
    value: React.Key;
    label?: React.ReactNode;
    disabled?: boolean;
};

export type SheetSelectProps = {
    value?: React.Key;
    onChange?: (value: React.Key | undefined) => void;
    options?: SheetSelectOption[];
    showSearch?: boolean;
    allowClear?: boolean;
    placeholder?: React.ReactNode;
    disabled?: boolean;
    // Injected by AntD Form.Item when it clones the child (D-02).
    id?: string;
    status?: SheetFieldStatus;
};

const rowBaseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minHeight: iosTokens.touchTarget.min,
    padding: '11px 16px',
    border: 'none',
    borderBottom: '1px solid #f0f0f0',
    background: 'transparent',
    ...iosTokens.type.control,
    textAlign: 'left',
    cursor: 'pointer',
    boxSizing: 'border-box',
    gap: 8,
};

const emptyStateStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '32px 16px',
    textAlign: 'center',
    fontSize: 14,
    color: MUTED,
};

// `String(label)` is only safe for plain string/number labels; for richer nodes we
// fall back to the value's string form for filtering (matches the AntD wrapper's
// label-resolution intent in optionLabel.ts).
const optionFilterText = (option: SheetSelectOption): string => {
    if (typeof option.label === 'string') return option.label;
    if (typeof option.label === 'number') return String(option.label);
    return String(option.value);
};

export const SheetSelect: React.FunctionComponent<SheetSelectProps> = ({
    value,
    onChange,
    options = [],
    showSearch,
    allowClear,
    placeholder,
    disabled,
    id,
    status,
}) => {
    const field = useSheetPickerField<React.Key>({ value, onChange, id, status });
    const { open, setOpen } = field;
    const [query, setQuery] = React.useState('');

    // Reset the search query on each open transition so a stale filter never leaks
    // into a fresh open (mirrors useSheetPickerField's draft re-seeding).
    React.useEffect(() => {
        if (open) setQuery('');
    }, [open]);

    const summary = getTriggerSummary({ value, options });
    const showSearchField = showSearch || options.length >= SEARCH_THRESHOLD;

    const filteredOptions = React.useMemo(() => {
        if (!query) return options;
        const needle = normalizeDiacritics(query);
        return options.filter(option => normalizeDiacritics(optionFilterText(option)).includes(needle));
    }, [options, query]);

    const handleSelect = (optionValue: React.Key) => {
        onChange?.(optionValue);
        setOpen(false);
    };

    const handleClear = () => {
        onChange?.(undefined);
        setOpen(false);
    };

    const sheetTitle = placeholder ?? 'Chọn';

    return (
        <>
            <SheetTrigger
                id={id}
                status={field.status}
                disabled={disabled}
                placeholder={placeholder}
                summary={summary}
                allowClear={allowClear}
                onClear={() => onChange?.(undefined)}
                onOpen={() => setOpen(true)}
                glyph={<DownOutlined />}
            />
            <Sheet open={open} title={sheetTitle} onClose={() => setOpen(false)}>
                {showSearchField && (
                    <div style={{ margin: '8px 0 12px' }}>
                        <Input
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                            placeholder="Tìm kiếm"
                            prefix={<SearchOutlined style={{ color: MUTED }} />}
                            allowClear
                            style={{ fontSize: 16 }}
                        />
                    </div>
                )}

                {allowClear && (
                    <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={handleClear}
                        style={{ ...rowBaseStyle, color: CLEAR_LABEL }}
                    >
                        <span style={{ flex: 1, minWidth: 0 }}>Bỏ chọn</span>
                    </button>
                )}

                {options.length === 0 ? (
                    <div style={emptyStateStyle}>
                        <div style={{ fontWeight: 600 }}>Chưa có lựa chọn</div>
                        <div>Danh sách đang trống</div>
                    </div>
                ) : filteredOptions.length === 0 ? (
                    <div style={emptyStateStyle}>
                        <div style={{ fontWeight: 600 }}>Không tìm thấy</div>
                        <div>Thử từ khóa khác</div>
                    </div>
                ) : (
                    filteredOptions.map(option => {
                        const isSelected = String(option.value) === String(value);
                        return (
                            <button
                                key={String(option.value)}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                disabled={option.disabled}
                                onClick={() => handleSelect(option.value)}
                                style={{
                                    ...rowBaseStyle,
                                    color: isSelected ? PURPLE : 'rgba(0,0,0,0.88)',
                                    cursor: option.disabled ? 'not-allowed' : 'pointer',
                                    opacity: option.disabled ? 0.4 : 1,
                                }}
                            >
                                <span style={{ flex: 1, minWidth: 0 }}>
                                    {option.label ?? String(option.value)}
                                </span>
                                {isSelected && <CheckOutlined aria-hidden style={{ color: PURPLE }} />}
                            </button>
                        );
                    })
                )}
            </Sheet>
        </>
    );
};
