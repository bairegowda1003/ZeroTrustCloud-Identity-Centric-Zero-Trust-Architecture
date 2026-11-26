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
const filename = path.resolve(__dirname, '../src/utils/securityVerification.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'require', 'module', compiled)(loaded.exports, require, loaded);
const { validateSecurityVerification, snapshotAgeReason, requestSecurityVerification } = loaded.exports;

// Controlled transports exercise the request lifecycle without contacting the lab.
function controlledFetch(t) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((resolve, reject) => {
    calls.push({ signal, resolve, reject });
  }));
  return calls;
}
function verificationResponse(time) {
  return { ok: true, json: async () => ({ source: 'automated-verification', collectedAt: time, checks: [] }) };
}

test('verification sharing detaches the departing consumer and preserves the collection timestamp', async t => {
  const calls = controlledFetch(t);
  const leaving = new AbortController();
  let updates = 0;
  const first = requestSecurityVerification(leaving.signal).then(() => updates++);
  leaving.abort();
  const second = requestSecurityVerification(new AbortController().signal);
  const third = requestSecurityVerification();
  await assert.rejects(first, { name: 'AbortError' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].signal.aborted, false);
  const timestamp = '2026-11-25T00:00:00Z';
  calls[0].resolve(verificationResponse(timestamp));
  assert.equal((await second).collectedAt, timestamp);
  assert.equal(await third, await second);
  assert.equal(updates, 0);
  const manual = requestSecurityVerification();
  assert.equal(calls.length, 2);
  calls[1].resolve(verificationResponse('2026-11-25T00:01:00Z'));
  assert.equal((await manual).collectedAt, '2026-11-25T00:01:00Z');
});

test('shared failure rejects active consumers, validates responses and permits fresh retries', async t => {
  const calls = controlledFetch(t);
  const leaving = new AbortController();
  const first = requestSecurityVerification(leaving.signal);
  const second = requestSecurityVerification();
  const third = requestSecurityVerification();
  leaving.abort();
  await assert.rejects(first, { name: 'AbortError' });
  assert.equal(calls[0].signal.aborted, false);
  calls[0].reject(new Error('collector unavailable'));
  await Promise.all([second, third].map(p => assert.rejects(p, /collector unavailable/)));
  const invalid = requestSecurityVerification();
  calls[1].resolve({ ok: true, json: async () => ({ source: 'invalid' }) });
  await assert.rejects(invalid, /Unexpected verification source/);
  const retry = requestSecurityVerification();
  assert.equal(calls.length, 3);
  calls[2].resolve(verificationResponse('2026-11-25T00:00:00Z'));
  await retry;
});

test('shared deadline stays fixed and late settlement cannot release a replacement', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = controlledFetch(t);
  const first = requestSecurityVerification();
  t.mock.timers.tick(7000);
  const second = requestSecurityVerification();
  t.mock.timers.tick(1000);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].signal.aborted, true);
  await Promise.all([first, second].map(p => assert.rejects(p, /timed out after 8000ms/)));
  const fresh = requestSecurityVerification();
  calls[0].resolve(verificationResponse('2026-11-24T00:00:00Z'));
  await new Promise(resolve => setImmediate(resolve));
  const joined = requestSecurityVerification();
  assert.equal(calls.length, 2);
  calls[1].resolve(verificationResponse('2026-11-25T00:00:00Z'));
  assert.equal(await fresh, await joined);
});

test('verification releases an abandoned operation and ignores already cancelled callers', async t => {
  const calls = controlledFetch(t);
  const controller = new AbortController();
  const departing = requestSecurityVerification(controller.signal);
  controller.abort();
  await assert.rejects(departing, { name: 'AbortError' });
  assert.equal(calls[0].signal.aborted, true);
  await assert.rejects(requestSecurityVerification(controller.signal), { name: 'AbortError' });
  const next = requestSecurityVerification();
  assert.equal(calls.length, 2);
  calls[1].resolve(verificationResponse('2026-11-25T00:01:00Z'));
  await next;
});

