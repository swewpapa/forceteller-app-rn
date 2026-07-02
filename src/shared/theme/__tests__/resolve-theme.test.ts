import { resolveTheme } from '../resolve-theme';

describe('resolveTheme', () => {
  it.each([
    ['system', 'light', 'day'],
    ['system', 'dark', 'night'],
    ['system', null, 'day'],
    ['day', 'dark', 'day'],
    ['night', 'light', 'night'],
  ] as const)('mode=%s, os=%s → %s', (mode, osScheme, expected) => {
    expect(resolveTheme(mode, osScheme)).toBe(expected);
  });
});
