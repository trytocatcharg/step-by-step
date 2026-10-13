const BASE_GOAL = 10000;
const MIN_GOAL = 4000;
const MAX_GOAL = 15000;
const ROUND_TO = 500;

export function calculateAge(birthISO: string, now: Date = new Date()): number | null {
  const birth = new Date(birthISO);
  if (Number.isNaN(birth.getTime()) || birth.getTime() > now.getTime()) return null;

  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 && age <= 120 ? age : null;
}

/**
 * Heuristic daily step goal based on age and BMI (derived from height/weight).
 * Returns null when the input is not usable, in which case the UI must let the
 * user pick a goal manually (6000 / 8000 / 10000 / custom).
 */
export function estimateDailyGoal(input: {
  birthDate: string;
  heightCm: number;
  weightKg: number;
}): number | null {
  const age = calculateAge(input.birthDate);
  const heightM = input.heightCm / 100;
  if (age === null || heightM <= 0 || input.weightKg <= 0) return null;

  const bmi = input.weightKg / (heightM * heightM);
  if (!Number.isFinite(bmi)) return null;

  let goal = BASE_GOAL;

  if (age >= 70) goal -= 3000;
  else if (age >= 60) goal -= 2000;
  else if (age >= 50) goal -= 1000;

  if (bmi < 18.5) goal += 1000;
  else if (bmi >= 30) goal -= 1000;

  goal = Math.round(goal / ROUND_TO) * ROUND_TO;
  return Math.min(Math.max(goal, MIN_GOAL), MAX_GOAL);
}
