import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SheetActionMenu } from './SheetActionMenu';

const noop = () => {};

test('renders one full-width row per action with its label', () => {
  render(
    <SheetActionMenu
      open
      title="Tùy chọn"
      data-testid="menu"
      onClose={noop}
      actions={[
        { key: 'edit', label: 'Sửa', onClick: noop },
        { key: 'share', label: 'Chia sẻ', onClick: noop },
      ]}
    />,
  );
  expect(screen.getByText('Sửa')).toBeInTheDocument();
  expect(screen.getByText('Chia sẻ')).toBeInTheDocument();
});

test('each action row is a button with min-height 44px', () => {
  render(
    <SheetActionMenu
      open
      onClose={noop}
      actions={[{ key: 'edit', label: 'Sửa', onClick: noop }]}
    />,
  );
  const row = screen.getByRole('button', { name: 'Sửa' });
  expect(row).toHaveAttribute('type', 'button');
  expect(row.style.minHeight).toBe('44px');
});

test('a danger row renders its label in #ff4d4f', () => {
  render(
    <SheetActionMenu
      open
      onClose={noop}
      actions={[{ key: 'del', label: 'Xóa', danger: true, onClick: noop }]}
    />,
  );
  const row = screen.getByRole('button', { name: 'Xóa' });
  // color may be normalized to rgb by jsdom
  const color = row.style.color;
  expect(['#ff4d4f', 'rgb(255, 77, 79)']).toContain(color);
});

test('a non-danger row is not red', () => {
  render(
    <SheetActionMenu
      open
      onClose={noop}
      actions={[{ key: 'edit', label: 'Sửa', onClick: noop }]}
    />,
  );
  const row = screen.getByRole('button', { name: 'Sửa' });
  const color = row.style.color;
  expect(['#ff4d4f', 'rgb(255, 77, 79)']).not.toContain(color);
});

test('renders a leading icon when an action has one', () => {
  render(
    <SheetActionMenu
      open
      onClose={noop}
      actions={[
        {
          key: 'edit',
          label: 'Sửa',
          icon: <span data-testid="edit-icon" />,
          onClick: noop,
        },
      ]}
    />,
  );
  expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
});

test('clicking an action row fires its onClick once then onClose once, in order', () => {
  const calls: string[] = [];
  const onClick = jest.fn(() => calls.push('action'));
  const onClose = jest.fn(() => calls.push('close'));
  render(
    <SheetActionMenu
      open
      onClose={onClose}
      actions={[{ key: 'edit', label: 'Sửa', onClick }]}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Sửa' }));
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(calls).toEqual(['action', 'close']);
});

test('the Hủy button fires onClose and triggers no action onClick', () => {
  const onClick = jest.fn();
  const onClose = jest.fn();
  render(
    <SheetActionMenu
      open
      onClose={onClose}
      actions={[{ key: 'edit', label: 'Sửa', onClick }]}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onClick).not.toHaveBeenCalled();
});

test('renders nothing when closed', () => {
  render(
    <SheetActionMenu
      open={false}
      data-testid="menu"
      onClose={noop}
      actions={[{ key: 'edit', label: 'Sửa', onClick: noop }]}
    />,
  );
  expect(screen.queryByTestId('menu')).toBeNull();
});
