import React from 'react';
import { DatePicker as AntDatePicker, Button } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Sheet, SheetActions } from '@components/Sheet';
import { SheetTrigger } from '../shared/SheetTrigger';
import { useSheetPickerField, SheetFieldStatus } from '../shared/useSheetPickerField';

// SheetDatePicker (PICK-05/06, D-08/D-09).
//
// De-floating recipe (RESEARCH Open Q1 / A1 / Pitfall 3): host AntD's OWN calendar
// panel INSIDE the sheet body instead of letting it float on the global
// `components.DatePicker.zIndexPopup: 4200` popup (set in App.tsx). The recipe is:
//   1. force `open` to the sheet's open state so the panel is always visible,
//   2. `getPopupContainer={() => bodyEl}` mounts the panel inside the sheet body —
//      we back `bodyEl` with a CALLBACK-REF + state (not a useRef) and only render
//      the picker once `bodyEl` exists, so AntD never reads a null container and
//      portals to document.body (the null-ref timing trap),
//   3. `popupStyle={{ position:'static', zIndex:'auto', boxShadow:'none' }}` plus a
//      scoped `popupClassName="sheet-date-popup"` + an injected <style> block fully
//      neutralize the absolute/z-index:4200 positioning so the panel flows inline.
// The value stays a `Dayjs` end to end — NEVER converted to moment (Pitfall 5).

const PURPLE = '#7436dc';

export type SheetDatePickerPicker = 'date' | 'week' | 'month' | 'quarter' | 'year';

export type SheetDatePickerProps = {
    value?: Dayjs | null;
    onChange?: (value: Dayjs | null) => void;
    picker?: SheetDatePickerPicker;
    showTime?: boolean | object;
    disabledDate?: (current: Dayjs) => boolean;
    format?: string;
    placeholder?: string;
    disabled?: boolean;
    allowClear?: boolean;
    // Injected by AntD Form.Item child-clone (D-02).
    id?: string;
    status?: SheetFieldStatus;
};

// Scoped CSS that de-floats the embedded panel: reverse the absolute/fixed
// positioning and the z-index:4200 the global theme assigns to the dropdown so
// it renders inline in the sheet body (Pitfall 3). Lives as injected CSS because
// these target rc-picker's own `.ant-picker-dropdown` node, which we don't own.
const deFloatStyles = (
    <style>{`
.sheet-date-popup.ant-picker-dropdown,
.sheet-date-popup .ant-picker-dropdown {
  position: static !important;
  z-index: auto !important;
  box-shadow: none !important;
  inset: auto !important;
  transform: none !important;
}
.sheet-date-popup .ant-picker-dropdown-range { padding: 0 !important; }
`}</style>
);

const defaultFormat = (picker?: SheetDatePickerPicker, showTime?: boolean | object): string => {
    if (showTime) return 'DD/MM/YYYY HH:mm';
    switch (picker) {
        case 'month': return 'MM/YYYY';
        case 'quarter': return '[Q]Q YYYY';
        case 'year': return 'YYYY';
        case 'week': return 'YYYY-wo';
        default: return 'DD/MM/YYYY';
    }
};

// "Hôm nay" (D-09): today, clamped to min/max. When today itself is disabled,
// search outward for the nearest allowed day so the quick-action always lands
// on a selectable date rather than committing a disabled value.
const resolveToday = (disabledDate?: (current: Dayjs) => boolean): Dayjs => {
    const today = dayjs();
    if (!disabledDate || !disabledDate(today)) return today;
    for (let i = 1; i <= 366; i += 1) {
        const forward = today.add(i, 'day');
        if (!disabledDate(forward)) return forward;
        const backward = today.subtract(i, 'day');
        if (!disabledDate(backward)) return backward;
    }
    return today;
};

