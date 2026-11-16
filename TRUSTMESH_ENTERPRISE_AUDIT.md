# TrustMesh enterprise audit

Date: 2026-11-16. Baseline commit: `7a01a26`. Audit only; no implementation approval implied.

## A. Executive assessment

TrustMesh is a substantial React demonstration console with domain-organized components, typed fixtures, investigation drawers, and authored Kubernetes configuration. It is not yet a verified zero-trust platform. Preserve the interface and incrementally establish one credible admission-to-evidence workflow.

The highest risks are misleading evidence labels, policy logic that does not match its advertised coverage, incomplete SPIRE and admission infrastructure, and absence of a data path into the frontend. A successful frontend build does not validate any security engine.

`PROJECT_CORE.md`, `AGENTS.md`, README and the weekly report still describe Phase 1. The user's current instruction and `plan-change.md` describe Phase 6.1. This audit evaluates the later source without changing the constitution. Reconcile these documents explicitly before implementation. The previous environment report's dual-boot description is superseded by the owner's VMware information. Its claims of complete manifests, CSI deployment and operational frontend exceed the evidence it records.

Scope limitations: no authorized ChatGPT Project conversation-history interface was available; the Zero Trust conversations were not accessed. This is source inspection and compilation, not a browser or cluster penetration test. No Kali connection was supplied. Research PDFs and all historical planning prose were not exhaustively reviewed; methodology context came from README, the master blueprint's experimental/provenance sections, weekly report, implementation/verification documents and plan-change. No claim of complete historical understanding is made.

## B. Architecture inventory

| Module | Existing implementation | Dependencies / boundary |
|---|---|---|
| Shell | App state selects modules; Header, Sidebar, theme localStorage | React 18, TypeScript, Vite, Lucide; no URL router |
| Command center | Findings filtering/sorting, detail drawer, session triage, computed score | `demoFindings.ts`, `utils/trustScore.ts`; local memory |
| Identity | Inventory, status filters, workload drawer | `demoIdentities.ts`; discovery script disconnected |
| Policy | Inventory, audit/decision presentation, policy drawer | `demoPolicies.ts`; no admission API |
| Mesh | Trust diagrams, traffic list, SVID inspector | `demoMesh.ts`; no live stream |
| Supply chain | Image inventory, vulnerability explorer, pipeline | `demoSupplyChain.ts`; JSON reports and signing scripts |
| Observability | Event explorer, scorecard, health monitor | `demoObservability.ts`; no collector query |
| Kubernetes | Single-node KinD, workload SAs and deployments | Images, Services, runtime prerequisites incomplete |
| Security | Gatekeeper templates, SPIRE skeleton, Istio policies | Controllers/CRDs/configuration still required |
| Telemetry | Collector, Prometheus, Loki, Grafana manifests | DNS/service wiring and evidence normalization incomplete |

The minimal dependency set and domain folders are strengths. `strict: true` is enabled. Unused-local checks are disabled. Global CSS exceeds 15,000 lines; repeated domain styling warrants gradual consolidation. No configured test or lint command exists. No backend, durable audit store, authentication service or event transport was found; these must not be implied by UI terminology.

## C. Phase implementation matrix

| Phase | Source | Validation in this audit | Simulated | Runtime verified | Incomplete / blocked |
|---|---|---|---|---|---|
| 1 | Shell, findings, theme, score | TS and bundle pass | All security records | No browser verification | Persistence and audit trail absent |
| 2 | Identity UI, namespaces, SAs, workload YAML | Static review | Inventory / sync | None | Discovery ESM defect, missing image/service prerequisites |
| 3 | Rego, constraints, policy UI | Static review only | Decisions | None | Incorrect object paths, controller install dependency |
| 4 | SPIRE skeleton, Istio policies, mesh UI | Static review only | SVIDs and traffic | None | Missing SPIRE objects/CSI/controller, mesh installation |
| 5 | Scan/sign scripts, provider policy, UI | Static review only | Test runner and UI | None | External provider, trustworthy cryptographic evidence |
| 6 | Telemetry manifests, explorer/scorecard | Static review only | Health and evaluation results | None | Collection endpoints, provenance and ingestion |
| 6.1 | Environment report and proposed process | Windows tooling inspection | Not applicable | None | Kali runtime unavailable to this session |

## D. UI/UX assessment

