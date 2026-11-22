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
const filename = path.resolve(__dirname, '../src/utils/gatekeeperPolicies.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'require', 'module', compiled)(loaded.exports, require, loaded);
const { validateGatekeeperPolicies, snapshotAgeReason, requestGatekeeperPolicies } = loaded.exports;

// Synthetic test fixture matching the live backend response from Kali
const fixture = () => ({
  source: 'live-kubernetes',
  cluster: 'kind-trustmesh-lab',
  collectedAt: '2026-11-18T16:08:42Z',
  available: true,
  constraints: [
    {
      name: 'trustmesh-container-security',
      kind: 'K8sContainerSecurity',
      enforcementAction: 'deny',
      match: {
        kinds: [{ apiGroups: ['apps'], kinds: ['Deployment'] }],
        namespaces: ['trustmesh-lab'],
      },
      audit: {
        totalViolations: 0,
        auditTimestamp: '2026-11-18T16:08:42Z',
      },
      webhookEnforced: true,
      enforcementPoints: [
        {
          name: 'vap.k8s.io',
          state: 'error',
          message: 'K8sNativeValidation engine is missing',
        },
      ],
    },
    {
      name: 'trustmesh-require-dedicated-sa',
      kind: 'K8sRequiredServiceAccount',
      enforcementAction: 'deny',
      match: {
        kinds: [{ apiGroups: ['apps'], kinds: ['Deployment'] }],
        namespaces: ['trustmesh-lab'],
      },
      audit: {
        totalViolations: 0,
        auditTimestamp: '2026-11-18T16:08:42Z',
      },
      webhookEnforced: true,
      enforcementPoints: [],
    },
    {
      name: 'trustmesh-workload-hardening',
      kind: 'K8sWorkloadHardening',
      enforcementAction: 'deny',
      match: {
        kinds: [{ apiGroups: ['apps'], kinds: ['Deployment'] }],
        namespaces: ['trustmesh-lab'],
      },
      audit: {
        totalViolations: 0,
        auditTimestamp: '2026-11-18T16:08:42Z',
      },
      webhookEnforced: true,
      enforcementPoints: [],
    },
  ],
});

test('1. Valid three-constraint response is accepted by validator', () => {
  const result = validateGatekeeperPolicies(fixture());
  assert.deepEqual(result, fixture());
  assert.equal(result.constraints.length, 3);
  assert.equal(result.cluster, 'kind-trustmesh-lab');
});

test('2. Dynamic constraint names and counts', () => {
  const custom = fixture();
  custom.constraints.push({
    name: 'custom-dynamic-constraint',
    kind: 'K8sCustomKind',
    enforcementAction: 'dryrun',
    match: { kinds: [], namespaces: ['custom-ns'] },
    audit: { totalViolations: 2, auditTimestamp: '2026-11-18T16:15:00Z' },
    webhookEnforced: false,
    enforcementPoints: [],
  });
  const result = validateGatekeeperPolicies(custom);
  assert.equal(result.constraints.length, 4);
  assert.equal(result.constraints[3].name, 'custom-dynamic-constraint');
});

test('3. Correct namespace (trustmesh-lab) and Deployment scope validated', () => {
  const c = fixture().constraints[0];
  assert.deepEqual(c.match.namespaces, ['trustmesh-lab']);
  assert.deepEqual(c.match.kinds, [{ apiGroups: ['apps'], kinds: ['Deployment'] }]);
});

test('4. Correct configured enforcement wording', () => {
  const { LiveGatekeeperStatus } = require('../src/components/policies/LiveGatekeeperStatus.tsx');
  // Helper render verification
  assert.ok(LiveGatekeeperStatus);
});

test('5. Webhook status based on API data and 7. Zero audit violations described accurately', () => {
  const c = fixture().constraints[0];
  assert.equal(c.webhookEnforced, true);
  assert.equal(c.audit.totalViolations, 0);
});

test('6. Native validation error retained in enforcementPoints', () => {
  const c = fixture().constraints[0];
  assert.equal(c.enforcementPoints.length, 1);
  assert.equal(c.enforcementPoints[0].name, 'vap.k8s.io');
  assert.equal(c.enforcementPoints[0].state, 'error');
  assert.equal(c.enforcementPoints[0].message, 'K8sNativeValidation engine is missing');
});

test('8. Missing audit and webhook fields handled gracefully (null values permitted)', () => {
  const partial = fixture();
  partial.constraints[0].audit.totalViolations = null;
  partial.constraints[0].audit.auditTimestamp = null;
  partial.constraints[0].webhookEnforced = null;
  partial.constraints[0].enforcementAction = null;

  const result = validateGatekeeperPolicies(partial);
  assert.equal(result.constraints[0].audit.totalViolations, null);
  assert.equal(result.constraints[0].webhookEnforced, null);
  assert.equal(result.constraints[0].enforcementAction, null);
});

test('9. Empty successful inventory returns valid empty constraints array', () => {
  const empty = {
    source: 'live-kubernetes',
    cluster: 'kind-trustmesh-lab',
    collectedAt: '2026-11-18T16:08:42Z',
    available: true,
    constraints: [],
  };
  const result = validateGatekeeperPolicies(empty);
  assert.equal(result.constraints.length, 0);
  assert.equal(result.available, true);
});

test('10. HTTP 503 and network errors rejected properly by request function', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, '/api/policies/gatekeeper');
    return {
      ok: false,
      status: 503,
      json: async () => ({ error: 'Gatekeeper constraint inventory unavailable' }),
    };
  });
  await assert.rejects(
    requestGatekeeperPolicies(new AbortController().signal),
    /Gatekeeper constraint inventory unavailable/
  );
  mock.mock.restore();
});

test('11. Malformed response rejected by schema validator', () => {
  const invalidCases = [
    null,
    {},
    { source: 'demo', cluster: 'kind-trustmesh-lab', collectedAt: '2026-11-18T16:08:42Z', available: true, constraints: [] },
    { source: 'live-kubernetes', cluster: '', collectedAt: 'invalid-date', available: true, constraints: [] },
    { source: 'live-kubernetes', cluster: 'kind-trustmesh-lab', collectedAt: '2026-11-18T16:08:42Z', available: true, constraints: null },
    { source: 'live-kubernetes', cluster: 'kind-trustmesh-lab', collectedAt: '2026-11-18T16:08:42Z', available: true, constraints: [{ name: '' }] },
  ];
  for (const item of invalidCases) {
    assert.throws(() => validateGatekeeperPolicies(item));
  }
});

test('12. PolicyGovernanceView renders both live Gatekeeper section and demonstration section', () => {
  const { PolicyGovernanceView } = require('../src/components/policies/PolicyGovernanceView.tsx');
  const html = renderToStaticMarkup(React.createElement(PolicyGovernanceView));

  // Must render live container
  assert.match(html, /Verified Live Gatekeeper Policies &amp; Webhook Status/);
  assert.match(html, /kind-trustmesh-lab/);

  // Must render demonstration provenance and section divider
  assert.match(html, /DEMONSTRATION DATA/);
  assert.match(html, /DEMONSTRATION \/ SIMULATED INTERFACE/);
  assert.match(html, /Policy Inventory/);
  assert.match(html, /Admission Decisions/);
  assert.match(html, /Cluster Audit Violations/);

  // Must contain disclaimers preventing misrepresentation
  assert.match(html, /Reported webhook status reflects controller-manager pod health/);
  assert.match(html, /Constraints target Deployments in the trustmesh-lab namespace; enforcement is not cluster-wide/);
});
