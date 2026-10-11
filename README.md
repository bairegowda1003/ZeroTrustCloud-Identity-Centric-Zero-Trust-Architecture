# ZeroTrustCloud: Implementing and Automating Identity-Centric Zero-Trust Architecture for Cloud-Native Environments

**📋 Current Status: Phase 1 — Dashboard Foundation Implemented & Verified**

Phase 1 delivers the TrustMesh Security Command Center dashboard: the application shell, an interactive findings explorer, threat context drawers, and honest integration state indicators. In accordance with `PROJECT_CORE.md`, all displayed telemetry records are controlled demonstration fixtures.

ZeroTrustCloud (proposed platform name: **TrustMesh**) is a final-year MCA cybersecurity engineering project focused on the design, automated policy enforcement, and empirical evaluation of an **Identity-Centric Zero-Trust Architecture (ZTA)** built for containerized, multi-cloud Kubernetes environments (AWS EKS & Azure AKS).

---

## 1. Project Overview

Cloud-native systems today run on dynamic microservices, short-lived containers, and distributed compute spread across hybrid multi-cloud setups. Traditional perimeter-based security models ("castle-and-moat") break down in this environment, since internal workloads, service accounts, and CI/CD pipelines routinely operate outside any fixed network boundary.

TrustMesh explores how cryptographic workload identity, Policy-as-Code enforcement, mutual TLS (mTLS) via service mesh, continuous runtime verification, and software supply-chain protection can be brought together into a single automated security control plane.

---

## 2. Problem Statement

Perimeter firewalls alone cannot address the security gaps that modern cloud-native systems introduce:

- **Perimeter Dissolution** — dynamic pod scheduling makes IP/port-based boundaries meaningless
- **Identity Sprawl & Static Secrets** — long-lived tokens and hardcoded credentials end up exposed in repos or registries
- **Over-Privileged Workloads** — loose default Kubernetes configs allow lateral movement after a container is compromised
- **Unprotected East-West Traffic** — unencrypted service-to-service traffic is open to interception and tampering
- **Supply-Chain Poisoning** — unsigned images and unvetted dependencies open the door to remote code execution
- **Configuration Drift** — manual, out-of-band cluster changes slip past CI/CD security checks

---

## 3. Project Objectives

- **Identity-Centric Workload Security** — secretless, cryptographic workload attestation using SPIFFE/SPIRE and cloud OIDC federation (AWS IRSA / Azure Workload Identity)
- **Automated Policy-as-Code** — declarative policy enforcement across clusters via OPA Gatekeeper admission controllers
- **Zero Implicit Network Trust** — strict mTLS and Layer-7 authorization across microservices using Istio Service Mesh
- **Continuous Runtime Verification** — ongoing checks on container integrity, drift detection, and dynamic trust scoring
- **Software Supply Chain Defense** — automated vulnerability scanning (Trivy), SBOM generation (Syft), and image signing (Cosign/Sigstore) built into the CI/CD pipeline
- **Centralized Security Observability** — authentication logs, authorization denials, and admission rejections routed into Prometheus/Loki and a posture dashboard
- **Empirical Benchmarking** — measuring defensive effectiveness, latency overhead, and compute cost through controlled red-team test scenarios

---

## 4. Proposed Architecture Blueprint

```
                  ┌─────────────────────────────────────────┐
                  │        Users / Developers / CI/CD       │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │         Identity & Access Layer         │
                  │      OIDC / Cloud IAM / SPIFFE SVID     │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          Policy-as-Code Engine          │
                  │       OPA Gatekeeper / Rego Rules       │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
             ┌──────────────────────────────────────────────────┐
             │               Kubernetes / Multi-Cloud           │
             │                      (EKS / AKS)                 │
             │                                                  │
             │   ┌──────────────┐            ┌──────────────┐   │
             │   │  Service A   │───────────▶│  Service B   │   │
             │   │(Envoy Sidecar)  STRICT mTLS(Envoy Sidecar)│   │
             │   └──────────────┘            └──────────────┘   │
             │                                                  │
             │       Istio Service Mesh / Layer-7 AuthZ         │
             └─────────────────────────┬────────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │      Continuous Verification Engine     │
                  │   Dynamic Trust Score / Drift Detection │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │         Observability & Auditing        │
                  │  Prometheus / Loki / Posture Dashboard  │
                  └─────────────────────────────────────────┘
```

---

## 5. Core System Modules & Phase 1 Status

