import { mockStepsForToday } from './mockData';
import type { StepsResult } from './index';

/** Web preview only: no health store exists in the browser. */
export async function getStepsForDay(_date: Date): Promise<StepsResult> {
  return { steps: mockStepsForToday(), status: 'ok' };
}
