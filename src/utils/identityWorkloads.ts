export interface LiveIdentityWorkloadPod {
  name: string;
  phase: string;
  serviceAccountName: string;
  labels: Record<string, string>;
  readyContainers: number;
  totalContainers: number;
}

export interface LiveIdentityServiceAccount {
  name: string;
}

export interface LiveSpireRegistration {
  name: string;
  spiffeIDTemplate: string | null;
  namespaceSelector: Record<string, unknown> | null;
  podSelector: Record<string, unknown> | null;
  statistics: Record<string, number> | null;
  available: boolean;
  error: string | null;
}

export interface LiveSpireComponent {
  name: string;
  kind: string;
  desiredReplicas: number | null;
  readyReplicas: number | null;
  available: boolean;
  error: string | null;
}

export interface LiveIdentityWorkloadsResponse {
  source: string;
  cluster: string;
  namespace: string;
  available: boolean;
  workloads: LiveIdentityWorkloadPod[];
  serviceAccounts: LiveIdentityServiceAccount[];
  spireRegistration: LiveSpireRegistration;
  spireComponents: LiveSpireComponent[];
  collectedAt: string;
  error?: string;
}

export const SNAPSHOT_MAX_AGE_MS = 60_000;
export const REQUEST_TIMEOUT_MS = 10_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export function validateIdentityWorkloads(value: unknown): LiveIdentityWorkloadsResponse {
  if (
    !isRecord(value) ||
    value.source !== 'live-kubernetes' ||
    !isText(value.collectedAt) ||
    !/(Z|[+-]\d{2}:\d{2})$/i.test(value.collectedAt) ||
    !Number.isFinite(Date.parse(value.collectedAt)) ||
    !isText(value.cluster) ||
    !isText(value.namespace) ||
    typeof value.available !== 'boolean' ||
    !Array.isArray(value.workloads) ||
    !value.workloads.every(
      (w: unknown) =>
        isRecord(w) &&
        isText(w.name) &&
        isText(w.phase) &&
        isText(w.serviceAccountName) &&
        isRecord(w.labels) &&
        Object.values(w.labels).every(label => typeof label === 'string') &&
        isCount(w.readyContainers) &&
        isCount(w.totalContainers) &&
        w.readyContainers <= w.totalContainers
    ) ||
    !Array.isArray(value.serviceAccounts) ||
    !value.serviceAccounts.every((sa: unknown) => isRecord(sa) && isText(sa.name)) ||
    !isRecord(value.spireRegistration) ||
    typeof value.spireRegistration.available !== 'boolean' ||
    !isText(value.spireRegistration.name) ||
    !(value.spireRegistration.spiffeIDTemplate == null || isText(value.spireRegistration.spiffeIDTemplate)) ||
    ![value.spireRegistration.namespaceSelector, value.spireRegistration.podSelector].every(s => s == null || isRecord(s)) ||
    !(value.spireRegistration.statistics == null || (isRecord(value.spireRegistration.statistics) && Object.values(value.spireRegistration.statistics).every(isCount))) ||
    !(value.spireRegistration.error == null || typeof value.spireRegistration.error === 'string') ||
    !Array.isArray(value.spireComponents) ||
    !value.spireComponents.every(
      (c: unknown) => isRecord(c) && isText(c.name) && isText(c.kind) && typeof c.available === 'boolean' &&
        [c.readyReplicas, c.desiredReplicas].every(n => n == null || isCount(n)) &&
        (c.error == null || typeof c.error === 'string')
    )
  ) {
    throw new Error(
      'Invalid Identity Workloads response: expected valid workloads, serviceAccounts, spireRegistration and spireComponents.'
    );
  }
  return value as unknown as LiveIdentityWorkloadsResponse;
}

export function snapshotAgeReason(collectedAt: string, now: number): string | null {
  const age = now - Date.parse(collectedAt);
  if (!Number.isFinite(age)) return 'Collection time is invalid';
  if (age < -30_000) return 'Collection time is in the future; check clock synchronization';
  return age >= SNAPSHOT_MAX_AGE_MS ? 'Collection is at least 60 seconds old' : null;
}

export async function requestIdentityWorkloads(
  signal: AbortSignal,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<LiveIdentityWorkloadsResponse> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel = () => {};
  const interrupted = new Promise<never>((_, reject) => {
    cancel = () => {
      reject(new DOMException('Request cancelled', 'AbortError'));
      controller.abort();
    };
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
    timer = setTimeout(() => {
      reject(new Error('Identity API request timed out. Use Refresh to retry.'));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      interrupted,
      (async () => {
        const response = await fetch('/api/identity/workloads', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) {
          let errDetail = `HTTP ${response.status}`;
          try {
            const body = await response.json();
            if (body && typeof body.error === 'string') {
              errDetail = body.error;
            }
          } catch {
            // Keep generic status
          }
          throw new Error(`Identity API returned ${errDetail}`);
        }
        return validateIdentityWorkloads(await response.json());
      })(),
    ]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
}
