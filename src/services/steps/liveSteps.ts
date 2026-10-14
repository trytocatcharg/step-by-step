export interface LiveStepsHandle {
  stop: () => void;
}

/**
 * Starts a live step-count stream. Returns null when live steps are not
 * supported or permission was denied — callers should fall back to periodic
 * health-store reads.
 */
export async function startLiveSteps(
  onSteps: (cumulativeSteps: number) => void
): Promise<LiveStepsHandle | null> {
  void onSteps;
  return null;
}
