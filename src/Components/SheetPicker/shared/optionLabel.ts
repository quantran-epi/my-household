import React from 'react';

// Label-resolution helpers lifted near-verbatim from src/Components/Form/Select/Select.tsx
// (lines 50-111) so the closed-trigger summary (D-04) reads identically to today's AntD
// Select. `any` in these signatures is intentional and matches Select.tsx — the project is
// strict:false / es5 and these mirror the existing shapes exactly.

export type SelectedOptionDisplay = {
    value: React.Key;
    label: React.ReactNode;
};

type SelectMode = 'multiple' | 'tags' | undefined;

type SelectedOptionsResolveProps = {
    value?: any;
    defaultValue?: any;
    options?: any[];
    children?: React.ReactNode;
};

const _renderOptionLabel = (option: any): React.ReactNode => {
    if (option?.label !== undefined && option.label !== null) return option.label;
    if (option?.value !== undefined && option.value !== null) return String(option.value);
    return '';
};

const _isMultiSelectMode = (mode: SelectMode) => mode === 'multiple' || mode === 'tags';

const _getOptionValue = (value: any) => {
    if (value && typeof value === 'object' && 'value' in value) return value.value;
    return value;
};

const _normalizeSelectedValues = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null) return [];
    return [value];
};

const _optionValueKey = (value: any) => String(_getOptionValue(value));

const _flattenOptions = (options: any[] = []): any[] => {
    return options.flatMap(option => Array.isArray(option?.options) ? _flattenOptions(option.options) : [option]);
};

const _flattenChildOptions = (children: React.ReactNode): any[] => {
    const items: any[] = [];
    React.Children.forEach(children, child => {
        if (!React.isValidElement(child)) return;
        const props = child.props as any;
        if (props?.options) {
            items.push(..._flattenOptions(props.options));
            return;
        }
        if (props?.children && props?.value === undefined) {
            items.push(..._flattenChildOptions(props.children));
            return;
        }
        items.push({
            value: props?.value,
            label: props?.label ?? props?.children,
        });
    });
    return items;
};

const _getSelectedOptionDisplays = ({ value, defaultValue, options, children }: SelectedOptionsResolveProps): SelectedOptionDisplay[] => {
    const selectedValues = _normalizeSelectedValues(value ?? defaultValue);
    if (selectedValues.length === 0) return [];

    const optionLookup = new Map<string, any>();
    _flattenOptions(options as any[]).forEach(option => optionLookup.set(_optionValueKey(option?.value), option));
    _flattenChildOptions(children).forEach(option => optionLookup.set(_optionValueKey(option?.value), option));

    return selectedValues.map(selectedValue => {
        const rawValue = _getOptionValue(selectedValue);
        const option = optionLookup.get(_optionValueKey(rawValue));
        const selectedLabel = selectedValue && typeof selectedValue === 'object' && 'label' in selectedValue ? selectedValue.label : undefined;
        const label = (selectedLabel ?? _renderOptionLabel(option)) || String(rawValue ?? '');
        return { value: _optionValueKey(rawValue), label };
    }).filter(item => item.label !== '');
};

// Re-export under the public name the pickers consume.
export const getSelectedOptionDisplays = _getSelectedOptionDisplays;

type TriggerSummaryProps = {
    value?: any;
    options?: any[];
    mode?: SelectMode;
    children?: React.ReactNode;
};

// Closed-trigger summary (D-04): single -> the matching option's label; multi -> the first
// label with a "+N" suffix when more than one is selected, falling back to "N đã chọn" when
// no labels resolve; empty/undefined -> undefined (the caller renders the placeholder).
export const getTriggerSummary = ({ value, options, mode, children }: TriggerSummaryProps): React.ReactNode | undefined => {
    const displays = getSelectedOptionDisplays({ value, options, children });

    if (!_isMultiSelectMode(mode)) {
        return displays[0]?.label;
    }

    const selectedCount = _normalizeSelectedValues(value).length;
    if (selectedCount === 0) return undefined;

    const firstLabel = displays[0]?.label;
    if (firstLabel === undefined || firstLabel === null || firstLabel === '') {
        // Labels did not resolve (e.g. options not yet loaded) — fall back to the count form.
        return `${selectedCount} đã chọn`;
    }

    if (selectedCount > 1) {
        // Avoid JSX so this stays a valid .ts module (per plan file list).
        return React.createElement(React.Fragment, null, firstLabel, ` +${selectedCount - 1}`);
    }
    return firstLabel;
};
