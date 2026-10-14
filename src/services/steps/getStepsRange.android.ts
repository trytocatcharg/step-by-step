import {
  getGrantedPermissions,
  initialize,
  readRecords,
  requestPermission,
} from 'react-native-health-connect';

import { dayKey } from './dayRange';
import type { DaySteps } from './index';
import type { StepsRangeResult } from './getStepsRange';

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
    const initialized = await initialize();
    if (!initialized) {
      return { days: mapToDays(buckets), status: 'unavailable' };
    }

    const granted = await getGrantedPermissions();
    const hasStepsRead = granted.some(
      (p) => p.recordType === 'Steps' && p.accessType === 'read'
    );
    if (!hasStepsRead) {
      const requested = await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
      ]);
      const nowGranted = requested.some(
        (p) => p.recordType === 'Steps' && p.accessType === 'read'
      );
      if (!nowGranted) {
        return { days: mapToDays(buckets), status: 'denied' };
      }
    }

    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - (dayCount - 1));
    rangeStart.setHours(0, 0, 0, 0);

    const { records } = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: rangeStart.toISOString(),
        endTime: today.toISOString(),
      },
    });

    for (const record of records) {
      const key = dayKey(new Date(record.startTime));
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + record.count);
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
