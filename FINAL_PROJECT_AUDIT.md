# ZeroTrustCloud / TrustMesh — independent final submission audit

**PRJ-34 · MCA final year · Cybersecurity & Supply Chain Defense · audited November 25, 2026 · review November 27, 2026**

Official title supplied for review: *Implementing and Automating Identity-Centric Zero-Trust Architecture for Cloud-Native Environments*.

## A. Executive assessment

**CONDITIONALLY READY.** A student can demonstrate a working local identity and security-posture dashboard. All five Kali endpoints returned valid JSON, both Kubernetes contexts reported a Ready node, and the live verification grid displayed 15 distinct results. The production build, type check, 78 software tests, opening experience and saved-artifact browser suite passed. These are fresh audit results.

**The remaining submission risk is evidentiary.** A repeated live Shell refresh failed at the Windows-to-Kali proxy. Some repository scripts print successful enforcement or signature results without observing a security decision. The historical experiment archive and original university statement were unavailable for independent examination. There is no measured baseline-versus-hardened performance result. A claim of a completed enterprise Zero Trust framework or validated performance objective would be indefensible. No P0 failure preventing the entire local demonstration was established. Section M gives the conditions for presenting the narrower result.

## B. Actual implemented architecture

| Layer | Independently established baseline |
|---|---|
| Repository | Windows PowerShell at the supplied E: project path. Branch `main`, commit `b62a80438c88c5e8efd7e9a987f694abd78d6206`, 193 tracked files. Initial tree clean. `PROJECT_CORE.md` still declares Phase 1. The live two-cluster lab extends beyond its status narrative. |
| Client | React and React DOM 18.3.1, TypeScript 5.9.3, Vite 5.4.21, Node 24.12.0, npm 11.6.2. `src/App.tsx` owns navigation, launch and theme state. Components, hooks, runtime validators, domain types, static evidence and CSS live under `src/`. Seven sidebar destinations plus preferences, header and opening experience. |
| Transport | Browser requests same-origin `/api/*`. `vite.config.ts` proxies to fixed plain HTTP address `192.168.33.128:8766`. Both direct and preview-proxied GETs worked. A static web server needs its own proxy. |
| Collector | Root-level `trustmesh-server-staging.py` is a five-route Python standard-library implementation. `trustmesh-server-policy-candidate.py` is an earlier three-route candidate. Live response headers identified BaseHTTP/0.6 Python/3.14.8. The stated deployed file is `/home/mrrobot/trustmesh-api/server.py`. Its bytes, process identity and effective Kubernetes permissions could not be inspected over SSH. |
| Policy lab | `kind-trustmesh-lab` supplies node status and Gatekeeper constraint observations. Network lab `kind-trustmesh-network-lab` supplies node, Pod, ServiceAccount, SPIRE, Istio and Kubernetes NetworkPolicy observations. The five endpoints summarize resources. They do not expose complete cluster inventories. |
| Security artifacts | 57 tracked assets under `k8s/` span cluster, microservices, SPIRE, Gatekeeper, Istio, supply chain, observability, scripts and scenario manifests. Significant differences from live names, namespaces and matching rules preclude using this tree as an exact deployment export. |
| Evidence and media | Two Trivy JSON records, one Cosign claim, a public-key file. No tracked five-endpoint historical archive or checksum manifest. Production assets include the MP4, WebP poster, four WebP brand sizes, core and two cloud SVGs. Private design screenshots, local master blueprint, several phase reports and the `reserach/` development link are ignored. |
| Documentation and tests | README, constitution, earlier audits, weekly kickoff, two planning PDFs and six literature PDFs. The 14-page methodology PDF specifies comparative experiments. No `docs/methodology-and-data-collection-plan.md` found. Eight Node test files use fixtures, rendering and source inspection. Four CDP scripts exercise a running site in Chrome. Lockfile and production assets are tracked. |

## C. University requirement traceability matrix

**Authority limit.** The audit brief supplies the five problem names, six component names and performance objective. The local *Master Project Blueprint* describes itself as an interpretation of the official statement. The independently identifiable original attachment was missing. The matrix covers the requirements supplied in the brief and the material capabilities in local planning. Completeness against the original, exact development priorities and mandatory status of individual enterprise capabilities require supervisor clarification. Technology choices such as EKS/AKS or alternative mesh engines do not by themselves require every alternative simultaneously.

Evidence strength below is **direct** for fresh observation or execution, **static** for source/configuration or saved file contents, **reported** for an earlier claim without independently verified output, and **none** for an unsupported capability. Validation concerns the particular capability in the row. A configuration PASS establishes its observed settings only.