const SheetDatePickerBase: React.FunctionComponent<SheetDatePickerProps> = ({
    value,
    onChange,
    picker,
    showTime,
    disabledDate,
    format,
    placeholder,
    disabled,
    allowClear = true,
    id,
    status,
}) => {
    const field = useSheetPickerField<Dayjs>({ value: value ?? undefined, onChange, id, status });
    const { open, setOpen } = field;

    // Callback-ref + state so the panel container exists BEFORE the embedded
    // DatePicker mounts (see de-floating note). Reset when the sheet closes.
    const [bodyEl, setBodyEl] = React.useState<HTMLDivElement | null>(null);

    // showTime needs a confirm step ("Xong"); plain date commits on tap. The
    // single draft holds the in-progress selection for the showTime confirm flow.
    const [singleDraft, setSingleDraft] = React.useState<Dayjs | null>(value ?? null);
    React.useEffect(() => {
        if (open) setSingleDraft(value ?? null);
    }, [open, value]);

    const fmt = format ?? defaultFormat(picker, showTime);
    const summary = value ? value.format(fmt) : undefined;
    const title = placeholder ?? 'Chọn ngày';

    const commit = (next: Dayjs | null) => {
        onChange?.(next);
        setOpen(false);
    };

    const handlePanelChange = (next: Dayjs | null) => {
        if (showTime) {
            // Wait for the unified "Xong" confirm (sheet consistency over AntD's OK footer).
            setSingleDraft(next);
        } else {
            // Single date/datetime: commit on tap → auto-dismiss (D-05 single-select feel).
            commit(next);
        }
    };

    const handleToday = () => {
        commit(resolveToday(disabledDate));
    };

    return (
        <>
            <SheetTrigger
                id={field.id}
                status={field.status}
                disabled={disabled}
                placeholder={title}
                summary={summary}
                allowClear={allowClear}
                onClear={() => onChange?.(null)}
                onOpen={() => setOpen(true)}
                glyph={<CalendarOutlined />}
            />
            <Sheet open={open} onClose={() => setOpen(false)} title={title}>
                {deFloatStyles}
                <div data-testid="sheet-date-body" ref={setBodyEl} style={{ minHeight: 0 }}>
                    <button
                        type="button"
                        onClick={handleToday}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            minHeight: 44,
                            marginBottom: 12,
                            border: `1px solid ${PURPLE}`,
                            borderRadius: 12,
                            background: '#fff',
                            color: PURPLE,
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Hôm nay
                    </button>
                    {bodyEl && (
                        <AntDatePicker
                            open={open}
                            value={showTime ? singleDraft : value ?? undefined}
                            onChange={handlePanelChange}
                            getPopupContainer={() => bodyEl}
                            popupClassName="sheet-date-popup"
                            popupStyle={{ position: 'static', zIndex: 'auto', boxShadow: 'none' }}
                            disabledDate={disabledDate}
                            showTime={showTime as any}
                            // For showTime, suppress AntD's inline OK footer so the panel
                            // fires onChange on each cell tap into singleDraft; the unified
                            // "Xong" then commits (sheet consistency over AntD's OK button).
                            needConfirm={showTime ? false : undefined}
                            picker={picker}
                            format={fmt}
                            inputReadOnly
                            allowClear={false}
                            style={{ width: '100%' }}
                        />
                    )}
                    {showTime && (
                        <SheetActions style={{ marginTop: 12 }}>
                            <Button onClick={() => setOpen(false)}>Hủy</Button>
                            <Button
                                type="primary"
                                disabled={!singleDraft}
                                onClick={() => commit(singleDraft)}
                            >
                                Xong
                            </Button>
                        </SheetActions>
                    )}
                </div>
            </Sheet>
        </>
    );
};

// --- RangePicker sub-export (D-09) ---------------------------------------
// Mirrors Form/DatePicker.tsx's Object.assign sub-export shape. Range drives a
// draft and commits ONLY on "Xong" via SheetActions so a half-picked range can
// never escape; "Hủy"/drag-dismiss reverts. Value stays a [Dayjs, Dayjs] tuple.

