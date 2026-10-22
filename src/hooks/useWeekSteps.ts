import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { dayKey } from '../services/steps/dayRange';
import { getStepsForDays } from '../services/steps';
import type { DaySteps, StepsStatus } from '../services/steps';
import {
  getLastBackfillDay,
  markBackfillDone,
  mergeStepsHistory,
} from '../storage/stepsHistoryStorage';

const CACHE_KEY = '@juststeps/week_cache';
const DAY_COUNT = 7;
/**
 * One extra day is fetched so the average can cover complete days only:
 * the last entry is "today", whose steps are still partial during the day.
 */
const FETCH_COUNT = DAY_COUNT + 1;
/** How far back the one-per-day backfill seeds the local history. */
const BACKFILL_DAYS = 90;
const REFRESH_MS = 5 * 60_000;

export interface WeekStepsState {
  /** Last DAY_COUNT days (today included), for the chart. */
  days: DaySteps[];
  /** Last DAY_COUNT complete days (today excluded), for the average. */
  completeDays: DaySteps[];
  status: StepsStatus;
  loading: boolean;
}

function lastWeekDays(): DaySteps[] {
  const days: DaySteps[] = [];
  const today = new Date();
  for (let i = FETCH_COUNT - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: dayKey(d), steps: 0 });
  }
  return days;
}

function isCurrentWeek(value: unknown, expected: string[]): value is DaySteps[] {
  if (!Array.isArray(value) || value.length !== expected.length) return false;
  return value.every(
    (d, i) =>
      typeof d === 'object' &&
      d !== null &&
      (d as DaySteps).date === expected[i] &&
      typeof (d as DaySteps).steps === 'number'
  );
}

/**
 * Steps for the last 7 days plus today, oldest first. Read from the health
 * store and cached in AsyncStorage so the chart renders instantly (and
 * offline) from the last successful read. `days` holds the 7 chart days
 * (today included); `completeDays` holds the 7 complete days before today.
 */
export function useWeekSteps(): WeekStepsState {
  const [state, setState] = useState<WeekStepsState>(() => {
    const raw = lastWeekDays();
    return {
      days: raw.slice(-DAY_COUNT),
      completeDays: raw.slice(0, DAY_COUNT),
      status: 'ok',
      loading: true,
    };
  });

  useEffect(() => {
    let cancelled = false;

    const splitDays = (raw: DaySteps[]): Pick<WeekStepsState, 'days' | 'completeDays'> => ({
      days: raw.slice(-DAY_COUNT),
      completeDays: raw.slice(0, DAY_COUNT),
    });

    const refresh = async () => {
      const result = await getStepsForDays(FETCH_COUNT);
      if (cancelled) return;
      setState({ ...splitDays(result.days), status: result.status, loading: false });
      if (result.status === 'ok') {
        AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ days: result.days })
        ).catch(() => undefined);
        mergeStepsHistory(result.days).catch(() => undefined);
        backfillHistory();
      }
    };

    // Seed the local history from the health store once per day so the
    // stored record grows even on days the app is never opened.
    const backfillHistory = async () => {
      try {
        const today = dayKey(new Date());
        if ((await getLastBackfillDay()) === today) return;
        const result = await getStepsForDays(BACKFILL_DAYS);
        if (!cancelled && result.status === 'ok') {
          await mergeStepsHistory(result.days);
          await markBackfillDone();
        }
      } catch {
        // Backfill is best-effort; it retries next time.
      }
    };

    // Render the cached snapshot for the current week while the first read is
    // in flight.
    const expected = lastWeekDays().map((d) => d.date);
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed: unknown = JSON.parse(raw);
        const days = (parsed as { days?: unknown } | null)?.days;
        if (isCurrentWeek(days, expected)) {
          setState((prev) => ({ ...prev, ...splitDays(days as DaySteps[]) }));
        }
      })
      .catch(() => undefined);

    refresh();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refresh();
    });
    const interval = setInterval(refresh, REFRESH_MS);

    return () => {
      cancelled = true;
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  return state;
}