| ID and requirement | Component, implementation and configuration | Evidence and validation method | Implementation coverage | Result / strength | Remaining gap and submission relevance |
|---|---|---|---|---|---|
| P1 Perimeter Security is Obsolete | Network API, NetworkPolicy, PeerAuthentication, Pod proxies | Inspect exact selectors and live resource observations, D/F | PARTIALLY IMPLEMENTED | PASS / direct for posture | Request-by-request verification, traffic and full L7 enforcement unproven. |
| P2 Identity and Access Management Complexity | Identity API, four dedicated accounts, SPIRE controllers, one ClusterSPIFFEID | Join five Pods to accounts and compare selector/statistics | PARTIALLY IMPLEMENTED | PASS / direct for inventory | Current credential validity, human permissions and federation outside demonstrated result. |
| P3 Policy Enforcement at Scale | Gatekeeper collector, constraints in policy context | Compare names, kinds, match, audit and webhook fields | PARTIALLY IMPLEMENTED | PASS / direct for three constraints | One namespace and resource kind. Scale, multi-cluster consistency and decisions unmeasured. |
| P4 Supply Chain and Pipeline Security | `k8s/supply-chain`, saved-artifact reader and browser | Parse JSON, compare digests and inspect helper branches | PARTIALLY IMPLEMENTED | FAIL / static for end-to-end pipeline | Offline artifact inspection works. No proven security gate from build to deployment. |
| P5 Visibility and Compliance | Five APIs, environment hub, inspectors, verification grid | Live HTTP, browser and controlled unavailable states | PARTIALLY IMPLEMENTED | PASS / direct for resource visibility | No operational compliance assessment or established event collection. |
| C1 Identity & Access Management Engine — workload binding and registration | `identity_workloads`, ServiceAccounts, controller replicas and registration | Five bindings, four accounts in use, explicit verifier selector | IMPLEMENTED | PASS / direct | Bounded to observed objects. Plaintext client shares authorized account. |
| C1.1 Attestation, issuance, renewal and current SVID validation | Verifier Pod, SPIRE and CSI | Pod Succeeded and registration stats. No credential-validity response or trusted issuance transcript available | UNVERIFIED | UNKNOWN / reported | Registration establishes eligibility. Request dated verifier evidence for historic issuance. |
| C1.2 Least privilege, RBAC/ABAC, human IAM, OIDC, cloud federation and JIT | Some infrastructure RBAC, e.g. `k8s/observability/prometheus/00-prometheus-rbac.yaml`; UI entry flag | Manifest and route inspection | PARTIALLY IMPLEMENTED | NOT TESTED / static | Effective workload grants unverified. No integrated user IAM, ABAC decision service, JIT or cloud federation established. Clarify required breadth. |
| C2 Policy-as-Code Engine — declarative constraints and enforcement | `k8s/policies/gatekeeper` templates, Rego and constraints; live three custom kinds | Read live spec/status, compare authored rules and test manifests | PARTIALLY IMPLEMENTED | PASS / direct for configuration | Obtain deployed Rego, webhook configuration and original positive/negative admission decisions. |
| C2.1 Policy testing, distribution and scale | `k8s/policies/tests`; Git tracks manifests | Runner inspection; cases differ from deployed scope | PARTIALLY IMPLEMENTED | NOT TESTED / static | No established GitOps reconciliation, policy promotion or scaling evidence. |
| C3 Service Mesh Security Engine — authenticated encrypted service communication | istiod, injection, named workload STRICT policy, native sidecars | Live network API and verifier | PARTIALLY IMPLEMENTED | PASS / direct for posture | No session handshake or evidence that SPIRE acts as Istio CA. |
| C3.1 Fine-grained principal-based authorization | `k8s/istio/02-authorization-policies.yaml` | Three authored ALLOW policies; no API inventory for this type | CONFIGURED ONLY | BLOCKED / static | Runtime presence or absence across namespaces unknown. Explicit inventory required. |
| C4 Continuous Verification Engine — automated checks | `automated_verification` and verification studio | Current grid, 15 identifiers and per-check evidence, D | IMPLEMENTED | PASS / direct for on-demand evaluation | Configuration checks have predicate limitations. Continuous identity or artifact verification remains unproven. |
| C4.1 Runtime drift, image integrity, dynamic risk and response | No production drift baseline, event loop or enforcement daemon identified; demo findings | Inspect hooks and source provenance | DEMONSTRATION ONLY for risk scenarios | NOT TESTED / static | Runtime integrity, continuous reauthorization, drift detection and automatic response are missing capabilities. |
| C5 Pipeline Security Engine — dependency/image scanning | Trivy JSON, scanner helper and supply-chain studio | Inspect payload scope and CVE identities | PARTIALLY IMPLEMENTED | PASS / static for record inspection | Scanner execution, complete image assessment and build enforcement unverified. |
| C5.1 Signature, trusted identity, provenance and deployment integrity | Cosign claim, public key, signing/verification helpers, provider and constraint YAML | Compare recorded reference and digest, inspect helper, parse public key | PARTIALLY IMPLEMENTED | FAIL / static and local parser | No validated signature, trusted signer, admission decision or deployed digest chain. |
| C5.2 CI/CD identities and permissions, build gates, SBOM, secret rotation | Repository and workflow inventory | No tracked CI workflow, production SBOM or secret lifecycle integration identified | NOT IMPLEMENTED in delivered pipeline | NOT TESTED / none | Material to pipeline claims. A scanner script alone does not constitute CI/CD. |
| C6 Observability & Compliance Engine — current visibility and history | Live pages, timestamps, demo sections, artifact ledger | Compare APIs to UI; retained-state test | PARTIALLY IMPLEMENTED | PASS / direct | Current snapshots and offline evidence available. No durable event history or identity decision feed established. |
| C6.1 Centralized metrics, logs, traces and alerting | Prometheus RBAC/config/alerts/deployment, Grafana, Loki, OTel DaemonSet manifests | Filesystem inspection; endpoints do not query these systems | CONFIGURED ONLY | BLOCKED / static | Runtime deployment, working ingestion, dashboards, detection and alert delivery unknown. |
| C6.2 Formal audit and compliance | UI evidence inspector and historical scenarios | Review implementation and assessment artifacts | NOT IMPLEMENTED | NOT TESTED / none | No SOC 2, HIPAA, PCI-DSS or similar assessment, control mapping and evidence attestation established. |
| R1 Research objective — integrated identity-centric framework | Local policy and network contexts, shared UI | Independent cross-check of resource and verification results | PARTIALLY IMPLEMENTED | PASS / direct for local demonstration | Cross-domain presentation works. Joined transaction decisions spanning all engines unproven. |
| R2 Performance considerations — avoid degradation | Methodology PDF, README §8, baseline and hardened experiment plan | Review for matched latency, throughput and resource samples | UNVERIFIED | NOT TESTED / none for overhead | No controlled comparison. Section K measures only collection and frontend operations. |
| R3 Development priorities — reproducible experiments and measurable results | Blueprint §§3, 19 and experimental plan; scenario scripts | Compare priorities to raw evidence, configuration and baseline | PARTIALLY IMPLEMENTED | BLOCKED / mixed | Plan exists. Original rubric, archived outputs and exact lab reproduction are outstanding. |
| R4 Broader enterprise and multi-cloud architecture | Two local kind contexts; explicit EKS/AKS disconnected cards | Source and live environment inspection | NOT IMPLEMENTED for managed-cloud environments | NOT TESTED / direct for UI boundary | Academic clarification on cloud parity, scale and federation. No inference of production maturity. |

## D. Security-control verification

