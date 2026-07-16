import { describe, it, expect } from 'vitest';
import { mapWithConcurrency } from '../js/api.js';

describe('mapWithConcurrency', () => {
  it('preserves result order regardless of completion order', async () => {
    const items = [30, 10, 20];
    const results = await mapWithConcurrency(items, 3, (ms) => new Promise(resolve => {
      setTimeout(() => resolve(ms), ms);
    }));
    expect(results).toEqual([30, 10, 20]);
  });

  it('never runs more than `limit` tasks concurrently', async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);
    await mapWithConcurrency(items, 3, async (i) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active--;
      return i;
    });
    expect(maxActive).toBeLessThanOrEqual(3);
  });

  it('processes every item exactly once', async () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const seen = [];
    await mapWithConcurrency(items, 4, async (i) => {
      seen.push(i);
      return i;
    });
    expect(seen.sort((a, b) => a - b)).toEqual(items);
  });
});
