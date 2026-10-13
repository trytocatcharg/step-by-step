import {
  isHealthDataAvailableAsync,
  queryQuantitySamples,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';

import { startOfDay } from './dayRange';
import type { StepsResult } from './index';

const STEP_COUNT = 'HKQuantityTypeIdentifierStepCount' as const;

export async function getStepsForDay(date: Date): Promise<StepsResult> {
  try {
    if (!(await isHealthDataAvailableAsync())) {
      return { steps: 0, status: 'unavailable' };
    }

    await requestAuthorization({ toRead: [STEP_COUNT] });

    const samples = await queryQuantitySamples(STEP_COUNT, {
      limit: 0,
      filter: { date: { startDate: startOfDay(date), endDate: date } },
    });

    const steps = samples.reduce((sum, sample) => sum + sample.quantity, 0);
    return { steps: Math.round(steps), status: 'ok' };
  } catch {
    return { steps: 0, status: 'error' };
  }
}