**Network and mesh.** In `trustmesh-integration-test`, both ingress policies select only `app=trustmesh-integration-server`. The default-deny object contributes no allowed ingress. The allow object adds same-namespace Pods matching `app=trustmesh-integration-client,role=authorized` on TCP 8080. Kubernetes unions allowances from policies selecting a Pod. Neither rule isolates all namespace ingress or egress. The authorized plaintext control also matches the network selector. Network labels do not authenticate an SVID. The API observes Kubernetes resources, not the installed CNI implementation or packets. Calico daemon readiness requires a separate inventory.

The live `trustmesh-integration-strict-mtls` PeerAuthentication selects the server only. Istiod reported 1/1 and injection was enabled. Server, authorized and unauthorized client each had a ready native `istio-proxy` in initContainers. The plaintext client had none. The completed verifier had none. Repository AuthorizationPolicy objects exist for payment, database and order workloads in payments/orders. No live route queries AuthorizationPolicy. Neither deployed presence nor absence can be concluded. Expected authorized success, unauthorized denial and plaintext failure require original dated traces. The mesh runner copies expected TLS values into output. No current traffic probe was performed.

**Identity.** Four dedicated accounts and the standard default account were visible. Four long-lived Pods were Running, and the verifier was Succeeded (0/1 ready after completion). Server, agent and SPIFFE CSI driver each reported 1/1. Registration selected the verifier app in exactly the integration namespace, with one selected Pod, one intended entry and zero entry failures. Its template derives the SPIFFE ID from trust domain, namespace and ServiceAccount. No endpoint returns a certificate, issuance event, expiration or current validation. A completed Pod supports the lifecycle claim only. The earlier SPIRE agent readiness failure is reported history. Its time, duration, cause and recovery transition could not be corroborated. Current readiness is compatible with a transient failure; persistence was not observed and cause remains unresolved.

**Admission.** Three constraints reported `deny`, each targeting `apps/Deployment` in `trustmesh-lab`: `K8sContainerSecurity/trustmesh-container-security`, `K8sRequiredServiceAccount/trustmesh-require-dedicated-sa` and `K8sWorkloadHardening/trustmesh-workload-hardening`. Each reported webhook enforcement and zero audit violations at 15:13:33Z. Each also reported `vap.k8s.io: K8sNativeValidation engine is missing`. Staging computes webhook status from webhook-operation entries and collects enforcement-point diagnostics separately. These observations can coexist. Neither establishes the outcome of a particular admission request. No cumulative rejection count was supplied. The four checked-in templates for nonroot, privileged, dedicated SA and escalation have different kinds and broader match scopes. The Gatekeeper installation YAML contains installation guidance and a Namespace. It is not an export of the installed controller or webhook.

**Supply chain.** Both saved Trivy records declare `container_image` but each contains a single npm language-package result targeting `package-lock.json`. Neither supplies an original scan timestamp. `order-api-v1.1-vuln.json` actually identifies `trustmesh/mysql-proxy:cache`, mysql2 3.9.2, recorded CVE-2024-21508, severity CRITICAL, score 8.8, fixed version 3.9.4. Those values are report contents. They do not describe the dashboard dependencies. `order-api-v1.2-clean.json` identifies `trustmesh/order-api:v1.2`, lists mysql2 3.9.4 and express 4.19.2, and has an empty vulnerabilities array for that target. No OS-wide, all-layer or filesystem-wide clean result follows.

The order-api repository digest and the Cosign claim match at `sha256:7b129c54e0821dfa92918bc3251ee2d744f456108e427d1421008064953bfcb4`. The claim carries a signer label, issuer string, an ISO value in SignedEntryTimestamp (14:22Z on November 1) and an IntegratedTime corresponding to 13:02Z that day. These are recorded fields with different semantics. No authenticated Rekor proof or verified signature bytes were established. The provider references a service and a CA bundle that decodes to a certificate header alone. A working provider, admission gate and deployment-to-registry digest relation were not established. No signing, scanning or admission operation was run.

### Verification register

The live response had 15 unique IDs, 15 PASS, zero FAIL and zero UNKNOWN. All 15 used **2026-11-25T15:14:17.213384+00:00**. Staging assigns one collection-start time to the batch. Sources below use P for the policy context and N for the network context. All observations in this table are actual API values. Branch descriptions come from the repository staging copy. Their correspondence to the running binary is unverified. Unavailable domain collectors generate UNKNOWN; specific exceptions below distinguish absent inventory from negative evidence.

| Check ID | Source and observed PASS condition | FAIL / UNKNOWN behavior and limit |
|---|---|---|
| k8s-cluster-readiness-lab | P nodes, 1 reachable Ready node | FAIL any nonready node; UNKNOWN disconnected, empty or exception. |
| k8s-cluster-readiness-network-lab | N nodes, 1 reachable Ready node | Same predicates for N. Node condition measures node readiness. |
| gatekeeper-constraints-inventory | P constraint lists, all three expected names found | FAIL missing expected name; UNKNOWN collection failure. Checks named inventory only. |
| gatekeeper-enforcement-action-deny | P constraint specs, three deny values | FAIL missing constraint or different/missing action; UNKNOWN collector unavailable. |
| gatekeeper-scope-workload-deployments | P constraint match, all three have apps/Deployment and trustmesh-lab | FAIL missing expected name or unmatched kind/namespace; UNKNOWN collector unavailable. Predicate also accepts core group erroneously. |
| gatekeeper-webhook-enforced | P status.byPod, true for three | FAIL any reported false; UNKNOWN missing constraint/value or collector. VAP diagnostic retained. |
| calico-default-deny-server | N named NetworkPolicy, server app, Ingress, empty ingress list | FAIL absent policy or divergent fields on successful list; UNKNOWN failed list. Checks selected fields only. |
| calico-allow-authorized-server | N named NetworkPolicy, authorized peer and TCP 8080 in one rule | FAIL absent object or missing required match; UNKNOWN failed list. Other allowances are not excluded by predicate. |
| istio-control-plane-ready | N istio-system Deployment, ready 1/desired 1 | FAIL if observed unready; UNKNOWN failed query. |
| istio-workload-strict-mtls | N named PeerAuthentication, server selector, STRICT | FAIL absent or divergent policy; UNKNOWN failed query. No connection or negotiation test. |
| istio-sidecar-injection-posture | N Pods, proxy present on three and absent on plaintext | FAIL divergent presence; UNKNOWN missing expected Pod or failed inventory. First matching Pod used. Does not require native location or readiness. |
| spire-control-plane-components | N trustmesh-spire, three named controllers with ready/desired 1/1 | FAIL insufficient/zero ready; UNKNOWN missing/unavailable component. No attestation test. Missing numeric values can be defaulted. |
| spire-workload-registration | N ClusterSPIFFEID, named object and matching template substrings; observed selectors and statistics as above | FAIL wrong name/template; UNKNOWN unavailable registration. Selector/statistics do not govern PASS. |
| workload-service-accounts | N integration ServiceAccounts, all four expected names | FAIL missing name on available inventory; UNKNOWN collector failure. No RBAC analysis. |
| workload-lifecycle-and-identity | N integration Pods, four Running and verifier Succeeded; expected SA for each | FAIL divergent binding/phase; UNKNOWN missing workload or unavailable inventory. Verifier Running also accepted. First matching roles, name fallbacks, no every-replica guarantee. |

