/**
 * TrustMesh Phase 3: OPA Gatekeeper v3.15.0 Policies & Admission Decision Fixtures
 * Directly derived from k8s/policies manifests and testbed executions.
 */

import {
  GatekeeperPolicyRecord,
  AdmissionDecisionRecord,
  PolicyAuditViolationRecord,
} from '../types/policy';

export const GATEKEEPER_ENGINE_INFO = {
  version: 'v3.15.0',
  releaseTag: 'gatekeeper.sh/v3.15.0',
  mode: 'Validating Webhook (Enforce & Audit)',
  clusterContext: 'kind-trustmesh-lab',
  webhookService: 'gatekeeper-webhook-service.gatekeeper-system.svc:443',
  syncStatus: 'SYNCHRONIZED',
  evaluatedNamespaces: ['web', 'orders', 'payments', 'security'],
  excludedNamespaces: ['kube-system', 'kube-public', 'kube-node-lease', 'gatekeeper-system'],
  healthStatus: 'HEALTHY',
};

export const GATEKEEPER_POLICIES: GatekeeperPolicyRecord[] = [
  {
    id: 'POL-ADM-01',
    name: 'Require Non-Root Execution',
    templateKind: 'K8sRequireNonRoot',
    constraintName: 'require-nonroot',
    category: 'Pod Security Baseline',
    enforcementAction: 'deny',
    status: 'enforcing',
    description: 'Requires all workloads to execute under unprivileged UIDs and disallows root execution (UID 0) across regular and init containers.',
    securityObjective: 'Eliminate container breakout vectors resulting from default root user execution inside container namespaces.',
    targetKinds: ['Pod', 'Deployment', 'DaemonSet', 'StatefulSet', 'Job'],
    excludedNamespaces: ['kube-system', 'gatekeeper-system', 'kube-public'],
    regoSource: `package k8srequirenonroot

get_containers(pod) = containers {
  containers := array.concat(
    object.get(pod.spec, "containers", []),
    object.get(pod.spec, "initContainers", [])
  )
}

violation[{"msg": msg}] {
  container := get_containers(input.review.object)[_]
  sec := object.get(container, "securityContext", {})
  sec.runAsUser == 0
  msg := sprintf("[require-nonroot] Container '%v' explicitly sets runAsUser: 0 (root). Zero-Trust requires non-root execution.", [container.name])
}

violation[{"msg": msg}] {
  container := get_containers(input.review.object)[_]
  c_sec := object.get(container, "securityContext", {})
  p_sec := object.get(input.review.object.spec, "securityContext", {})
  c_sec.runAsNonRoot != true
  p_sec.runAsNonRoot != true
  msg := sprintf("[require-nonroot] Container '%v' lacks runAsNonRoot: true and no pod-level default is declared.", [container.name])
}`,
    violationTemplateMessage: "[require-nonroot] Container '<name>' in pod '<pod>' must not run as root. Set securityContext.runAsNonRoot: true and specify a non-zero runAsUser.",
    remediationGuidance: 'Define securityContext.runAsNonRoot: true and runAsUser: 10001 (or higher non-root UID) in pod or container spec.',
    remediationSnippet: `spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
  containers:
    - name: app
      securityContext:
        allowPrivilegeEscalation: false`,
    activeViolationsCount: 1,
    blockedAdmissionsCount: 4,
    linkedFindingId: 'TM-SEC-102',
    isLabFixture: true,
  },
  {
    id: 'POL-ADM-02',
    name: 'Restrict Privileged Containers',
    templateKind: 'K8sRestrictPrivileged',
    constraintName: 'restrict-privileged',
    category: 'Kernel Isolation',
    enforcementAction: 'deny',
    status: 'enforcing',
    description: 'Prohibits any container or init container from requesting privileged execution (securityContext.privileged: true).',
    securityObjective: 'Prevent container escape to the host kernel and protect co-located tenant workloads from unauthorized kernel manipulation.',
    targetKinds: ['Pod', 'Deployment', 'DaemonSet', 'StatefulSet', 'Job'],
    excludedNamespaces: ['kube-system', 'gatekeeper-system', 'kube-public'],
    regoSource: `package k8srestrictprivileged

get_containers(pod) = containers {
  containers := array.concat(
    object.get(pod.spec, "containers", []),
    object.get(pod.spec, "initContainers", [])
  )
}

violation[{"msg": msg}] {
  container := get_containers(input.review.object)[_]
  sec := object.get(container, "securityContext", {})
  sec.privileged == true
  msg := sprintf("[restrict-privileged] Privileged container '%v' is strictly prohibited. Workloads must not execute with blanket host kernel access.", [container.name])
}`,
    violationTemplateMessage: "[restrict-privileged] Privileged container '<name>' is strictly prohibited. Workloads must not execute with blanket host kernel access.",
    remediationGuidance: 'Remove privileged: true from securityContext. Request only granular required Linux capabilities (e.g. CAP_NET_BIND_SERVICE) if necessary.',
    remediationSnippet: `containers:
  - name: app
    securityContext:
      privileged: false
      capabilities:
        drop: ["ALL"]`,
    activeViolationsCount: 1,
    blockedAdmissionsCount: 5,
    linkedFindingId: 'TM-SEC-102',
    isLabFixture: true,
  },
  {
    id: 'POL-ADM-03',
    name: 'Require Dedicated ServiceAccounts',
    templateKind: 'K8sRequireDedicatedSA',
    constraintName: 'require-dedicated-sa',
    category: 'Identity Hardening',
    enforcementAction: 'deny',
    status: 'enforcing',
    description: 'Rejects workloads that use the shared default ServiceAccount or omit serviceAccountName declaration entirely.',
    securityObjective: 'Enforce workload identity segregation so each microservice receives an individually attested, least-privilege identity.',
    targetKinds: ['Pod', 'Deployment', 'DaemonSet', 'StatefulSet', 'Job'],
    excludedNamespaces: ['kube-system', 'gatekeeper-system', 'kube-public'],
    regoSource: `package k8srequirededicatedsa

violation[{"msg": msg}] {
  sa := input.review.object.spec.serviceAccountName
  sa == "default"
  workload_name := input.review.object.metadata.name
  msg := sprintf("[require-dedicated-sa] Workload '%v' is bound to shared 'default' ServiceAccount. Dedicated workload identities are mandatory under Zero Trust.", [workload_name])
}

violation[{"msg": msg}] {
  not input.review.object.spec.serviceAccountName
  workload_name := input.review.object.metadata.name
  msg := sprintf("[require-dedicated-sa] Workload '%v' omits serviceAccountName. Workloads must explicitly declare a dedicated ServiceAccount.", [workload_name])
}`,
    violationTemplateMessage: "[require-dedicated-sa] Workload '<name>' must specify a dedicated least-privilege ServiceAccount. Use of shared 'default' ServiceAccount is prohibited under Zero Trust.",
    remediationGuidance: 'Create a dedicated ServiceAccount in the workload namespace and set spec.serviceAccountName to that account.',
    remediationSnippet: `spec:
  serviceAccountName: payment-service-sa
  automountServiceAccountToken: false`,
    activeViolationsCount: 2,
    blockedAdmissionsCount: 3,
    linkedFindingId: 'TM-SEC-106',
    isLabFixture: true,
  },
  {
    id: 'POL-ADM-04',
    name: 'Restrict Privilege Escalation',
    templateKind: 'K8sRestrictEscalation',
    constraintName: 'restrict-escalation',
    category: 'Kernel Isolation',
    enforcementAction: 'deny',
    status: 'enforcing',
    description: 'Requires all regular, init, and ephemeral containers to set allowPrivilegeEscalation: false, blocking setuid binary exploitation.',
    securityObjective: 'Ensure child processes cannot acquire higher execution rights than their parent container context.',
    targetKinds: ['Pod', 'Deployment', 'DaemonSet', 'StatefulSet', 'Job'],
    excludedNamespaces: ['kube-system', 'gatekeeper-system', 'kube-public'],
    regoSource: `package k8srestrictescalation

get_all_containers(pod) = containers {
  containers := array.concat(
    array.concat(
      object.get(pod.spec, "containers", []),
      object.get(pod.spec, "initContainers", [])
    ),
    object.get(pod.spec, "ephemeralContainers", [])
  )
}

violation[{"msg": msg}] {
  container := get_all_containers(input.review.object)[_]
  sec := object.get(container, "securityContext", {})
  sec.allowPrivilegeEscalation != false
  msg := sprintf("[restrict-escalation] Container '%v' must explicitly declare allowPrivilegeEscalation: false to prevent binary privilege escalation.", [container.name])
}`,
    violationTemplateMessage: "[restrict-escalation] Container '<name>' must explicitly declare allowPrivilegeEscalation: false to prevent binary privilege escalation.",
    remediationGuidance: 'Explicitly set allowPrivilegeEscalation: false in securityContext of all container definitions.',
    remediationSnippet: `containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false`,
    activeViolationsCount: 1,
    blockedAdmissionsCount: 3,
    linkedFindingId: 'TM-SEC-107',
    isLabFixture: true,
  },
];

