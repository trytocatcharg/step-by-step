export interface Profile {
  name: string;
  /** ISO date string (yyyy-mm-ddThh:mm:ss.sssZ) */
  birthDate: string;
  heightCm: number;
  weightKg: number;
  dailyGoal: number;
}