The API has no aggregate totals field. Independent reduction of individual records agreed with the browser legend. The successful branches inspect data. Several explanations claim more than their predicates establish (H). Unknown and failed configurations were examined in source and frontend fixtures. This audit did not interrupt a live collector or inject faulty resources.

## E. Automated and browser test results

Windows, existing dependencies, production preview on loopback, headless **Google Chrome 157.0.8103.81** with a separate temporary profile. No other browser engine was tested. The package has no npm test alias. Test source was inspected before execution. Browser suites ran sequentially without altering source, assertions or deadlines. Browser scripts report a suite exit rather than individual assertion totals.

| New execution | Data source | Passed / failed / skipped | Duration and observation |
|---|---|---|---|
| `node --test tests/*.test.cjs` | Synthetic responses, mocked fetch, React static rendering, file/source checks and saved artifact readers | 78 / 0 / 0; 0 cancelled | 2.209 s. All eight test files. Backend route presence test inspects staging source. |
| `node node_modules/typescript/bin/tsc --noEmit` | Strict project type check | 1 / 0 / 0 | 5.150 s. |
| `npm.cmd run build` | TypeScript and Vite production bundle | 1 / 0 / 0 | Vite 9.09 s, 1,530 modules. End-to-end build duration not separately timed. |
| Launch browser | Production assets, local proxy, deliberate blocked requests/autoplay rejection | 1 / 0 / 0 | 5.546 s. Playback, loop, fallback, immediate keyboard entry, focus, theme/session, replay, reduced motion and media cleanup passed. |
| Shell browser, live | Production proxy → Kali | 0 / 4 / 0 across four invocations | 24.588, 23.554, 23.873 and 23.831 s. All twelve viewport/theme combinations reached their pass markers before the refresh failure. |
| Security Verification browser, live | Production proxy → Kali | 1 / 2 / 0 across three invocations | First two attempts 17.630 and 17.645 s. Diagnostic run with passive CDP network observation passed; its full duration was not captured. Compared row IDs to the exact response used by the page at **15:17:54.067603Z**. All 15 PASS. Inspector, refreshed/retained state and recovery checks finished. |
| Supply Chain browser | Three saved files bundled into the production UI | 1 / 0 / 0 | 10.724 s. Selected records, checked inspector/raw JSON pagination, copy and digest identity. |
| Shell and Verification browsers, isolated fixtures | Separate loopback origin replayed the five response shapes; synthetic collection times supported the freshness tests | 2 / 0 / 0 | Shell 9.245 s, Verification 9.228 s. These timestamps and results have no standing as live observations. |
| Additional Chrome layout survey | Seven production workspaces × six viewports × two themes | 84 combinations, zero document-overflow or empty-main findings | No runtime exceptions or HTTP responses ≥400 in this survey. Duration not measured. This checks page geometry and navigation, not every glyph or control. |

Commands for the existing browser suites (no screenshot output directory):

```powershell
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 14342 --strictPort
node tests/launch-browser.mjs http://127.0.0.1:14342 http://127.0.0.1:19342
node tests/shell-browser.mjs http://127.0.0.1:14342 http://127.0.0.1:19342
node tests/verification-browser.mjs http://127.0.0.1:14342 http://127.0.0.1:19342
node tests/supply-chain-browser.mjs http://127.0.0.1:14342 http://127.0.0.1:19342
```

Fixture runs used the same last three arguments as the corresponding live scripts except site port **14343**. The temporary adapter served local JSON and forwarded static asset requests to the preview. It did not write to test files or route the production application to synthetic results.

**Failure evidence.** Shell stopped at `tests/shell-browser.mjs:309` with `Timed out waiting for document.querySelector('.shell-integrations').innerText.includes('Cluster status API reachable')`. Diagnostic run saw HTTP 200, then HTTP 500 on cluster refresh. The Hub said “Latest refresh failed; showing previous snapshot”. Vite logged `http proxy error: /api/cluster/status` and `Error: socket hang up` on three occasions. Verification initially failed at `tests/verification-browser.mjs:81`, `Timed out waiting for document.querySelectorAll('.vs-row').length>0`. Node also printed `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76` on failed process exits. Fixture success and the eventual live Verification pass narrow the problem; neither identifies the cause of the upstream reset. No assertion was relaxed.

**UI coverage.** Six targets were 390×844, 768×1024, 1366×768, 1440×900, 1536×864 and 1920×1080. Shell exercised rail, overlay, popovers, preferences, keyboard focus and theme persistence. Completion of stale/error/recovery assertions was fixture-based for Shell. The live Verification interaction suite uses five of the six sizes, excluding 768; Supply Chain uses five, excluding 1536. The additional geometry survey included both omitted sizes. Identity, Policies and Trust Architecture had route/geometry coverage, source inspection and fixture-based renderer/validator checks. Selection, long-name clipping, visual focus indication, contrast, all possible data lengths and every button in those modules were not exhaustively verified. No full WCAG or screen-reader assessment was performed.

**Launch media.** The MP4 container's actual track-handler list was one `vide` and zero `soun`. The browser confirmed muted, looping inline playback, background pause, pause persistence, poster display on media failure and zero video requests with reduced motion. After entry the prior element was paused, disconnected, had no source and had networkState 0. Blocking the APIs did not block entry. The session flag controls the opening experience; there is no authenticated identity. The poster/film is conceptual artwork.

