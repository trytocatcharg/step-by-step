export type StepsStatus = 'ok' | 'unavailable' | 'denied' | 'error';

export interface StepsResult {
  steps: number;
  status: StepsStatus;
}

export interface DaySteps {
  /** Local-calendar day key: yyyy-mm-dd. */
  date: string;
  steps: number;
}

export * from './getSteps';
export * from './getStepsRange';
