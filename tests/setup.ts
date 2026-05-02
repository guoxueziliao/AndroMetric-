import { afterAll, beforeAll, vi } from 'vitest';

const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
};

vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
}));

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