## F. Live API and Kubernetes validation

Ordinary unauthenticated GETs from the approved Windows host route to Kali succeeded after the restricted sandbox initially failed to connect. All five captured response bodies parsed as JSON and passed the corresponding actual `src/utils` runtime validator. Timestamps below are UTC on **2026-11-25**. Latency is the elapsed time of the preceding independent GET, one sample per route.

| Route | HTTP | Collected at | Duration | Payload agreement |
|---|---:|---|---:|---|
| /api/cluster/status | 200 | 15:14:15.641942 | 0.237 s | Two named connected contexts, one Ready node each; integration reports five Pods. |
| /api/identity/workloads | 200 | 15:14:16.478115 | 0.462 s | Same five names/phases, five SA objects, three controllers, selected verifier registration. |
| /api/policies/gatekeeper | 200 | 15:14:16.753681 | 0.222 s | Three scoped constraints, actions, webhook flags, diagnostics and audit time. |
| /api/security/network | 200 | 15:14:17.166906 | 0.374 s | Same five Pods; two ingress policies, one workload STRICT policy and Istiod. |
| /api/security/verification | 200 | 15:14:17.213384 | 1.182 s | Automated-verification source, 15 unique checks, shared batch time, per-check reason/evidence/source. |

**API design and exposure.** Staging lines 14–29 pass a list of fixed arguments to subprocess.run, with no shell, an 8 s kubectl request timeout and a 12 s process timeout. Fixed GET routes and collector-owned contexts do not interpolate URL parameters into commands. No modifying Kubernetes verbs were found in those collectors. The fixed host binds a LAN interface. CORS allows `http://localhost:5173`; the same-origin preview proxy works independently of that header. Sampled proxied responses carried JSON and `Cache-Control: no-store`. CORS is no access-control barrier to direct clients. No application authentication, TLS, rate limit, bounded worker pool or global collection deadline was established. ThreadingHTTPServer can run concurrent collections, each invoking multiple serial kubectl processes. Verification's frontend deadline is 8 s, shorter than one worst-case subprocess timeout. One HTTP 200 can carry unavailable or partial data. These are local-demo operating limits.

Cluster status represents disconnected contexts in-band. Identity returns 503 when Pod/SA inventory fails, while registration/controller subqueries can fail independently. Policy returns 503 when any required kind query fails. Network exposes section availability and can return 200 with incomplete sections or 503 when nothing was collected. Verification generally emits UNKNOWN for unavailable domains and returns a structured result. Some exception reasons include exception text. The staging cluster-status exception list omits OS and type errors; malformed nested objects may escape other handlers. No privileged configuration dump, adversarial request, artificial live failure or load test was used. Source parity and actual RBAC remain open.

**Direct access limitation.** Windows had no kubectl on PATH. Noninteractive trusted-host SSH to the stated Kali user failed during banner exchange with “Connection refused”. HTTP reachability does not grant filesystem or raw Kubernetes API access. Section L lists minimal local commands for evidence the HTTP routes omit.

## G. Technical-accuracy findings

| Presentation | Finding |
|---|---|
| Current observation vs control efficacy | Most inspected workspaces distinguish resource posture, verification, saved files and demo scenarios. Environment Hub identifies EKS and AKS as **NOT CONNECTED**. The architecture drawing depicts policy relationships. No request count, packet observation or compliance score can be derived from it. |
| Verification reasons | Live response said “verifying traffic encryption” for a spec check. Static success prose also describes an exclusive allowed path, native sidecar location and a targeted registration more strongly than the predicates support. Inspector/raw API consumers can see these statements. |
| Historical and demo UI | Policy page explicitly labels its decision feed demonstration/simulated; Verification says an observed admission decision requires an execution record. Findings and risk scores are fixtures and triage is local. Saved evidence is distinct from the collapsed pipeline walkthrough. No independent support for attack counts, breach rates or actual rejection counts was found. |
| Freshness | Timestamp aging, manual re-verify and retained evidence are implemented. The one-second timer in `useCommandSources.ts:51` updates displayed age. It does not poll Kubernetes each second. A live failure visibly retained the prior evidence. |
| Formal claims | No measured formal compliance level, universal workload identity validation, cross-cloud connection, production incident response or zero performance overhead was established. Do not present a demo score or a simulated security event as an experimental result. |

## H. Confirmed defects and material implementation findings

The reproduction column describes read-only observations or source inspection. Staging findings are confirmed against that file; an identical deployed defect is asserted only where its effect was directly observed. Corrections below are recommendations only.

