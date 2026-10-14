import { dayKey } from './dayRange';
import { mockStepsForDay } from './mockData';
import type { DaySteps } from './index';
import type { StepsRangeResult } from './getStepsRange';

/** Web preview only: serves deterministic mock data for the last N days. */
export async function getStepsForDays(dayCount: number): Promise<StepsRangeResult> {
  const days: DaySteps[] = [];
  const today = new Date();
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: dayKey(d), steps: mockStepsForDay(dayKey(d)) });
  }
  return { days, status: 'ok' };
}
