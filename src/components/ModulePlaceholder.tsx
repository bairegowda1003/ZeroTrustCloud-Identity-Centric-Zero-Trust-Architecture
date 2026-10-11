import React from 'react';
import { Shield, Fingerprint, ShieldCheck, Network, PackageCheck, Activity, Layers, AlertCircle, ArrowLeft } from 'lucide-react';
import { ActiveModule } from '../types/security';

interface ModulePlaceholderProps {
  module: ActiveModule;
  onNavigateHome: () => void;
}

interface ModuleInfo {
  title: string;
  badge: string;
  plannedPhase: string;
  icon: React.ReactNode;
  summary: string;
  plannedCapabilities: { title: string; desc: string }[];
}

const MODULE_DATA: Record<Exclude<ActiveModule, 'command_center'>, ModuleInfo> = {
  workload_identity: {
    title: 'Workload Identity & Cryptographic Attestation',
    badge: 'SPIFFE / SPIRE Engine',
    plannedPhase: 'Phase 4 (Weeks 6–7)',
    icon: <Fingerprint size={28} color="var(--accent-cyan)" />,
    summary: 'Decoupling application identity from static long-lived credentials. SPIRE agents will attest kernel processes and container namespaces, projecting short-lived cryptographic X.509 SVID tokens into pod volumes.',
    plannedCapabilities: [
      { title: 'SPIFFE SVID Attestation', desc: 'Hardware and kernel-level verification of pod identities without hardcoded secrets.' },
      { title: 'Multi-Cloud OIDC Federation', desc: 'Seamless credential exchange across AWS IRSA and Azure Workload Identity.' },
      { title: 'Token Lifecycle Rotation', desc: 'Automated ephemeral certificate issuance with 1-hour expiration.' },
      { title: 'Identity Audit Trail', desc: 'Immutable logging of all token exchanges and attestation queries.' },
    ],
  },
  policy_governance: {
    title: 'Declarative Policy-as-Code & Admission Governance',
    badge: 'OPA Gatekeeper Engine',
    plannedPhase: 'Phase 4 (Weeks 6–7)',
    icon: <ShieldCheck size={28} color="var(--accent-cyan)" />,
    summary: 'Automating continuous compliance through Open Policy Agent (OPA) Gatekeeper validating admission webhooks. Policies written in Rego reject non-compliant manifests before Kubernetes etcd persistence.',
    plannedCapabilities: [
      { title: 'Admission-Time Rejection', desc: 'Prevent pods with privileged securityContext or root execution from being scheduled.' },
      { title: 'Namespace Boundary Policies', desc: 'Mandate strict default-deny NetworkPolicies and resource limit quotas.' },
      { title: 'Rego Constraint Library', desc: 'Standardized templates enforcing CIS Kubernetes Benchmark controls.' },
      { title: 'Audit Mode Evaluation', desc: 'Continuous in-cluster background scanning to detect out-of-band drift.' },
    ],
  },
  service_mesh: {
    title: 'Service Mesh Trust & Layer-7 Microservice Authorization',
    badge: 'Istio Envoy Data Plane',
    plannedPhase: 'Phase 4 (Weeks 6–7)',
    icon: <Network size={28} color="var(--accent-cyan)" />,
    summary: 'Eliminating implicit trust in the cluster network fabric. Istio Envoy sidecars enforce STRICT mutual TLS (mTLS) and fine-grained Layer-7 authorization policies on every service-to-service call.',
    plannedCapabilities: [
      { title: 'STRICT Mutual TLS', desc: 'End-to-end cryptographic transit encryption across all East-West microservice traffic.' },
      { title: 'Layer-7 Principals Check', desc: 'Verify caller SPIFFE IDs and enforce allowed HTTP methods (GET, POST) per service.' },
      { title: 'Egress Traffic Lockdown', desc: 'Prevent compromised pods from establishing outbound connections to arbitrary IPs.' },
      { title: 'Distributed Tracing', desc: 'Ingest cryptographic connection handshakes and latency metrics.' },
    ],
  },
  supply_chain: {
    title: 'Software Supply Chain Defense & Provenance',
    badge: 'Cosign & Trivy Engine',
    plannedPhase: 'Phase 5 (Weeks 7–8)',
    icon: <PackageCheck size={28} color="var(--accent-cyan)" />,
    summary: 'Securing the container lifecycle from source code to runtime execution. Integrates Cosign digital image signing, Syft Software Bill of Materials (SBOM) generation, and Trivy static vulnerability scanning.',
    plannedCapabilities: [
      { title: 'Mandatory Signature Verification', desc: 'Reject unsigned container images at the Kubernetes admission controller.' },
      { title: 'Automated SBOM Generation', desc: 'Generate and index CycloneDX/SPDX manifests for all build artifacts.' },
      { title: 'Continuous CVE Triage', desc: 'Scan running container images against updated vulnerability feeds.' },
      { title: 'Secretless CI/CD Runners', desc: 'Keyless signing using GitHub Actions OIDC identity tokens.' },
    ],
  },
  experiments: {
    title: 'Empirical Security & Performance Benchmarking',
    badge: 'Controlled Scenarios EXP-01 – EXP-08',
    plannedPhase: 'Phase 5 (Weeks 8–9)',
    icon: <Activity size={28} color="var(--accent-cyan)" />,
    summary: 'Rigorous empirical evaluation comparing a Baseline Kubernetes Cluster (flat networking, default permissions) against the hardened TrustMesh Zero-Trust Cluster. Measurements are derived from executed red-team scenarios.',
    plannedCapabilities: [
      { title: 'Attack Simulation Suite', desc: 'Eight test scenarios (EXP-01 to EXP-08) targeting privilege escalation and bypass.' },
      { title: 'Latency Overhead Profiling', desc: 'Empirical measurement of Envoy mTLS and OPA admission latency penalties.' },
      { title: 'Raw CSV Telemetry Pipeline', desc: 'Collection and statistical analysis of detection latencies and resource usage.' },
      { title: 'Trade-off Characterization', desc: 'Documenting the security-versus-performance frontier for cloud-native zero trust.' },
    ],
  },
  integrations: {
    title: 'Cloud Infrastructure & Managed Cluster Connectors',
    badge: 'Multi-Cloud Telemetry Hub',
    plannedPhase: 'Phase 3 (Weeks 5–6)',
    icon: <Layers size={28} color="var(--accent-cyan)" />,
    summary: 'Target infrastructure environments for TrustMesh deployment. Integration connectors for AWS EKS (Elastic Kubernetes Service) and Azure AKS (Azure Kubernetes Service) are scheduled for provisioning in Phase 3.',
    plannedCapabilities: [
      { title: 'AWS EKS Connector', desc: 'Terraform-automated cluster with IRSA OIDC provider and VPC CNI.' },
      { title: 'Azure AKS Connector', desc: 'Automated multi-tenant cluster with Azure Workload Identity and Azure CNI.' },
      { title: 'Audit Log Collector', desc: 'Ingestion of Kubernetes apiserver audit streams into Prometheus and Loki.' },
      { title: 'Health Telemetry Ingestion', desc: 'Real-time node and control-plane health checking.' },
    ],
  },
};

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  module,
  onNavigateHome,
}) => {
  if (module === 'command_center') return null;
  const info = MODULE_DATA[module];

  return (
    <div className="module-roadmap-container">
      <div className="roadmap-banner-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span className="roadmap-badge">
            {info.badge} • {info.plannedPhase}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontSize: '11px', fontWeight: 600 }}>
            <AlertCircle size={14} />
            <span>HONEST STATUS: PLANNED ARCHITECTURAL MODULE (NOT ACTIVE IN PHASE 1)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: 'var(--radius-sm)', 
            backgroundColor: 'var(--bg-surface-elevated)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid var(--border-active)'
          }}>
            {info.icon}
          </div>
          <div>
            <h2 className="roadmap-title">{info.title}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              ZeroTrustCloud Academic Framework • Project PRJ-34
            </div>
          </div>
        </div>

        <p className="roadmap-desc">
          {info.summary}
        </p>
      </div>

      <div className="roadmap-specs-grid">
        {info.plannedCapabilities.map((cap, idx) => (
          <div key={idx} className="spec-card">
            <h4 className="spec-card-title">{cap.title}</h4>
            <p className="spec-card-text">{cap.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '16px 20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
          Phase 1 constraint: Infrastructure engines and live cloud connections are not installed during Phase 1.
        </div>
        <button 
          className="btn-connectors"
          onClick={onNavigateHome}
        >
          <ArrowLeft size={13} />
          <span>Return to Command Center</span>
        </button>
      </div>
    </div>
  );
};
