import { describe, expect, it } from 'vitest';
import packageJson from '../package.json';
import { APP_VERSION } from '../app/appConfig';

describe('APP_VERSION', () => {
  it('uses package.json as the single version source', () => {
    expect(APP_VERSION).toBe(packageJson.version);
  });
});
