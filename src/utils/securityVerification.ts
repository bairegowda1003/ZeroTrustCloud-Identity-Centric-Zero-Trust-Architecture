export type VerificationStatus = 'PASS' | 'FAIL' | 'UNKNOWN';

export interface VerificationCheck {
  id: string;
  control: string;
  status: VerificationStatus;
  reason: string;
  evidence: Record<string, unknown>;
  source: string;
  observedAt: string;
}

export interface LiveSecurityVerificationResponse {
  source: string;
  collectedAt: string;
  checks: VerificationCheck[];
}

export function validateSecurityVerification(payload: unknown): LiveSecurityVerificationResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Malformed security verification response: payload is not an object');
  }

  const record = payload as Record<string, unknown>;

  if (record.source !== 'automated-verification') {
    throw new Error(`Unexpected verification source: ${String(record.source)}`);
  }

  if (typeof record.collectedAt !== 'string' || Number.isNaN(Date.parse(record.collectedAt))) {
    throw new Error('Malformed security verification response: invalid collectedAt timestamp');
  }

  if (!Array.isArray(record.checks)) {
    throw new Error('Malformed security verification response: checks must be an array');
  }

  const validStatuses = new Set<VerificationStatus>(['PASS', 'FAIL', 'UNKNOWN']);

  const checks: VerificationCheck[] = record.checks.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid verification check at index ${idx}`);
    }
    const it = item as Record<string, unknown>;

    const id = typeof it.id === 'string' && it.id.trim() ? it.id.trim() : `check-${idx}`;
    const control = typeof it.control === 'string' && it.control.trim() ? it.control.trim() : 'Unknown Control';
    const rawStatus = typeof it.status === 'string' ? it.status.toUpperCase() : 'UNKNOWN';
    const status: VerificationStatus = validStatuses.has(rawStatus as VerificationStatus)
      ? (rawStatus as VerificationStatus)
      : 'UNKNOWN';
    const reason = typeof it.reason === 'string' ? it.reason : 'No explanation provided';
    const evidence = (it.evidence && typeof it.evidence === 'object' && !Array.isArray(it.evidence))
      ? (it.evidence as Record<string, unknown>)
      : {};
    const source = typeof it.source === 'string' ? it.source : 'Kubernetes collector';
    const observedAt = (typeof it.observedAt === 'string' && !Number.isNaN(Date.parse(it.observedAt)))
      ? it.observedAt
      : record.collectedAt as string;

    return {
      id,
      control,
      status,
      reason,
      evidence,
      source,
      observedAt,
    };
  });

  return {
    source: record.source as string,
    collectedAt: record.collectedAt as string,
    checks,
  };
}

export function snapshotAgeReason(timestamp: string, now: number = Date.now()): string | null {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return 'Invalid timestamp';
  const deltaMs = now - parsed;
  if (deltaMs < -15000) return 'Snapshot timestamp is in the future (clock skew)';
  if (deltaMs > 120000) return 'Snapshot is stale (>2m old)';
  if (deltaMs > 60000) return 'Snapshot is aging (>1m old)';
  return null;
}

export async function requestSecurityVerification(signal?: AbortSignal): Promise<LiveSecurityVerificationResponse> {
  const timeoutMs = 8000;
  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort(new Error('Automated verification request timed out after 8000ms'));
  }, timeoutMs);

  const combinedSignal = signal
    ? anySignal([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch('/api/security/verification', {
      signal: combinedSignal,
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    });

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson === 'object') {
          const errRec = errorJson as Record<string, unknown>;
          if (typeof errRec.error === 'string') {
            detail = `${detail} - ${errRec.error}`;
          }
        }
      } catch {
        if (response.statusText) {
          detail = `${detail} (${response.statusText})`;
        }
      }
      throw new Error(`Failed to retrieve automated security verification: ${detail}`);
    }

    const json = await response.json();
    return validateSecurityVerification(json);
  } finally {
    clearTimeout(timer);
  }
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort(s.reason);
      return controller.signal;
    }
    s.addEventListener('abort', () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}
