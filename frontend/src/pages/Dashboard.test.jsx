import { describe, expect, test } from 'vitest';
import { dashboardComponents } from './Dashboard';

describe('dashboardComponents', () => {
  test('includes dakota concert calendar route mapping', () => {
    expect(dashboardComponents.dakota_concert_calendar).toBeTruthy();
  });
});
