import { dayKey } from './dayRange';
import type { DaySteps, StepsStatus } from './index';

export interface StepsRangeResult {
  days: DaySteps[];
  status: StepsStatus;
}

/** Steps bucketed per local day for the last `dayCount` days (today included). */
export async function getStepsForDays(
  dayCount: number
): Promise<StepsRangeResult> {
  const days: DaySteps[] = [];
  const today = new Date();
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: dayKey(d), steps: 0 });
  }
  return { days, status: 'unavailable' };
}
