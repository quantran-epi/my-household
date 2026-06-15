import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sheet } from '@components/Sheet';

const noop = () => {};

test('mounts content when open', () => {
  render(
    <Sheet open title="Bộ chọn" data-testid="smoke-sheet" onClose={noop}>
      nội dung
    </Sheet>,
  );
  expect(screen.getByTestId('smoke-sheet')).toBeInTheDocument();
  expect(screen.getByText('nội dung')).toBeInTheDocument();
});

test('renders nothing when closed', () => {
  render(
    <Sheet open={false} title="Bộ chọn" data-testid="smoke-sheet" onClose={noop}>
      nội dung
    </Sheet>,
  );
  expect(screen.queryByTestId('smoke-sheet')).toBeNull();
});

test('fires onClose when the close button is clicked', () => {
  const onClose = jest.fn();
  render(
    <Sheet open title="Bộ chọn" data-testid="smoke-sheet" onClose={onClose}>
      nội dung
    </Sheet>,
  );
  fireEvent.click(screen.getByLabelText('Đóng'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
