import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Form, Button } from 'antd';
import { SheetMultiSelect } from './SheetMultiSelect';

// jsdom has no matchMedia; AntD's Grid (pulled in by Form/Button) registers a
// responsiveObserver against it on mount. Polyfill a no-op MediaQueryList so the
// real AntD <Form> mounts under jsdom (test-env gap, not a component concern).
beforeAll(() => {
    if (!window.matchMedia) {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: (query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: () => {},
                removeListener: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => false,
            }),
        });
    }
});

const OPTIONS = [
    { value: 'a', label: 'Rau củ' },
    { value: 'b', label: 'Thịt cá' },
    { value: 'c', label: 'Gia vị' },
];

// Real AntD Form host: SheetMultiSelect is the Form.Item child, so Form.Item
// clones it with the injected value/onChange/id/status (PICK-08, D-02/D-12).
const FormHost: React.FunctionComponent<{ onFinish: (values: any) => void }> = ({ onFinish }) => (
    <Form onFinish={onFinish} initialValues={{ tags: ['a'] }}>
        <Form.Item name="tags">
            <SheetMultiSelect options={OPTIONS} placeholder="Chọn nhóm" />
        </Form.Item>
        <Button htmlType="submit">Lưu</Button>
    </Form>
);

const openSheet = () => {
    // The closed trigger is the first button; submit button is "Lưu".
    fireEvent.click(screen.getByRole('button', { name: /Rau củ|Chọn nhóm/ }));
};

test('submitting after "Xong" collects the committed array unchanged', async () => {
    const onFinish = jest.fn();
    render(<FormHost onFinish={onFinish} />);

    openSheet();
    // Toggle two more options on top of the bound initial ['a'].
    fireEvent.click(screen.getByLabelText('Thịt cá'));
    fireEvent.click(screen.getByLabelText('Gia vị'));
    fireEvent.click(screen.getByRole('button', { name: 'Xong (3)' }));

    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));

    // rc-field-form validates + resolves onFinish in a microtask — wait for it.
    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
    // Array order/contents preserved exactly as committed (a kept, b + c appended).
    expect(onFinish.mock.calls[0][0]).toEqual({ tags: ['a', 'b', 'c'] });
});

test('cancelling with "Hủy" leaves the form value at its initial array', async () => {
    const onFinish = jest.fn();
    render(<FormHost onFinish={onFinish} />);

    openSheet();
    // Edit the draft, then bail out via Hủy — the form value must not change.
    fireEvent.click(screen.getByLabelText('Thịt cá'));
    fireEvent.click(screen.getByLabelText('Gia vị'));
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));

    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
    expect(onFinish.mock.calls[0][0]).toEqual({ tags: ['a'] });
});
