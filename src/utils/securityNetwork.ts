export interface LiveSecurityNetworkIstiod {
  name: string;
  ready: boolean;
  desiredReplicas: number | null;
  readyReplicas: number | null;
  available: boolean;
  error: string | null;
}

export interface LiveSecurityNetworkNamespaceInjection {
  namespace: string;
  enabled: boolean;
  labelValue: string | null;
  available: boolean;
  error: string | null;
}

export interface LiveSecurityNetworkPeerAuth {
  name: string;
  mode: string;
  selector: {
    matchLabels: Record<string, string>;
  };
  workloadScoped: boolean;
}

export interface LiveSecurityNetworkWorkloadSidecar {
  present: boolean;
  containerName: string | null;
  location: 'initContainers' | 'containers' | 'none';
  nativeSidecar: boolean;
  ready: boolean;
}

export interface LiveSecurityNetworkWorkload {
  name: string;
  phase: string;
  labels: Record<string, string>;
  sidecar: LiveSecurityNetworkWorkloadSidecar;
}

export interface LiveSecurityNetworkIngressPeer {
  podSelector?: {
    matchLabels?: Record<string, string>;
  };
  namespaceSelector?: {
    matchLabels?: Record<string, string>;
  };
}

export interface LiveSecurityNetworkIngressPort {
  port?: number | string;
  protocol: string;
}

export interface LiveSecurityNetworkIngressRule {
  from: LiveSecurityNetworkIngressPeer[];
  ports: LiveSecurityNetworkIngressPort[];
}

export interface LiveSecurityNetworkPolicy {
  name: string;
  podSelector: {
    matchLabels: Record<string, string>;
  };
  policyTypes: string[];
  ingress: LiveSecurityNetworkIngressRule[];
  workloadScoped: boolean;
}

export interface LiveSecurityNetworkResponse {
  source: string;
  cluster: string;
  namespace: string;
  istioSystemNamespace: string;
  collectedAt: string;
  available: boolean;
  error?: string | null;
  istiod: LiveSecurityNetworkIstiod;
  namespaceInjection: LiveSecurityNetworkNamespaceInjection;
  peerAuthentications: LiveSecurityNetworkPeerAuth[];
  peerAuthenticationsAvailable: boolean;
  peerAuthenticationsError?: string | null;
  workloads: LiveSecurityNetworkWorkload[];
  workloadsAvailable: boolean;
  workloadsError?: string | null;
  networkPolicies: LiveSecurityNetworkPolicy[];
  networkPoliciesAvailable: boolean;
  networkPoliciesError?: string | null;
}

function fields(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Malformed network resource');
  return value as Record<string, unknown>;
}

function stringField(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Malformed network resource name or state');
  return value;
}

function flag(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Malformed network observation flag');
  return value;
}

function labelMap(value: unknown): Record<string,string> {
  const map = fields(value);
  if (Object.values(map).some(v => typeof v !== 'string')) throw new Error('Malformed Kubernetes labels');
  return map as Record<string,string>;
}

function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Malformed network resource inventory');
  return value;
}

function selector(value: unknown) {
  const raw = fields(value);
  if (Object.keys(raw).some(k => k !== 'matchLabels')) throw new Error('Unsupported selector in network evidence');
  return { matchLabels: labelMap(raw.matchLabels ?? {}) };
}

