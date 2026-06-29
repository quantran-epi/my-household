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

test('renders a grabber drag handle when open', () => {
  render(
    <Sheet open title="Bộ chọn" data-testid="smoke-sheet" onClose={noop}>
      nội dung
    </Sheet>,
  );
  const grabber = screen.getByLabelText('Kéo để đóng');
  expect(grabber).toBeInTheDocument();
  expect(grabber).toHaveAttribute('data-drag-handle');
});

test('grabber exposes its aria-label as an accessible button', () => {
  render(
    <Sheet open title="Bộ chọn" data-testid="smoke-sheet" onClose={noop}>
      nội dung
    </Sheet>,
  );
  const grabber = screen.getByRole('button', { name: 'Kéo để đóng' });
  expect(grabber).toBeInTheDocument();
});

test('still renders the grabber when maskClosable is false', () => {
  render(
    <Sheet open title="Bộ chọn" data-testid="smoke-sheet" maskClosable={false} onClose={noop}>
      nội dung
    </Sheet>,
  );
  expect(screen.getByLabelText('Kéo để đóng')).toBeInTheDocument();
});

// jsdom does not carry clientY through a constructed PointerEvent, so build a
// plain bubbling event with the coordinate assigned as an own property — React
// reads nativeEvent.clientY off it.
const pointer = (type: string, clientY: number) =>
  Object.assign(new Event(type, { bubbles: true }), { clientY, pointerId: 1 });

test('resets the drag offset when reopened after a drag (mount-and-toggle host)', () => {
  const { rerender } = render(
    <Sheet open title="Bộ chọn" data-testid="smoke-sheet" onClose={noop}>
      nội dung
    </Sheet>,
  );
  const grabber = screen.getByLabelText('Kéo để đóng');
  fireEvent(grabber, pointer('pointerdown', 0));
  fireEvent(grabber, pointer('pointermove', 240));
  expect(screen.getByTestId('smoke-sheet').style.transform).toBe('translate3d(0, 240px, 0)');

  rerender(
    <Sheet open={false} title="Bộ chọn" data-testid="smoke-sheet" onClose={noop}>
      nội dung
    </Sheet>,
  );
  rerender(
    <Sheet open title="Bộ chọn" data-testid="smoke-sheet" onClose={noop}>
      nội dung
    </Sheet>,
  );
  expect(screen.getByTestId('smoke-sheet').style.transform).toBe('translate3d(0, 0px, 0)');
});