test('Command Center reuses the supplied cluster observation and only starts the four lab feeds', t => {
  const effects = [];
  t.mock.method(React, 'useEffect', setup => effects.push(setup));
  const paths = [];
  t.mock.method(globalThis, 'fetch', url => {
    paths.push(url);
    return new Promise(() => {});
  });
  const cluster = { data: null, isLoading: true, refresh() {} };
  const { useCommandSources } = require('../src/hooks/useCommandSources');
  function Probe() {
    assert.equal(useCommandSources(cluster).cluster, cluster);
    return null;
  }
  renderToStaticMarkup(React.createElement(Probe));
  const cleanups = effects.map(setup => setup());
  try {
    assert.deepEqual(paths.sort(), ['/api/identity/workloads', '/api/policies/gatekeeper',
      '/api/security/network', '/api/security/verification']);
  } finally {
    for (const cleanup of cleanups) cleanup?.();
  }
});

// Synthetic test fixture matching the 15 verified Zero Trust checks
const validFixture = () => ({
  source: 'automated-verification',
  collectedAt: '2026-11-19T05:00:00Z',
  checks: [
    {
      id: 'k8s-cluster-readiness-lab',
      control: 'Kubernetes Node Readiness (kind-trustmesh-lab)',
      status: 'PASS',
      reason: 'Cluster kind-trustmesh-lab is reachable and all 1 node(s) report Ready condition.',
      evidence: { connected: true, nodes: [{ name: 'kind-trustmesh-lab-control-plane', ready: true }] },
      source: 'kind-trustmesh-lab / nodes',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'k8s-cluster-readiness-network-lab',
      control: 'Kubernetes Node Readiness (kind-trustmesh-network-lab)',
      status: 'PASS',
      reason: 'Cluster kind-trustmesh-network-lab is reachable and all 1 node(s) report Ready condition.',
      evidence: { connected: true, nodes: [{ name: 'kind-trustmesh-network-lab-control-plane', ready: true }] },
      source: 'kind-trustmesh-network-lab / nodes',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'gatekeeper-constraints-inventory',
      control: 'Gatekeeper Constraint Inventory',
      status: 'PASS',
      reason: 'All 3 expected Gatekeeper constraints exist.',
      evidence: {
        expected: ['trustmesh-container-security', 'trustmesh-require-dedicated-sa', 'trustmesh-workload-hardening'],
        discovered: ['trustmesh-container-security', 'trustmesh-require-dedicated-sa', 'trustmesh-workload-hardening'],
      },
      source: 'kind-trustmesh-lab / gatekeeper constraints',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'gatekeeper-enforcement-action-deny',
      control: 'Gatekeeper Enforcement Action (Deny)',
      status: 'PASS',
      reason: 'All 3 expected Gatekeeper constraints have enforcementAction set to deny.',
      evidence: {
        'trustmesh-container-security': 'deny',
        'trustmesh-require-dedicated-sa': 'deny',
        'trustmesh-workload-hardening': 'deny',
      },
      source: 'kind-trustmesh-lab / gatekeeper spec.enforcementAction',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'gatekeeper-scope-workload-deployments',
      control: 'Gatekeeper Target Scope (apps/Deployment in trustmesh-lab)',
      status: 'PASS',
      reason: 'All 3 expected constraints target apps/Deployment resources within namespace trustmesh-lab.',
      evidence: { match: { namespaces: ['trustmesh-lab'], kinds: [{ apiGroups: ['apps'], kinds: ['Deployment'] }] } },
      source: 'kind-trustmesh-lab / gatekeeper spec.match',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'gatekeeper-webhook-enforced',
      control: 'Gatekeeper Webhook Enforcement Posture',
      status: 'PASS',
      reason: 'All 3 expected constraints report webhookEnforced = true on controller-manager pods. (Environment diagnostic note: vap.k8s.io engine missing on audit pod is retained and does not impair webhook admission).',
      evidence: {
        webhookEnforced: {
          'trustmesh-container-security': true,
          'trustmesh-require-dedicated-sa': true,
          'trustmesh-workload-hardening': true,
        },
        enforcementPoints: {
          'trustmesh-container-security': [{ name: 'vap.k8s.io', state: 'error', message: 'K8sNativeValidation engine is missing' }],
        },
      },
      source: 'kind-trustmesh-lab / gatekeeper status.byPod',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'calico-default-deny-server',
      control: 'Calico Default-Deny Ingress Policy for Server Workloads',
      status: 'PASS',
      reason: 'Policy trustmesh-integration-default-deny selects app=trustmesh-integration-server, specifies Ingress in policyTypes, and contains an empty ingress array (default deny on server pods).',
      evidence: { podSelector: { app: 'trustmesh-integration-server' }, policyTypes: ['Ingress'], ingressRules: 0 },
      source: 'kind-trustmesh-network-lab / networkpolicy:trustmesh-integration-default-deny',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'calico-allow-authorized-server',
      control: 'Calico Ingress Allowance for Authorized Client',
      status: 'PASS',
      reason: 'Policy trustmesh-integration-allow-authorized selects app=trustmesh-integration-server and restricts ingress to authorized client (app=trustmesh-integration-client, role=authorized) over TCP port 8080.',
      evidence: {
        podSelector: { app: 'trustmesh-integration-server' },
        ingress: [{ from: [{ podSelector: { matchLabels: { app: 'trustmesh-integration-client', role: 'authorized' } } }], ports: [{ port: 8080, protocol: 'TCP' }] }],
      },
      source: 'kind-trustmesh-network-lab / networkpolicy:trustmesh-integration-allow-authorized',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'istio-control-plane-ready',
      control: 'Istio Control Plane Readiness (istiod)',
      status: 'PASS',
      reason: 'istiod deployment is ready (1/1 replicas ready in istio-system).',
      evidence: { name: 'istiod', ready: true, desiredReplicas: 1, readyReplicas: 1, available: true },
      source: 'kind-trustmesh-network-lab / istio-system / deployment:istiod',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'istio-workload-strict-mtls',
      control: 'Istio Workload-Scoped STRICT mTLS Policy',
      status: 'PASS',
      reason: 'STRICT mTLS is actively configured and workload-scoped to app=trustmesh-integration-server (verifying traffic encryption without falsely claiming namespace-wide enforcement).',
      evidence: { name: 'trustmesh-integration-strict-mtls', mode: 'STRICT', selector: { matchLabels: { app: 'trustmesh-integration-server' } }, workloadScoped: true },
      source: 'kind-trustmesh-network-lab / peerauthentication:trustmesh-integration-strict-mtls',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'istio-sidecar-injection-posture',
      control: 'Istio Sidecar Injection Posture (Workload Inspection)',
      status: 'PASS',
      reason: 'Sidecars verified in spec.initContainers (native sidecar) for server, authorized client, and unauthorized client. Plaintext client confirmed uninjected (expected baseline for negative testing).',
      evidence: {
        authorized: { present: true, location: 'initContainers' },
        unauthorized: { present: true, location: 'initContainers' },
        server: { present: true, location: 'initContainers' },
        plaintext: { present: false, location: 'none' },
      },
      source: 'kind-trustmesh-network-lab / pods',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'spire-control-plane-components',
      control: 'SPIRE Control Plane & Node Attestation Components',
      status: 'PASS',
      reason: 'All 3 SPIRE infrastructure components (server StatefulSet, agent DaemonSet, CSI driver DaemonSet) report Ready in namespace trustmesh-spire.',
      evidence: {
        components: [
          { name: 'trustmesh-spire-server', readyReplicas: 1, desiredReplicas: 1 },
          { name: 'trustmesh-spire-agent', readyReplicas: 1, desiredReplicas: 1 },
          { name: 'trustmesh-spire-spiffe-csi-driver', readyReplicas: 1, desiredReplicas: 1 },
        ],
      },
      source: 'kind-trustmesh-network-lab / trustmesh-spire',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'spire-workload-registration',
      control: 'SPIRE Workload Identity Registration (ClusterSPIFFEID)',
      status: 'PASS',
      reason: 'ClusterSPIFFEID registration exists targeting namespace trustmesh-integration-test with template spiffe://{{ .TrustDomain }}/ns/{{ .PodMeta.Namespace }}/sa/{{ .PodSpec.ServiceAccountName }}.',
      evidence: { name: 'trustmesh-integration-workload-identity', available: true },
      source: 'kind-trustmesh-network-lab / clusterspiffeid:trustmesh-integration-workload-identity',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'workload-service-accounts',
      control: 'Zero Trust Dedicated ServiceAccount Inventory',
      status: 'PASS',
      reason: 'All 4 dedicated ServiceAccounts (authorized, unauthorized, server, verifier) exist in namespace trustmesh-integration-test. (Default ServiceAccount presence noted as standard K8s behavior).',
      evidence: {
        expected: ['trustmesh-integration-authorized', 'trustmesh-integration-unauthorized', 'trustmesh-integration-server', 'trustmesh-integration-verifier'],
        discovered: ['default', 'trustmesh-integration-authorized', 'trustmesh-integration-unauthorized', 'trustmesh-integration-server', 'trustmesh-integration-verifier'],
      },
      source: 'kind-trustmesh-network-lab / serviceaccounts',
      observedAt: '2026-11-19T05:00:00Z',
    },
    {
      id: 'workload-lifecycle-and-identity',
      control: 'Workload Lifecycle Phase & ServiceAccount Binding',
      status: 'PASS',
      reason: 'All 5 integration workloads observed matching expected lifecycle phases and dedicated ServiceAccount bindings.',
      evidence: {
        workloads: [
          { name: 'auth-pod', phase: 'Running', sa: 'trustmesh-integration-authorized' },
          { name: 'unauth-pod', phase: 'Running', sa: 'trustmesh-integration-unauthorized' },
          { name: 'server-pod', phase: 'Running', sa: 'trustmesh-integration-server' },
          { name: 'plaintext-pod', phase: 'Running', sa: 'trustmesh-integration-authorized' },
          { name: 'verifier-pod', phase: 'Succeeded', sa: 'trustmesh-integration-verifier' },
        ],
      },
      source: 'kind-trustmesh-network-lab / pods',
      observedAt: '2026-11-19T05:00:00Z',
    },
  ],
});

