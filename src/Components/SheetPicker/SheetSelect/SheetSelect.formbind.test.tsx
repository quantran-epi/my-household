import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import { SheetSelect } from './SheetSelect';

const options = [
    { value: 'a', label: 'Cà chua' },
    { value: 'b', label: 'Đỏ' },
    { value: 'c', label: 'Rau muống' },
];

const openSheet = () => {
    const trigger = screen.getAllByRole('button').find(el => el.getAttribute('aria-haspopup') === 'dialog');
    fireEvent.click(trigger!);
};

test('a bound SheetSelect submits the picked value unchanged via Form', async () => {
    const onFinish = jest.fn();
    render(
        <Form onFinish={onFinish} initialValues={{ field: 'a' }}>
            <Form.Item name="field">
                <SheetSelect options={options} placeholder="Chọn" />
            </Form.Item>
            <button type="submit">Lưu</button>
        </Form>,
    );

    // The bound initial value renders on the trigger.
    const trigger = screen.getAllByRole('button').find(el => el.getAttribute('aria-haspopup') === 'dialog');
    expect(trigger).toHaveTextContent('Cà chua');

    // Open, pick a different option, submit.
    openSheet();
    fireEvent.click(screen.getByRole('option', { name: 'Rau muống' }));
    fireEvent.click(screen.getByText('Lưu'));

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
    expect(onFinish).toHaveBeenCalledWith({ field: 'c' });
});

test('a required rule blocks submit when no value is selected', async () => {
    const onFinish = jest.fn();
    render(
        <Form onFinish={onFinish}>
            <Form.Item name="field" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <SheetSelect options={options} placeholder="Chọn" />
            </Form.Item>
            <button type="submit">Lưu</button>
        </Form>,
    );

    fireEvent.click(screen.getByText('Lưu'));

    // Validation fails -> onFinish never fires, the rule message surfaces.
    await waitFor(() => expect(screen.getByText('Bắt buộc')).toBeInTheDocument());
    expect(onFinish).not.toHaveBeenCalled();
});