| ID / severity | Location and reproduction | Actual vs expected, impact | Smallest recommended correction |
|---|---|---|---|
| H1 P1 · live reliability | `tests/shell-browser.mjs:309`, `vite.config.ts:16`; repeat command E and inspect proxy log | Repeated refresh timeout, HTTP 500 and upstream socket hang-up. Expected a newly collected reachable snapshot. Prior evidence retained correctly. Live rehearsal is unreliable. | Correlate this GET with the existing Kali server log at the same time. Resolve the reset at the identified layer and rerun unchanged live suites. |
| H2 P1 · signature evidence | `k8s/supply-chain/cosign/verify-signature.ps1:26–41`, inspect no-CLI branch | Default branch prints VERIFIED, a fixed digest, ALLOW and exit 0 using image-name patterns. It does not even read the named database. A caller can treat an unverified image as trusted. | Return unavailable/non-success when Cosign cannot verify. Label any teaching transcript separately. |
| H3 P1 · experimental validity | `k8s/istio/tests/run-mesh-tests.ps1:44–55`; `k8s/supply-chain/tests/run-supply-chain-tests.ps1:60–75` | Runners copy expected TLS/cipher/status or print expected 201/403 and increment pass counts without executing the alleged decision. Output cannot substantiate historical security experiments. | Mark outputs as simulation and remove them from empirical totals. Use independently captured original decisions for experimental claims. |
| H4 P1 · network verification | `trustmesh-server-staging.py:988–1014`, inspect match and early break | Finding one matching allow rule suffices for a PASS that claims ingress is restricted. Additional rules, peers, ports and other selecting policies can widen the effective allow set. Current response showed only the intended two policies. | Describe the tested condition as presence of the configured allowance, or evaluate the full effective scope before claiming exclusivity. |
| H5 P1 · identity verification | `trustmesh-server-staging.py:1287–1296` | PASS requires a name and template substrings. It claims namespace targeting without checking either selector or registration failures. Current independent inventory happens to match. | Check the advertised selectors/template or narrow the check label to the fields tested. Distinguish absent evidence. |
| H6 P1 · reproducibility | `k8s/cluster/kind-config.yaml`, `k8s/policies/gatekeeper/constraints/require-dedicated-sa.yaml:4`, staging lines 216–223 and live F | Tracked resources describe a different lab layout and different Gatekeeper kinds. No corresponding tracked definition of the live integration NetworkPolicies was found. Reapplying repository assets cannot be represented as reproducing this deployment. | Supply a sanitized inventory and versioned instructions specific to the existing two-context lab, with historical sample assets identified. |
| H7 P2 · check accuracy | `trustmesh-server-staging.py:831,1098,1163–1173` | Scope predicate accepts core-group Deployment as apps/Deployment. mTLS reason claims traffic encryption. Sidecar reason says native initContainer while condition tests presence only. First matches can hide replica variation. | Require apps group, report configured mTLS, and derive sidecar wording and replica coverage from inspected fields. |
| H8 P1 · admission evidence attribution | `k8s/policies/tests/run-policy-tests.ps1:32–44` | Generic Forbidden or an exception is classified DENY, potentially satisfying a negative case despite client, RBAC or infrastructure failure. Cases use different targets from live Deployment-only rules. | Require an attributable Gatekeeper response for the expected constraint, carry infrastructure errors as UNKNOWN, map cases to deployed rules. |
| H9 P1 · scanning/signing helpers | `k8s/supply-chain/trivy/trivy-scan.ps1:22–55`; `cosign/sign-image.ps1:18–22` under the same tree | Scanner exit is recorded but not enforced; stale report may be consumed; missing report has no explicit failure. Severity parameter does not govern threshold logic. Sign helper announces success after command without checking result, or in simulation. | Propagate tool failures, require a matching fresh report and chosen threshold, and reserve success wording for verified outputs. |
| H10 P2 · key/provider packaging | `k8s/supply-chain/cosign/cosign.pub:1`; `k8s/supply-chain/policies/00-gatekeeper-cosign-provider.yaml:12–14` | Node crypto.createPublicKey on supplied file returned ERR_OSSL_UNSUPPORTED. Authored provider CA data decodes to a PEM header only. Neither provides a demonstrated working verification chain. | Identify these as sample materials. If claiming real verification, supply a parseable trusted public key, complete public trust material and verification transcript. |
| H11 P2 · credential hygiene | `k8s/observability/grafana/01-grafana-manifests.yaml:41–42` | Grafana admin password is a literal in tracked configuration. Value withheld. No evidence it is active. | Replace literal with a secret reference before using this manifest. Rotate only if confirmed used. |
| H12 P2 · error handling | `trustmesh-server-staging.py:31–55,1478–1495` | Missing kubectl executable can raise OSError outside cluster_status's handled exceptions and abort the status GET. No evidence that this caused H1. | Handle OS/type failures consistently with the integration collector and return the existing unavailable contract. |
| H13 P2 · authored Rego mismatch | `k8s/policies/gatekeeper/templates/03-k8s-require-dedicated-sa-template.yaml:20,28` and matching constraint | Rule reads object.spec.serviceAccountName even for Deployments and other controllers matched by the constraint. Pod-template binding can be treated as omitted. Privileged template also reads Pod-shaped containers. This concerns authored examples; live templates differ. | Restrict the example to supported kinds or inspect each selected kind's Pod template and verify representative cases. |

## I. University requirement gaps

1. **P1 research validity.** No reproducible baseline/hardened measurements for latency, throughput, CPU or memory, and no raw evidence establishing the full positive/negative experiment matrix. Performance and defensive efficacy beyond the observed posture remain open.
2. **P1 pipeline coverage.** Artifact inspection works. Integrated CI/CD security, build-time enforcement, authenticated signer evidence, deploy-time integrity, runner identity, secret rotation, GitOps reconciliation and continuous artifact validation have no demonstrated end-to-end implementation.
3. **P1 reproduction and identity scope.** Registration covers a selected verifier. Current SVID validity, every-workload attestation and linkage of SPIRE identities to Istio certificates lack proof. Reproduction requires host state beyond this repository.
4. **P2 limited implementation scope.** Three Deployment constraints cover one policy namespace. Effective least privilege, RBAC/ABAC decisions, principal-based L7 authorization, cross-cluster governance and actual packet/admission decisions require additional primary evidence.
5. **P2 observability scope.** No verified event ingestion, centralized logging, continuously executing verifier, runtime drift/anomaly detection, incident response or formal compliance reporting. Monitoring manifests alone do not close this gap.
6. **Academic clarification.** Determine whether the marked submission must include managed clouds, human IAM/JIT, federation, full CI/CD, enterprise observability, comparative overhead data and particular development priorities. The research objective explicitly raises performance. It must remain unanswered in the conclusions unless measured. No missing capability has been deemed optional solely because Phase 1 excluded it.

## J. Documentation corrections

