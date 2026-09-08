import { expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

// A malformed dataset must reach React's boundary, not abort module loading.
vi.mock('../../data/itinerary.json', () => ({ default: 'invalid test input' }));

it('defers dataset validation until React renders the provider', async () => {
  const { TripProvider } = await import('../context');
  expect(typeof TripProvider).toBe('function');
  expect(() => renderToString(createElement(TripProvider, { children: null }))).toThrow();
});
