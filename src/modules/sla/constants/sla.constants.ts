export const SLA_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

// Default SLA targets (minutes) applied when an org has no policy yet.
export const DEFAULT_SLA_POLICIES: Record<
  (typeof SLA_PRIORITIES)[number],
  { responseMinutes: number; resolutionMinutes: number }
> = {
  Critical: { responseMinutes: 15, resolutionMinutes: 240 },
  High: { responseMinutes: 30, resolutionMinutes: 480 },
  Medium: { responseMinutes: 60, resolutionMinutes: 1440 },
  Low: { responseMinutes: 120, resolutionMinutes: 2880 },
};

// A stage is "at risk" once this fraction of the target remains.
export const AT_RISK_THRESHOLD = 0.2;
