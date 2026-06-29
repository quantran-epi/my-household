import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SheetMultiSelect } from './SheetMultiSelect';

const OPTIONS = [
    { value: 'a', label: 'Rau củ' },
    { value: 'b', label: 'Thịt cá' },
    { value: 'c', label: 'Gia vị' },
];

// A small controlled host so committing via "Xong" feeds the new value back as
// the picker's `value` (mirrors how Form.Item / a parent would re-render it).
const ControlledHost: React.FunctionComponent<{
    initial?: string[];
    onChange: (value: any) => void;
    allowClear?: boolean;
}> = ({ initial, onChange, allowClear }) => {
    const [value, setValue] = React.useState<string[] | undefined>(initial);
    return (
        <SheetMultiSelect
            value={value}
            options={OPTIONS}
            allowClear={allowClear}
            placeholder="Chọn nhóm"
            onChange={next => {
                setValue(next);
                onChange(next);
            }}
        />
    );
};

const openSheet = () => {
    // The closed trigger is the only button until the sheet opens.
    fireEvent.click(screen.getByRole('button'));
};

test('toggling checkbox rows does NOT call onChange while the sheet stays open', () => {
    const onChange = jest.fn();
    render(<ControlledHost onChange={onChange} />);

    openSheet();
    fireEvent.click(screen.getByLabelText('Rau củ'));
    fireEvent.click(screen.getByLabelText('Gia vị'));

    expect(onChange).not.toHaveBeenCalled();
    // Sheet still mounted (rows visible).
    expect(screen.getByLabelText('Thịt cá')).toBeInTheDocument();
});

test('the primary button label reflects the draft count', () => {
    render(<ControlledHost onChange={jest.fn()} />);

    openSheet();
    // Empty draft -> plain "Xong".
    expect(screen.getByRole('button', { name: 'Xong' })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Rau củ'));
    expect(screen.getByRole('button', { name: 'Xong (1)' })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Gia vị'));
    expect(screen.getByRole('button', { name: 'Xong (2)' })).toBeInTheDocument();
});

test('clicking "Xong (N)" calls onChange once with the full draft array and closes', () => {
    const onChange = jest.fn();
    render(<ControlledHost onChange={onChange} />);

    openSheet();
    fireEvent.click(screen.getByLabelText('Rau củ'));
    fireEvent.click(screen.getByLabelText('Gia vị'));
    fireEvent.click(screen.getByRole('button', { name: 'Xong (2)' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['a', 'c']);
    // Sheet closed -> rows gone.
    expect(screen.queryByLabelText('Rau củ')).toBeNull();
});

test('clicking "Hủy" closes without onChange and reopening re-seeds the original value', () => {
    const onChange = jest.fn();
    render(<ControlledHost initial={['b']} onChange={onChange} />);

    openSheet();
    // Toggle some edits into the draft.
    fireEvent.click(screen.getByLabelText('Rau củ'));
    fireEvent.click(screen.getByLabelText('Gia vị'));
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));

    expect(onChange).not.toHaveBeenCalled();

    // Reopen — the draft must be discarded and re-seeded from value (['b']).
    openSheet();
    expect((screen.getByLabelText('Thịt cá') as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText('Rau củ') as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText('Gia vị') as HTMLInputElement).checked).toBe(false);
});

test('the Sheet receives maskClosable=false while the draft is dirty', () => {
    render(<ControlledHost onChange={jest.fn()} />);

    openSheet();
    // Clean draft -> backdrop click (maskClosable=true) dismisses.
    const sheet = screen.getByTestId('sheet-multiselect');
    expect(sheet).toBeInTheDocument();

    // Make the draft dirty, then prove a backdrop mousedown does NOT close.
    fireEvent.click(screen.getByLabelText('Rau củ'));
    // The overlay backdrop is the dialog's parent; mousedown on it would close
    // only when maskClosable. Assert via the reflected data attribute.
    expect(screen.getByTestId('sheet-multiselect-dirty')).toHaveAttribute('data-dirty', 'true');
});

test('the closed trigger shows the multi summary', () => {
    render(<ControlledHost initial={['a', 'b']} onChange={jest.fn()} />);

    // First label + "+N" when more than one selected.
    expect(screen.getByText(/Rau củ/)).toBeInTheDocument();
    expect(screen.getByText(/\+1/)).toBeInTheDocument();
});

test('clear affordance resets the value via onChange(undefined)', () => {
    const onChange = jest.fn();
    render(<ControlledHost initial={['a']} onChange={onChange} allowClear />);

    fireEvent.click(screen.getByLabelText('Bỏ chọn'));
    expect(onChange).toHaveBeenCalledWith(undefined);
});
