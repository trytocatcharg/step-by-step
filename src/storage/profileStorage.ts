import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Profile } from '../types';

const PROFILE_KEY = '@tropicbird/profile';

function isValidProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.name === 'string' &&
    p.name.length > 0 &&
    typeof p.birthDate === 'string' &&
    !Number.isNaN(Date.parse(p.birthDate)) &&
    typeof p.heightCm === 'number' &&
    p.heightCm > 0 &&
    typeof p.weightKg === 'number' &&
    p.weightKg > 0 &&
    typeof p.dailyGoal === 'number' &&
    p.dailyGoal > 0
  );
}

export async function loadProfile(): Promise<Profile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