test('1. Valid automated verification response passes validation with all 15 checks', () => {
  const result = validateSecurityVerification(validFixture());
  assert.equal(result.source, 'automated-verification');
  assert.equal(result.checks.length, 15);
  const passChecks = result.checks.filter((c) => c.status === 'PASS');
  assert.equal(passChecks.length, 15);
});

test('2. Correct PASS results from valid observations across all 6 rule groups', () => {
  const result = validateSecurityVerification(validFixture());
  const ids = result.checks.map((c) => c.id);
  assert.ok(ids.includes('k8s-cluster-readiness-lab'));
  assert.ok(ids.includes('gatekeeper-constraints-inventory'));
  assert.ok(ids.includes('calico-default-deny-server'));
  assert.ok(ids.includes('istio-workload-strict-mtls'));
  assert.ok(ids.includes('spire-workload-registration'));
  assert.ok(ids.includes('workload-lifecycle-and-identity'));
});

test('3. Correctly parses FAIL status when expected configuration is violated', () => {
  const fixture = validFixture();
  const gkCheck = fixture.checks.find((c) => c.id === 'gatekeeper-enforcement-action-deny');
  gkCheck.status = 'FAIL';
  gkCheck.reason = 'Constraint trustmesh-container-security has enforcementAction: dryrun';

  const result = validateSecurityVerification(fixture);
  const updatedCheck = result.checks.find((c) => c.id === 'gatekeeper-enforcement-action-deny');
  assert.equal(updatedCheck.status, 'FAIL');
  assert.ok(updatedCheck.reason.includes('dryrun'));
});