type RangeValue = [Dayjs | null, Dayjs | null] | null;

export type SheetRangePickerProps = {
    value?: RangeValue;
    onChange?: (value: RangeValue) => void;
    picker?: SheetDatePickerPicker;
    showTime?: boolean | object;
    disabledDate?: (current: Dayjs) => boolean;
    format?: string;
    placeholder?: string;
    disabled?: boolean;
    allowClear?: boolean;
    id?: string;
    status?: SheetFieldStatus;
};

const rangeComplete = (v: RangeValue): v is [Dayjs, Dayjs] =>
    !!v && !!v[0] && !!v[1];

const RangePicker: React.FunctionComponent<SheetRangePickerProps> = ({
    value,
    onChange,
    picker,
    showTime,
    disabledDate,
    format,
    placeholder,
    disabled,
    allowClear = true,
    id,
    status,
}) => {
    const [open, setOpen] = React.useState(false);
    const [bodyEl, setBodyEl] = React.useState<HTMLDivElement | null>(null);
    const [draft, setDraft] = React.useState<RangeValue>(value ?? null);

    // Re-seed the draft from the committed value on each open (never persist a
    // draft across opens — RESEARCH §Pattern 3).
    React.useEffect(() => {
        if (open) setDraft(value ?? null);
    }, [open, value]);

    const fmt = format ?? defaultFormat(picker, showTime);
    const fieldStatus: SheetFieldStatus = status ?? '';
    const title = placeholder ?? 'Chọn khoảng ngày';

    const summary = rangeComplete(value)
        ? `${value[0].format(fmt)} – ${value[1].format(fmt)}`
        : undefined;

    // dirty = a half/edited range that differs from the committed value. Drives
    // maskClosable so an accidental drag-dismiss springs back (Pitfall 2).
    const dirty = (() => {
        const a = value ?? null;
        const b = draft ?? null;
        const key = (v: RangeValue) => (v ? `${v[0]?.valueOf() ?? ''}|${v[1]?.valueOf() ?? ''}` : '');
        return key(a) !== key(b);
    })();

    const commit = () => {
        // Only commit a complete range; "Xong" stays disabled otherwise.
        if (!rangeComplete(draft)) return;
        onChange?.(draft);
        setOpen(false);
    };

    const cancel = () => {
        // Discard the draft, never call onChange.
        setOpen(false);
    };

    return (
        <>
            <SheetTrigger
                id={id}
                status={fieldStatus}
                disabled={disabled}
                placeholder={title}
                summary={summary}
                allowClear={allowClear}
                onClear={() => onChange?.(null)}
                onOpen={() => setOpen(true)}
                glyph={<CalendarOutlined />}
            />
            <Sheet open={open} onClose={cancel} title={title} maskClosable={!dirty}>
                {deFloatStyles}
                <div data-testid="sheet-range-body" ref={setBodyEl} style={{ minHeight: 0 }}>
                    {bodyEl && (
                        <AntDatePicker.RangePicker
                            open={open}
                            value={draft as any}
                            onChange={(next) => setDraft(next as RangeValue)}
                            getPopupContainer={() => bodyEl}
                            popupClassName="sheet-date-popup"
                            popupStyle={{ position: 'static', zIndex: 'auto', boxShadow: 'none' }}
                            disabledDate={disabledDate}
                            showTime={showTime as any}
                            picker={picker as any}
                            format={fmt}
                            inputReadOnly
                            allowClear={false}
                            style={{ width: '100%' }}
                        />
                    )}
                    <SheetActions style={{ marginTop: 12 }}>
                        <Button onClick={cancel}>Hủy</Button>
                        <Button type="primary" disabled={!rangeComplete(draft)} onClick={commit}>
                            Xong
                        </Button>
                    </SheetActions>
                </div>
            </Sheet>
        </>
    );
};

export const SheetDatePicker = Object.assign(SheetDatePickerBase, { RangePicker });