| Document and section | Claim needing attention | Required editorial treatment |
|---|---|---|
| `PROJECT_CORE.md` §§1, 5 and README §§5, 9 | Phase 1 status says admission engines remain uninstalled or planned. Planned directory tree and implemented shell description do not capture the separate live lab. | Date the original milestone; document local observations, repository examples and deployment origin individually. Preserve research history. |
| README §5.1, lines 111, 128 | Preview described as port 3000; blanket simulated-testbed label and older dashboard description. | Port 3000 is configured for dev. Specify preview port explicitly. Document provenance per current screen. |
| README §§3, 4, 6, 8, 11 | Federation, L7 authorization, Syft, GitHub Actions, Loki, risk scoring and baseline experiments appear among objectives/diagrams. | Keep their planned labels and attach actual evidence to a separate delivered-scope table. Avoid presenting the proposed diagram as the deployed topology. |
| Local `PHASE_5_IMPLEMENTATION.md:4,66,96,134` | “Complete & Verified”, “Real attestation payload with Rekor bundle”, successful admission and a signature rate. | Identify saved claims and generated walkthrough outputs. Remove unsupported rates from academic results. |
| Local `PHASE_6_VERIFICATION.md:91–104` | Eight “executed and verified” outcomes include SVID issuance, rejection and quarantine from a simulation script. | Label as scenario playback. Preserve original files as history and correct their interpretation in the submitted narrative. |
| `PHASE_6_1_ENVIRONMENT_AUDIT.md` §1; planning and methodology PDFs | Dated offline/host assertions and Week 4 planned evaluation. | Cite as earlier snapshots/plans. Add dated results and open questions separately. Do not overwrite historical evidence. |
| README and final runbook | No exact path from clean frontend checkout to the observed two-cluster deployment or comprehensive live browser rehearsal. | Include versions, fixed proxy, backend identity, prerequisites, expected evidence and failure path. Do not package credentials. |

## K. Performance and stability findings

Direct API wall times ranged from 0.222 to 1.182 s in the five ordinary GETs in F. Verification was the longest. One warm local production navigation in Chrome reported DOM interactive at 12.9 ms and load event end at 33.5 ms. This is a single browser navigation, with API work continuing after page load. The launch suite verified resource release after entry. Repeated refresh showed intermittent upstream failure in the live path.

| Production output | Size | Build-reported gzip |
|---|---:|---:|
| HTML | 0.97 kB | 0.52 kB |
| CSS | 350.06 kB | 63.15 kB |
| JavaScript | 391.69 kB | 115.08 kB |
| Launch MP4 | 2,829,341 bytes | Not measured |
| Poster WebP | 69,264 bytes | Not measured |

No high-load test, cross-host benchmark, percentiles, resource profiles, defensive efficacy rate or before/after workload comparison was performed. The study's security-enforcement overhead claim is **UNVERIFIED**. Responsive navigation, a small number of successful GETs and a quiet audit cannot answer the performance research question.

## L. Reproducibility and demonstration readiness

**Minimum review sequence.** Use the existing Kali host and two existing contexts. On Kali, establish context names, node readiness, access to the named APIs and the existing backend listener. On Windows, confirm route to the backend and open the local preview with the same-origin proxy. Use the existing dependency installation, build and start the preview as in E. For a separate clean machine, the tracked lockfile and a compatible Node/npm installation are prerequisites; a clean offline install was not tested. No new cluster, cloud account, external registry, credential entry or security experiment is required for the UI walkthrough. Existing local Kubernetes credentials remain necessary on Kali. Do not launch a second backend on an occupied port. No infrastructure startup or recovery was attempted.

Show the two context names and timestamps in Environment Hub, then an account binding and the selected verifier registration, the three Deployment constraints and VAP diagnostic, and the server's ingress selectors and STRICT configuration. Show individual verification evidence and the saved npm-target scan and matching digest strings. Identify the simulated sections before showing them. If the VM or proxy fails, demonstrate the unavailable or last-known state and the saved artifacts. A functioning **live** demonstration still depends on Kali and reliable proxy refresh. An offline demonstration cannot satisfy that part of the review.

**Read-only commands for the operator.** Run on the existing Kali host with its existing kubeconfig. These commands address facts outside the Windows API contract. Do not output kubeconfig, Secret data, full verifier logs, keys or tokens.

```bash
sha256sum /home/mrrobot/trustmesh-api/server.py
ss -ltnp 'sport = :8766'
kubectl config get-contexts -o name
P=kind-trustmesh-lab
N=kind-trustmesh-network-lab
kubectl --context "$P" get nodes
kubectl --context "$N" get nodes
kubectl --context "$P" -n gatekeeper-system get deploy,pods
kubectl --context "$P" get validatingwebhookconfigurations
kubectl --context "$P" get constrainttemplates -o name
kubectl --context "$P" get constrainttemplates k8scontainersecurity k8srequiredserviceaccount k8sworkloadhardening -o yaml
kubectl --context "$P" get k8scontainersecurity,k8srequiredserviceaccount,k8sworkloadhardening -o wide
kubectl --context "$N" get authorizationpolicies.security.istio.io -A
kubectl --context "$N" -n trustmesh-integration-test get networkpolicy,peerauthentication,pod,sa
kubectl --context "$N" get clusterspiffeid trustmesh-integration-workload-identity -o yaml
kubectl --context "$N" -n trustmesh-spire get sts,ds,pod
kubectl --context "$N" -n trustmesh-spire get events --sort-by=.lastTimestamp
kubectl --context "$N" -n trustmesh-integration-test get role,rolebinding
for ctx in "$P" "$N"; do
  kubectl --context "$ctx" get deploy,ds,sts -A | grep -Ei 'calico|tigera|prometheus|grafana|loki|otel|opentelemetry|cosign' || true
done
```

Compare the deployed file hash with the Windows staging SHA-256 **7cb655354b67a6841922ecf6af1321c3f6bfb93011df9cca110eaa45c86efdba**. Different hashes require source comparison, including possible line endings. Matching files alone cannot identify the process that served a given request. The observability name filter is a first inventory check; custom-named controllers may require inspecting images. Events can expire. Effective permissions require reviewing the relevant role/binding subjects and ClusterRoleBindings, and any wider grants. A ServiceAccount name alone gives no least-privilege verdict.

From Windows, test each endpoint without printing its contents:

```powershell
foreach ($route in 'cluster/status','identity/workloads','policies/gatekeeper','security/network','security/verification') {
  curl.exe --noproxy '*' --connect-timeout 4 --max-time 60 -sS -o NUL -w "$route %{http_code} %{time_total}\n" ("http://192.168.33.128:8766/api/"+$route)
}
```

**Historical archive.** No original final-evidence bundle was available locally. The five responses collected during this audit are new observations and were stored separately in temporary storage. To verify the original without modifying it, first locate the existing archive on Kali:

```bash
find /home/mrrobot -type f -name SHA256SUMS -path '*final-evidence*' -print
```