- **Command Center Dashboard** [Implemented — Phase 1] — application shell, navigation system, dynamic posture metrics, interactive findings explorer with multi-column sorting, free-text search and multi-factor filtering, slide-over threat context drawer with attack paths and Rego remediation, and honest integration state indicators
- **Identity Engine** [Planned — Phase 4] — cryptographic workload identity attestation via SPIRE and secretless cloud OIDC federation
- **Policy Engine** [Planned — Phase 4] — declarative Policy-as-Code admission webhooks using OPA Gatekeeper and Rego
- **Service Trust Engine** [Planned — Phase 4] — Istio Service Mesh enforcing strict mTLS and Layer-7 authorization
- **Continuous Verification Engine** [Planned — Phase 5] — runtime daemon tracking configuration drift and dynamic trust scores
- **Pipeline Security Engine** [Planned — Phase 5] — secretless GitHub Actions runners, Trivy scanning, and Cosign image signing at admission
- **Observability & Compliance Engine** [Planned — Phase 6] — centralized audit telemetry, policy violations, and security health metrics

### 5.1 Phase 1 Local Execution & Verification

The Phase 1 dashboard is built with React 18, TypeScript, and Vite, using a custom high-density dark-navy enterprise security design system.

```bash
# 1. Install dependencies
npm install

# 2. Build for production (typecheck & bundle)
npm run build

# 3. Launch local preview server (port 3000)
npm run preview
# OR start the Vite development server
npm run dev
```

**Verified Phase 1 Capabilities:**

- **Honest Data Tagging** — prominent `[SIMULATED TESTBED]` indicator on every screen; no fabricated live cloud connections
- **Security Command Center** — 2.5D isometric telemetry space tracking evaluated workloads, active breaches, severity distribution chips, and a floating top-priority incident card with 1-click inspection
- **Progressive Disclosure Architecture** — dedicated Findings Explorer with live free-text search (CVE, title, pod name, namespace), multi-factor dropdown filters (Severity, Architecture Pillar, Status), and multi-column sorting
- **Threat Lineage Drawer** — slide-over detail drawer with threat impact analysis, 4-step attack path graphs, CIS/NIST remediation guidance, and syntax-highlighted Rego constraint snippets
- **Session Triage Updates** — local triage toggling (New, In Progress, Resolved) that updates table badges and metric counters instantly
- **Planned Integrations Modal** — connector inspection dialog showing planned status for AWS EKS, Azure AKS, Istio, OPA Gatekeeper, SPIRE, and Cosign
- **Module Shell Navigation** — clean routes for upcoming engines with architectural blueprints and return buttons

---

## 6. Proposed Technology Stack

| Category | Tools |
|---|---|
| Cloud Infrastructure | Amazon Web Services (AWS EKS), Microsoft Azure (Azure AKS) |
| Container Orchestration | Kubernetes (v1.28+) |
| Workload Identity | SPIFFE / SPIRE, OpenID Connect (OIDC), AWS IRSA, Azure Workload Identity |
| Policy-as-Code | Open Policy Agent (OPA) Gatekeeper, Rego |
| Service Mesh | Istio, Envoy Proxy (STRICT mTLS) |
| Supply Chain Security | Cosign / Sigstore, Syft (SBOM), Trivy (vulnerability scanning) |
| CI/CD Automation | GitHub Actions (OIDC Federated, Secretless) |
| Observability & Logging | Prometheus, Grafana, Grafana Loki, OpenTelemetry Collector |
| Dashboard Frontend | React 18, TypeScript, Vite |

---

## 7. Research & Methodology

Research has been carried out across two review cycles, followed by the Week 4 methodology blueprint:

- **Week 1 Review (10 papers individually / 30 as a team)** — workload identity federation, OIDC token binding, mTLS performance, and software supply-chain integrity
- **Week 3 Review (10 more papers individually / 30 more as a team)** — secretless inter-application identities, service-mesh control plane verification, Intel SGX enclaves, Kubernetes network misconfigurations, and dynamic risk-based access control (DR-TBAC), bringing the combined total to **60 research papers reviewed** across the team
- **Week 4 Blueprint** — methodology formalization, STRIDE threat modeling, telemetry schema definition, and the controlled experimental matrix
- **Current (Phase 1)** — TrustMesh dashboard foundation built and verified using controlled demonstration fixtures

Individual literature review documentation is maintained under the `Research Papers Review/` folder, and project planning/progress reports under `Plannings/`, with progress tracked through TrackEdge.

---

## 8. Experimental Evaluation Strategy (Planned)

Validation will compare two environments:

- **Baseline Cloud-Native Environment (No Zero-Trust Controls):** flat CNI networking, default service accounts, static secrets, unsigned images
- **Hardened ZeroTrustCloud Environment (With TrustMesh Controls):** STRICT mTLS, default-deny NetworkPolicies, SPIRE attestation, OPA Gatekeeper rules, mandatory Cosign image signing

