import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Form, Button } from 'antd';
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

const openSheetByLabel = (label: RegExp) => {
    const triggers = screen.getAllByRole('button').filter(b => b.getAttribute('aria-haspopup') === 'dialog');
    const target = triggers.find(b => label.test(b.textContent ?? '')) ?? triggers[0];
    fireEvent.click(target);
};

// Guards Pitfall 1 (the #1 risk): a picker that doesn't read injected value /
// emit via injected onChange / keep a single root element silently drops out of
// the Form payload. strict:false/es5 won't catch it — this test is the only guard.

describe('SheetDatePicker Form binding (PICK-08)', () => {
    it('collects the single Dayjs value unchanged on submit', async () => {
        const onFinish = jest.fn();
        render(
            <Form onFinish={onFinish}>
                <Form.Item name="date" label="Ngày">
                    <SheetDatePicker placeholder="Chọn ngày" />
                </Form.Item>
                <Button htmlType="submit">Lưu</Button>
            </Form>
        );

        openSheetByLabel(/Chọn ngày/);
        const body = screen.getByTestId('sheet-date-body');
        const cell = within(body).getByTitle(dayjs().format('YYYY-MM-DD'));
        fireEvent.click(cell.querySelector('.ant-picker-cell-inner') ?? cell);

        fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));

        await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
        const values = onFinish.mock.calls[0][0];
        expect(dayjs.isDayjs(values.date)).toBe(true);
        expect(values.date.format('YYYY-MM-DD')).toBe(dayjs().format('YYYY-MM-DD'));
    });

    it('collects the single value via the "Hôm nay" quick-action unchanged', async () => {
        const onFinish = jest.fn();
        render(
            <Form onFinish={onFinish}>
                <Form.Item name="date" label="Ngày">
                    <SheetDatePicker placeholder="Chọn ngày" />
                </Form.Item>
                <Button htmlType="submit">Lưu</Button>
            </Form>
        );

        openSheetByLabel(/Chọn ngày/);
        fireEvent.click(screen.getByRole('button', { name: 'Hôm nay' }));
        fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));

        await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
        const values = onFinish.mock.calls[0][0];
        expect(dayjs.isDayjs(values.date)).toBe(true);
    });

    it('collects the [Dayjs, Dayjs] range tuple unchanged on submit (commit via "Xong")', async () => {
        const onFinish = jest.fn();
        // Seed an initial complete range so the committed tuple is deterministic
        // under jsdom (rc-picker cell-click active-index is non-deterministic in jsdom).
        render(
            <Form
                onFinish={onFinish}
                initialValues={{ range: [dayjs('2026-06-10'), dayjs('2026-06-20')] }}
            >
                <Form.Item name="range" label="Khoảng ngày">
                    <SheetDatePicker.RangePicker placeholder="Chọn khoảng ngày" />
                </Form.Item>
                <Button htmlType="submit">Lưu</Button>
            </Form>
        );

        openSheetByLabel(/Chọn khoảng ngày|10\/06\/2026/);
        fireEvent.click(screen.getByRole('button', { name: 'Xong' }));
        fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));

        await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
        const values = onFinish.mock.calls[0][0];
        expect(Array.isArray(values.range)).toBe(true);
        expect(dayjs.isDayjs(values.range[0])).toBe(true);
        expect(dayjs.isDayjs(values.range[1])).toBe(true);
        expect(values.range[0].format('YYYY-MM-DD')).toBe('2026-06-10');
        expect(values.range[1].format('YYYY-MM-DD')).toBe('2026-06-20');
    });

    it('forwards the Form-injected id to the trigger (Form.Item child-clone, D-02)', () => {
        render(
            <Form>
                <Form.Item name="date" label="Ngày">
                    <SheetDatePicker placeholder="Chọn ngày" />
                </Form.Item>
            </Form>
        );
        const trigger = screen.getAllByRole('button').find(b => b.getAttribute('aria-haspopup') === 'dialog')!;
        expect(trigger).toHaveAttribute('id', 'date');
    });
});
