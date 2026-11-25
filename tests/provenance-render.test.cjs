const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Server rendering checks markup, not browser effects or layout.
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React,
        esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
    });
    module._compile(compiled.outputText, filename);
  };
}
const { INITIAL_DEMO_FINDINGS } = require('../src/data/demoFindings.ts');
const notice = 'DEMONSTRATION DATA — NOT LIVE SECURITY TELEMETRY';
const render = (component, props = {}) => renderToStaticMarkup(React.createElement(component, props));

test('security pages identify their actual evidence sources', () => {
  const pages = [
    ['CommandCenterHero', '../src/components/CommandCenterHero.tsx'],
    ['IdentityAccessView', '../src/components/identity/IdentityAccessView.tsx'],
    ['PolicyGovernanceView', '../src/components/policies/PolicyGovernanceView.tsx'],
    ['TrustArchitectureView', '../src/components/mesh/TrustArchitectureView.tsx'],
    ['SupplyChainView', '../src/components/supply-chain/SupplyChainView.tsx'],
    ['SecurityObservabilityView', '../src/components/observability/SecurityObservabilityView.tsx'],
  ];
  for (const [name, filename] of pages) {
    const html = render(require(filename)[name], { findings: INITIAL_DEMO_FINDINGS, onFindingClick() {} });
    const expectedNotice = name === 'SecurityObservabilityView'
      ? 'HISTORICAL EXPERIMENT / DEMONSTRATION'
      : name === 'TrustArchitectureView' ? 'Connections illustrate configured architecture'
      : name === 'SupplyChainView' ? 'Historical / offline evidence'
      : name === 'PolicyGovernanceView' ? 'DEMONSTRATION / SIMULATED'
      : name === 'IdentityAccessView' ? 'Kubernetes reports the assignments' : notice;
    assert.ok(html.includes(expectedNotice), name);
    assert.doesNotMatch(html, /Mathematically Proven|6\/6 Controls Verified|Zero Trust Enforced|>Live<|Negotiating mTLS/);
  }
});

test('session triage removes resolved and suppressed items from priorities', () => {
  const { PriorityFindingsCard } = require('../src/components/PriorityFindingsCard.tsx');
  const findings = INITIAL_DEMO_FINDINGS.map((finding, i) => ({ ...finding, status: i % 2 ? 'resolved' : 'suppressed' }));
  const html = render(PriorityFindingsCard, { findings, onFindingClick() {} });
  assert.match(html, /No unresolved demonstration findings/);
  assert.doesNotMatch(html, /Fail-Closed|35m ago|4 Unresolved/);
});

test('finding drawer labels session-only behavior', () => {
  const { FindingDetailDrawer } = require('../src/components/FindingDetailDrawer.tsx');
  const html = render(FindingDetailDrawer, { finding: INITIAL_DEMO_FINDINGS[0], isOpen: true, onClose() {}, onStatusChange() {} });
  assert.ok(html.includes(notice));
  assert.match(html, /Session-only demonstration triage/);
});
