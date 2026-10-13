import type { StepsResult } from './index';

export async function getStepsForDay(_date: Date): Promise<StepsResult> {
  return { steps: 0, status: 'unavailable' };
}