Source-level strengths: recognizable domain headers, common navigation, progressive disclosure through drawers, severity labels, dense tables, theme tokens, responsive media queries, global focus-visible rules and reduced-motion handling. These support incremental refinement; there is no evidence requiring a full redesign.

Evidence credibility currently undermines visual maturity: pulsing live labels and confident health statuses give static values unwarranted authority. Put provenance, collection time and enforcement outcome beside every important metric. Keep the trust diagrams where they explain identity and authorization; reduce their prominence if they push the actionable findings below the fold.

Accessibility defect: `FindingsTable.tsx` uses clickable `th` elements for sorting without native buttons. Header's collapse element has `role="button"` and `tabIndex` but no corresponding keyboard handler in the inspected code. Use semantic buttons and expose sort state. Drawers should be tested for initial focus, trapping, Escape and restoration; ARIA dialog attributes alone do not prove this behavior.

Theme contrast, clipping, information density and chart readability are NOT visually verified. Acceptance checks should cover both themes at 1366x768, 1440x900 and 1920x1080, 200% zoom, keyboard-only operation and reduced motion. Existing media queries are implementation evidence, not responsive test results. No numerical contrast or premium-product comparison score is justified here.

## E. Prioritized findings

Complexity: S = focused change, M = several connected changes/tests, L = integration work. Findings below are source-verified unless marked review item. Runtime consequences are predictions requiring tests.