export function validateSecurityNetwork(payload: unknown): LiveSecurityNetworkResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Malformed security network response: payload is not an object');
  }

  const record = payload as Record<string, unknown>;

  if (record.source !== 'live-kubernetes') {
    throw new Error(`Unexpected telemetry source: ${String(record.source)}`);
  }

  if (typeof record.cluster !== 'string' || !record.cluster.trim()) {
    throw new Error('Malformed security network response: missing cluster');
  }

  if (typeof record.namespace !== 'string' || !record.namespace.trim()) {
    throw new Error('Malformed security network response: missing namespace');
  }

  if (typeof record.collectedAt !== 'string' || Number.isNaN(Date.parse(record.collectedAt))) {
    throw new Error('Malformed security network response: invalid collectedAt timestamp');
  }

  if (typeof record.available !== 'boolean') {
    throw new Error('Malformed security network response: missing available status');
  }

  // Validate istiod
  const rawIstiod = record.istiod as Record<string, unknown> | undefined;
  if (!rawIstiod || typeof rawIstiod !== 'object') {
    throw new Error('Malformed security network response: missing istiod field');
  }
  const istiod: LiveSecurityNetworkIstiod = {
    name: typeof rawIstiod.name === 'string' ? rawIstiod.name : 'istiod',
    ready: flag(rawIstiod.ready),
    desiredReplicas: typeof rawIstiod.desiredReplicas === 'number' ? rawIstiod.desiredReplicas : null,
    readyReplicas: typeof rawIstiod.readyReplicas === 'number' ? rawIstiod.readyReplicas : null,
    available: flag(rawIstiod.available),
    error: typeof rawIstiod.error === 'string' ? rawIstiod.error : null,
  };

  // Validate namespaceInjection
  const rawNsInj = record.namespaceInjection as Record<string, unknown> | undefined;
  if (!rawNsInj || typeof rawNsInj !== 'object') {
    throw new Error('Malformed security network response: missing namespaceInjection field');
  }
  const namespaceInjection: LiveSecurityNetworkNamespaceInjection = {
    namespace: typeof rawNsInj.namespace === 'string' ? rawNsInj.namespace : record.namespace,
    enabled: flag(rawNsInj.enabled),
    labelValue: typeof rawNsInj.labelValue === 'string' ? rawNsInj.labelValue : null,
    available: flag(rawNsInj.available),
    error: typeof rawNsInj.error === 'string' ? rawNsInj.error : null,
  };

  const peerAuthentications = list(record.peerAuthentications).map(item => {
    const p = fields(item);
    const target = selector(p.selector);
    return { name: stringField(p.name), mode: stringField(p.mode), selector: target,
      workloadScoped: Object.keys(target.matchLabels).length > 0 };
  });

  const workloads: LiveSecurityNetworkWorkload[] = list(record.workloads).map(item => {
    const p = fields(item);
    const sidecar = fields(p.sidecar);
    const location = sidecar.location;
    if (location !== 'containers' && location !== 'initContainers' && location !== 'none')
      throw new Error('Malformed sidecar location');
    return { name: stringField(p.name), phase: stringField(p.phase), labels: labelMap(p.labels),
      sidecar: { present: flag(sidecar.present), nativeSidecar: flag(sidecar.nativeSidecar),
        ready: flag(sidecar.ready), location, containerName: typeof sidecar.containerName === 'string' ? sidecar.containerName : null } };
  });

  const networkPolicies = list(record.networkPolicies).map(item => {
    const p = fields(item);
    const podSelector = selector(p.podSelector);
    const ingress = list(p.ingress).map(item => {
      const rule = fields(item);
      const from = list(rule.from).map(item => {
        const peer = fields(item);
        return { podSelector: peer.podSelector === undefined ? undefined : selector(peer.podSelector),
          namespaceSelector: peer.namespaceSelector === undefined ? undefined : selector(peer.namespaceSelector) };
      });
      const ports = list(rule.ports).map(item => {
        const p = fields(item);
        if (p.port != null && typeof p.port !== 'string' && typeof p.port !== 'number')
          throw new Error('Malformed ingress port');
        return { protocol: stringField(p.protocol), port: p.port ?? undefined };
      });
      return { from, ports };
    });
    return { name: stringField(p.name), podSelector, policyTypes: list(p.policyTypes).map(stringField),
      workloadScoped: Object.keys(podSelector.matchLabels).length > 0, ingress };
  });

  return {
    source: record.source,
    cluster: record.cluster,
    namespace: record.namespace,
    istioSystemNamespace: typeof record.istioSystemNamespace === 'string' ? record.istioSystemNamespace : 'istio-system',
    collectedAt: record.collectedAt,
    available: record.available,
    error: typeof record.error === 'string' ? record.error : null,
    istiod,
    namespaceInjection,
    peerAuthentications,
    peerAuthenticationsAvailable: flag(record.peerAuthenticationsAvailable),
    peerAuthenticationsError: typeof record.peerAuthenticationsError === 'string' ? record.peerAuthenticationsError : null,
    workloads,
    workloadsAvailable: flag(record.workloadsAvailable),
    workloadsError: typeof record.workloadsError === 'string' ? record.workloadsError : null,
    networkPolicies,
    networkPoliciesAvailable: flag(record.networkPoliciesAvailable),
    networkPoliciesError: typeof record.networkPoliciesError === 'string' ? record.networkPoliciesError : null,
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

export async function requestSecurityNetwork(signal?: AbortSignal): Promise<LiveSecurityNetworkResponse> {
  const timeoutMs = 5000;
  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort(new Error('Network security request timed out after 5000ms'));
  }, timeoutMs);

  const combinedSignal = signal
    ? anySignal([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch('/api/security/network', {
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
        // Fall back to response.statusText if json decoding fails
        if (response.statusText) {
          detail = `${detail} (${response.statusText})`;
        }
      }
      throw new Error(`Failed to retrieve live network security telemetry: ${detail}`);
    }

    const json = await response.json();
    return validateSecurityNetwork(json);
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
