import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getStepsForDay } from '../services/steps';
import type { StepsStatus } from '../services/steps';

const CACHE_KEY = '@tropicbird/steps_cache';

export interface TodayStepsState {
  steps: number;
  status: StepsStatus;
  loading: boolean;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function useTodaySteps(): TodayStepsState {
  const [state, setState] = useState<TodayStepsState>({
    steps: 0,
    status: 'ok',
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const result = await getStepsForDay(new Date());
      if (cancelled) return;
      setState({ steps: result.steps, status: result.status, loading: false });
      if (result.status === 'ok') {
        AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ date: dayKey(new Date()), steps: result.steps })
        ).catch(() => undefined);
      }
    };

    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const cached = JSON.parse(raw) as { date?: string; steps?: number };
        if (cached.date === dayKey(new Date()) && typeof cached.steps === 'number') {
          setState((prev) => ({ ...prev, steps: cached.steps as number }));
        }
      })
      .catch(() => undefined);

    refresh();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refresh();
    });
    const interval = setInterval(refresh, 60000);

    return () => {
      cancelled = true;
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  return state;
}