**Planned Test Scenarios (EXP-01 to EXP-08):**

1. Authorized communication over strict mTLS
2. Unauthenticated pod access blocking
3. Unauthorized Layer-7 service call rejection
4. Privilege escalation manifest blocking
5. Untrusted / unsigned container image rejection
6. Out-of-band configuration drift detection
7. Vulnerable dependency pod quarantine
8. Synthetic workload load stress benchmarking

---

## 9. Repository Structure

```
ZeroTrustCloud-Identity-Centric-Zero-Trust-Architecture/
│
├── README.md                                          [Project overview, status, and roadmap]
├── PROJECT_CORE.md                                    [TrustMesh Core Constitution & Scope Boundary]
├── AGENTS.md                                          [Instructions & rules for coding agents]
├── index.html, vite.config.ts, tsconfig.json          [Frontend application configuration]
├── package.json, package-lock.json                    [Dashboard dependencies & scripts]
│
├── src/                                               [TrustMesh Phase 1 Dashboard Application]
│   ├── components/                                    [Header, Sidebar, CommandCenter, FindingsTable, Drawers]
│   ├── data/                                          [Controlled demonstration security findings & provider data]
│   ├── styles/                                        [Custom enterprise design token CSS]
│   ├── types/                                         [Domain TypeScript interfaces]
│   ├── App.tsx                                        [Application shell coordinator]
│   └── main.tsx                                       [React DOM entrypoint]
│
├── Plannings/                                         [Project work plans & methodology]
│   ├── Work_Plan_and_Project_Progress_Report_ZeroTrustCloud.pdf
│   └── ZeroTrustCloud_Methodology_Data_Collection_Experimental_Plan.pdf
│
├── Original Research Papers/                          [Raw source papers collected by each member]
│   ├── Baire Gowda_Research papers/
│   │   ├── part 1/                                    [Week 1 — 10 papers]
│   │   └── part 2/                                    [Week 3 — 10 papers]
│   │
│   ├── Hithaishi S P/
│   │   ├── part 1/
│   │   └── part 2/
│   │
│   └── SANJAY RESEARCH PAPERS/
│       ├── part 1/
│       └── part 2/
│
└── Research Papers Review/                            [Literature survey reports]
    ├── part 1/                                        [Week 1 literature review writeups]
    └── part 2/                                        [Week 3 literature review writeups]
```

### Planned Future Directory Structure (To Be Created During Implementation)

```
├── identity-engine/          [Planned — Phase 4: SPIRE attestation & OIDC federation manifests]
├── policy-engine/            [Planned — Phase 4: OPA Gatekeeper constraints & Rego policies]
├── service-mesh/             [Planned — Phase 4: Istio STRICT mTLS & Layer-7 AuthZ policies]
├── continuous-verification/  [Planned — Phase 5: Runtime verification & drift detectors]
├── supply-chain-security/    [Planned — Phase 5: Cosign signature webhooks & SBOM generators]
├── observability/            [Planned — Phase 6: Prometheus telemetry configs & Grafana dashboards]
│
├── infrastructure/           [Planned — Phase 3: Cluster provisioning automation]
│   ├── kubernetes/           [Planned — Base Helm charts & microservice testbed]
│   ├── aws/                  [Planned — AWS EKS Terraform & IRSA IAM roles]
│   └── azure/                [Planned — Azure AKS Terraform & Workload Identity]
│
└── experiments/              [Planned — Phase 5: Empirical evaluation]
    ├── scenarios/            [Planned — Attack simulation scripts EXP-01 to EXP-08]
    ├── datasets/             [Planned — Raw collected CSV telemetry]
    └── results/              [Planned — Comparative performance charts & logs]
```

---

## 10. Project Team Members

- **Baire Gowda** — [@bairegowda1003](https://github.com/bairegowda1003)
- **Sanjay** — [@sanju722002](https://github.com/sanju722002)
- **Hithaishi S P** — [@HithaishiSP2004](https://github.com/HithaishiSP2004) *(Project Lead)*

**Academic Program:** Master of Computer Applications (MCA) — Final Year, Semester III
**Department:** Department of Computer Applications
**Academic Year:** 2025 – 2026
**Project Period:** September 4, 2026 – November 27, 2026

---

## 11. Next Phase Roadmap

- **Weeks 5–7:** Multi-cloud cluster provisioning (AWS EKS & Azure AKS), baseline workload characterization, and Zero-Trust control implementation (SPIRE, OPA, Istio)
- **Weeks 8–9:** Controlled attack simulations (EXP-01 to EXP-08) and empirical telemetry data collection into normalized CSV datasets
- **Weeks 10–12:** Comparative statistical analysis, performance graphing, and final dissertation authoring
