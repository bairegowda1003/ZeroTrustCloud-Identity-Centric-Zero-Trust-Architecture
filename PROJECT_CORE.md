# TrustMesh — Project Core & Implementation Constitution

> **Read this file before every implementation task.**  
> This document is the project's source of truth for scope, architecture intent, design principles, and honest status reporting. Update it when a real project decision changes; do not silently override it.

## 1. Project identity

- **Academic project:** [PRJ-34] ZeroTrustCloud: Implementing and Automating Identity-Centric Zero-Trust Architecture for Cloud-Native Environments
- **Application/platform name:** TrustMesh
- **Domain:** Cybersecurity & Supply Chain Defense
- **Project period:** 4 September 2026 – 27 November 2026
- **Current milestone:** Phase 1 — Dashboard Foundation
- **Current status:** Phase 1 Dashboard Foundation is implemented and verified locally (Application shell, Security Command Center, interactive findings explorer, threat context drawers, honest demo tags, and integration state modals). Live cloud infrastructure and admission engines remain uninstalled for subsequent phases.
- **Official academic source:** The university project blueprint supplied by the student.
- **Existing project source of truth:** Existing repository files, research documents, and `docs/methodology-and-data-collection-plan.md` where present.

## 2. The problem we are solving

Cloud-native environments distribute workloads across clusters, services, cloud accounts, and CI/CD systems. Traditional perimeter security is insufficient on its own. The project investigates how identity-centric zero-trust principles can be implemented and evaluated across:

1. Identity and access management
2. Policy-as-Code and consistent policy enforcement
3. Service-to-service trust and encrypted communication
4. Continuous workload and artifact verification
5. CI/CD and software supply-chain security
6. Centralized audit, observability, and compliance visibility

The long-term goal is a demonstrable and measurable framework—not merely a dashboard mock-up.

## 3. Non-negotiable project principles

1. **Build the security core, not just the UI.** Every future dashboard feature should eventually correspond to a real control, event, configuration, or measured experiment.
2. **Phase discipline.** Implement only the agreed current milestone. For now, Phase 1 is the dashboard foundation.
3. **No fabricated reality.** Never represent demo data, mock integrations, sample clusters, simulated events, or placeholder metrics as live cloud telemetry or completed security enforcement.
4. **Traceability.** Keep a clear link between the university problem statement, architecture components, implementation, and future experimental evidence.
5. **Incremental, testable engineering.** Prefer a small working vertical slice over a large set of empty modules.
6. **Do not over-engineer.** No unnecessary microservices, event buses, complex state management, premature database/backend layers, elaborate plugin systems, or abstractions without a demonstrated need.
7. **Preserve existing work.** Inspect the repository and Git status first. Do not delete or replace research papers, reports, methodology, README content, or working code without a clear reason.
8. **Use the existing stack when viable.** Do not scaffold a new application before checking what is already present.
9. **Review before publishing.** Do not automatically commit, push, deploy, or expose secrets.
10. **Update this constitution only deliberately.** If a request conflicts with this file, identify the conflict and ask before making a major scope or architecture change.

## 4. University blueprint — long-term architecture

These are project goals, not claims of current implementation.

### A. Identity & Access
- Workload identities and Kubernetes service accounts
- Least-privilege RBAC/ABAC concepts
- OIDC and cloud workload identity integration where feasible
- Identity and authorization audit events

### B. Policy-as-Code
- Open Policy Agent (OPA), potentially Gatekeeper
- Policy definition, validation, and testing
- Policy violations and enforcement outcomes

### C. Service Trust
- Service-to-service identity
- Istio or another selected service mesh, if feasible
- mTLS and fine-grained authorization

### D. Continuous Verification
- Workload/image integrity checks
- Cosign/Sigstore verification where feasible
- Configuration drift and security-event detection

### E. Supply-Chain Security
- CI/CD identity and permissions
- Dependency and image scanning
- SBOM and artifact signature workflows where feasible

### F. Observability & Evaluation
- Audit/authentication/authorization events
- Centralized security findings and posture
- Controlled experiments and measured results
- Performance/security trade-off analysis

**Scope control:** The university blueprint lists broad capabilities and possible technologies. It does not require every technology to be deployed simultaneously. Choose a feasible, demonstrable path and document trade-offs.

## 5. Current milestone: Phase 1 — Dashboard Foundation

### Goal
Create the maintainable application shell and the first Security Command Center interface, inspired by enterprise cloud-security consoles, while preserving clean paths for later real security integrations.

### In scope now
- Inspect the current repository and available design-reference screenshots.
- Establish or extend the existing frontend rather than replacing it.
- Define a restrained, consistent TrustMesh design system.
- Implement the app shell, navigation, and overview page.
- Add the first useful findings-table interactions: search, filter, sort, and detail view.
- Add a small, coherent set of clearly labelled demonstration records only where needed to develop and test the interface.
- Provide honest empty/unconnected states.
- Add initial module routes/pages only if they can be done without bloating the milestone.
- Verify the app locally and document what actually works.

