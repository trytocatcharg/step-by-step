import AsyncStorage from '@react-native-async-storage/async-storage';

import { dayKey } from '../services/steps/dayRange';
import type { DaySteps } from '../services/steps';

const HISTORY_KEY = '@juststeps/history';
const LAST_BACKFILL_KEY = '@juststeps/history_backfill';

export type StepsHistory = Record<string, number>;

/** All locally stored daily step totals, keyed by yyyy-mm-dd. */
export async function loadStepsHistory(): Promise<StepsHistory> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const history: StepsHistory = {};
    for (const [date, steps] of Object.entries(parsed)) {
      if (typeof steps === 'number' && steps >= 0) history[date] = steps;
    }
    return history;
  } catch {
    return {};
  }
}

/** Merge authoritative day totals into the stored history. */
export async function mergeStepsHistory(days: DaySteps[]): Promise<void> {
  if (days.length === 0) return;
  const history = await loadStepsHistory();
  let changed = false;
  for (const { date, steps } of days) {
    if (history[date] !== steps) {
      history[date] = steps;
      changed = true;
    }
  }
  if (changed) {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(
      () => undefined
    );
  }
}

/** Day key (yyyy-mm-dd) of the last successful backfill, or null. */
export async function getLastBackfillDay(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_BACKFILL_KEY);
  } catch {
    return null;
  }
}

export async function markBackfillDone(date: Date = new Date()): Promise<void> {
  await AsyncStorage.setItem(LAST_BACKFILL_KEY, dayKey(date)).catch(
    () => undefined
  );
}