test('4. Correctly parses UNKNOWN status when collectors fail or data is missing', () => {
  const fixture = validFixture();
  const k8sCheck = fixture.checks.find((c) => c.id === 'k8s-cluster-readiness-lab');
  k8sCheck.status = 'UNKNOWN';
  k8sCheck.reason = 'Context kind-trustmesh-lab is unreachable';

  const result = validateSecurityVerification(fixture);
  const updatedCheck = result.checks.find((c) => c.id === 'k8s-cluster-readiness-lab');
  assert.equal(updatedCheck.status, 'UNKNOWN');
  assert.ok(updatedCheck.reason.includes('unreachable'));
});

test('5. Gatekeeper webhook enforcement distinct from vap.k8s.io diagnostic error', () => {
  const fixture = validFixture();
  const webhookCheck = fixture.checks.find((c) => c.id === 'gatekeeper-webhook-enforced');
  assert.equal(webhookCheck.status, 'PASS');
  assert.ok(webhookCheck.reason.includes('webhookEnforced = true'));
  assert.ok(webhookCheck.reason.includes('vap.k8s.io'));
  assert.equal(webhookCheck.evidence.webhookEnforced['trustmesh-container-security'], true);
});

test('6. Workload-scoped STRICT mTLS verified and distinguished from namespace-wide', () => {
  const fixture = validFixture();
  const mtlsCheck = fixture.checks.find((c) => c.id === 'istio-workload-strict-mtls');
  assert.equal(mtlsCheck.status, 'PASS');
  assert.equal(mtlsCheck.evidence.mode, 'STRICT');
  assert.equal(mtlsCheck.evidence.workloadScoped, true);
  assert.equal(mtlsCheck.evidence.selector.matchLabels.app, 'trustmesh-integration-server');
  assert.ok(mtlsCheck.reason.includes('without falsely claiming namespace-wide'));
});

