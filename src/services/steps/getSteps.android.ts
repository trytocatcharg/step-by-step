import {
  getGrantedPermissions,
  initialize,
  readRecords,
  requestPermission,
} from 'react-native-health-connect';

import { startOfDay } from './dayRange';
import type { StepsResult } from './index';

export async function getStepsForDay(date: Date): Promise<StepsResult> {
  try {
    const initialized = await initialize();
    if (!initialized) {
      return { steps: 0, status: 'unavailable' };
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
        return { steps: 0, status: 'denied' };
      }
    }

    const { records } = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay(date).toISOString(),
        endTime: date.toISOString(),
      },
    });

    const steps = records.reduce((sum, record) => sum + record.count, 0);
    return { steps, status: 'ok' };
  } catch {
    return { steps: 0, status: 'error' };
  }
}
