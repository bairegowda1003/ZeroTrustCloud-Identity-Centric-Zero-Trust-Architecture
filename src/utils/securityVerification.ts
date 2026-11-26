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

  const ids = new Set<string>();
  const checks: VerificationCheck[] = record.checks.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid verification check at index ${idx}`);
    }
    const it = item as Record<string, unknown>;

    const id = typeof it.id === 'string' ? it.id.trim() : '';
    if (!id || ids.has(id)) throw new Error(`Missing or duplicate verification check ID at index ${idx}`);
    ids.add(id);
    const control = typeof it.control === 'string' && it.control.trim() ? it.control.trim() : 'Unknown Control';
    const rawStatus = typeof it.status === 'string' ? it.status.toUpperCase() : 'UNKNOWN';
    const status: VerificationStatus = validStatuses.has(rawStatus as VerificationStatus)
      ? (rawStatus as VerificationStatus)
      : 'UNKNOWN';
    const reason = typeof it.reason === 'string' ? it.reason : 'No explanation provided';
    const evidence = (it.evidence && typeof it.evidence === 'object' && !Array.isArray(it.evidence))
      ? (it.evidence as Record<string, unknown>)
      : {};
    const source = typeof it.source === 'string' ? it.source : 'Source not reported';
    const observedAt = (typeof it.observedAt === 'string' && !Number.isNaN(Date.parse(it.observedAt)))
      ? it.observedAt
      : '';

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

async function collectVerification(signal: AbortSignal): Promise<LiveSecurityVerificationResponse> {
  const response = await fetch('/api/security/verification', {
    signal,
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
}

interface Consumer {
  resolve: (value: LiveSecurityVerificationResponse) => void;
  reject: (reason: unknown) => void;
}

interface Collection {
  controller: AbortController;
  consumers: Set<Consumer>;
}

let activeCollection: Collection | undefined;

function startCollection(): Collection {
  const controller = new AbortController();
  const collection: Collection = { controller, consumers: new Set() };
  activeCollection = collection;

  function finish(deliver: (consumer: Consumer) => void) {
    clearTimeout(timer);
    if (activeCollection === collection) activeCollection = undefined;
    for (const consumer of collection.consumers) deliver(consumer);
    collection.consumers.clear();
  }

  const timer = setTimeout(() => {
    controller.abort(new Error('Automated verification request timed out after 8000ms'));
  }, 8000);
  controller.signal.addEventListener('abort', () => {
    finish(consumer => consumer.reject(controller.signal.reason));
  }, { once: true });

  void collectVerification(controller.signal).then(
    value => finish(consumer => consumer.resolve(value)),
    error => finish(consumer => consumer.reject(error)),
  );
  return collection;
}

export function requestSecurityVerification(signal?: AbortSignal): Promise<LiveSecurityVerificationResponse> {
  if (signal?.aborted) return Promise.reject(signal.reason);
  const collection = activeCollection ?? startCollection();
  return new Promise((resolve, reject) => {
    function cancel() {
      collection.consumers.delete(consumer);
      reject(signal?.reason);
      // React runs outgoing effect cleanup before mounting the incoming workspace.
      queueMicrotask(() => {
        if (activeCollection === collection && !collection.consumers.size) {
          collection.controller.abort();
        }
      });
    }
    const consumer: Consumer = {
      resolve(value) {
        signal?.removeEventListener('abort', cancel);
        resolve(value);
      },
      reject(error) {
        signal?.removeEventListener('abort', cancel);
        reject(error);
      },
    };
    collection.consumers.add(consumer);
    signal?.addEventListener('abort', cancel, { once: true });
  });
}
