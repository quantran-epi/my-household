import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import dayjs from 'dayjs';
import { SheetDatePicker } from './SheetDatePicker';

// jsdom lacks matchMedia/ResizeObserver that rc-picker/antd touch. Polyfill before render.
beforeAll(() => {
    if (!window.matchMedia) {
        window.matchMedia = ((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        })) as any;
    }
    if (!(window as any).ResizeObserver) {
        (window as any).ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    }
});

const openSheet = () => {
    // The trigger is the only button rendered before the sheet opens. Its
    // accessible name is the placeholder OR the formatted value, so target it
    // by aria-haspopup rather than by text.
    const triggers = screen.getAllByRole('button').filter(b => b.getAttribute('aria-haspopup') === 'dialog');
    fireEvent.click(triggers[0]);
};

describe('SheetDatePicker (single date)', () => {
    it('renders the embedded AntD panel INSIDE the sheet body (de-floated, not portaled to body top-left)', () => {
        render(<SheetDatePicker placeholder="Chọn ngày" />);
        openSheet();

        const body = screen.getByTestId('sheet-date-body');
        // The rc-picker panel cells live inside the sheet body element — proving
        // getPopupContainer mounted the panel inline rather than at document.body.
        const cells = body.querySelectorAll('.ant-picker-cell');
        expect(cells.length).toBeGreaterThan(0);
    });

    it('picking a day calls onChange with a Dayjs and closes the sheet', () => {
        const onChange = jest.fn();
        render(<SheetDatePicker placeholder="Chọn ngày" value={dayjs('2026-06-15')} onChange={onChange} />);
        openSheet();

        const body = screen.getByTestId('sheet-date-body');
        const cell = within(body).getByTitle('2026-06-20');
        fireEvent.click(cell.querySelector('.ant-picker-cell-inner') ?? cell);

        expect(onChange).toHaveBeenCalledTimes(1);
        const emitted = onChange.mock.calls[0][0];
        expect(dayjs.isDayjs(emitted)).toBe(true);
        expect(emitted.format('YYYY-MM-DD')).toBe('2026-06-20');
        // Sheet auto-dismisses on single-select.
        expect(screen.queryByTestId('sheet-date-body')).not.toBeInTheDocument();
    });

    it('disabledDate marks out-of-range days disabled', () => {
        const disabledDate = (d: ReturnType<typeof dayjs>) => d.isBefore(dayjs('2026-06-10'), 'day');
        render(<SheetDatePicker placeholder="Chọn ngày" value={dayjs('2026-06-15')} disabledDate={disabledDate} />);
        openSheet();

        const body = screen.getByTestId('sheet-date-body');
        const disabledCell = within(body).getByTitle('2026-06-05');
        expect(disabledCell).toHaveClass('ant-picker-cell-disabled');
    });

    it('"Hôm nay" commits today as a Dayjs and closes', () => {
        const onChange = jest.fn();
        render(<SheetDatePicker placeholder="Chọn ngày" onChange={onChange} />);
        openSheet();

        fireEvent.click(screen.getByRole('button', { name: 'Hôm nay' }));

        expect(onChange).toHaveBeenCalledTimes(1);
        const emitted = onChange.mock.calls[0][0];
        expect(dayjs.isDayjs(emitted)).toBe(true);
        expect(emitted.format('YYYY-MM-DD')).toBe(dayjs().format('YYYY-MM-DD'));
        expect(screen.queryByTestId('sheet-date-body')).not.toBeInTheDocument();
    });

    it('"Hôm nay" lands on the nearest allowed day when today is disabled', () => {
        const onChange = jest.fn();
        // Disable today and everything before tomorrow → nearest allowed is tomorrow.
        const disabledDate = (d: ReturnType<typeof dayjs>) => d.isBefore(dayjs().add(1, 'day'), 'day');
        render(<SheetDatePicker placeholder="Chọn ngày" onChange={onChange} disabledDate={disabledDate} />);
        openSheet();

        fireEvent.click(screen.getByRole('button', { name: 'Hôm nay' }));

        const emitted = onChange.mock.calls[0][0];
        expect(dayjs.isDayjs(emitted)).toBe(true);
        expect(disabledDate(emitted)).toBe(false);
        expect(emitted.format('YYYY-MM-DD')).toBe(dayjs().add(1, 'day').format('YYYY-MM-DD'));
    });

    it('the trigger shows the formatted summary of the committed value', () => {
        render(<SheetDatePicker placeholder="Chọn ngày" value={dayjs('2026-06-15')} />);
        expect(screen.getByText('15/06/2026')).toBeInTheDocument();
    });
});
