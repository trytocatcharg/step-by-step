import { Pedometer } from 'expo-sensors';

import type { LiveStepsHandle } from './liveSteps';

/**
 * Subscribes to the hardware step counter (TYPE_STEP_COUNTER). The values are
 * cumulative steps since the device booted — callers must baseline them
 * against a known total. Events stop while the app is in the background, so
 * this is only a live layer on top of the health store, not a replacement.
 */
export async function startLiveSteps(
  onSteps: (cumulativeSteps: number) => void
): Promise<LiveStepsHandle | null> {
  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return null;

    const permission = await Pedometer.requestPermissionsAsync();
    if (!permission.granted) return null;

    const subscription = Pedometer.watchStepCount(({ steps }) => {
      onSteps(steps);
    });
    return { stop: () => subscription.remove() };
  } catch {
    return null;
  }
}
