import { dayKey } from './dayRange';

/**
 * Random step totals so web previews (where no health store exists) show
 * realistic data. Only used by the `.web.ts` platform shims — never on real
 * devices.
 */
export function mockStepsForDay(_dateKey: string): number {
  return Math.floor(Math.random() * 7500) + 2500;
}

export function mockStepsForToday(): number {
  return mockStepsForDay(dayKey(new Date()));
}