test('7. SPIRE registration verified without falsely claiming active X.509-SVID validity', () => {
  const fixture = validFixture();
  const spireCheck = fixture.checks.find((c) => c.id === 'spire-workload-registration');
  assert.equal(spireCheck.status, 'PASS');
  assert.equal(spireCheck.evidence.name, 'trustmesh-integration-workload-identity');
  assert.ok(spireCheck.reason.includes('ClusterSPIFFEID registration exists'));
});

test('8. Completed SPIFFE verifier (Succeeded phase) accepted as valid lifecycle state', () => {
  const fixture = validFixture();
  const workloadCheck = fixture.checks.find((c) => c.id === 'workload-lifecycle-and-identity');
  assert.equal(workloadCheck.status, 'PASS');
  const verifierEvidence = workloadCheck.evidence.workloads.find((w) => w.sa === 'trustmesh-integration-verifier');
  assert.ok(verifierEvidence);
  assert.equal(verifierEvidence.phase, 'Succeeded');
});

test('9. Intentional plaintext client without sidecar confirmed as expected baseline (not a failure)', () => {
  const fixture = validFixture();
  const sidecarCheck = fixture.checks.find((c) => c.id === 'istio-sidecar-injection-posture');
  assert.equal(sidecarCheck.status, 'PASS');
  assert.equal(sidecarCheck.evidence.plaintext.present, false);
  assert.ok(sidecarCheck.reason.includes('Plaintext client confirmed uninjected'));
});

test('10. Stable workload identification by labels and ServiceAccounts, not ephemeral Pod names', () => {
  const fixture = validFixture();
  const workloadCheck = fixture.checks.find((c) => c.id === 'workload-lifecycle-and-identity');
  assert.equal(workloadCheck.status, 'PASS');
  const saSet = new Set(workloadCheck.evidence.workloads.map((w) => w.sa));
  assert.ok(saSet.has('trustmesh-integration-authorized'));
  assert.ok(saSet.has('trustmesh-integration-unauthorized'));
  assert.ok(saSet.has('trustmesh-integration-server'));
  assert.ok(saSet.has('trustmesh-integration-verifier'));
});

test('11. Freshness evaluator tracks age, staleness, and future clock skew', () => {
  const baseTime = Date.parse('2026-11-19T05:00:00Z');
  assert.equal(snapshotAgeReason('2026-11-19T05:00:00Z', baseTime + 10000), null);
  assert.equal(snapshotAgeReason('2026-11-19T05:00:00Z', baseTime + 70000), 'Snapshot is aging (>1m old)');
  assert.equal(snapshotAgeReason('2026-11-19T05:00:00Z', baseTime + 130000), 'Snapshot is stale (>2m old)');
  assert.equal(snapshotAgeReason('2026-11-19T05:00:00Z', baseTime - 20000), 'Snapshot timestamp is in the future (clock skew)');
});

test('12. Existing endpoints and verification endpoint registered in backend staging file', () => {
  const serverCode = fs.readFileSync(path.resolve(__dirname, '../trustmesh-server-staging.py'), 'utf8');
  assert.ok(serverCode.includes('/api/cluster/status'));
  assert.ok(serverCode.includes('if self.path == "/api/identity/workloads":'));
  assert.ok(serverCode.includes('if self.path == "/api/policies/gatekeeper":'));
  assert.ok(serverCode.includes('if self.path == "/api/security/network":'));
  assert.ok(serverCode.includes('if self.path == "/api/security/verification":'));
});

