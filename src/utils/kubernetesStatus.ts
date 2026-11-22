export interface KubernetesNodeStatus {
  name: string;
  ready: boolean;
}

export interface KubernetesClusterStatus {
  name: string;
  context: string;
  connected: boolean;
  nodes: KubernetesNodeStatus[];
}

export interface KubernetesWorkloadPod {
  name: string;
  phase: string;
  readyContainers: number;
  totalContainers: number;
}

export interface KubernetesIntegrationStatus {
  available: boolean;
  namespace: string;
  pods: KubernetesWorkloadPod[];
}

export interface LiveKubernetesStatusResponse {
  source: string;
  collectedAt: string;
  clusters: KubernetesClusterStatus[];
  integration: KubernetesIntegrationStatus;
}

// Operational snapshots only; these fields do not establish security enforcement.
export const SNAPSHOT_MAX_AGE_MS = 60_000;
export const REQUEST_TIMEOUT_MS = 10_000;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export function validateKubernetesStatus(value: unknown): LiveKubernetesStatusResponse {
  if (!isRecord(value) || value.source !== 'live-kubernetes' ||
      !isText(value.collectedAt) || !/(Z|[+-]\d{2}:\d{2})$/i.test(value.collectedAt) ||
      !Number.isFinite(Date.parse(value.collectedAt)) || !Array.isArray(value.clusters) ||
      !value.clusters.every((cluster: unknown) => isRecord(cluster) &&
        isText(cluster.name) && isText(cluster.context) && typeof cluster.connected === 'boolean' &&
        Array.isArray(cluster.nodes) && cluster.nodes.every((node: unknown) =>
          isRecord(node) && isText(node.name) && typeof node.ready === 'boolean')) ||
      !isRecord(value.integration) || typeof value.integration.available !== 'boolean' ||
      !isText(value.integration.namespace) || !Array.isArray(value.integration.pods) ||
      !value.integration.pods.every((pod: unknown) => isRecord(pod) && isText(pod.name) &&
        isText(pod.phase) && isCount(pod.readyContainers) && isCount(pod.totalContainers) &&
        pod.readyContainers <= pod.totalContainers)) {
    throw new Error('Invalid Kubernetes response: expected complete cluster, node, namespace, pod and timestamp fields.');
  }
  return value as unknown as LiveKubernetesStatusResponse;
}

export function snapshotAgeReason(collectedAt: string, now: number): string | null {
  const age = now - Date.parse(collectedAt);
  if (!Number.isFinite(age)) return 'Collection time is invalid';
  if (age < -30_000) return 'Collection time is in the future; check clock synchronization';
  return age >= SNAPSHOT_MAX_AGE_MS ? 'Collection is at least 60 seconds old' : null;
}

export async function requestKubernetesStatus(signal: AbortSignal, timeoutMs = REQUEST_TIMEOUT_MS): Promise<LiveKubernetesStatusResponse> {
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
      reject(new Error('Kubernetes API request timed out. Use Refresh to retry.'));
      controller.abort();
    }, timeoutMs);
  });
  try {
    // Race includes body decoding: a stalled JSON body must also time out.
    return await Promise.race([interrupted, (async () => {
      const response = await fetch('/api/cluster/status', { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`Kubernetes API returned HTTP ${response.status}`);
      return validateKubernetesStatus(await response.json());
    })()]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
}