export const ADMISSION_DECISIONS: AdmissionDecisionRecord[] = [
  {
    id: 'ADM-101',
    timestamp: '11:28:14 UTC',
    workloadName: 'test-compliant-workload',
    workloadKind: 'Pod',
    namespace: 'payments',
    evaluatingPolicyId: 'POL-ADM-01',
    evaluatingPolicyName: 'All 4 Baseline Constraints Evaluated',
    decision: 'ALLOW',
    reason: 'Admitted: runAsNonRoot: true, non-privileged, dedicated SA payment-service-sa, escalation disabled',
    rawWebhookResponse: 'pod/test-compliant-workload created (admission review allowed: true)',
    sourceType: 'TEST EVIDENCE',
  },
  {
    id: 'ADM-102',
    timestamp: '11:27:50 UTC',
    workloadName: 'order-api-v2',
    workloadKind: 'Deployment',
    namespace: 'orders',
    evaluatingPolicyId: 'POL-ADM-02',
    evaluatingPolicyName: 'Controller Template Policy Verification',
    decision: 'ALLOW',
    reason: 'Admitted: Deployment controller pod template satisfies security baseline requirements',
    rawWebhookResponse: 'deployment.apps/order-api-v2 created (admission review allowed: true)',
    sourceType: 'TEST EVIDENCE',
  },
  {
    id: 'ADM-103',
    timestamp: '11:25:32 UTC',
    workloadName: 'test-violation-root',
    workloadKind: 'Pod',
    namespace: 'web',
    evaluatingPolicyId: 'POL-ADM-01',
    evaluatingPolicyName: 'Require Non-Root Execution',
    decision: 'DENY',
    reason: 'Blocked by webhook: Container malicious-root-worker explicitly sets runAsUser: 0 (root)',
    rawWebhookResponse: 'Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request: [require-nonroot] Container \'malicious-root-worker\' explicitly sets runAsUser: 0 (root). Zero-Trust requires non-root execution.',
    sourceType: 'TEST EVIDENCE',
    linkedFindingId: 'TM-SEC-102',
  },
  {
    id: 'ADM-104',
    timestamp: '11:24:19 UTC',
    workloadName: 'test-violation-privileged',
    workloadKind: 'Pod',
    namespace: 'security',
    evaluatingPolicyId: 'POL-ADM-02',
    evaluatingPolicyName: 'Restrict Privileged Containers',
    decision: 'DENY',
    reason: 'Blocked by webhook: Container privileged-breakout-agent requests privileged: true',
    rawWebhookResponse: 'Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request: [restrict-privileged] Privileged container \'privileged-breakout-agent\' is strictly prohibited. Workloads must not execute with blanket host kernel access.',
    sourceType: 'TEST EVIDENCE',
    linkedFindingId: 'TM-SEC-102',
  },
  {
    id: 'ADM-105',
    timestamp: '11:22:05 UTC',
    workloadName: 'test-violation-default-sa',
    workloadKind: 'Pod',
    namespace: 'orders',
    evaluatingPolicyId: 'POL-ADM-03',
    evaluatingPolicyName: 'Require Dedicated ServiceAccounts',
    decision: 'DENY',
    reason: 'Blocked by webhook: Workload unauthenticated-batch-job binds to shared default ServiceAccount',
    rawWebhookResponse: 'Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request: [require-dedicated-sa] Workload \'test-violation-default-sa\' is bound to shared \'default\' ServiceAccount. Dedicated workload identities are mandatory under Zero Trust.',
    sourceType: 'TEST EVIDENCE',
    linkedFindingId: 'TM-SEC-106',
  },
  {
    id: 'ADM-106',
    timestamp: '11:19:40 UTC',
    workloadName: 'test-violation-escalation',
    workloadKind: 'Pod',
    namespace: 'web',
    evaluatingPolicyId: 'POL-ADM-04',
    evaluatingPolicyName: 'Restrict Privilege Escalation',
    decision: 'DENY',
    reason: 'Blocked by webhook: Container setuid-binary-spawner enables allowPrivilegeEscalation: true',
    rawWebhookResponse: 'Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request: [restrict-escalation] Container \'setuid-binary-spawner\' must explicitly declare allowPrivilegeEscalation: false to prevent binary privilege escalation.',
    sourceType: 'TEST EVIDENCE',
    linkedFindingId: 'TM-SEC-107',
  },
];