### Out of scope for Phase 1
- Production AWS/Azure integrations
- Live cloud account discovery
- Production Kubernetes integration
- OPA/Gatekeeper enforcement
- Istio/mTLS deployment
- SPIRE workload attestation
- Cosign/Sigstore admission enforcement
- Full CI/CD security automation
- Production authentication/authorization
- Premature FastAPI services or database migrations
- Real-time telemetry integrations
- Automated remediation
- Performance/security claims without experiments

Create only the extension points that are useful now. Do not install future infrastructure simply to make the UI look complete.

## 6. Design direction

### Reference
Use the screenshots saved under:
`design-references/cortex-cloud/`

The official Cortex Cloud website may be consulted for visual context:
https://www.paloaltonetworks.com/cortex/cloud

Use the references to study information hierarchy, dense security tables, severity presentation, navigation, filtering, and the overall enterprise-console feel. Create a distinct TrustMesh visual identity. Do not copy the interface pixel-for-pixel, use Palo Alto Networks branding, or imply affiliation.

### TrustMesh design principles
- Dark navy/charcoal foundation, with restrained blue/cyan accents
- Strong legibility and clear hierarchy
- Compact but readable tables and data visualization
- Useful density rather than oversized decorative cards
- Consistent severity colors and status semantics
- Subtle borders and purposeful interaction feedback
- Minimal decoration; avoid excessive glassmorphism, random gradients, emoji icons, and generic template layouts
- Responsive behavior and accessible contrast

The goal is an original professional cybersecurity console—not a clone and not a marketing landing page.

## 7. Data and status integrity

For every displayed metric or event, know whether it is:
- Demonstration data
- A local application state
- Data from a verified integration
- An actual result from a controlled experiment

Label demo content visibly, for example:
**DEMONSTRATION DATA — NOT LIVE CLOUD TELEMETRY**

If no account or cluster is connected, say so plainly. Never use fake green “Connected” indicators or claim a policy was enforced unless that behavior exists and has been verified.

Future experimental measurements must come from executed tests. Do not invent latency, throughput, detection-time, accuracy, or resource-overhead values.

## 8. Implementation rules

Before editing:
1. Inspect the repository tree, package files, app entry points, current routes, styles, and Git status.
2. Read the existing README and methodology plan.
3. Inspect the design-reference directory.
4. Report the current state and a concise implementation plan.

During implementation:
- Reuse working code and established conventions.
- Prefer the smallest architecture that meets the requirement.
- Keep UI components, types, and demo records separate where useful.
- Avoid giant components, unnecessary dependencies, and speculative abstractions.
- Do not create every future backend/service directory in advance.
- Keep each interaction functional; avoid decorative controls that do nothing.

After implementation:
- Run the app and available checks.
- Test navigation and the interactions that were built.
- Inspect terminal/browser errors where available.
- Review the Git diff and ensure research assets remain intact.
- Report what works, what was tested, what remains demo-only, and any blockers.
- Never claim tests passed if they were not run.

## 9. Proposed technical direction (not permission to overbuild)

- Frontend: keep the current framework if viable; otherwise React + TypeScript with the lightest suitable tooling.
- Styling: keep existing styling if viable; otherwise Tailwind CSS if it fits the current setup.
- Backend later: Python/FastAPI only when a real API/control requires it.
- Persistence later: choose a database when persistent findings/policies/audit records are needed.
- Security engines later: select and validate the smallest feasible combination of OPA, Kubernetes, service mesh, workload identity, and supply-chain tooling that can support credible experiments.

Do not treat this proposed stack as a requirement to install everything in Phase 1.

## 10. Decision gate for new work

Before adding a feature or dependency, answer:
1. Does it support the university problem statement?
2. Is it required for the current milestone?
3. Is it backed by a real use case or test?
4. Can it be implemented more simply?
5. Will we be able to verify it?

If it does not support the current milestone, record it as a future task instead of implementing it now.

## 11. Definition of done for Phase 1

Phase 1 is done only when:
- The existing project is preserved.
- The application starts locally using documented instructions.
- The app shell and overview page are implemented.
- Navigation and advertised interactions work.
- Demo data is clearly labelled and unconnected integrations are honest.
- No obvious runtime/build errors remain from the implemented work.
- README/status notes describe actual functionality and limitations.
- The Git diff has been reviewed.

A polished screenshot alone is not completion.

## 12. Persistent agent instruction

At the beginning of every Antigravity task/session:
1. Read this `PROJECT_CORE.md` in full.
2. Read `AGENTS.md`.
3. Inspect the current repository state before assuming anything.
4. Read the relevant existing methodology/report documents.
5. Confirm the current milestone and do not expand it without approval.

When finishing a task, update project documentation only with verified changes. If the core scope or an architecture decision genuinely changes, propose the edit to this file and explain why rather than silently rewriting the project direction.
