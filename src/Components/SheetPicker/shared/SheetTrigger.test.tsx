import React from 'react';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SheetTrigger } from './SheetTrigger';
import { useSheetPickerField } from './useSheetPickerField';

describe('SheetTrigger', () => {
    it('forwards the injected id to its root button', () => {
        render(<SheetTrigger id="field_color" summary="Đỏ" onOpen={() => {}} />);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('id', 'field_color');
    });

    it('sets aria-invalid when status==="error"', () => {
        render(<SheetTrigger status="error" summary="Đỏ" />);
        expect(screen.getByRole('button', { name: /Đỏ/ })).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid when status is not error', () => {
        render(<SheetTrigger status="" summary="Đỏ" />);
        expect(screen.getByRole('button', { name: /Đỏ/ })).not.toHaveAttribute('aria-invalid');
    });

    it('renders the placeholder when there is no summary', () => {
        render(<SheetTrigger placeholder="Chọn" onOpen={() => {}} />);
        expect(screen.getByText('Chọn')).toBeInTheDocument();
    });

    it('renders the summary when a value exists', () => {
        render(<SheetTrigger summary="Xanh lá" placeholder="Chọn" />);
        expect(screen.getByText('Xanh lá')).toBeInTheDocument();
        expect(screen.queryByText('Chọn')).not.toBeInTheDocument();
    });

    it('opens the sheet on click', () => {
        const onOpen = jest.fn();
        render(<SheetTrigger summary="Đỏ" onOpen={onOpen} />);
        fireEvent.click(screen.getByRole('button', { name: /Đỏ/ }));
        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('clicking the clear × fires onClear and does NOT open the sheet', () => {
        const onOpen = jest.fn();
        const onClear = jest.fn();
        render(<SheetTrigger summary="Đỏ" allowClear onClear={onClear} onOpen={onOpen} />);
        fireEvent.click(screen.getByRole('button', { name: 'Bỏ chọn' }));
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onOpen).not.toHaveBeenCalled();
    });

    it('does not render the clear × when there is no value', () => {
        render(<SheetTrigger placeholder="Chọn" allowClear onClear={() => {}} />);
        expect(screen.queryByRole('button', { name: 'Bỏ chọn' })).not.toBeInTheDocument();
    });

    it('disabled trigger does not fire onOpen', () => {
        const onOpen = jest.fn();
        render(<SheetTrigger summary="Đỏ" disabled onOpen={onOpen} />);
        fireEvent.click(screen.getByRole('button', { name: /Đỏ/ }));
        expect(onOpen).not.toHaveBeenCalled();
    });
});

describe('useSheetPickerField', () => {
    it('seeds draft from value and re-seeds on each open transition', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useSheetPickerField({ value }),
            { initialProps: { value: ['a', 'b'] as string[] } }
        );
        expect(result.current.draft).toEqual(['a', 'b']);

        // Open, then the value changes upstream; re-open re-seeds from the new value.
        act(() => result.current.setOpen(true));
        rerender({ value: ['c'] });
        act(() => result.current.setOpen(false));
        act(() => result.current.setOpen(true));
        expect(result.current.draft).toEqual(['c']);
    });

    it('dirty is false right after open, true after an edit, false again when draft matches value', () => {
        const { result } = renderHook(() => useSheetPickerField({ value: ['a'] }));
        act(() => result.current.setOpen(true));
        expect(result.current.dirty).toBe(false);

        act(() => result.current.setDraft(['a', 'b']));
        expect(result.current.dirty).toBe(true);

        act(() => result.current.setDraft(['a']));
        expect(result.current.dirty).toBe(false);
    });

    it('commit calls onChange with the draft and closes', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() => useSheetPickerField({ value: ['a'], onChange }));
        act(() => result.current.setOpen(true));
        act(() => result.current.setDraft(['a', 'b']));
        act(() => result.current.commit());
        expect(onChange).toHaveBeenCalledWith(['a', 'b']);
        expect(result.current.open).toBe(false);
    });

    it('cancel closes without calling onChange', () => {
        const onChange = jest.fn();
        const { result } = renderHook(() => useSheetPickerField({ value: ['a'], onChange }));
        act(() => result.current.setOpen(true));
        act(() => result.current.setDraft(['a', 'b']));
        act(() => result.current.cancel());
        expect(onChange).not.toHaveBeenCalled();
        expect(result.current.open).toBe(false);
    });

    it('normalizes status default to empty string and forwards id', () => {
        const { result } = renderHook(() => useSheetPickerField({ id: 'f1' }));
        expect(result.current.status).toBe('');
        expect(result.current.id).toBe('f1');
    });
});