| ID / priority | File / exact anchor and current behavior | Impact and recommendation | Complexity / dependency or risk |
|---|---|---|---|
| E01 P0 | `mesh/MeshTrafficStream.tsx`: `LIVE SERVICE MESH TELEMETRY`; fixture-fed traffic. `demoObservability.ts`: `TESTBED_AUDIT`, ONLINE, 100% availability, 1240 handshakes | False provenance. Classify as DEMO, remove live claims, require timestamp/raw artifact before TESTBED or LIVE | M; preserve fixtures but change semantics |
| E02 P0 | `supply-chain/tests/run-supply-chain-tests.ps1` increments passed for every expected outcome; `observability/tests/simulate-security-events.ps1` prints INGESTED without sending data | Printed assertions are not verification. Mark simulation explicitly; separate real execution harness with captured exit codes and evidence | S labels, M real tests; do not rerun as proof |
| E03 P0 | `policies/gatekeeper/templates/03-k8s-require-dedicated-sa-template.yaml` reads top-level `spec.serviceAccountName`; constraints match Deployments, Jobs and CronJobs | Compliant controllers lack that top-level field and are rejected. Other templates inspect top-level containers, skipping controller pod templates. Normalize PodSpec paths or deliberately match Pods only; test controller behavior | M; narrowing coverage changes admission semantics |
| E04 P0 | Nonroot template uses `c_sec.runAsNonRoot != true`; escalation template uses `sec.allowPrivilegeEscalation != false` | Missing Rego fields are undefined, not false: omission can escape intended checks. Use explicit defaults/presence rules and test absent, inherited, false/true, UID 0, init and ephemeral cases | M; Rego engine test needed |
| E05 P0 | `spire/02-spire-server.yaml` references missing `spire-server-sa`, `spire-server-config`; agent references missing SA/config. No server Service, server-controller/CRD or CSI driver definitions found | SPIRE cannot deploy from these assets. Complete a minimal upstream-aligned installation before registration. `03-spire-agent-csi.yaml` is only an agent with emptyDir socket | L; attestation/RBAC/storage and CSI dependencies |
| E06 P0 | Cosign Provider points to absent `cosign-webhook`; CA value decodes to certificate header only. Template uses `result.responses[img]` / `result.errors[img]` | Provider infrastructure absent; response handling does not follow documented tuple response contract. Missing/invalid responses can fail to produce violations. Implement explicit negative/default-deny tests, real TLS and key configuration | L; cryptographic provider contract, external-data enablement |
| E07 P1 | `scripts/discover-workloads.js` uses require and __dirname under package `type: module` | npm discovery entry fails before discovery. Convert to ESM. It also assigns Pod UID as SA UID, declares dedicated SAs verified, invents projected-token reason and ignores SA-level automount inheritance | M; real pod + SA reads and provenance model needed |
| E08 P1 | `identity/IdentityAccessView.tsx` handleSyncCluster only sets timers, then says 12 workloads verified | Action falsely reports successful synchronization. Show explicitly simulated feedback or disable until adapter exists | S; no new infrastructure required |
| E09 P1 | `microservices/02-workloads.yaml`: local app image tags without build sources/load step; no application Services; Postgres lacks initialization credentials; nginx read-only/nonroot without writable runtime mounts | Workload baseline is not deployable as a complete service chain. Start with one known runnable bounded sample and Service; validate each readiness prerequisite | M; registry/image availability unverified; nginx failure is a runtime risk |
| E10 P1 | Gatekeeper install YAML only creates namespace; Istio base only creates/labels namespaces | Applying directories does not install controllers/CRDs. Add explicit pinned installation/readiness stages later; avoid applying constraints before CRDs exist | M; version compatibility gate |
| E11 P1 | `otel/01-otel-collector-config.yaml`, `prometheus/01-prometheus-config.yaml`: `spire-system`; actual namespace `spire`; collector Service absent; app Services absent | Scrape DNS cannot resolve as authored. Fix namespace AND provide Services/ports and real telemetry config; verify target health independently | M; E05/E09 |
| E12 P1 | No NetworkPolicy definitions; namespace labels claim security zones. Istio principals use `cluster.local`, SPIRE IDs `trustmesh.internal` | Namespace labels do not enforce isolation; SPIRE is not connected to Istio identity issuance. Define actual network boundary and prove identity source before claiming unified trust | L; CNI enforcement and mesh integration required |
| E13 P1 | `App.tsx` and domain views import fixtures; no fetch/WebSocket integration found | Security events cannot change the UI from cluster activity. Introduce one read-only snapshot contract with explicit collection status before a broader API | M; avoid embedding kube credentials in browser |
| E14 P1 | `grafana/01-grafana-manifests.yaml` has committed admin password; Loki auth disabled | Lab defaults must remain isolated. Supply credential externally and use loopback/tunnel access before any host/guest exposure | S; no production auth platform needed |
| E15 P1 | `kind-config.yaml` has no node image pin; component versions are independently pinned; setup script lacks readiness/error gates and deploys intentionally privileged workload | Reproducibility and safe sequencing missing. Choose compatible versions, stop on failure, isolate negative fixtures from baseline | M; never silently relax admission policies |
| E16 P2 | `utils/trustScore.ts` clamps domain score to 35, returns 100 with no findings, fixed text says 12 active findings; `demoObservability.ts` independently fixes 88.5 | Heuristic triage score is not measured control efficacy. Explain formula, show unknown coverage, derive counts and separate suppression from control recovery | M; product scoring decision |
| E17 P2 | `App.tsx` local navigation/state and finding status changes | Reload loses triage, browser back/deep links absent, no audit record. Label session-only; add navigation/evidence links incrementally | M; persistence only when needed |
| E18 P2 | `FindingsTable.tsx` clickable headers; global CSS growth; no test/lint scripts | Keyboard gap and maintainability risk. Native sort buttons, focused workflow tests, gradual CSS consolidation | M; browser verification required |
| E19 P1 | `demoObservability.ts` cites nonexistent `run-all-tests.ps1` and negative-tests path; describes constraints not present; EVT-008 resource differs from order-api report | Evidence chains are misleading. Validate references and distinguish illustrative mappings from actual resource UIDs/digests | M; canonical fixture IDs |
| E20 P2 | Telemetry deployments lack persistent storage mounts for Loki/Prometheus; Grafana lacks resource bounds; alert names/labels not validated against engine output | Evidence retention/resource behavior unverified. Bound retention and resources; confirm actual exported metrics before claiming detections | M; runtime measurements required |

Gatekeeper webhook outage behavior cannot be established from the namespace-only installer. `enforcementAction: deny` is not proof of webhook fail-closed behavior. Provider `failurePolicy: Fail` must be checked against the selected Provider CRD schema; a comment or unknown field cannot establish enforcement.

