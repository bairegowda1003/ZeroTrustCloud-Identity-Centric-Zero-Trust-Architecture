type JsonObject = Record<string, unknown>;
const object = (value: unknown): JsonObject =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const str = (value: unknown) => typeof value === 'string' && value.trim() ? value : undefined;

export function readArtifact(path: string, source: string) {
  const filename = path.split('/').pop()!;
  const signature = path.includes('/cosign/');
  let raw: unknown;
  try { raw = JSON.parse(source); } catch { /* Retain unreadable files in the ledger. */ }
  const data = object(raw);
  const critical = object(data.critical);
  const identity = str(signature ? object(critical.identity)['docker-reference'] : data.ArtifactName);
  const available = signature ? !!str(critical.type)?.includes('signature') : Array.isArray(data.Results);
  const results = list(data.Results).map(object);
  const findings = results.flatMap(result => list(result.Vulnerabilities).map(value => {
    const v = object(value);
    return {
      cve: str(v.VulnerabilityID), severity: str(v.Severity), pkg: str(v.PkgName),
      installed: str(v.InstalledVersion), fixed: str(v.FixedVersion),
      score: object(object(v.CVSS).nvd).V3Score
    };
  }));
  const complete = results.length > 0 && results.every(r => Array.isArray(r.Vulnerabilities));
  const metadata = object(data.Metadata);
  const repoDigests = list(metadata.RepoDigests).filter((v): v is string => typeof v === 'string');
  const reference = signature ? identity : identity?.replace(/@.*$/, '').replace(/:[^/:]+$/, '');
  const digest = signature ? str(object(critical.image)['docker-manifest-digest'])
    : repoDigests.find(v => v.split('@')[0] === reference)?.split('@')[1];
  const expectedImage = filename.match(/^(.+)-v\d[^/]*-(?:vuln|clean)\.json$/)?.[1];
  const mismatch = !!(expectedImage && reference && expectedImage !== reference.split('/').pop());
  const status = !available ? 'Evidence unavailable' : signature ? 'Signature record available'
    : findings.length ? `${findings.length} recorded finding${findings.length === 1 ? '' : 's'}`
    : complete ? 'No findings recorded' : 'Findings unavailable';
  return {path, filename, signature, identity, reference, available, findings, digest, mismatch,
    expectedImage, status, raw, signer: str(object(data.optional).Signer),
    type: signature ? 'Cosign signature record' : 'Trivy scan report'};
}
export type Artifact = ReturnType<typeof readArtifact>;

export function relatedRecords(selected: Artifact, records: Artifact[]) {
  return records.filter(other => selected.available && other.available && selected.signature !== other.signature
    && !!selected.reference && selected.reference === other.reference && !!selected.digest
    && /^sha256:[0-9a-f]{64}$/.test(selected.digest) && selected.digest === other.digest);
}
export function readCollection(files: Record<string, string>) {
  return Object.entries(files).map(([path, text]) => readArtifact(path.slice(path.indexOf('k8s/')), text))
    .sort((a, b) => Number(a.signature) - Number(b.signature) || a.filename.localeCompare(b.filename));
}