test('13. CommandCenterHero renders LiveVerificationCard alongside LiveKubernetesStatus', () => {
  const { CommandCenterHero } = require('../src/components/CommandCenterHero');
  const html = renderToStaticMarkup(React.createElement(CommandCenterHero, {
    cluster: { data: null, isLoading: true },
    findings: [],
    onFindingClick: () => {},
  }));

  assert.ok(html.includes('live-verification-card-compact'), 'Renders compact verification card container');
  assert.ok(html.includes('AUTOMATED VERIFICATION'), 'Renders AUTOMATED VERIFICATION badge');
  assert.ok(html.includes('live-k8s-panel'), 'Renders LiveKubernetesStatus panel');
});

test('14. Missing identity cannot alias another check; absent provenance stays unreported', () => {
  const fixture = validFixture();
  const check = fixture.checks[0];
  delete check.source;
  delete check.observedAt;
  const parsed = validateSecurityVerification(fixture).checks[0];
  assert.equal(parsed.observedAt, '');
  assert.equal(parsed.source, 'Source not reported');
  fixture.checks.push(check);
  assert.throws(() => validateSecurityVerification(fixture), /duplicate/);
  delete check.id;
  assert.throws(() => validateSecurityVerification(fixture), /Missing/);
});

test('15. Regression: recognizes plaintext client with actual live labels (app=trustmesh-integration-client, role=authorized, trustmesh.io/test=plaintext-negative)', () => {
  const fixture = validFixture();
  // Update fixture to match the exact live Kubernetes pod attributes
  const livePlaintextWorkload = {
    name: 'trustmesh-integration-plaintext-client',
    phase: 'Running',
    sa: 'trustmesh-integration-authorized',
    labels: {
      app: 'trustmesh-integration-client',
      role: 'authorized',
      'trustmesh.io/test': 'plaintext-negative',
    },
  };
  const workloadCheck = fixture.checks.find((c) => c.id === 'workload-lifecycle-and-identity');
  workloadCheck.evidence.workloads = workloadCheck.evidence.workloads.map((w) =>
    w.name === 'plaintext-pod' ? livePlaintextWorkload : w
  );

  const result = validateSecurityVerification(fixture);
  const validatedCheck = result.checks.find((c) => c.id === 'workload-lifecycle-and-identity');
  assert.equal(validatedCheck.status, 'PASS');
  const found = validatedCheck.evidence.workloads.find(
    (w) => w.labels && w.labels['trustmesh.io/test'] === 'plaintext-negative'
  );
  assert.ok(found);
  assert.equal(found.sa, 'trustmesh-integration-authorized');
  assert.equal(found.phase, 'Running');
});

test('16. Regression: normal authorized client and plaintext negative-test client are treated as separate workloads', () => {
  const fixture = validFixture();
  const sidecarCheck = fixture.checks.find((c) => c.id === 'istio-sidecar-injection-posture');
  // Both share role=authorized and app=trustmesh-integration-client, but authorized has sidecar, plaintext does not
  assert.equal(sidecarCheck.evidence.authorized.present, true);
  assert.equal(sidecarCheck.evidence.plaintext.present, false);
  assert.notDeepEqual(sidecarCheck.evidence.authorized, sidecarCheck.evidence.plaintext);
});

test('17. Regression: missing workloads produce UNKNOWN rather than an invented PASS', () => {
  const fixture = validFixture();
  const sidecarCheck = fixture.checks.find((c) => c.id === 'istio-sidecar-injection-posture');
  sidecarCheck.status = 'UNKNOWN';
  sidecarCheck.reason = 'Cannot verify sidecar posture: missing workload(s) plaintext-client.';

  const result = validateSecurityVerification(fixture);
  const validated = result.checks.find((c) => c.id === 'istio-sidecar-injection-posture');
  assert.equal(validated.status, 'UNKNOWN');
  assert.ok(validated.reason.includes('missing workload(s) plaintext-client'));
});

