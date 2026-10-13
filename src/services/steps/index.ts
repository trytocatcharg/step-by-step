export type StepsStatus = 'ok' | 'unavailable' | 'denied' | 'error';

export interface StepsResult {
  steps: number;
  status: StepsStatus;
}

export * from './getSteps';
