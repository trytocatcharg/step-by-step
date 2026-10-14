import {
  isHealthDataAvailableAsync,
  queryQuantitySamples,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';

import { dayKey } from './dayRange';
import type { DaySteps } from './index';
import type { StepsRangeResult } from './getStepsRange';

const STEP_COUNT = 'HKQuantityTypeIdentifierStepCount' as const;

/** Steps bucketed per local day for the last `dayCount` days (today included). */
export async function getStepsForDays(
  dayCount: number
): Promise<StepsRangeResult> {
  const buckets = new Map<string, number>();
  const today = new Date();
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.set(dayKey(d), 0);
  }

  try {
    if (!(await isHealthDataAvailableAsync())) {
      return { days: mapToDays(buckets), status: 'unavailable' };
    }

    await requestAuthorization({ toRead: [STEP_COUNT] });

    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - (dayCount - 1));
    rangeStart.setHours(0, 0, 0, 0);

    const samples = await queryQuantitySamples(STEP_COUNT, {
      limit: 0,
      filter: { date: { startDate: rangeStart, endDate: today } },
    });

    for (const sample of samples) {
      // HealthKit sample dates may fall on the previous day in the local
      // calendar if the device timezone changed; bucket by start date.
      const key = dayKey(new Date(sample.startDate));
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + sample.quantity);
      }
    }

    return { days: mapToDays(buckets), status: 'ok' };
  } catch {
    return { days: mapToDays(buckets), status: 'error' };
  }
}

function mapToDays(buckets: Map<string, number>): DaySteps[] {
  return [...buckets.entries()].map(([date, steps]) => ({ date, steps }));
}
