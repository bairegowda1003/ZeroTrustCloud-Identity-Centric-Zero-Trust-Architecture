export interface GatekeeperMatchKind {
  apiGroups?: string[];
  kinds?: string[];
}

export interface GatekeeperConstraintMatch {
  kinds: GatekeeperMatchKind[];
  namespaces: string[];
}

export interface GatekeeperConstraintAudit {
  totalViolations: number | null;
  auditTimestamp: string | null;
}

export interface GatekeeperEnforcementPoint {
  name: string;
  state: string | null;
  message: string | null;
}

export interface LiveGatekeeperConstraint {
  name: string;
  kind: string;
  enforcementAction: string | null;
  match: GatekeeperConstraintMatch;
  audit: GatekeeperConstraintAudit;
  webhookEnforced: boolean | null;
  enforcementPoints: GatekeeperEnforcementPoint[];
}

export interface LiveGatekeeperPoliciesResponse {
  source: string;
  cluster: string;
  collectedAt: string;
  available: boolean;
  constraints: LiveGatekeeperConstraint[];
  error?: string;
}

export const SNAPSHOT_MAX_AGE_MS = 60_000;
export const REQUEST_TIMEOUT_MS = 10_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export function validateGatekeeperPolicies(value: unknown): LiveGatekeeperPoliciesResponse {
  if (
    !isRecord(value) ||
    value.source !== 'live-kubernetes' ||
    !isText(value.collectedAt) ||
    !/(Z|[+-]\d{2}:\d{2})$/i.test(value.collectedAt) ||
    !Number.isFinite(Date.parse(value.collectedAt)) ||
    !isText(value.cluster) ||
    typeof value.available !== 'boolean' ||
    !Array.isArray(value.constraints) ||
    !value.constraints.every((c: unknown) => {
      if (!isRecord(c) || !isText(c.name) || !isText(c.kind)) return false;
      if (c.enforcementAction !== null && typeof c.enforcementAction !== 'string') return false;

      // Validate match
      if (!isRecord(c.match)) return false;
      if (!Array.isArray(c.match.kinds) || !Array.isArray(c.match.namespaces)) return false;

      // Validate audit
      if (!isRecord(c.audit)) return false;
      if (
        c.audit.totalViolations !== null &&
        !(typeof c.audit.totalViolations === 'number' && Number.isSafeInteger(c.audit.totalViolations))
      ) {
        return false;
      }
      if (c.audit.auditTimestamp !== null && typeof c.audit.auditTimestamp !== 'string') return false;

      // Validate webhookEnforced
      if (c.webhookEnforced !== null && typeof c.webhookEnforced !== 'boolean') return false;

      // Validate enforcementPoints
      if (!Array.isArray(c.enforcementPoints)) return false;
      if (
        !c.enforcementPoints.every(
          (ep: unknown) =>
            isRecord(ep) &&
            isText(ep.name) &&
            (ep.state === null || typeof ep.state === 'string') &&
            (ep.message === null || typeof ep.message === 'string')
        )
      ) {
        return false;
      }

      return true;
    })
  ) {
    throw new Error(
      'Invalid Gatekeeper Policies response: expected valid source, cluster, timestamp, and constraints array.'
    );
  }
  return value as unknown as LiveGatekeeperPoliciesResponse;
}

export function snapshotAgeReason(collectedAt: string, now: number): string | null {
  const age = now - Date.parse(collectedAt);
  if (!Number.isFinite(age)) return 'Collection time is invalid';
  if (age < -30_000) return 'Collection time is in the future; check clock synchronization';
  return age >= SNAPSHOT_MAX_AGE_MS ? 'Collection is at least 60 seconds old' : null;
}

export async function requestGatekeeperPolicies(
  signal: AbortSignal,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<LiveGatekeeperPoliciesResponse> {
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
      reject(new Error('Gatekeeper Policies API request timed out. Use Refresh to retry.'));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      interrupted,
      (async () => {
        const response = await fetch('/api/policies/gatekeeper', {
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
            // Retain generic status
          }
          throw new Error(`Gatekeeper Policies API returned ${errDetail}`);
        }
        return validateGatekeeperPolicies(await response.json());
      })(),
    ]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
}
