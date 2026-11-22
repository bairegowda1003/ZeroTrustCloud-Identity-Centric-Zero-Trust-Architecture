const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Setup TypeScript and JSON transpile hooks for server rendering
require.extensions['.json'] = (module, filename) => {
  const content = fs.readFileSync(filename, 'utf8');
  module.exports = JSON.parse(content);
};

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
};

const { SecurityObservabilityView } = require('../src/components/observability/SecurityObservabilityView');
const { ObservabilitySummaryCards } = require('../src/components/observability/ObservabilitySummaryCards');
const { ObservabilityTelemetryHero } = require('../src/components/observability/ObservabilityTelemetryHero');
const { SecurityEventExplorerTable } = require('../src/components/observability/SecurityEventExplorerTable');
const { TelemetryHealthMonitor } = require('../src/components/observability/TelemetryHealthMonitor');
const { ZeroTrustScorecardMatrix } = require('../src/components/observability/ZeroTrustScorecardMatrix');
const { EventDetailDrawer } = require('../src/components/observability/EventDetailDrawer');
const { INITIAL_OBSERVABILITY_SUMMARY, CORRELATED_SECURITY_EVENTS } = require('../src/data/demoObservability');

test('1. Automated verification remains above the simulation divider', () => {
  const html = renderToStaticMarkup(React.createElement(SecurityObservabilityView));

  const verificationPos = html.indexOf('live-verification-detail-container');
  const dividerPos = html.indexOf('demo-section-divider');
  const summaryCardsPos = html.indexOf('obs-gauge-grid');

  assert.ok(verificationPos !== -1, 'LiveVerificationDetail rendered');
  assert.ok(dividerPos !== -1, 'demo-section-divider rendered');
  assert.ok(verificationPos < dividerPos, 'LiveVerificationDetail must be above demo divider');
  assert.ok(dividerPos < summaryCardsPos, 'Demo divider must be above synthetic summary cards');
  assert.ok(
    html.includes('Events, telemetry metrics, collection timestamps, and evaluation scores below are illustrative fixtures'),
    'Includes explanation below divider'
  );
});

test('2. Synthetic telemetry is explicitly identified in summary cards', () => {
  const html = renderToStaticMarkup(
    React.createElement(ObservabilitySummaryCards, { summary: INITIAL_OBSERVABILITY_SUMMARY })
  );

  assert.ok(html.includes('ZERO TRUST POSTURE (ILLUSTRATIVE)'), 'Posture card tagged as illustrative');
  assert.ok(html.includes('ZeroTrust Index (Illustrative)'), 'Index labeled as illustrative');
  assert.ok(html.includes('SECURITY EVENTS (SIMULATED)'), 'Security events tagged as simulated');
  assert.ok(html.includes('Incidents (Simulated)'), 'Incidents labeled as simulated');
  assert.ok(html.includes('BOUNDARY DEFENSE (SIMULATED)'), 'Boundary defense tagged as simulated');
  assert.ok(html.includes('TELEMETRY PIPELINE (SIMULATED)'), 'Pipeline tagged as simulated');
  assert.ok(html.includes('Simulated transit:'), 'Transit labeled as simulated');
  assert.doesNotMatch(html, /Collector Availability: 100\.0% Live/);
});

test('3. Events are not described as live audit records', () => {
  const heroHtml = renderToStaticMarkup(
    React.createElement(ObservabilityTelemetryHero, { onSelectEvent: () => {} })
  );
  const tableHtml = renderToStaticMarkup(
    React.createElement(SecurityEventExplorerTable, {
      events: CORRELATED_SECURITY_EVENTS,
      onSelectEvent: () => {}
    })
  );

  const exactNotice = 'REPRESENTATIVE DEMONSTRATION SCENARIOS — NOT LIVE AUDIT EVENTS';
  assert.ok(heroHtml.includes(exactNotice), 'Hero conduit renders required exact notice');
  assert.ok(tableHtml.includes(exactNotice), 'Event explorer table renders required exact notice');

  assert.doesNotMatch(tableHtml, /Live SIEM Audit Log/);
  assert.doesNotMatch(heroHtml, /Live Cluster Telemetry Feed/);
});

test('4. Cosign simulation is not described as active admission enforcement', () => {
  const cosignEvt = CORRELATED_SECURITY_EVENTS.find((e) => e.eventId === 'EVT-2026-006' || e.sourceComponent === 'COSIGN_PROVIDER');
  assert.ok(cosignEvt, 'Cosign event exists in fixtures');

  const drawerHtml = renderToStaticMarkup(
    React.createElement(EventDetailDrawer, {
      event: cosignEvt,
      onClose: () => {}
    })
  );

  assert.ok(drawerHtml.includes('SIMULATED SCENARIO'), 'Drawer renders simulated scenario badge');
  assert.ok(drawerHtml.includes('Scenario Definition (Repository Path — Not Execution Evidence)'), 'References are labeled scenario definitions');
  assert.ok(
    drawerHtml.includes('not an active admission log or live execution trace'),
    'Explicitly clarifies path is not an active admission log'
  );
});

test('5. Monitoring services are not represented as deployed', () => {
  const html = renderToStaticMarkup(React.createElement(TelemetryHealthMonitor));

  const exactTitle = 'PROPOSED TELEMETRY ARCHITECTURE — NOT DEPLOYED';
  assert.ok(html.includes(exactTitle), 'Health monitor renders required title');
  assert.ok(html.includes('NOT RUNNING (MANIFEST ONLY)'), 'Services marked as not running');
  assert.ok(html.includes('Manifest Target:'), 'Endpoints labeled as manifest targets');
  assert.ok(html.includes('Simulated Benchmark:'), 'Latencies labeled as simulated benchmarks');
  assert.ok(html.includes('Illustrative Volume:'), 'Volume labeled as illustrative');

  // Must not claim services are ONLINE live services
  assert.doesNotMatch(html, />ONLINE</);
});

test('6. Illustrative security scores are not described as measured values', () => {
  const html = renderToStaticMarkup(React.createElement(ZeroTrustScorecardMatrix));

  const exactScorecardBadge = 'ILLUSTRATIVE EVALUATION — NOT LIVE SECURITY MEASUREMENT';
  assert.ok(html.includes(exactScorecardBadge), 'Scorecard renders required exact banner');
  assert.ok(html.includes('Calculated Score (Illustrative)'), 'Score column labeled as illustrative');
  assert.ok(html.includes('Proposed Data Source (Architecture Target)'), 'Data sources labeled as proposed targets');
  assert.ok(html.includes('DEMO ONLY'), 'Renders DEMO ONLY badge');
  assert.ok(
    html.includes('do not represent measured cluster compliance or real-time enforcement'),
    'Includes explanatory note'
  );
});

test('7. Top notice in Audit page distinguishes live verification from simulated observability', () => {
  const html = renderToStaticMarkup(React.createElement(SecurityObservabilityView));

  assert.ok(
    html.includes('LIVE VERIFICATION + DEMONSTRATION DATA'),
    'Notice renders mixed-provenance title'
  );
  assert.ok(
    html.includes(
      'Automated verification below uses observed Kubernetes state. Events, telemetry models, and evaluation scores below are simulated examples, not live audit records.'
    ),
    'Notice renders mixed-provenance explanation'
  );
  assert.doesNotMatch(
    html,
    /No security controls are verified or executed by this view/,
    'Does not claim no controls are verified'
  );
});
