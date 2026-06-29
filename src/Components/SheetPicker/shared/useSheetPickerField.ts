import React from 'react';

// Normalizes the props AntD Form.Item injects when it clones its child (value/onChange/id/status,
// D-02) and owns the open + draft state machine the multi-select/range pickers compose on
// (RESEARCH §Pattern 1, §Pattern 3). The draft is seeded from `value` on EACH open transition and
// never persists across opens — an accidental dismiss must not leak a stale edit.
//
// IMPORTANT: this hook never computes or passes a `zIndex`. Phase 7's useResolvedOverlayZIndex
// token-stacks Sheets automatically; passing an explicit zIndex breaks nested stacking
// (RESEARCH anti-pattern).

export type SheetFieldStatus = 'error' | 'warning' | '';

type UseSheetPickerFieldArgs<V> = {
    value?: V;
    onChange?: (value: any) => void;
    id?: string;
    status?: SheetFieldStatus;
};

const toArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null) return [];
    return [value];
};

const sameSet = (a: any[], b: any[]): boolean => {
    if (a.length !== b.length) return false;
    const bSet = new Set(b.map(item => String(item)));
    return a.every(item => bSet.has(String(item)));
};

export type SheetPickerField<V> = {
    id?: string;
    status: SheetFieldStatus;
    open: boolean;
    setOpen: (open: boolean) => void;
    draft: any[];
    setDraft: React.Dispatch<React.SetStateAction<any[]>>;
    dirty: boolean;
    commit: () => void;
    cancel: () => void;
};

export const useSheetPickerField = <V = any>({ value, onChange, id, status }: UseSheetPickerFieldArgs<V>): SheetPickerField<V> => {
    const [open, setOpen] = React.useState(false);
    const [draft, setDraft] = React.useState<any[]>(() => toArray(value));

    // Re-seed the draft from the latest committed value on each open transition
    // (RESEARCH §Pattern 3 — never persist a draft across opens).
    React.useEffect(() => {
        if (open) setDraft(toArray(value));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const dirty = !sameSet(draft, toArray(value));

    const commit = React.useCallback(() => {
        onChange?.(draft);
        setOpen(false);
    }, [onChange, draft]);

    const cancel = React.useCallback(() => {
        setOpen(false);
    }, []);

    return React.useMemo(() => ({
        id,
        status: status ?? '',
        open,
        setOpen,
        draft,
        setDraft,
        dirty,
        commit,
        cancel,
    }), [id, status, open, draft, dirty, commit, cancel]);
};
