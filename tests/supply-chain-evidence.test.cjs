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
}

// Load utility module
const { loadHistoricalSupplyChainEvidence } = require('../src/utils/supplyChainEvidence');

test('1. Loads correct image identities directly from JSON artifacts', () => {
  const evidence = loadHistoricalSupplyChainEvidence();

  // Artifact A must display the actual image identity from JSON, not the filename
  assert.equal(evidence.artifactA_vuln.artifactName, 'trustmesh/mysql-proxy:cache');
  assert.ok(evidence.artifactA_vuln.note.includes('identifies mysql-proxy:cache'));

  // Artifact B must display trustmesh/order-api:v1.2
  assert.equal(evidence.artifactB_clean.artifactName, 'trustmesh/order-api:v1.2');

  // Artifact C must display target reference trustmesh/order-api
  assert.equal(evidence.artifactC_cosign.dockerReference, 'trustmesh/order-api');
});

test('2. Artifact A reports CVE-2024-21508 with accurate package and version details', () => {
  const evidence = loadHistoricalSupplyChainEvidence();
  const report = evidence.artifactA_vuln;

  assert.equal(report.recordedFindingCount, 1);
  const vuln = report.vulnerabilities[0];
  assert.equal(vuln.cveId, 'CVE-2024-21508');
  assert.equal(vuln.severity, 'CRITICAL');
  assert.equal(vuln.pkgName, 'mysql2');
  assert.equal(vuln.installedVersion, '3.9.2');
  assert.equal(vuln.fixedVersion, '3.9.4');
  assert.equal(vuln.cvssScore, 8.8);
});

test('3. Artifact B records zero reported vulnerabilities without claiming remediation of mysql-proxy', () => {
  const evidence = loadHistoricalSupplyChainEvidence();
  const report = evidence.artifactB_clean;

  assert.equal(report.recordedFindingCount, 0);
  assert.equal(report.vulnerabilities.length, 0);
  assert.ok(report.note.includes('distinct image identities'));
  assert.ok(!report.note.includes('remediated'));
});

test('4. Artifact C manifest digest matches Artifact B Trivy image digest', () => {
  const evidence = loadHistoricalSupplyChainEvidence();
  const expectedDigest = 'sha256:7b129c54e0821dfa92918bc3251ee2d744f456108e427d1421008064953bfcb4';

  assert.equal(evidence.artifactC_cosign.manifestDigest, expectedDigest);
  assert.equal(evidence.artifactB_clean.imageId, expectedDigest);
  assert.equal(evidence.artifactC_cosign.digestMatchesCleanReport, true);
});

test('5. Cryptographic signature verification is explicitly labeled unconfirmed', () => {
  const evidence = loadHistoricalSupplyChainEvidence();
  const cosign = evidence.artifactC_cosign;

  // Must use exact required wording
  assert.equal(
    cosign.verificationNotice,
    'Signature record available — cryptographic verification unconfirmed.'
  );
  assert.ok(cosign.note.includes('has not been independently confirmed'));
});

test('6. Evidence provenance uses the required exact banner label', () => {
  const evidence = loadHistoricalSupplyChainEvidence();

  // Must use exact required label
  assert.equal(
    evidence.provenanceLabel,
    'HISTORICAL ARTIFACT — EXECUTION PROVENANCE UNCONFIRMED'
  );
  assert.ok(evidence.disclaimer.includes('saved static repository evaluation artifacts'));
  assert.ok(evidence.disclaimer.includes('Execution timestamps are not inferred from Git commit dates'));
});

test('7. Clarifies Gatekeeper admission constraints do not enforce Cosign signatures', () => {
  const evidence = loadHistoricalSupplyChainEvidence();

  assert.ok(
    evidence.gatekeeperEnforcementNotice.includes('do not enforce Cosign signature verification')
  );
  assert.ok(
    evidence.gatekeeperEnforcementNotice.includes('container security, required dedicated service accounts, and workload hardening')
  );
});

test('8. SupplyChainView renders historical evidence section above visible demonstration divider', () => {
  const { SupplyChainView } = require('../src/components/supply-chain/SupplyChainView');
  const html = renderToStaticMarkup(React.createElement(SupplyChainView));

  // Must render historical evidence section
  assert.ok(html.includes('supply-chain-evidence-container'), 'Renders supply-chain-evidence-container');
  assert.ok(html.includes('HISTORICAL ARTIFACT — EXECUTION PROVENANCE UNCONFIRMED'), 'Renders exact provenance badge');
  assert.ok(html.includes('trustmesh/mysql-proxy:cache'), 'Displays actual image identity for Artifact A');
  assert.ok(html.includes('CVE-2024-21508'), 'Displays CVE-2024-21508');
  assert.ok(html.includes('trustmesh/order-api:v1.2'), 'Displays actual image identity for Artifact B');
  assert.ok(html.includes('Signature record available — cryptographic verification unconfirmed.'), 'Renders unconfirmed notice');

  // Must render demonstration divider
  assert.ok(html.includes('demo-section-divider'), 'Renders demo section divider');
  assert.ok(html.includes('DEMONSTRATION / SIMULATED PIPELINE'), 'Renders simulated pipeline boundary label');

  // Must render existing simulation elements below
  assert.ok(html.includes('Monitored Images (Demo)'), 'Summary cards labeled as demo');
  assert.ok(html.includes('sc-pipeline-hero'), 'Renders simulated pipeline hero');
});
