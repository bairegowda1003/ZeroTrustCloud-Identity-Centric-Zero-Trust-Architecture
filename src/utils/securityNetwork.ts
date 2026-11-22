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
    ready: Boolean(rawIstiod.ready),
    desiredReplicas: typeof rawIstiod.desiredReplicas === 'number' ? rawIstiod.desiredReplicas : null,
    readyReplicas: typeof rawIstiod.readyReplicas === 'number' ? rawIstiod.readyReplicas : null,
    available: Boolean(rawIstiod.available),
    error: typeof rawIstiod.error === 'string' ? rawIstiod.error : null,
  };

  // Validate namespaceInjection
  const rawNsInj = record.namespaceInjection as Record<string, unknown> | undefined;
  if (!rawNsInj || typeof rawNsInj !== 'object') {
    throw new Error('Malformed security network response: missing namespaceInjection field');
  }
  const namespaceInjection: LiveSecurityNetworkNamespaceInjection = {
    namespace: typeof rawNsInj.namespace === 'string' ? rawNsInj.namespace : record.namespace,
    enabled: Boolean(rawNsInj.enabled),
    labelValue: typeof rawNsInj.labelValue === 'string' ? rawNsInj.labelValue : null,
    available: Boolean(rawNsInj.available),
    error: typeof rawNsInj.error === 'string' ? rawNsInj.error : null,
  };

  // Validate peerAuthentications
  const rawPA = record.peerAuthentications;
  if (!Array.isArray(rawPA)) {
    throw new Error('Malformed security network response: peerAuthentications must be an array');
  }
  const peerAuthentications: LiveSecurityNetworkPeerAuth[] = rawPA.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid peerAuthentication at index ${idx}`);
    }
    const it = item as Record<string, unknown>;
    const name = typeof it.name === 'string' ? it.name : `peerauth-${idx}`;
    const mode = typeof it.mode === 'string' ? it.mode : 'UNSPECIFIED';
    const selector = (it.selector && typeof it.selector === 'object') ? (it.selector as Record<string, unknown>) : {};
    const matchLabels = (selector.matchLabels && typeof selector.matchLabels === 'object')
      ? (selector.matchLabels as Record<string, string>)
      : {};
    return {
      name,
      mode,
      selector: { matchLabels },
      workloadScoped: Boolean(it.workloadScoped ?? (Object.keys(matchLabels).length > 0)),
    };
  });

  // Validate workloads
  const rawWorkloads = record.workloads;
  if (!Array.isArray(rawWorkloads)) {
    throw new Error('Malformed security network response: workloads must be an array');
  }
  const workloads: LiveSecurityNetworkWorkload[] = rawWorkloads.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid workload at index ${idx}`);
    }
    const it = item as Record<string, unknown>;
    const name = typeof it.name === 'string' ? it.name : `pod-${idx}`;
    const phase = typeof it.phase === 'string' ? it.phase : 'Unknown';
    const labels = (it.labels && typeof it.labels === 'object') ? (it.labels as Record<string, string>) : {};
    const rawSidecar = (it.sidecar && typeof it.sidecar === 'object') ? (it.sidecar as Record<string, unknown>) : {};
    const loc = rawSidecar.location;
    const location: 'initContainers' | 'containers' | 'none' =
      loc === 'initContainers' || loc === 'containers' ? loc : 'none';

    return {
      name,
      phase,
      labels,
      sidecar: {
        present: Boolean(rawSidecar.present),
        containerName: typeof rawSidecar.containerName === 'string' ? rawSidecar.containerName : null,
        location,
        nativeSidecar: Boolean(rawSidecar.nativeSidecar),
        ready: Boolean(rawSidecar.ready),
      },
    };
  });

  // Validate networkPolicies
  const rawNP = record.networkPolicies;
  if (!Array.isArray(rawNP)) {
    throw new Error('Malformed security network response: networkPolicies must be an array');
  }
  const networkPolicies: LiveSecurityNetworkPolicy[] = rawNP.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid networkPolicy at index ${idx}`);
    }
    const it = item as Record<string, unknown>;
    const name = typeof it.name === 'string' ? it.name : `netpol-${idx}`;
    const podSelector = (it.podSelector && typeof it.podSelector === 'object')
      ? (it.podSelector as Record<string, unknown>)
      : {};
    const matchLabels = (podSelector.matchLabels && typeof podSelector.matchLabels === 'object')
      ? (podSelector.matchLabels as Record<string, string>)
      : {};
    const policyTypes = Array.isArray(it.policyTypes) ? (it.policyTypes as string[]) : [];

    const rawIngress = Array.isArray(it.ingress) ? (it.ingress as unknown[]) : [];
    const ingress: LiveSecurityNetworkIngressRule[] = rawIngress.map((rule) => {
      const r = (rule && typeof rule === 'object') ? (rule as Record<string, unknown>) : {};
      const rawFrom = Array.isArray(r.from) ? (r.from as unknown[]) : [];
      const from: LiveSecurityNetworkIngressPeer[] = rawFrom.map((peer) => {
        const p = (peer && typeof peer === 'object') ? (peer as Record<string, unknown>) : {};
        return {
          podSelector: p.podSelector && typeof p.podSelector === 'object'
            ? (p.podSelector as { matchLabels?: Record<string, string> })
            : undefined,
          namespaceSelector: p.namespaceSelector && typeof p.namespaceSelector === 'object'
            ? (p.namespaceSelector as { matchLabels?: Record<string, string> })
            : undefined,
        };
      });
      const rawPorts = Array.isArray(r.ports) ? (r.ports as unknown[]) : [];
      const ports: LiveSecurityNetworkIngressPort[] = rawPorts.map((pt) => {
        const p = (pt && typeof pt === 'object') ? (pt as Record<string, unknown>) : {};
        return {
          port: (typeof p.port === 'number' || typeof p.port === 'string') ? p.port : undefined,
          protocol: typeof p.protocol === 'string' ? p.protocol : 'TCP',
        };
      });
      return { from, ports };
    });

    return {
      name,
      podSelector: { matchLabels },
      policyTypes,
      ingress,
      workloadScoped: Boolean(it.workloadScoped ?? (Object.keys(matchLabels).length > 0)),
    };
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
    peerAuthenticationsAvailable: Boolean(record.peerAuthenticationsAvailable ?? true),
    peerAuthenticationsError: typeof record.peerAuthenticationsError === 'string' ? record.peerAuthenticationsError : null,
    workloads,
    workloadsAvailable: Boolean(record.workloadsAvailable ?? true),
    workloadsError: typeof record.workloadsError === 'string' ? record.workloadsError : null,
    networkPolicies,
    networkPoliciesAvailable: Boolean(record.networkPoliciesAvailable ?? true),
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
