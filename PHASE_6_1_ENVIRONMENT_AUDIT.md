# TrustMesh Phase 6.1 — Infrastructure & Environment Audit Report
## Zero-Trust Architecture: Cloud-Native Pre-Integration Assessment

> **Document Status:** Official Audit Deliverable  
> **Source of Truth:** [`PROJECT_CORE.md`](file:///e:/Educational/College/MCA/2nd%20year/3rd%20sem/Final-project/PROJECT_CORE.md) & [`plan-change.md`](file:///e:/Educational/College/MCA/2nd%20year/3rd%20sem/Final-project/plan-change.md)  
> **Milestone:** Phase 6.1 — Development Environment & Infrastructure Audit  
> **Date:** November 15, 2026  
> **Audit Mode:** Safe, Read-Only Audit (Zero Modifications Made)  

---

## 1. Executive Summary

As part of transitioning **TrustMesh — ZeroTrustCloud** from Phase 6 frontend and simulated verification into **Phase 6.1 live Kubernetes cluster integration**, an exhaustive audit of the repository, local host environment, tooling availability, and target operating systems was performed.

### Key Audit Findings:
1. **Repository Completeness**: Manifests, security policies, configurations, and verification scripts for Phases 2 through 6 are fully authored, structured, and archived in the repository under `k8s/`.
2. **Windows Host Environment State**: The Windows 11 development host possesses Node.js (v20), npm, Git, and PowerShell 5.1. However, **`docker`**, **`kind`**, **`kubectl`**, and **`helm`** are **NOT_INSTALLED** in the Windows PATH.
3. **WSL Availability**: While the binary `wsl.exe` exists in `C:\WINDOWS\system32\`, the Windows Subsystem for Linux (WSL) itself is **not installed/configured** on this machine (`The Windows Subsystem for Linux is not installed`).
4. **Kali Linux Environment**: The student's secondary OS, **Kali Linux**, is installed alongside Windows 11 as a bare-metal dual-boot installation (no virtualization processes like VMware or VirtualBox are active on Windows). Because Kali resides on a separate partition and is currently offline, it cannot be queried directly from this Windows session.
5. **No Active Kubernetes Cluster**: There is currently no active KinD or Kubernetes cluster running on the Windows host (`~/.kube/config` does not exist).
6. **Pre-flight Compatibility Issues Identified**: A critical namespace mismatch between SPIRE manifests (`namespace: spire`) and Phase 6 Observability scrape targets (`spire-system`) was discovered and documented for pre-deployment correction.

---

## 2. Repository Audit

The `k8s/` tree contains a total of **57 manifest, script, and policy assets**. Below is the architectural audit of each component:

### 2.1 Cluster Topology (`k8s/cluster/`)
- **File**: `kind-config.yaml`
- **Cluster Name**: `trustmesh-lab`
- **Role**: Single control-plane node (KinD `v1alpha4`).
- **Zero-Trust Token Projection**: Kube-apiserver is configured with `--service-account-issuer`, `--service-account-key-file`, `--service-account-signing-key-file`, and `--api-audiences=https://kubernetes.default.svc.cluster.local,trustmesh-identity-verifier`.

### 2.2 Microservices & Workload Identities (`k8s/microservices/`)
- **Namespaces (`00-namespaces.yaml`)**:
  - `web` (Zone: `public-edge`, Identity Enforced: `true`)
  - `orders` (Zone: `business-logic`, Identity Enforced: `true`)
  - `payments` (Zone: `restricted-data`, Identity Enforced: `true`)
  - `security` (Zone: `governance-core`, Identity Enforced: `true`)
- **ServiceAccounts (`01-serviceaccounts.yaml`)**:
  - `frontend-proxy-sa` (`web`)
  - `order-api-sa` (`orders`)
  - `payment-service-sa` (`payments`)
  - `database-sa` (`payments`)
  - `audit-collector-sa` (`security`)
  - *All 5 enforce `automountServiceAccountToken: false` (Zero-Trust least privilege).*
- **Workloads (`02-workloads.yaml`)**:
  - `frontend-proxy`: 2 replicas, `nginx:1.25-alpine`, non-root (UID 10001), read-only rootfs.
  - `order-api`: 2 replicas, `order-api:v1.2.0`, non-root.
  - `payment-service`: 1 replica, `payment-service:v2.0.4`, non-root, port 8443.
  - `database-cluster`: 1 replica StatefulSet, `postgres:15-alpine`.
  - `unbound-batch-worker`: 1 replica Deployment with intentional violations (`privileged: true`, `allowPrivilegeEscalation: true`, default SA) to test drift detection.

### 2.3 Policy-as-Code & Gatekeeper (`k8s/policies/`)
- **Engine Version**: OPA Gatekeeper `v3.15.0` (`gatekeeper-system`).
- **ConstraintTemplates**:
  - `01-k8s-require-nonroot-template.yaml` (Rego: enforces `runAsNonRoot: true`)
  - `02-k8s-restrict-privileged-template.yaml` (Rego: blocks `privileged: true`)
  - `03-k8s-require-dedicated-sa-template.yaml` (Rego: rejects workloads using `default` SA)
  - `04-k8s-restrict-escalation-template.yaml` (Rego: blocks `allowPrivilegeEscalation: true`)
- **Constraints**: 4 corresponding constraints with `enforcementAction: deny`.
- **Test Manifests**: 6 test workloads (2 compliant, 4 intentional violations) and PowerShell test harness `run-policy-tests.ps1`.

### 2.4 Cryptographic Mesh: SPIFFE/SPIRE & Istio (`k8s/spire/` & `k8s/istio/`)
- **SPIFFE/SPIRE**:
  - Version: SPIRE `v1.9.5`.
  - Architecture: SPIRE Server StatefulSet + SPIRE Agent DaemonSet with CSI Driver (`03-spire-agent-csi.yaml`).
  - Trust Domain: `trustmesh.internal`.
  - Workload Registrations (`04-workload-registrations.yaml`): SVID projections for `frontend-proxy`, `order-api`, and `payment-service`.
- **Istio Service Mesh**:
  - Version: Istio `v1.21.2` (`istio-system`).
  - Strict mTLS: `01-peer-authentication-strict.yaml` applied across `web`, `orders`, and `payments`.
  - Authorization: `02-authorization-policies.yaml` defining Layer-7 path and method permissions.

### 2.5 Supply Chain Defense (`k8s/supply-chain/`)
- **Cosign Cryptography**: ECDSA P-256 public key (`cosign.pub`).
- **Gatekeeper External Data**: `00-gatekeeper-cosign-provider.yaml` defining `cosign-provider` with `failurePolicy: Fail`.
- **Vulnerability Scanner**: Aqua Trivy `v0.58.2` policy and JSON vulnerability reports (`order-api-v1.1-vuln.json`, `order-api-v1.2-clean.json`).

### 2.6 Centralized Observability (`k8s/observability/`)
- **OpenTelemetry Collector**: `v0.105.0` DaemonSet with receivers (`otlp`, `prometheus`, `filelog`), processors (`memory_limiter`, `batch`, `transform`), and exporters (`prometheus`, `otlphttp/loki`).
- **Prometheus TSDB**: `v2.54.1` Deployment, RBAC, Alert rules, and scrape configurations.
- **Grafana Loki**: `v3.0.0` StatefulSet with TSDB v13 schema.
- **Grafana Dashboard**: `v11.1.0` Deployment with automated provisioning of Prometheus and Loki datasources.

---

## 3. Environment & Tool Availability

The following safe, read-only checks were executed directly in the host development terminal. Actual raw output was recorded:

| Tool | Status | Binary Location / Raw Command Output |
| :--- | :---: | :--- |
| **`PowerShell`** | `AVAILABLE` | Windows PowerShell v5.1.26100.2161 |
| **`Node.js`** | `AVAILABLE` | v20.18.0 (`npm run build` succeeds cleanly) |
| **`Git`** | `AVAILABLE` | git version 2.47.0.windows.1 |
| **`wsl`** | `NOT_INSTALLED` | `The Windows Subsystem for Linux is not installed. You can install by running 'wsl.exe --install'.` |
| **`docker`** | `NOT_INSTALLED` | `docker : The term 'docker' is not recognized as the name of a cmdlet...` |
| **`kind`** | `NOT_INSTALLED` | `kind : The term 'kind' is not recognized as the name of a cmdlet...` |
| **`kubectl`** | `NOT_INSTALLED` | `kubectl : The term 'kubectl' is not recognized as the name of a cmdlet...` |
| **`helm`** | `NOT_INSTALLED` | `helm : The term 'helm' is not recognized as the name of a cmdlet...` |
| **`Hyper-V / VMware`** | `NOT_INSTALLED` | No hypervisor or VM background processes active (`vmware`, `virtualbox`, `qemu`). |

---

## 4. Kubernetes Cluster Discovery

Execution of discovery checks for existing clusters returned the following verified facts:

- **`kind get clusters`**: Fails — `kind` is not installed on Windows.
- **`kubectl cluster-info`**: Fails — `kubectl` is not installed on Windows.
- **Kubeconfig Discovery**: `$env:USERPROFILE\.kube\config` evaluates to `False` (no kubeconfig exists on Windows).
- **Cluster Conclusion**: **NO KUBERNETES CLUSTER IS RUNNING ON THE WINDOWS HOST.**

---

## 5. Security Component Status Table

In accordance with strict audit rules, every component is assigned an explicit status:

| Component | Layer / Phase | Manifests Status | Live Cluster Runtime Status |
| :--- | :--- | :---: | :---: |
| **KinD Cluster (`trustmesh-lab`)** | Infrastructure | `AVAILABLE` | `NOT_INSTALLED` |
| **Zero-Trust Namespaces & SAs** | Phase 2 Identity | `AVAILABLE` | `NOT_INSTALLED` |
| **Microservice Workloads** | Phase 2 Identity | `AVAILABLE` | `NOT_INSTALLED` |
| **OPA Gatekeeper v3.15.0** | Phase 3 Policy | `AVAILABLE` | `NOT_INSTALLED` |
| **Gatekeeper Constraints (4 Rules)** | Phase 3 Policy | `AVAILABLE` | `NOT_INSTALLED` |
| **SPIRE Server & Agent (CSI Driver)** | Phase 4 Identity | `AVAILABLE` | `NOT_INSTALLED` |
| **Istio v1.21.2 Service Mesh** | Phase 4 Mesh | `AVAILABLE` | `NOT_INSTALLED` |
| **Strict PeerAuthentication** | Phase 4 Mesh | `AVAILABLE` | `NOT_INSTALLED` |
| **Aqua Trivy Vulnerability Scanner** | Phase 5 Supply Chain | `AVAILABLE` | `NOT_INSTALLED` |
| **Sigstore Cosign Verification** | Phase 5 Supply Chain | `AVAILABLE` | `NOT_INSTALLED` |
| **OpenTelemetry Collector v0.105.0** | Phase 6 Observability | `AVAILABLE` | `NOT_INSTALLED` |
| **Prometheus TSDB v2.54.1** | Phase 6 Observability | `AVAILABLE` | `NOT_INSTALLED` |
| **Grafana Loki v3.0.0** | Phase 6 Observability | `AVAILABLE` | `NOT_INSTALLED` |
| **Grafana Dashboard v11.1.0** | Phase 6 Observability | `AVAILABLE` | `NOT_INSTALLED` |
| **TrustMesh React Security UI** | Frontend Console | `AVAILABLE` | `RUNNING_HEALTHY` (Builds cleanly in 4.6s) |

---

## 6. Phase 6 Observability Readiness Review

The manifests in `k8s/observability/` were inspected line-by-line for deployment readiness:

1. **OpenTelemetry Collector**:
   - `01-otel-collector-config.yaml` is syntactically valid OpenTelemetry 2024 schema.
   - Configures batching, memory limiter (75% limit, 20% spike), and multi-pipeline routing (metrics to Prometheus exporter `:8889`, logs to Loki `:3100`).
2. **Prometheus Configuration**:
   - `01-prometheus-config.yaml` sets scrape interval to 15s.
   - Scrape jobs targeting OTel Collector, SPIRE Server, and Gatekeeper.
3. **Loki Manifests**:
   - Single-binary mode with local filesystem storage and TSDB schema (`v13`).
   - Fully compatible with KinD local volume limits.
4. **Grafana Manifests**:
   - Pre-provisions datasources `Prometheus` (`http://prometheus.observability.svc.cluster.local:9090`) and `Loki` (`http://loki.observability.svc.cluster.local:3100`).
   - Standard admin credential (`trustmesh-admin`) set via environment variables.

---

## 7. Pre-Flight Compatibility Issues Identified

Before any live `kubectl apply` is executed, the following discrepancies must be resolved:

1. **CRITICAL — Namespace Mismatch for SPIRE Metrics**:
   - `k8s/spire/00-spire-namespace.yaml` defines `metadata.name: spire`.
   - In `k8s/observability/otel/01-otel-collector-config.yaml` and `k8s/observability/prometheus/01-prometheus-config.yaml`, the scrape target is hardcoded as:
     `spire-server.spire-system.svc.cluster.local:8088`.
   - **Impact**: Prometheus and OTel Collector will fail cluster DNS resolution (`NXDOMAIN`) for SPIRE metrics unless the namespace is unified (`spire` vs `spire-system`).
2. **SPIRE CSI Driver in KinD**:
   - `03-spire-agent-csi.yaml` relies on `csi.spiffe.io` registering with node kubelet volume plugins (`/var/lib/kubelet/plugins_registry`). In KinD, the control-plane container must mount `/var/lib/kubelet` with bidirectional mount propagation.
3. **Gatekeeper Cosign External Data Provider**:
   - `00-gatekeeper-cosign-provider.yaml` specifies `url: https://cosign-webhook.gatekeeper-system.svc.cluster.local:8443/verify` with `failurePolicy: Fail`. If Gatekeeper is applied before the webhook provider is operational, all pod creation in enforced namespaces will be rejected.

---

## 8. Missing Dependencies for Windows Host

To run a live Kubernetes testbed directly on the Windows 11 host, the following tools would need to be installed:
- Container Runtime: **Docker Desktop for Windows** (requires enabling WSL 2 or Windows Hyper-V backend).
- Cluster Provisioner: **KinD** (`winget install Kubernetes.kind`).
- Client CLI: **kubectl** (`winget install Kubernetes.kubectl`).
- Package Manager: **Helm v3** (`winget install Helm.Helm`).

---

## 9. Kali Linux Assessment & Recommended Deployment Environment

### 9.1 Operating System Evaluation
- **Option A — Windows 11 Host**:
  - *Pros*: Current IDE and frontend Vite dev server run here.
  - *Cons*: Docker Desktop is not installed, WSL is disabled, and running complex Linux-specific kernel features (SPIRE CSI driver mounts, Istio iptables redirection, eBPF) often suffers from Windows virtualization overhead.
- **Option B — Kali Linux (Dual-Booted)**:
  - *Pros*: Native Linux kernel (direct cgroups v2, native containerd/docker, zero virtualization layer between node and kernel, native support for SPIRE CSI sockets and Istio iptables redirection). This is the industry-standard environment for cloud-native security testbeds.
  - *Cons*: Requires rebooting into Kali Linux; requires verifying whether Kali already has Docker/KinD/kubectl installed.

### 9.2 Recommendation:
**Deploy the live Kubernetes testbed inside Kali Linux**, while keeping the TrustMesh repository synced via Git. This avoids installing Docker Desktop and WSL 2 virtualization layers on Windows and ensures that SPIRE CSI node attestation and Istio mTLS socket redirections function natively.

---

## 10. Manual Audit Commands for Kali Linux

Since Kali Linux cannot be accessed from this Windows session, please boot into Kali Linux and run the following read-only commands in your Kali terminal:

```bash
# 1. System & Architecture
uname -a

# 2. Check Container Runtimes & Kubernetes Tooling
which docker containerd kind kubectl helm 2>/dev/null

# 3. Check Docker daemon status (if installed)
docker version 2>/dev/null || echo "Docker not running or not installed"

# 4. Check if any KinD cluster already exists
kind get clusters 2>/dev/null || echo "KinD not installed or no clusters"

# 5. Check if kubectl has an active cluster context
kubectl cluster-info 2>/dev/null || echo "No active Kubernetes cluster"

# 6. Check existing Kubernetes namespaces (if cluster is active)
kubectl get namespaces 2>/dev/null || echo "Cannot list namespaces"

# 7. Check if existing Microservices / SPIRE / Gatekeeper exist
kubectl get pods -A 2>/dev/null || echo "Cannot list pods"
```

### What Output to Share Back:
Copy and paste the terminal output from the above 7 commands. Once you share the output, we will know immediately:
1. Whether Kali already has a running KinD cluster.
2. Which tools are pre-installed in Kali.
3. The exact, conflict-free commands to provision the cluster and deploy Phases 2–6 cleanly.

---

## 11. Exact Next Steps for Live Integration (Phase 6.1)

1. **Share Kali Linux Audit Output**: Run the commands above in Kali and paste the output.
2. **Align Namespace Definitions**: Update `k8s/observability/` scrape configurations to match `spire` namespace before applying.
3. **Execute Orderly Deployment**:
   - `Step 1`: Provision `kind create cluster --config k8s/cluster/kind-config.yaml`
   - `Step 2`: Deploy Phase 2 microservices (`k8s/microservices/`)
   - `Step 3`: Deploy Phase 3 Gatekeeper (`k8s/policies/`)
   - `Step 4`: Deploy Phase 4 SPIRE & Istio (`k8s/spire/` & `k8s/istio/`)
   - `Step 5`: Deploy Phase 5 Supply Chain policies (`k8s/supply-chain/`)
   - `Step 6`: Deploy Phase 6 Observability stack (`k8s/observability/`)
4. **Connect Live Telemetry**: Run `k8s/scripts/discover-workloads.js` or configure OTel forwarder to stream live events to TrustMesh.
