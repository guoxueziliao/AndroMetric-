import { mock } from 'bun:test';

// Mock happy-dom globals
globalThis.document = {
  createElement: () => ({}),
  querySelector: () => null,
  querySelectorAll: () => [],
} as any;

globalThis.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  location: { reload: () => {} },
} as any;

// Suppress console during tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
});
