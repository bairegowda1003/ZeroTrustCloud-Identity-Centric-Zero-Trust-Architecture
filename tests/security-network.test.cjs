const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Setup TypeScript transpile hook for server rendering
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2020,
      },
    });
    module._compile(compiled.outputText, filename);
  };
}

// Compile utility module in memory
const filename = path.resolve(__dirname, '../src/utils/securityNetwork.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'require', 'module', compiled)(loaded.exports, require, loaded);
const { validateSecurityNetwork, snapshotAgeReason, requestSecurityNetwork } = loaded.exports;

// Synthetic test fixture matching verified Kali / Kubernetes telemetry
const fixture = () => ({
  source: 'live-kubernetes',
  cluster: 'kind-trustmesh-network-lab',
  namespace: 'trustmesh-integration-test',
  istioSystemNamespace: 'istio-system',
  collectedAt: '2026-11-19T04:30:00Z',
  available: true,
  error: null,
  istiod: {
    name: 'istiod',
    ready: true,
    desiredReplicas: 1,
    readyReplicas: 1,
    available: true,
    error: null,
  },
  namespaceInjection: {
    namespace: 'trustmesh-integration-test',
    enabled: true,
    labelValue: 'enabled',
    available: true,
    error: null,
  },
  peerAuthentications: [
    {
      name: 'trustmesh-integration-strict-mtls',
      mode: 'STRICT',
      selector: {
        matchLabels: {
          app: 'trustmesh-integration-server',
        },
      },
      workloadScoped: true,
    },
  ],
  peerAuthenticationsAvailable: true,
  peerAuthenticationsError: null,
  workloads: [
    {
      name: 'trustmesh-integration-authorized-7c9bcd47f-6txvk',
      phase: 'Running',
      labels: { app: 'trustmesh-integration-client', role: 'authorized' },
      sidecar: {
        present: true,
        containerName: 'istio-proxy',
        location: 'initContainers',
        nativeSidecar: true,
        ready: true,
      },
    },
    {
      name: 'trustmesh-integration-unauthorized-5d49646b59-4mxlk',
      phase: 'Running',
      labels: { app: 'trustmesh-integration-client', role: 'unauthorized' },
      sidecar: {
        present: true,
        containerName: 'istio-proxy',
        location: 'initContainers',
        nativeSidecar: true,
        ready: true,
      },
    },
    {
      name: 'trustmesh-integration-server-678c4856f6-4w29d',
      phase: 'Running',
      labels: { app: 'trustmesh-integration-server' },
      sidecar: {
        present: true,
        containerName: 'istio-proxy',
        location: 'initContainers',
        nativeSidecar: true,
        ready: true,
      },
    },
    {
      name: 'trustmesh-integration-plaintext-client-86c679fc4d-q7n4b',
      phase: 'Running',
      labels: { app: 'trustmesh-integration-plaintext' },
      sidecar: {
        present: false,
        containerName: null,
        location: 'none',
        nativeSidecar: false,
        ready: false,
      },
    },
    {
      name: 'trustmesh-integration-spiffe-verifier-q9s8f',
      phase: 'Succeeded',
      labels: { app: 'trustmesh-integration-verifier' },
      sidecar: {
        present: false,
        containerName: null,
        location: 'none',
        nativeSidecar: false,
        ready: false,
      },
    },
  ],
  workloadsAvailable: true,
  workloadsError: null,
  networkPolicies: [
    {
      name: 'trustmesh-integration-default-deny',
      podSelector: {
        matchLabels: {
          app: 'trustmesh-integration-server',
        },
      },
      policyTypes: ['Ingress'],
      ingress: [],
      workloadScoped: true,
    },
    {
      name: 'trustmesh-integration-allow-authorized',
      podSelector: {
        matchLabels: {
          app: 'trustmesh-integration-server',
        },
      },
      policyTypes: ['Ingress'],
      ingress: [
        {
          from: [
            {
              podSelector: {
                matchLabels: {
                  app: 'trustmesh-integration-client',
                  role: 'authorized',
                },
              },
            },
          ],
          ports: [
            {
              port: 8080,
              protocol: 'TCP',
            },
          ],
        },
      ],
      workloadScoped: true,
    },
  ],
  networkPoliciesAvailable: true,
  networkPoliciesError: null,
});

test('1. Valid live network security response is accepted by validator', () => {
  const result = validateSecurityNetwork(fixture());
  assert.equal(result.source, 'live-kubernetes');
  assert.equal(result.cluster, 'kind-trustmesh-network-lab');
  assert.equal(result.namespace, 'trustmesh-integration-test');
  assert.equal(result.available, true);
  assert.equal(result.istiod.ready, true);
  assert.equal(result.peerAuthentications.length, 1);
  assert.equal(result.workloads.length, 5);
  assert.equal(result.networkPolicies.length, 2);
});

test('2. Workload-scoped STRICT mTLS verified correctly', () => {
  const result = validateSecurityNetwork(fixture());
  const pa = result.peerAuthentications[0];
  assert.equal(pa.name, 'trustmesh-integration-strict-mtls');
  assert.equal(pa.mode, 'STRICT');
  assert.equal(pa.workloadScoped, true);
  assert.equal(pa.selector.matchLabels.app, 'trustmesh-integration-server');
});

test('3. Sidecar detection in spec.initContainers verified', () => {
  const result = validateSecurityNetwork(fixture());
  const authorized = result.workloads.find((w) => w.labels.role === 'authorized');
  const server = result.workloads.find((w) => w.labels.app === 'trustmesh-integration-server');

  assert.ok(authorized);
  assert.equal(authorized.sidecar.present, true);
  assert.equal(authorized.sidecar.location, 'initContainers');
  assert.equal(authorized.sidecar.containerName, 'istio-proxy');
  assert.equal(authorized.sidecar.nativeSidecar, true);

  assert.ok(server);
  assert.equal(server.sidecar.present, true);
  assert.equal(server.sidecar.location, 'initContainers');
});

test('4. Plaintext client and Succeeded SPIFFE verifier without sidecar verified', () => {
  const result = validateSecurityNetwork(fixture());
  const plaintext = result.workloads.find((w) => w.labels.app === 'trustmesh-integration-plaintext');
  const verifier = result.workloads.find((w) => w.labels.app === 'trustmesh-integration-verifier');

  assert.ok(plaintext);
  assert.equal(plaintext.sidecar.present, false);
  assert.equal(plaintext.sidecar.location, 'none');

  assert.ok(verifier);
  assert.equal(verifier.phase, 'Succeeded');
  assert.equal(verifier.sidecar.present, false);
  assert.equal(verifier.sidecar.location, 'none');
});

test('5. NetworkPolicy rule parsing: default-deny has empty ingress, allow-authorized has TCP 8080 ingress', () => {
  const result = validateSecurityNetwork(fixture());
  const defaultDeny = result.networkPolicies.find((np) => np.name === 'trustmesh-integration-default-deny');
  const allowAuth = result.networkPolicies.find((np) => np.name === 'trustmesh-integration-allow-authorized');

  assert.ok(defaultDeny);
  assert.deepEqual(defaultDeny.policyTypes, ['Ingress']);
  assert.equal(defaultDeny.ingress.length, 0);
  assert.equal(defaultDeny.workloadScoped, true);
  assert.equal(defaultDeny.podSelector.matchLabels.app, 'trustmesh-integration-server');

  assert.ok(allowAuth);
  assert.equal(allowAuth.ingress.length, 1);
  const rule = allowAuth.ingress[0];
  assert.equal(rule.from.length, 1);
  assert.equal(rule.from[0].podSelector.matchLabels.app, 'trustmesh-integration-client');
  assert.equal(rule.from[0].podSelector.matchLabels.role, 'authorized');
  assert.equal(rule.ports.length, 1);
  assert.equal(rule.ports[0].port, 8080);
  assert.equal(rule.ports[0].protocol, 'TCP');
  assert.equal(allowAuth.workloadScoped, true);
});

test('6. Partial API failures preserved (PeerAuthentication or Istiod unavailable)', () => {
  const partial = fixture();
  partial.peerAuthentications = [];
  partial.peerAuthenticationsAvailable = false;
  partial.peerAuthenticationsError = 'PeerAuthentication inventory unavailable';
  partial.istiod.available = false;
  partial.istiod.error = 'Istiod status unavailable';

  const result = validateSecurityNetwork(partial);
  assert.equal(result.available, true);
  assert.equal(result.peerAuthenticationsAvailable, false);
  assert.equal(result.peerAuthenticationsError, 'PeerAuthentication inventory unavailable');
  assert.equal(result.istiod.available, false);
  assert.equal(result.workloads.length, 5);
  assert.equal(result.networkPolicies.length, 2);
});

test('7. Freshness evaluator tracks age, staleness, and future clock skew', () => {
  const baseTime = Date.parse('2026-11-19T04:30:00Z');
  assert.equal(snapshotAgeReason('2026-11-19T04:30:00Z', baseTime + 10000), null);
  assert.equal(snapshotAgeReason('2026-11-19T04:30:00Z', baseTime + 70000), 'Snapshot is aging (>1m old)');
  assert.equal(snapshotAgeReason('2026-11-19T04:30:00Z', baseTime + 130000), 'Snapshot is stale (>2m old)');
  assert.equal(snapshotAgeReason('2026-11-19T04:30:00Z', baseTime - 20000), 'Snapshot timestamp is in the future (clock skew)');
});

test('8. Rejects malformed payload missing mandatory fields', () => {
  assert.throws(() => validateSecurityNetwork(null), /payload is not an object/);
  assert.throws(() => validateSecurityNetwork({ source: 'not-k8s' }), /Unexpected telemetry source/);
  assert.throws(() => validateSecurityNetwork({ source: 'live-kubernetes', cluster: '' }), /missing cluster/);
});

test('9. HTTP 503 and network errors rejected properly by request function', async () => {
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Network security telemetry unavailable' }),
    });
    await assert.rejects(
      () => requestSecurityNetwork(),
      /Failed to retrieve live network security telemetry: HTTP 503 - Network security telemetry unavailable/
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('10. TrustArchitectureView renders both live telemetry section and demonstration section', () => {
  const { TrustArchitectureView } = require('../src/components/mesh/TrustArchitectureView');
  const html = renderToStaticMarkup(React.createElement(TrustArchitectureView));

  assert.ok(html.includes('live-network-security-container'), 'Renders LiveNetworkSecurityStatus container');
  assert.ok(html.includes('LIVE KUBERNETES'), 'Renders LIVE KUBERNETES source badge');
  assert.ok(html.includes('DEMONSTRATION / SIMULATED INTERFACE'), 'Renders demonstration interface boundary');
  assert.ok(html.includes('mesh-ring-grid'), 'Renders existing mesh summary cards below divider');
  assert.ok(html.includes('Service Mesh Paths'), 'Renders subview navigation tabs');
});
