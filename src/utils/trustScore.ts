import { SecurityFinding } from '../types/security';

export interface DomainScore {
  domain: 'identity' | 'policy' | 'supply_chain' | 'service_mesh';
  name: string;
  engine: string;
  description: string;
  score: number;
  unresolvedCount: number;
  criticalCount: number;
  highCount: number;
}

export interface CalculatedTrustPosture {
  overallScore: number;
  totalActiveFindings: number;
  totalResolvedFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  domains: {
    identity: DomainScore;
    policy: DomainScore;
    workloadIntegrity: DomainScore;
    serviceTrust: DomainScore;
  };
  scoringMethodology: string;
}

/**
 * Calculates authentic Zero-Trust posture scores dynamically from findings.
 * Score improves when findings are marked as 'resolved' or 'suppressed'.
 */
export function calculateTrustScore(findings: SecurityFinding[]): CalculatedTrustPosture {
  const activeFindings = findings.filter((f) => f.status !== 'resolved' && f.status !== 'suppressed');
  const resolvedFindings = findings.filter((f) => f.status === 'resolved');

  const criticalCount = activeFindings.filter((f) => f.severity === 'critical').length;
  const highCount = activeFindings.filter((f) => f.severity === 'high').length;
  const mediumCount = activeFindings.filter((f) => f.severity === 'medium').length;
  const lowCount = activeFindings.filter((f) => f.severity === 'low').length;

  const calculateDomain = (
    domainKey: 'identity' | 'policy' | 'supply_chain' | 'service_mesh',
    name: string,
    engine: string,
    description: string
  ): DomainScore => {
    const domainFindings = activeFindings.filter((f) => {
      if (domainKey === 'supply_chain') return f.domain === 'supply_chain' || f.domain === 'workload_runtime';
      return f.domain === domainKey;
    });

    const crit = domainFindings.filter((f) => f.severity === 'critical').length;
    const high = domainFindings.filter((f) => f.severity === 'high').length;
    const med = domainFindings.filter((f) => f.severity === 'medium').length;
    const low = domainFindings.filter((f) => f.severity === 'low').length;

    // Penalty deductions: Critical = -12, High = -8, Medium = -5, Low = -2
    const penalty = crit * 12 + high * 8 + med * 5 + low * 2;
    const rawScore = Math.max(35, Math.min(100, 100 - penalty));

    return {
      domain: domainKey,
      name,
      engine,
      description,
      score: rawScore,
      unresolvedCount: domainFindings.length,
      criticalCount: crit,
      highCount: high,
    };
  };

  const identity = calculateDomain(
    'identity',
    'Identity',
    'SPIFFE / SPIRE',
    'Workload identity attestation'
  );

  const policy = calculateDomain(
    'policy',
    'Policy',
    'OPA Gatekeeper',
    'Policy evaluation & enforcement'
  );

  const workloadIntegrity = calculateDomain(
    'supply_chain',
    'Workload Integrity',
    'Cosign / Trivy',
    'Image signature & vulnerability scan'
  );

  const serviceTrust = calculateDomain(
    'service_mesh',
    'Service Trust',
    'Istio mTLS',
    'Service-to-service authentication'
  );

  // Weighted average: Identity 25%, Policy 30%, Workload Integrity 25%, Service Trust 20%
  const overallScore = Math.round(
    identity.score * 0.25 +
    policy.score * 0.30 +
    workloadIntegrity.score * 0.25 +
    serviceTrust.score * 0.20
  );

  return {
    overallScore,
    totalActiveFindings: activeFindings.length,
    totalResolvedFindings: resolvedFindings.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    domains: {
      identity,
      policy,
      workloadIntegrity,
      serviceTrust,
    },
    scoringMethodology:
      'Dynamic Zero-Trust Posture Score calculated from 12 demo testbed findings. Severity deductions: Critical (-12), High (-8), Med (-5), Low (-2). Improves as findings are resolved.',
  };
}
