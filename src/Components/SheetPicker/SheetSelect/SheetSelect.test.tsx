import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SheetSelect } from './SheetSelect';

const shortOptions = [
    { value: 'a', label: 'Cà chua' },
    { value: 'b', label: 'Đỏ' },
    { value: 'c', label: 'Rau muống' },
];

// >= 8 to trip the search threshold
const longOptions = [
    { value: 'a', label: 'Cà chua' },
    { value: 'b', label: 'Đỏ' },
    { value: 'c', label: 'Rau muống' },
    { value: 'd', label: 'Thịt bò' },
    { value: 'e', label: 'Thịt gà' },
    { value: 'f', label: 'Cá thu' },
    { value: 'g', label: 'Trứng gà' },
    { value: 'h', label: 'Đậu phụ' },
];

const openSheet = () => {
    // The closed trigger carries aria-haspopup="dialog"; with allowClear+value the
    // trigger also renders a nested clear button, so target the dialog opener.
    const trigger = screen.getAllByRole('button').find(el => el.getAttribute('aria-haspopup') === 'dialog');
    fireEvent.click(trigger!);
};

test('tapping an option row commits the value once and dismisses the sheet', () => {
    const onChange = jest.fn();
    render(<SheetSelect options={shortOptions} onChange={onChange} placeholder="Chọn" />);

    openSheet();
    const option = screen.getByRole('option', { name: 'Rau muống' });
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('c');
    // Sheet dismissed — the option rows are unmounted.
    expect(screen.queryByRole('option', { name: 'Rau muống' })).toBeNull();
});

test('the selected row carries aria-selected and a checkmark', () => {
    render(<SheetSelect options={shortOptions} value="b" onChange={jest.fn()} placeholder="Chọn" />);

    openSheet();
    const selected = screen.getByRole('option', { name: 'Đỏ' });
    expect(selected).toHaveAttribute('aria-selected', 'true');
    // CheckOutlined renders an svg inside the selected row.
    expect(selected.querySelector('svg')).not.toBeNull();

    const unselected = screen.getByRole('option', { name: 'Cà chua' });
    expect(unselected).toHaveAttribute('aria-selected', 'false');
    expect(unselected.querySelector('svg')).toBeNull();
});

test('search field renders for long lists and filters diacritic-insensitively', () => {
    render(<SheetSelect options={longOptions} onChange={jest.fn()} placeholder="Chọn" />);

    openSheet();
    const search = screen.getByPlaceholderText('Tìm kiếm');
    expect(search).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'do' } });
    expect(screen.getByRole('option', { name: 'Đỏ' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Rau muống' })).toBeNull();
});

test('search field is absent for short lists without showSearch', () => {
    render(<SheetSelect options={shortOptions} onChange={jest.fn()} placeholder="Chọn" />);

    openSheet();
    expect(screen.queryByPlaceholderText('Tìm kiếm')).toBeNull();
});

test('showSearch forces the search field even for short lists', () => {
    render(<SheetSelect options={shortOptions} showSearch onChange={jest.fn()} placeholder="Chọn" />);

    openSheet();
    expect(screen.getByPlaceholderText('Tìm kiếm')).toBeInTheDocument();
});

test('empty filter result renders the not-found copy', () => {
    render(<SheetSelect options={longOptions} onChange={jest.fn()} placeholder="Chọn" />);

    openSheet();
    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm'), { target: { value: 'zzz' } });
    expect(screen.getByText('Không tìm thấy')).toBeInTheDocument();
});

test('no-options-at-all renders the empty list copy', () => {
    render(<SheetSelect options={[]} onChange={jest.fn()} placeholder="Chọn" />);

    openSheet();
    expect(screen.getByText('Chưa có lựa chọn')).toBeInTheDocument();
});

test('allowClear renders a leading "Bỏ chọn" row that clears and dismisses', () => {
    const onChange = jest.fn();
    render(<SheetSelect options={shortOptions} value="a" allowClear onChange={onChange} placeholder="Chọn" />);

    openSheet();
    const clearRow = screen.getByRole('option', { name: 'Bỏ chọn' });
    fireEvent.click(clearRow);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(screen.queryByRole('option', { name: 'Cà chua' })).toBeNull();
});

test('the closed trigger shows the selected option label as its summary', () => {
    render(<SheetSelect options={shortOptions} value="c" onChange={jest.fn()} placeholder="Chọn" />);
    const trigger = screen.getByRole('button');
    expect(within(trigger).getByText('Rau muống')).toBeInTheDocument();
});

test('a disabled trigger does not open the sheet', () => {
    render(<SheetSelect options={shortOptions} disabled onChange={jest.fn()} placeholder="Chọn" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('option')).toBeNull();
});
