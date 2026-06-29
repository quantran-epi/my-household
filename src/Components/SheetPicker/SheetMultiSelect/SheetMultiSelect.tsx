import React from 'react';
import { Checkbox, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Sheet, SheetActions } from '@components/Sheet';
import { useSheetPickerField, SheetFieldStatus } from '../shared/useSheetPickerField';
import { SheetTrigger } from '../shared/SheetTrigger';
import { getTriggerSummary } from '../shared/optionLabel';
import { normalizeDiacritics } from '../shared/normalizeDiacritics';

// SheetMultiSelect (PICK-03/04, D-06): checkbox rows, the sheet STAYS OPEN and edits a local
// draft seeded from `value` on each open. "Xong (N)" commits the draft via onChange + dismisses;
// "Hủy" (or drag/backdrop dismiss) reverts by discarding the draft. While the draft is dirty the
// host Sheet is maskClosable={false} so an accidental drag-dismiss springs back instead of losing
// edits (Phase 7 D-04). Controlled and AntD-Form-bindable (PICK-08) — single root element so
// Form.Item's child-clone binds value/onChange/id/status.

const PURPLE = '#7436dc';
const SEARCH_THRESHOLD = 8;

export type SheetMultiSelectOption = {
    value: React.Key;
    label?: React.ReactNode;
    disabled?: boolean;
};

export type SheetMultiSelectProps = {
    value?: any[];
    onChange?: (value: any) => void;
    options?: SheetMultiSelectOption[];
    showSearch?: boolean;
    allowClear?: boolean;
    placeholder?: string;
    disabled?: boolean;
    // Injected by Form.Item child-clone (D-02).
    id?: string;
    status?: SheetFieldStatus;
    'data-testid'?: string;
};

const summaryStripStyle: React.CSSProperties = {
    padding: '8px 16px',
    margin: '0 -16px 8px',
    background: '#f8fafc',
    color: '#64748b',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: '20px',
};

const searchWrapStyle: React.CSSProperties = {
    margin: '0 0 12px',
};

const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    minHeight: 44,
    padding: '11px 16px',
    margin: '0 -16px',
    borderTop: '1px solid #f0f0f0',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: '22px',
};

const emptyStyle: React.CSSProperties = {
    padding: '24px 16px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
};

const primaryButtonStyle: React.CSSProperties = {
    minHeight: 44,
    padding: '0 16px',
    border: 'none',
    borderRadius: 6,
    background: PURPLE,
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
    minHeight: 44,
    padding: '0 16px',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    background: '#fff',
    color: 'rgba(0,0,0,0.88)',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
};

const optionKey = (value: React.Key) => String(value);

const optionMatchesQuery = (option: SheetMultiSelectOption, query: string): boolean => {
    if (!query) return true;
    const haystack = typeof option.label === 'string' ? option.label : String(option.value ?? '');
    return normalizeDiacritics(haystack).includes(query);
};

export const SheetMultiSelect: React.FunctionComponent<SheetMultiSelectProps> = ({
    value,
    onChange,
    options = [],
    showSearch,
    allowClear,
    placeholder,
    disabled,
    id,
    status,
    'data-testid': testId,
}) => {
    const field = useSheetPickerField<any[]>({ value, onChange, id, status });
    const [query, setQuery] = React.useState('');

    const open = field.open;

    // Reset the search query whenever the sheet opens so a stale filter never
    // hides rows on the next open.
    React.useEffect(() => {
        if (open) setQuery('');
    }, [open]);

    const draftKeys = React.useMemo(
        () => new Set(field.draft.map(optionKey)),
        [field.draft],
    );

    const toggle = (optionValue: React.Key) => {
        const key = optionKey(optionValue);
        field.setDraft(prev => {
            const exists = prev.some(item => optionKey(item) === key);
            return exists
                ? prev.filter(item => optionKey(item) !== key)
                : [...prev, optionValue];
        });
    };

    const showSearchField = showSearch || options.length >= SEARCH_THRESHOLD;
    const normalizedQuery = normalizeDiacritics(query.trim());
    const visibleOptions = showSearchField
        ? options.filter(option => optionMatchesQuery(option, normalizedQuery))
        : options;

    const draftCount = field.draft.length;
    const doneLabel = draftCount > 0 ? `Xong (${draftCount})` : 'Xong';

    const summary = getTriggerSummary({ value, options, mode: 'multiple' });

    return (
        <React.Fragment>
            <SheetTrigger
                id={field.id}
                status={field.status}
                disabled={disabled}
                placeholder={placeholder ?? 'Chọn'}
                summary={summary}
                allowClear={allowClear}
                onClear={() => onChange?.(undefined)}
                onOpen={() => field.setOpen(true)}
            />
            {open && (
                <Sheet
                    open
                    onClose={field.cancel}
                    title={placeholder ?? 'Chọn'}
                    maskClosable={!field.dirty}
                    data-testid={testId ?? 'sheet-multiselect'}
                >
                    {/* Reflects dirty state for tests/automation; maskClosable above is the
                        load-bearing drag-protection (Phase 7 D-04). */}
                    <span
                        data-testid="sheet-multiselect-dirty"
                        data-dirty={field.dirty ? 'true' : 'false'}
                        style={{ display: 'none' }}
                    />
                    {draftCount > 0 && (
                        <div style={summaryStripStyle}>Đã chọn ({draftCount})</div>
                    )}
                    {showSearchField && (
                        <div style={searchWrapStyle}>
                            <Input
                                value={query}
                                onChange={event => setQuery(event.target.value)}
                                placeholder="Tìm kiếm"
                                prefix={<SearchOutlined />}
                                allowClear
                                style={{ fontSize: 16 }}
                            />
                        </div>
                    )}
                    {options.length === 0 ? (
                        <div style={emptyStyle}>
                            <div style={{ fontWeight: 600, color: '#334155' }}>Chưa có lựa chọn</div>
                            <div>Danh sách đang trống</div>
                        </div>
                    ) : visibleOptions.length === 0 ? (
                        <div style={emptyStyle}>
                            <div style={{ fontWeight: 600, color: '#334155' }}>Không tìm thấy</div>
                            <div>Thử từ khóa khác</div>
                        </div>
                    ) : (
                        visibleOptions.map(option => {
                            const checked = draftKeys.has(optionKey(option.value));
                            return (
                                <label
                                    key={optionKey(option.value)}
                                    style={{
                                        ...rowStyle,
                                        cursor: option.disabled ? 'not-allowed' : 'pointer',
                                        color: checked ? PURPLE : rowStyle.color,
                                    }}
                                >
                                    <Checkbox
                                        checked={checked}
                                        disabled={option.disabled}
                                        onChange={() => toggle(option.value)}
                                        aria-label={typeof option.label === 'string' ? option.label : undefined}
                                    />
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                        {option.label ?? String(option.value)}
                                    </span>
                                </label>
                            );
                        })
                    )}
                    <SheetActions style={{ marginTop: 16 }}>
                        <button type="button" onClick={field.cancel} style={secondaryButtonStyle}>
                            Hủy
                        </button>
                        <button type="button" onClick={field.commit} style={primaryButtonStyle}>
                            {doneLabel}
                        </button>
                    </SheetActions>
                </Sheet>
            )}
        </React.Fragment>
    );
};