In the directory containing the intended manifest, run this read-only check. It verifies the exact five relative file entries and digests, parses JSON, prints source and original timestamps, and checks verification ID uniqueness. An unexpected manifest layout should be inspected in place rather than normalized or overwritten.

```bash
python3 - <<'PY'
import hashlib, json, re
from collections import Counter
from pathlib import Path
root = Path.cwd().resolve()
names = {"cluster-status.json", "identity-workloads.json", "policies-gatekeeper.json",
         "security-network.json", "security-verification.json"}
seen = set()
records = {}
for line in (root / "SHA256SUMS").read_text().splitlines():
    m = re.fullmatch(r"([0-9a-fA-F]{64}) [ *](.+)", line)
    if not m:
        raise SystemExit("Unexpected checksum format")
    rel = Path(m[2])
    target = (root / rel).resolve()
    if rel.is_absolute() or target.parent != root or target.name not in names or target.name in seen:
        raise SystemExit("Unexpected checksum path or duplicate entry")
    raw = target.read_bytes()
    if hashlib.sha256(raw).hexdigest() != m[1].lower():
        raise SystemExit("Checksum mismatch: " + target.name)
    data = json.loads(raw)
    assert isinstance(data, dict) and data.get("source") and data.get("collectedAt")
    records[target.name] = data
    seen.add(target.name)
    print(target.name, data["source"], data["collectedAt"], "checksum OK")
assert seen == names
assert {c["context"] for c in records["cluster-status.json"]["clusters"]} == {
    "kind-trustmesh-lab", "kind-trustmesh-network-lab"}
assert records["policies-gatekeeper.json"]["cluster"] == "kind-trustmesh-lab"
identity, network = [records[f] for f in ("identity-workloads.json", "security-network.json")]
assert identity["cluster"] == network["cluster"] == "kind-trustmesh-network-lab"
assert identity["namespace"] == network["namespace"]
checks = records["security-verification.json"]["checks"]
assert len({c["id"] for c in checks}) == len(checks)
print("Historical verification counts:", Counter(c["status"] for c in checks))
PY
```

Checksum agreement establishes consistency with that manifest. It does not authenticate the operator, original command or observations. Compare the archived times and cluster/namespace values to the original experiment notes. For the claimed allowed/denied paths, request the timestamped source, destination, policy in effect and observed command outcome. For admission, request the actual denial identifying the constraint. For the historical SVID and SPIRE failure/recovery, request a redacted identity/validity summary and timestamped controller observations on both sides of the transition. Do not substitute files emitted by the simulation runners.

## M. Final action register

| Priority | Action before or after review | Closure criterion |
|---|---|---|
| Mandatory before submission | Reconcile the actual university statement with C and obtain supervisor determination for ambiguous mandatory capabilities. | Official source referenced, omissions disclosed, local scope accepted or outstanding requirements recorded. |
| Mandatory before submission | Correct the academic narrative around simulated security outcomes and scan/signature limits. | No expected value cited as a measured admission, packet, SVID, signature or benchmark outcome. |
| Mandatory for any historical enforcement or issuance claim | Verify the original archived files and attach redacted, attributable experiment transcripts. | Checksum and provenance recorded. Unsupported outcomes omitted from results if evidence is unavailable. |
| Mandatory for a reliable live demonstration | Investigate H1 and repeat the unchanged live Shell and Verification suites from the actual review host. | Both complete with current evidence and repeatable refresh, or the presentation explicitly limits the demonstration and uses an identified offline fallback. |
| Mandatory before claiming performance success | Provide matched baseline/hardened data and methodology or record the unanswered research question. | Conclusions distinguish unmeasured overhead from observed UI/API durations. |
| Recommended before submission | Confirm deployed source, CNI, AuthorizationPolicy, webhook scope, monitoring inventory and SPIRE history with the commands in L. Verify the existing two-context runbook. | Dated, sanitized inventory and reproducible rehearsal. |
| Recommended before submission | Clarify verifier predicates and remove false-success behavior from helpers in a separately approved change, or explicitly exclude those helpers as evidence. | No unsupported claims in demonstration or appendix. |
| Documented limitations | Local unauthenticated HTTP, dependency on Kali and kubeconfig, Chrome-only evidence, incomplete effective-RBAC review and no current SVID or traffic verification. | Disclosed before questions on production readiness or security efficacy. |
| Future enhancements subject to academic clarification | Federation/JIT, multi-cloud portability, integrated pipeline and SBOM, continuous drift detection, event ingestion, formal reporting and incident response. | Treat as future work only when the supervisor accepts the scoped deliverable. |

## N. Audit limitations

The official original statement, exact deployed Python and Kubernetes definitions, Kali historical archive, raw traffic/admission records, SVID evidence and dated agent recovery records were inaccessible. Direct Kubernetes validation was mediated by the five APIs. No assertion of cluster-wide absence can be made from those routes. Previous 15 PASS and previous browser results were not reused.

No manifests were applied/deleted, no components restarted, no cluster created, no packages installed or updated and no external scanner, registry, cloud or signing service was contacted. No production authentication, stress test or attack reproduction was attempted. The existing admission runner applies and deletes manifests; setup, signing, scan and evidence-generating scenario scripts were excluded. Frontend tests use mocked failure or browser-local blocking where indicated.

The installed dependency tree resolved successfully with `npm.cmd ls --depth=0`. No current vulnerability assessment of the dashboard lockfile was available. No clean-machine installation, all-browser validation, exhaustive button-by-button audit or full visual/accessibility certification is claimed. Existing PDFs and phase documents describe earlier milestones. Their presence cannot authenticate later test results.

## O. Working-tree integrity

| Check | Initial | Final |
|---|---|---|
| Branch and HEAD | main, b62a80438c88c5e8efd7e9a987f694abd78d6206 | Same |
| `git status --short --branch --untracked-files=all` | `## main` only | `## main` and `?? FINAL_PROJECT_AUDIT.md` |
| Tracked working-tree and staged changes | None | None |

**Only repository deliverable:** `FINAL_PROJECT_AUDIT.md`. The production build regenerated ignored `dist/` output. The audit used temporary HTTP response copies and a dedicated temporary browser profile. No tracked source, test, configuration, lockfile, historical evidence or other documentation changed. No commit, push, deployment or remediation was performed.
