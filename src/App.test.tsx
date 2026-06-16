import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('localforage', () => ({
  __esModule: true,
  INDEXEDDB: 'INDEXEDDB',
  default: {
    INDEXEDDB: 'INDEXEDDB',
    createInstance: () => ({
      getItem: () => Promise.resolve(null),
      setItem: (_key: string, value: string) => Promise.resolve(value),
      removeItem: () => Promise.resolve(),
    }),
  },
}));

jest.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));

test('renders the dashboard at the configured basename', async () => {
  window.history.pushState({}, '', '/my-household/');
  window.HTMLElement.prototype.scrollTo = jest.fn();
  const App = require('./App').default;

  render(<App />);

  expect(await screen.findByText(/Tổng quan bếp hôm nay/i)).toBeInTheDocument();
}, 10000);