export const POLICY_AUDIT_VIOLATIONS: PolicyAuditViolationRecord[] = [
  {
    id: 'AUD-301',
    workloadName: 'unbound-batch-worker',
    namespace: 'orders',
    kind: 'Deployment',
    policyId: 'POL-ADM-03',
    policyName: 'Require Dedicated ServiceAccounts',
    violationMessage: 'Workload bound to shared namespace default ServiceAccount without token isolation',
    severity: 'critical',
    firstDetected: '2026-11-01 11:15:22 UTC',
    linkedFindingId: 'TM-SEC-106',
  },
  {
    id: 'AUD-302',
    workloadName: 'legacy-cron-sync',
    namespace: 'default',
    kind: 'Job',
    policyId: 'POL-ADM-03',
    policyName: 'Require Dedicated ServiceAccounts',
    violationMessage: 'Batch job executes in default namespace without dedicated identity binding',
    severity: 'high',
    firstDetected: '2026-11-01 11:00:15 UTC',
    linkedFindingId: 'TM-SEC-107',
  },
  {
    id: 'AUD-303',
    workloadName: 'rogue-crawler-pod',
    namespace: 'default',
    kind: 'Job',
    policyId: 'POL-ADM-02',
    policyName: 'Restrict Privileged Containers',
    violationMessage: 'Untrusted job pod requests root capabilities and lack of boundary policy',
    severity: 'critical',
    firstDetected: '2026-11-01 11:05:00 UTC',
    linkedFindingId: 'TM-SEC-102',
  },
];