External references used for technical cross-checks: [Gatekeeper external-data contract](https://open-policy-agent.github.io/gatekeeper/website/docs/externaldata/), [SPIFFE CSI implementation](https://github.com/spiffe/spiffe-csi), [Istio supported Kubernetes matrix](https://istio.io/latest/docs/releases/supported-releases/). CSI requires actual driver/registrar and workload socket wiring. Do not repeat the previous audit's blanket claim that adding a KinD host mount alone solves CSI. No compatible target stack was runtime validated here.

## F. Evidence and workflow assessment

LIVE means directly collected from a running integration, with collection time and source identity. TESTBED means captured from an executed controlled experiment, with command, environment, raw result and expected/observed verdict. DEMO means authored fixture or simulated sequence. UNVERIFIED means origin cannot be established.

All `src/data/demo*.ts` security inventories, timelines, mesh traffic, vulnerability records and scorecard values are DEMO, regardless of their TESTBED labels. Derived frontend scores remain DEMO-derived local state. Existing report/signature JSON cannot independently establish cryptographic execution: treat as UNVERIFIED artifacts until tied to actual digest, command and raw output. No LIVE or independently validated TESTBED data was established in this audit.

| Workflow stage | Current status |
|---|---|
| Policy violation occurs | YAML scenarios authored; runtime not verified |
| Event received | Fixture only; no receiver-to-UI bridge |
| Posture changes | Local triage recomputes heuristic score; no cluster event trigger |
| Finding appears / investigator opens it | Source implements fixture table and drawer |
| Workload / policy / evidence linked | String IDs and illustrative snippets; inconsistent reference paths |
| Enforcement understood | Fixture verdicts, not authenticated admission outcomes |
| Audit trail records triage | Not implemented; state is session-only |

Identity inventory and inspection work at the source level, but attestation and synchronization are simulated. Mesh inspection presents static SVID/traffic records; there is no verified handshake or denial capture. Supply-chain drawers expose authored image/CVE records; neither verification nor quarantine is connected. Observability explorer shows correlated authored events; simulation script neither emits OTLP nor validates storage. Preserve these UI flows as demonstrations while replacing one data boundary at a time.

## G. Phase 6.1 readiness and safe sequence

Actual terminal: Windows PowerShell at the supplied E: repository, Node/npm available. Docker, KinD, kubectl and Helm are absent from this terminal's PATH. This does not prove they are absent from the machine or guest. Owner reports Kali 2026.3 VMware, Docker 28.5.2 hello-world success, KinD 0.33.0, kubectl 1.36.4, Helm 4.3, four CPUs, approximately 8 GB RAM and 116 GB free disk, and no clusters. These are supplied observations, not independently reproduced.

The repository is not ready for a recursive apply. The client kubectl version does not identify the future server version. Select a KinD-supported node image/digest and check each security component's compatibility before cluster creation. PowerShell scripts also require PowerShell in Kali or deliberate shell equivalents; do not assume Windows commands run there.

Next guest read-only evidence: `uname -a`, `free -h`, `df -h`, `docker version`, `kind version`, `kind get clusters`, `kubectl version --client`, `kubectl config current-context`, `helm version`. If a context exists, inspect nodes, pods, Services and storage classes before creating anything. Do not output kubeconfig secrets.

Proposed deployment sequence, after explicit implementation approval:

1. Correct provenance and admission logic; define a compatible pinned stack. Obtain guest baseline and connectivity evidence.
2. One control-plane node, one replica of a known runnable workload, dedicated SA and Service. Verify readiness, DNS and restricted token behavior. Existing SAs disable automount; no explicit projected-token volumes were found. Do not claim projected credentials without observing them.
3. Install Gatekeeper, wait for webhook/CRD readiness, apply corrected templates, wait for constraint kinds, then scope constraints to the experiment namespace. Record positive and negative server-side admission results and unavailable-webhook behavior.
4. Export a read-only captured experiment snapshot to the existing frontend with source, run ID, timestamps and raw evidence. This is the first useful complete integration milestone.
5. Add Istio separately; verify injection on newly created pods, allowed request, unauthorized principal and plaintext denial. Policies only protect the relevant mesh data plane; label changes alone do not retrofit existing pods.
6. Add SPIRE only after configuring node/workload attestation, RBAC, server Service/config, registration controller and actual CSI or other supported socket delivery. Observe issued SVID and renewal, then separately integrate the mesh identity source.
7. Run Trivy/Cosign against one real immutable image digest. Verify offline/CLI evidence first. Introduce admission provider only with TLS, response validation, key configuration and timeout/error tests.
8. Add one telemetry path first. Confirm collector Service, DNS, source logs/metrics, normalization and Loki/Prometheus query result before adding Grafana. Configuration existence is not ingestion evidence.

Resource planning: 8 GB is a constraint, not a guarantee. The three bounded telemetry components alone have 1.5 GiB combined memory limits; SPIRE server adds 512 MiB, while agents, controllers, Grafana and several app containers lack bounds. This excludes OS, Docker/node overhead and mesh sidecars. Reserve roughly 2 GiB for guest/runtime as an initial planning allowance, measure actual usage at every stage, keep replicas at one and postpone concurrent scanning/full observability until stable. This allowance is not a measured requirement. Stop expansion on memory pressure/OOM/restart evidence.

For Windows-to-guest access, first establish VMware NAT/bridged IP and SSH reachability. Prefer a loopback-bound guest port-forward reached through SSH tunneling. Do not expose Kubernetes credentials, unauthenticated Loki or default-password Grafana to the LAN. A snapshot import can avoid adding a backend until continuous read-only collection is necessary.

## H. Improvement roadmap

1. Correctness: E01/E02/E08 provenance and false success, E03/E04 admission tests, E07 discovery metadata, status documentation reconciliation.
2. UI refinement: provenance beside values, actionable evidence links, keyboard sorting, drawer focus tests, meaningful empty/stale/error states; preserve established layout.
3. Integration: one workload + Gatekeeper + captured result + frontend snapshot; then staged mesh, identity, supply chain and telemetry.
4. End-to-end verification: correlate run ID/resource UID/image digest across command output, event, finding, policy and observed enforcement. Include positive controls and dependency-failure cases. Distinguish unavailable infrastructure from denied admission.
5. Demonstration: separate DEMO and TESTBED modes, retain raw evidence and environment versions, rehearse offline fallback, document limitations and measured resource/latency results only.

## I. Proposed first implementation batch — not authorized or started

Choose E01, E02 and E08 first: consistently label fixtures DEMO, replace fictitious live/sync assertions, and prevent simulated test runners from reporting enforcement. These are low-risk changes with immediate credibility benefit. Reconcile milestone wording in a separately reviewed documentation change. Then fix E03/E04 with focused Rego cases before any cluster deployment. Discovery ESM/UID correction follows once the minimal snapshot contract is agreed. Do not bundle a redesign or full infrastructure installation into this batch.

Acceptance: no fixture is labelled LIVE/TESTBED; sync cannot claim verification without collection; simulations cannot produce a real-test pass; policy tests cover omission and controller pod templates. Owner review is required before implementation.

## J. Validation record

| Command / method | Result | Evidence / limit |
|---|---|---|
| `Get-Content PROJECT_CORE.md` | PASS | Constitution read completely before inspection |
| `git status --short`, `git log -5 --oneline` | PASS | Initially clean; baseline 7a01a26; phases 2–6 visible in history |
| `rg --files`, Get-ChildItem including hidden/ignored planning files | PASS | Source/manifests/plans inventoried; ignored documents exist outside default rg listing |
| Source/manifest reads and targeted rg | PASS as inspection | Findings above; not YAML schema/controller validation |
| `node node_modules/typescript/bin/tsc --noEmit` | PASS | Explicit exit 0; no emitted files |
| `node --input-type=module -e "import {build} from 'vite'; await build({build:{write:false}})"` | PASS | 1,520 modules; built in 10.20s; in-memory bundle, no dist writes |
| `Get-Command node,npm,docker,kind,kubectl,helm -ErrorAction SilentlyContinue` | PARTIAL | Node/npm found; cluster tools not in Windows PATH |
| Existing test/lint scripts | NOT AVAILABLE | package.json has dev/build/preview/discovery only |
| Kubernetes schema, Rego execution, actual admission, mesh and CSI checks | BLOCKED | No accessible runtime/toolchain; no install performed |
| Browser interactions, contrast, viewports, focus | NOT EXECUTED | Source assessment only |
| Simulation runners | NOT EXECUTED | Inspection proves they print expected outcomes rather than validate integrations |
| npm run build | NOT EXECUTED verbatim | Equivalent TS + bundle stages checked with output disabled to respect only-report modification constraint |

Two initial rg commands used Windows-incompatible wildcard path arguments; relevant findings were recovered with directory searches and Get-Content. No package installation, lockfile modification, server start, cluster creation, deployment, commit or push occurred. Only this new report is permitted to change. Next smallest useful step: review the provenance correction batch, then approve its implementation separately.
