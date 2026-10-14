import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { dayKey } from '../services/steps/dayRange';
import { getStepsForDay } from '../services/steps';
import type { StepsStatus } from '../services/steps';
import { startLiveSteps } from '../services/steps/liveSteps';
import { mergeStepsHistory } from '../storage/stepsHistoryStorage';

const CACHE_KEY = '@juststeps/steps_cache';
const REFRESH_MS = 60_000;

export interface TodayStepsState {
  steps: number;
  status: StepsStatus;
  loading: boolean;
}

/**
 * Today's steps. Health Connect (or HealthKit) is the source of truth and is
 * re-read every minute; on Android the hardware step counter adds live steps
 * on top of that baseline while the app is open. The displayed value is
 * monotone within a day — it never goes backwards when either source lags.
 */
export function useTodaySteps(): TodayStepsState {
  const [state, setState] = useState<TodayStepsState>({
    steps: 0,
    status: 'ok',
    loading: true,
  });

  const dayKeyRef = useRef(dayKey(new Date()));
  const displayedRef = useRef(0);
  const healthTotalRef = useRef(0);
  const healthStatusRef = useRef<StepsStatus>('ok');
  // Live layer baselines: the cumulative hardware counter restarts at zero on
  // every device boot, so its deltas are anchored to the health-store total.
  const sensorBaseRef = useRef<number | null>(null);
  const liveBaseRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let liveHandle: { stop: () => void } | null = null;

    const publish = () => {
      if (cancelled) return;
      const { current: steps } = displayedRef;
      const { current: status } = healthStatusRef;
      setState((prev) =>
        prev.loading || prev.steps !== steps || prev.status !== status
          ? { steps, status, loading: false }
          : prev
      );
    };

    const onLiveSteps = (cumulative: number) => {
      if (
        sensorBaseRef.current === null ||
        cumulative < sensorBaseRef.current
      ) {
        // First event, or the device rebooted and the counter reset.
        sensorBaseRef.current = cumulative;
        liveBaseRef.current = healthTotalRef.current;
      }
      const estimate =
        liveBaseRef.current + (cumulative - sensorBaseRef.current);
      if (estimate > displayedRef.current) {
        displayedRef.current = estimate;
        publish();
      }
    };

    const refresh = async () => {
      const result = await getStepsForDay(new Date());
      if (cancelled) return;

      const today = dayKey(new Date());
      if (today !== dayKeyRef.current) {
        // New day: yesterday's running totals must not leak into today.
        dayKeyRef.current = today;
        displayedRef.current = 0;
        sensorBaseRef.current = null;
      }

      healthTotalRef.current = result.steps;
      healthStatusRef.current = result.status;
      liveBaseRef.current = result.steps;
      displayedRef.current = Math.max(displayedRef.current, result.steps);
      publish();

      if (result.status === 'ok') {
        AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ date: today, steps: result.steps })
        ).catch(() => undefined);
        mergeStepsHistory([{ date: today, steps: result.steps }]).catch(
          () => undefined
        );
      }
    };

    // Show yesterday's cached total (only valid within the same day) while the
    // first read is in flight.
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const cached = JSON.parse(raw) as { date?: string; steps?: number };
        if (
          cached.date === dayKeyRef.current &&
          typeof cached.steps === 'number'
        ) {
          displayedRef.current = Math.max(displayedRef.current, cached.steps);
          publish();
        }
      })
      .catch(() => undefined);

    refresh();
    startLiveSteps(onLiveSteps).then((handle) => {
      if (cancelled) {
        handle?.stop();
      } else {
        liveHandle = handle;
      }
    });

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refresh();
    });
    const interval = setInterval(refresh, REFRESH_MS);

    return () => {
      cancelled = true;
      subscription.remove();
      clearInterval(interval);
      liveHandle?.stop();
    };
  }, []);

  return state;
}
