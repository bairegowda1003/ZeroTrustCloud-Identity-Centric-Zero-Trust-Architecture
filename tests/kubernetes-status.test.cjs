const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Compile in memory using the existing TypeScript dependency; no generated files.
const filename = path.resolve(__dirname, '../src/utils/kubernetesStatus.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'require', 'module', compiled)(loaded.exports, require, loaded);
const { validateKubernetesStatus, snapshotAgeReason, requestKubernetesStatus } = loaded.exports;

// Synthetic test inputs only. These never enter the dashboard or its live endpoint.
const fixture = () => ({
  source: 'live-kubernetes', collectedAt: '2026-11-18T10:00:00Z',
  clusters: [{ name: 'test-cluster', context: 'test-context', connected: true,
    nodes: [{ name: 'test-node', ready: true }] }],
  integration: { available: true, namespace: 'test',
    pods: [{ name: 'test-pod', phase: 'Running', readyContainers: 1, totalContainers: 1 }] },
});

test('accepts complete snapshots and explicitly unavailable empty inventories', () => {
  assert.deepEqual(validateKubernetesStatus(fixture()), fixture());
  const value = fixture();
  value.clusters[0].connected = false;
  value.clusters[0].nodes = [];
  value.integration.available = false;
  value.integration.pods = [];
  assert.deepEqual(validateKubernetesStatus(value), value);
});

test('rejects malformed nested fields, invalid timestamps and readiness counts', () => {
  const mutations = [
    v => { v.source = 'demo'; },
    v => { v.collectedAt = 'invalid'; },
    v => { v.collectedAt = '2026-11-18T10:00:00'; },
    v => { v.clusters = null; },
    v => { v.clusters[0] = null; },
    v => { v.clusters[0].connected = 'false'; },
    v => { delete v.clusters[0].nodes; },
    v => { v.clusters[0].nodes[0].ready = 'true'; },
    v => { v.integration = null; },
    v => { v.integration.available = 1; },
    v => { v.integration.namespace = ''; },
    v => { v.integration.pods = {}; },
    v => { v.integration.pods[0] = null; },
    v => { v.integration.pods[0].phase = 1; },
    v => { v.integration.pods[0].readyContainers = -1; },
    v => { v.integration.pods[0].readyContainers = 2; },
    v => { v.integration.pods[0].totalContainers = 1.5; },
  ];
  for (const mutate of mutations) {
    const value = fixture();
    mutate(value);
    assert.throws(() => validateKubernetesStatus(value), /Invalid Kubernetes response/);
  }
  for (const value of [null, [], {}, 'html']) {
    assert.throws(() => validateKubernetesStatus(value));
  }
});

test('freshness uses API collection age, including expiry and future clock skew', () => {
  const collected = fixture().collectedAt;
  const time = Date.parse(collected);
  assert.equal(snapshotAgeReason(collected, time + 59_999), null);
  assert.match(snapshotAgeReason(collected, time + 60_000), /60 seconds/);
  assert.match(snapshotAgeReason(collected, time - 30_001), /future/);
});

test('fetch uses the existing endpoint and rejects HTTP, JSON and schema failures', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/cluster/status');
    assert.equal(options.cache, 'no-store');
    return { ok: true, json: async () => fixture() };
  });
  assert.deepEqual(await requestKubernetesStatus(new AbortController().signal), fixture());
  mock.mock.mockImplementation(async () => ({ ok: false, status: 503 }));
  await assert.rejects(requestKubernetesStatus(new AbortController().signal), /HTTP 503/);
  mock.mock.mockImplementation(async () => ({ ok: true, json: async () => { throw new SyntaxError('Bad JSON'); } }));
  await assert.rejects(requestKubernetesStatus(new AbortController().signal), /Bad JSON/);
  mock.mock.mockImplementation(async () => ({ ok: true, json: async () => ({}) }));
  await assert.rejects(requestKubernetesStatus(new AbortController().signal), /Invalid Kubernetes response/);
});

test('timeout aborts a stalled request and also bounds body decoding', async t => {
  let requestSignal;
  const mock = t.mock.method(globalThis, 'fetch', async (_, options) => {
    requestSignal = options.signal;
    return new Promise(() => {});
  });
  await assert.rejects(requestKubernetesStatus(new AbortController().signal, 10), /timed out/);
  assert.equal(requestSignal.aborted, true);
  mock.mock.mockImplementation(async (_, options) => {
    requestSignal = options.signal;
    return { ok: true, json: () => new Promise(() => {}) };
  });
  await assert.rejects(requestKubernetesStatus(new AbortController().signal, 10), /timed out/);
  assert.equal(requestSignal.aborted, true);
});

test('cancellation rejects promptly even if transport ignores abort', async t => {
  let requestSignal;
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    requestSignal = options.signal;
    return new Promise(() => {});
  });
  const controller = new AbortController();
  const pending = requestKubernetesStatus(controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(requestSignal.aborted, true);
});
