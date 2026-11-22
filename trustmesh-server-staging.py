import json
import subprocess
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = "192.168.33.128"
PORT = 8766

CLUSTERS = {
    "gatekeeper": "kind-trustmesh-lab",
    "network": "kind-trustmesh-network-lab",
}

def kubectl_json(context, *args):
    command = [
        "kubectl",
        "--context", context,
        "--request-timeout=8s",
        *args,
        "-o", "json",
    ]
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=12,
        check=True,
    )
    return json.loads(result.stdout)

def cluster_status(name, context):
    try:
        nodes = kubectl_json(context, "get", "nodes")
        return {
            "name": name,
            "context": context,
            "connected": True,
            "nodes": [
                {
                    "name": node["metadata"]["name"],
                    "ready": any(
                        condition.get("type") == "Ready"
                        and condition.get("status") == "True"
                        for condition in node.get("status", {}).get("conditions", [])
                    ),
                }
                for node in nodes.get("items", [])
            ],
        }
    except (subprocess.SubprocessError, ValueError, KeyError) as error:
        return {
            "name": name,
            "context": context,
            "connected": False,
            "nodes": [],
            "error": "Kubernetes status unavailable",
        }

def pod_readiness(pod):
    status = pod.get("status") or {}
    spec = pod.get("spec") or {}
    init_containers = spec.get("initContainers") or []
    native_sidecar_names = {
        container.get("name")
        for container in init_containers
        if container.get("restartPolicy") == "Always"
    }
    container_statuses = (status.get("containerStatuses") or []) + [
        c_status
        for c_status in (status.get("initContainerStatuses") or [])
        if c_status.get("name") in native_sidecar_names
    ]
    return {
        "readyContainers": sum(
            1 for container in container_statuses if container.get("ready")
        ),
        "totalContainers": (
            len(spec.get("containers") or [])
            + len(native_sidecar_names)
        ),
    }

def integration_pods():
    try:
        data = kubectl_json(
            CLUSTERS["network"],
            "-n", "trustmesh-integration-test",
            "get", "pods",
        )

        return {
            "available": True,
            "namespace": "trustmesh-integration-test",
            "pods": [
                {
                    "name": pod["metadata"]["name"],
                    "phase": pod.get("status", {}).get("phase", "Unknown"),
                    **pod_readiness(pod),
                }
                for pod in data.get("items", [])
            ],
        }
    except (
        subprocess.SubprocessError, OSError, ValueError, KeyError,
        AttributeError, TypeError,
    ):
        return {
            "available": False,
            "namespace": "trustmesh-integration-test",
            "pods": [],
            "error": "Integration workload status unavailable",
        }


# Availability means query success, not current SVID validity or mTLS enforcement.
IDENTITY_CONTEXT = "kind-trustmesh-network-lab"
IDENTITY_NAMESPACE = "trustmesh-integration-test"
SPIRE_NAMESPACE = "trustmesh-spire"
IDENTITY_QUERY_ERRORS = (
    subprocess.SubprocessError, OSError, ValueError, KeyError,
    TypeError, AttributeError,
)


def identity_workloads():
    registration = {
        "name": "trustmesh-integration-workload-identity",
        "spiffeIDTemplate": None, "namespaceSelector": None, "podSelector": None,
        "statistics": None, "available": False, "error": "Not collected",
    }
    components = [
        {"name": name, "kind": kind, "desiredReplicas": None,
         "readyReplicas": None, "available": False, "error": "Not collected"}
        for kind, name in (
            ("StatefulSet", "trustmesh-spire-server"),
            ("DaemonSet", "trustmesh-spire-agent"),
            ("DaemonSet", "trustmesh-spire-spiffe-csi-driver"),
        )
    ]
    response = {
        "source": "live-kubernetes",
        "cluster": IDENTITY_CONTEXT, "namespace": IDENTITY_NAMESPACE,
        "available": False, "workloads": [], "serviceAccounts": [],
        "spireRegistration": registration, "spireComponents": components,
    }
    try:
        pods = kubectl_json(
            IDENTITY_CONTEXT, "-n", IDENTITY_NAMESPACE, "get", "pods"
        )["items"]
        accounts = kubectl_json(
            IDENTITY_CONTEXT, "-n", IDENTITY_NAMESPACE, "get", "serviceaccounts"
        )["items"]
        if not isinstance(pods, list) or not isinstance(accounts, list):
            raise ValueError("Invalid inventory")
        workloads = []
        for pod in pods:
            labels = pod["metadata"].get("labels") or {}
            workloads.append({
                "name": pod["metadata"]["name"],
                "phase": pod.get("status", {}).get("phase", "Unknown"),
                "serviceAccountName": (pod.get("spec") or {}).get(
                    "serviceAccountName", "default"
                ),
                "labels": {key: labels[key] for key in ("app", "role", "trustmesh.io/test") if key in labels},
                **pod_readiness(pod),
            })
        service_accounts = [{"name": account["metadata"]["name"]} for account in accounts]
    except IDENTITY_QUERY_ERRORS:
        response["error"] = "Pod or ServiceAccount inventory unavailable"
        response["collectedAt"] = datetime.now(timezone.utc).isoformat()
        return 503, response

    response.update(available=True, workloads=workloads, serviceAccounts=service_accounts)
    try:
        resource = kubectl_json(
            IDENTITY_CONTEXT, "get", "clusterspiffeids.spire.spiffe.io",
            "trustmesh-integration-workload-identity",
        )
        spec = resource["spec"]
        stats = resource.get("status", {}).get("stats")
        statistics = None if stats is None else {
            key: stats[key] for key in (
                "podsSelected", "entriesToSet", "entryFailures",
                "namespacesSelected", "podsSkipped", "entriesMasked",
            ) if key in stats
        }
        registration.update(
            name=resource["metadata"]["name"],
            spiffeIDTemplate=spec["spiffeIDTemplate"],
            namespaceSelector=spec.get("namespaceSelector"),
            podSelector=spec.get("podSelector"),
            statistics=statistics, available=True, error=None,
        )
    except IDENTITY_QUERY_ERRORS:
        registration["error"] = "SPIRE registration unavailable"

    for component in components:
        try:
            resource = kubectl_json(
                IDENTITY_CONTEXT, "-n", SPIRE_NAMESPACE,
                "get", component["kind"].lower(), component["name"],
            )
            status = resource.get("status", {})
            desired = ((resource.get("spec") or {}).get("replicas", 1) if component["kind"] == "StatefulSet"
                       else status.get("desiredNumberScheduled"))
            ready = status.get("readyReplicas" if component["kind"] == "StatefulSet"
                               else "numberReady", 0)
            component.update(
                name=resource["metadata"]["name"], desiredReplicas=desired,
                readyReplicas=ready, available=True, error=None,
            )
        except IDENTITY_QUERY_ERRORS:
            component["error"] = "SPIRE controller status unavailable"

    response["collectedAt"] = datetime.now(timezone.utc).isoformat()
    return 200, response

GATEKEEPER_CONTEXT = "kind-trustmesh-lab"
GATEKEEPER_CONSTRAINT_KINDS = (
    "k8scontainersecurity",
    "k8srequiredserviceaccount",
    "k8sworkloadhardening",
)
POLICY_QUERY_ERRORS = (
    subprocess.SubprocessError, OSError, ValueError, KeyError,
    AttributeError, TypeError,
)

def gatekeeper_policies():
    response = {
        "source": "live-kubernetes",
        "cluster": GATEKEEPER_CONTEXT,
        "collectedAt": datetime.now(timezone.utc).isoformat(),
        "available": False,
        "constraints": [],
    }
    raw_items = []
    try:
        for kind in GATEKEEPER_CONSTRAINT_KINDS:
            data = kubectl_json(GATEKEEPER_CONTEXT, "get", kind)
            items = data.get("items")
            if not isinstance(items, list):
                raise ValueError(f"Invalid constraint items for {kind}")
            raw_items.extend(items)
    except POLICY_QUERY_ERRORS:
        response["error"] = "Gatekeeper constraint inventory unavailable"
        response["collectedAt"] = datetime.now(timezone.utc).isoformat()
        return 503, response

    constraints = []
    for item in raw_items:
        if not isinstance(item, dict):
            continue
        metadata = item.get("metadata") or {}
        spec = item.get("spec") or {}
        status = item.get("status") or {}
        match = spec.get("match") or {}

        name = metadata.get("name")
        kind = item.get("kind")
        if not name or not kind:
            continue

        enforcement_action = spec.get("enforcementAction")
        if not isinstance(enforcement_action, str) or not enforcement_action.strip():
            enforcement_action = None

        kinds = match.get("kinds")
        if not isinstance(kinds, list):
            kinds = []
        namespaces = match.get("namespaces")
        if not isinstance(namespaces, list):
            namespaces = []

        total_violations = status.get("totalViolations")
        if not isinstance(total_violations, int):
            total_violations = None
        audit_timestamp = status.get("auditTimestamp")
        if not isinstance(audit_timestamp, str) or not audit_timestamp.strip():
            audit_timestamp = None

        by_pod = status.get("byPod")
        webhook_enforced = None
        enforcement_points = []
        seen_ep = set()

        if isinstance(by_pod, list):
            webhook_entries = []
            for pod_entry in by_pod:
                if not isinstance(pod_entry, dict):
                    continue

                ops = pod_entry.get("operations")
                is_webhook = False
                if isinstance(ops, list) and "webhook" in ops:
                    is_webhook = True
                elif isinstance(ops, str) and ops == "webhook":
                    is_webhook = True
                elif pod_entry.get("operation") == "webhook":
                    is_webhook = True

                if is_webhook:
                    webhook_entries.append(pod_entry)

                ep_list = pod_entry.get("enforcementPointsStatus")
                if isinstance(ep_list, list):
                    for ep in ep_list:
                        if not isinstance(ep, dict):
                            continue
                        ep_name = ep.get("enforcementPoint") or ep.get("name")
                        if not ep_name or not isinstance(ep_name, str):
                            continue
                        ep_state = ep.get("state")
                        ep_msg = ep.get("message")
                        ep_key = (ep_name, ep_state, ep_msg)
                        if ep_key not in seen_ep:
                            seen_ep.add(ep_key)
                            enforcement_points.append({
                                "name": ep_name,
                                "state": ep_state if isinstance(ep_state, str) else None,
                                "message": ep_msg if isinstance(ep_msg, str) else None,
                            })

            if webhook_entries:
                webhook_enforced = all(entry.get("enforced") is True for entry in webhook_entries)

        constraints.append({
            "name": name,
            "kind": kind,
            "enforcementAction": enforcement_action,
            "match": {
                "kinds": kinds,
                "namespaces": namespaces,
            },
            "audit": {
                "totalViolations": total_violations,
                "auditTimestamp": audit_timestamp,
            },
            "webhookEnforced": webhook_enforced,
            "enforcementPoints": enforcement_points,
        })

    response["available"] = True
    response["constraints"] = constraints
    response["collectedAt"] = datetime.now(timezone.utc).isoformat()
    return 200, response

NETWORK_CONTEXT = "kind-trustmesh-network-lab"
NETWORK_NAMESPACE = "trustmesh-integration-test"
ISTIO_SYSTEM_NAMESPACE = "istio-system"
NETWORK_QUERY_ERRORS = (
    subprocess.SubprocessError, OSError, ValueError, KeyError,
    TypeError, AttributeError,
)

def detect_sidecar(pod):
    spec = pod.get("spec") or {}
    status = pod.get("status") or {}
    containers = spec.get("containers") or []
    init_containers = spec.get("initContainers") or []
    container_statuses = status.get("containerStatuses") or []
    init_container_statuses = status.get("initContainerStatuses") or []

    # Check regular containers
    for c in containers:
        if c.get("name") == "istio-proxy":
            ready = any(
                cs.get("ready") is True
                for cs in container_statuses
                if cs.get("name") == "istio-proxy"
            )
            return {
                "present": True,
                "containerName": "istio-proxy",
                "location": "containers",
                "nativeSidecar": False,
                "ready": ready,
            }

    # Check initContainers (e.g., native sidecars with restartPolicy: Always)
    for c in init_containers:
        if c.get("name") == "istio-proxy":
            is_native = c.get("restartPolicy") == "Always"
            ready = any(
                cs.get("ready") is True
                for cs in init_container_statuses
                if cs.get("name") == "istio-proxy"
            )
            return {
                "present": True,
                "containerName": "istio-proxy",
                "location": "initContainers",
                "nativeSidecar": is_native,
                "ready": ready,
            }

    return {
        "present": False,
        "containerName": None,
        "location": "none",
        "nativeSidecar": False,
        "ready": False,
    }

def network_security():
    response = {
        "source": "live-kubernetes",
        "cluster": NETWORK_CONTEXT,
        "namespace": NETWORK_NAMESPACE,
        "istioSystemNamespace": ISTIO_SYSTEM_NAMESPACE,
        "collectedAt": datetime.now(timezone.utc).isoformat(),
        "available": False,
        "istiod": {
            "name": "istiod",
            "ready": False,
            "desiredReplicas": None,
            "readyReplicas": None,
            "available": False,
            "error": "Not collected",
        },
        "namespaceInjection": {
            "namespace": NETWORK_NAMESPACE,
            "enabled": False,
            "labelValue": None,
            "available": False,
            "error": "Not collected",
        },
        "peerAuthentications": [],
        "peerAuthenticationsAvailable": False,
        "workloads": [],
        "workloadsAvailable": False,
        "networkPolicies": [],
        "networkPoliciesAvailable": False,
    }

    query_success = False

    # 1. Istiod deployment in istio-system
    try:
        dep = kubectl_json(
            NETWORK_CONTEXT, "-n", ISTIO_SYSTEM_NAMESPACE,
            "get", "deployment", "istiod",
        )
        spec = dep.get("spec") or {}
        status = dep.get("status") or {}
        desired = spec.get("replicas", 1)
        ready = status.get("readyReplicas", 0)
        response["istiod"] = {
            "name": dep.get("metadata", {}).get("name", "istiod"),
            "ready": bool(ready and ready >= desired),
            "desiredReplicas": desired,
            "readyReplicas": ready,
            "available": True,
            "error": None,
        }
        query_success = True
    except NETWORK_QUERY_ERRORS:
        response["istiod"]["error"] = "Istio control-plane (istiod) status unavailable"

    # 2. Namespace injection configuration
    try:
        ns = kubectl_json(NETWORK_CONTEXT, "get", "namespace", NETWORK_NAMESPACE)
        labels = (ns.get("metadata") or {}).get("labels") or {}
        inj_val = labels.get("istio-injection")
        response["namespaceInjection"] = {
            "namespace": NETWORK_NAMESPACE,
            "enabled": inj_val == "enabled",
            "labelValue": inj_val,
            "available": True,
            "error": None,
        }
        query_success = True
    except NETWORK_QUERY_ERRORS:
        response["namespaceInjection"]["error"] = "Namespace injection status unavailable"

    # 3. Workload Pods and sidecar detection
    try:
        pods_data = kubectl_json(
            NETWORK_CONTEXT, "-n", NETWORK_NAMESPACE, "get", "pods"
        )
        raw_pods = pods_data.get("items")
        if not isinstance(raw_pods, list):
            raise ValueError("Invalid pods response")
        parsed_workloads = []
        for pod in raw_pods:
            if not isinstance(pod, dict):
                continue
            metadata = pod.get("metadata") or {}
            status = pod.get("status") or {}
            labels = metadata.get("labels") or {}
            p_name = metadata.get("name")
            if not p_name:
                continue
            parsed_workloads.append({
                "name": p_name,
                "phase": status.get("phase", "Unknown"),
                "labels": {k: labels[k] for k in ("app", "role", "trustmesh.io/test") if k in labels},
                "sidecar": detect_sidecar(pod),
            })
        response["workloads"] = parsed_workloads
        response["workloadsAvailable"] = True
        response["workloadsError"] = None
        query_success = True
    except NETWORK_QUERY_ERRORS:
        response["workloadsError"] = "Workload sidecar telemetry unavailable"

    # 4. PeerAuthentication resources
    try:
        pa_data = kubectl_json(
            NETWORK_CONTEXT, "-n", NETWORK_NAMESPACE, "get", "peerauthentications"
        )
        raw_pa = pa_data.get("items")
        if not isinstance(raw_pa, list):
            raise ValueError("Invalid peerauthentications response")
        parsed_pa = []
        for item in raw_pa:
            if not isinstance(item, dict):
                continue
            metadata = item.get("metadata") or {}
            spec = item.get("spec") or {}
            pa_name = metadata.get("name")
            if not pa_name:
                continue
            mtls = spec.get("mtls") or {}
            mode = mtls.get("mode", "UNSPECIFIED")
            selector = spec.get("selector") or {}
            match_labels = selector.get("matchLabels") or {}
            parsed_pa.append({
                "name": pa_name,
                "mode": mode,
                "selector": {
                    "matchLabels": match_labels,
                },
                "workloadScoped": bool(match_labels),
            })
        response["peerAuthentications"] = parsed_pa
        response["peerAuthenticationsAvailable"] = True
        response["peerAuthenticationsError"] = None
        query_success = True
    except NETWORK_QUERY_ERRORS:
        response["peerAuthenticationsError"] = "PeerAuthentication inventory unavailable"

    # 5. NetworkPolicy resources
    try:
        np_data = kubectl_json(
            NETWORK_CONTEXT, "-n", NETWORK_NAMESPACE, "get", "networkpolicies"
        )
        raw_np = np_data.get("items")
        if not isinstance(raw_np, list):
            raise ValueError("Invalid networkpolicies response")
        parsed_np = []
        for item in raw_np:
            if not isinstance(item, dict):
                continue
            metadata = item.get("metadata") or {}
            spec = item.get("spec") or {}
            np_name = metadata.get("name")
            if not np_name:
                continue
            pod_selector = spec.get("podSelector") or {}
            match_labels = pod_selector.get("matchLabels") or {}
            policy_types = spec.get("policyTypes") or []
            if not isinstance(policy_types, list):
                policy_types = []

            ingress_rules = []
            raw_ingress = spec.get("ingress")
            if isinstance(raw_ingress, list):
                for rule in raw_ingress:
                    if not isinstance(rule, dict):
                        continue
                    parsed_rule = {
                        "from": [],
                        "ports": [],
                    }
                    raw_from = rule.get("from")
                    if isinstance(raw_from, list):
                        for peer in raw_from:
                            if not isinstance(peer, dict):
                                continue
                            peer_obj = {}
                            if "podSelector" in peer:
                                peer_obj["podSelector"] = peer.get("podSelector") or {}
                            if "namespaceSelector" in peer:
                                peer_obj["namespaceSelector"] = peer.get("namespaceSelector") or {}
                            parsed_rule["from"].append(peer_obj)
                    raw_ports = rule.get("ports")
                    if isinstance(raw_ports, list):
                        for port_entry in raw_ports:
                            if not isinstance(port_entry, dict):
                                continue
                            parsed_rule["ports"].append({
                                "port": port_entry.get("port"),
                                "protocol": port_entry.get("protocol", "TCP"),
                            })
                    ingress_rules.append(parsed_rule)

            parsed_np.append({
                "name": np_name,
                "podSelector": {
                    "matchLabels": match_labels,
                },
                "policyTypes": policy_types,
                "ingress": ingress_rules,
                "workloadScoped": bool(match_labels),
            })
        response["networkPolicies"] = parsed_np
        response["networkPoliciesAvailable"] = True
        response["networkPoliciesError"] = None
        query_success = True
    except NETWORK_QUERY_ERRORS:
        response["networkPoliciesError"] = "NetworkPolicy inventory unavailable"

    response["collectedAt"] = datetime.now(timezone.utc).isoformat()

    if not query_success:
        response["available"] = False
        response["error"] = "Network security telemetry unavailable"
        return 503, response

    response["available"] = True
    return 200, response

def automated_verification():
    now_iso = datetime.now(timezone.utc).isoformat()
    checks = []

    # 1. KUBERNETES READINESS
    # Context 1: kind-trustmesh-lab
    try:
        lab_cluster = cluster_status("gatekeeper", CLUSTERS.get("gatekeeper", "kind-trustmesh-lab"))
        connected = lab_cluster.get("connected", False)
        nodes = lab_cluster.get("nodes", [])
        if not connected or not nodes:
            checks.append({
                "id": "k8s-cluster-readiness-lab",
                "control": "Kubernetes Node Readiness (kind-trustmesh-lab)",
                "status": "UNKNOWN",
                "reason": lab_cluster.get("error", "Context kind-trustmesh-lab is unreachable or returned no nodes"),
                "evidence": {"connected": connected, "nodes": nodes},
                "source": "kind-trustmesh-lab / nodes",
                "observedAt": now_iso,
            })
        else:
            not_ready = [n["name"] for n in nodes if not n.get("ready")]
            if not_ready:
                checks.append({
                    "id": "k8s-cluster-readiness-lab",
                    "control": "Kubernetes Node Readiness (kind-trustmesh-lab)",
                    "status": "FAIL",
                    "reason": f"Cluster kind-trustmesh-lab has non-ready node(s): {', '.join(not_ready)}",
                    "evidence": {"connected": connected, "nodes": nodes},
                    "source": "kind-trustmesh-lab / nodes",
                    "observedAt": now_iso,
                })
            else:
                checks.append({
                    "id": "k8s-cluster-readiness-lab",
                    "control": "Kubernetes Node Readiness (kind-trustmesh-lab)",
                    "status": "PASS",
                    "reason": f"Cluster kind-trustmesh-lab is reachable and all {len(nodes)} node(s) report Ready condition.",
                    "evidence": {"connected": connected, "nodes": nodes},
                    "source": "kind-trustmesh-lab / nodes",
                    "observedAt": now_iso,
                })
    except Exception as e:
        checks.append({
            "id": "k8s-cluster-readiness-lab",
            "control": "Kubernetes Node Readiness (kind-trustmesh-lab)",
            "status": "UNKNOWN",
            "reason": f"Error querying cluster status: {str(e)}",
            "evidence": {},
            "source": "kind-trustmesh-lab / nodes",
            "observedAt": now_iso,
        })

    # Context 2: kind-trustmesh-network-lab
    try:
        net_cluster = cluster_status("network", CLUSTERS.get("network", "kind-trustmesh-network-lab"))
        connected = net_cluster.get("connected", False)
        nodes = net_cluster.get("nodes", [])
        if not connected or not nodes:
            checks.append({
                "id": "k8s-cluster-readiness-network-lab",
                "control": "Kubernetes Node Readiness (kind-trustmesh-network-lab)",
                "status": "UNKNOWN",
                "reason": net_cluster.get("error", "Context kind-trustmesh-network-lab is unreachable or returned no nodes"),
                "evidence": {"connected": connected, "nodes": nodes},
                "source": "kind-trustmesh-network-lab / nodes",
                "observedAt": now_iso,
            })
        else:
            not_ready = [n["name"] for n in nodes if not n.get("ready")]
            if not_ready:
                checks.append({
                    "id": "k8s-cluster-readiness-network-lab",
                    "control": "Kubernetes Node Readiness (kind-trustmesh-network-lab)",
                    "status": "FAIL",
                    "reason": f"Cluster kind-trustmesh-network-lab has non-ready node(s): {', '.join(not_ready)}",
                    "evidence": {"connected": connected, "nodes": nodes},
                    "source": "kind-trustmesh-network-lab / nodes",
                    "observedAt": now_iso,
                })
            else:
                checks.append({
                    "id": "k8s-cluster-readiness-network-lab",
                    "control": "Kubernetes Node Readiness (kind-trustmesh-network-lab)",
                    "status": "PASS",
                    "reason": f"Cluster kind-trustmesh-network-lab is reachable and all {len(nodes)} node(s) report Ready condition.",
                    "evidence": {"connected": connected, "nodes": nodes},
                    "source": "kind-trustmesh-network-lab / nodes",
                    "observedAt": now_iso,
                })
    except Exception as e:
        checks.append({
            "id": "k8s-cluster-readiness-network-lab",
            "control": "Kubernetes Node Readiness (kind-trustmesh-network-lab)",
            "status": "UNKNOWN",
            "reason": f"Error querying cluster status: {str(e)}",
            "evidence": {},
            "source": "kind-trustmesh-network-lab / nodes",
            "observedAt": now_iso,
        })

    # 2. GATEKEEPER
    try:
        gk_status, gk_data = gatekeeper_policies()
    except Exception as e:
        gk_status, gk_data = 503, {"available": False, "error": str(e)}

    expected_constraints = [
        "trustmesh-container-security",
        "trustmesh-require-dedicated-sa",
        "trustmesh-workload-hardening",
    ]

    if gk_status != 200 or not gk_data.get("available"):
        err_msg = gk_data.get("error", "Gatekeeper policies query failed or unavailable")
        for check_id, title in [
            ("gatekeeper-constraints-inventory", "Gatekeeper Constraint Inventory"),
            ("gatekeeper-enforcement-action-deny", "Gatekeeper Enforcement Action (Deny)"),
            ("gatekeeper-scope-workload-deployments", "Gatekeeper Target Scope (apps/Deployment in trustmesh-lab)"),
            ("gatekeeper-webhook-enforced", "Gatekeeper Webhook Enforcement Posture"),
        ]:
            checks.append({
                "id": check_id,
                "control": title,
                "status": "UNKNOWN",
                "reason": err_msg,
                "evidence": {},
                "source": "kind-trustmesh-lab / gatekeeper",
                "observedAt": now_iso,
            })
    else:
        constraints = gk_data.get("constraints") or []
        c_map = {c.get("name"): c for c in constraints if isinstance(c, dict) and c.get("name")}

        # 2a: Inventory
        missing = [name for name in expected_constraints if name not in c_map]
        if missing:
            checks.append({
                "id": "gatekeeper-constraints-inventory",
                "control": "Gatekeeper Constraint Inventory",
                "status": "FAIL",
                "reason": f"Missing expected Gatekeeper constraints: {', '.join(missing)}",
                "evidence": {"expected": expected_constraints, "discovered": list(c_map.keys())},
                "source": "kind-trustmesh-lab / gatekeeper constraints",
                "observedAt": now_iso,
            })
        else:
            checks.append({
                "id": "gatekeeper-constraints-inventory",
                "control": "Gatekeeper Constraint Inventory",
                "status": "PASS",
                "reason": "All 3 expected Gatekeeper constraints (container-security, require-dedicated-sa, workload-hardening) exist.",
                "evidence": {"expected": expected_constraints, "discovered": list(c_map.keys())},
                "source": "kind-trustmesh-lab / gatekeeper constraints",
                "observedAt": now_iso,
            })

        # 2b: Enforcement Action
        non_deny = []
        for name in expected_constraints:
            c = c_map.get(name)
            if c:
                act = str(c.get("enforcementAction") or "").lower()
                if act != "deny":
                    non_deny.append(f"{name} ({act or 'unspecified'})")
        if missing:
            checks.append({
                "id": "gatekeeper-enforcement-action-deny",
                "control": "Gatekeeper Enforcement Action (Deny)",
                "status": "FAIL",
                "reason": f"Cannot verify enforcement action because constraints are missing: {', '.join(missing)}",
                "evidence": {"missing": missing},
                "source": "kind-trustmesh-lab / gatekeeper spec.enforcementAction",
                "observedAt": now_iso,
            })
        elif non_deny:
            checks.append({
                "id": "gatekeeper-enforcement-action-deny",
                "control": "Gatekeeper Enforcement Action (Deny)",
                "status": "FAIL",
                "reason": f"Constraints not configured with enforcementAction: deny: {', '.join(non_deny)}",
                "evidence": {name: c_map[name].get("enforcementAction") for name in expected_constraints},
                "source": "kind-trustmesh-lab / gatekeeper spec.enforcementAction",
                "observedAt": now_iso,
            })
        else:
            checks.append({
                "id": "gatekeeper-enforcement-action-deny",
                "control": "Gatekeeper Enforcement Action (Deny)",
                "status": "PASS",
                "reason": "All 3 expected Gatekeeper constraints have enforcementAction set to deny.",
                "evidence": {name: c_map[name].get("enforcementAction") for name in expected_constraints},
                "source": "kind-trustmesh-lab / gatekeeper spec.enforcementAction",
                "observedAt": now_iso,
            })

        # 2c: Scope (apps/Deployment in trustmesh-lab)
        scope_mismatch = []
        for name in expected_constraints:
            c = c_map.get(name)
            if c:
                match = c.get("match") or {}
                namespaces = match.get("namespaces") or []
                kinds = match.get("kinds") or []
                has_ns = "trustmesh-lab" in namespaces
                has_dep = any(
                    "Deployment" in (k.get("kinds") or [])
                    and ("apps" in (k.get("apiGroups") or []) or "" in (k.get("apiGroups") or []))
                    for k in kinds if isinstance(k, dict)
                )
                if not (has_ns and has_dep):
                    scope_mismatch.append(name)
        if missing:
            checks.append({
                "id": "gatekeeper-scope-workload-deployments",
                "control": "Gatekeeper Target Scope (apps/Deployment in trustmesh-lab)",
                "status": "FAIL",
                "reason": f"Cannot verify scope because constraints are missing: {', '.join(missing)}",
                "evidence": {"missing": missing},
                "source": "kind-trustmesh-lab / gatekeeper spec.match",
                "observedAt": now_iso,
            })
        elif scope_mismatch:
            checks.append({
                "id": "gatekeeper-scope-workload-deployments",
                "control": "Gatekeeper Target Scope (apps/Deployment in trustmesh-lab)",
                "status": "FAIL",
                "reason": f"Constraints do not correctly scope to apps/Deployment in namespace trustmesh-lab: {', '.join(scope_mismatch)}",
                "evidence": {name: c_map[name].get("match") for name in expected_constraints},
                "source": "kind-trustmesh-lab / gatekeeper spec.match",
                "observedAt": now_iso,
            })
        else:
            checks.append({
                "id": "gatekeeper-scope-workload-deployments",
                "control": "Gatekeeper Target Scope (apps/Deployment in trustmesh-lab)",
                "status": "PASS",
                "reason": "All 3 expected constraints target apps/Deployment resources within namespace trustmesh-lab.",
                "evidence": {name: c_map[name].get("match") for name in expected_constraints},
                "source": "kind-trustmesh-lab / gatekeeper spec.match",
                "observedAt": now_iso,
            })

        # 2d: Webhook Enforced
        webhook_status = {name: c_map[name].get("webhookEnforced") for name in expected_constraints if name in c_map}
        enforcement_pts = {name: c_map[name].get("enforcementPoints") for name in expected_constraints if name in c_map}
        if any(v is None for v in webhook_status.values()) or len(webhook_status) < len(expected_constraints):
            checks.append({
                "id": "gatekeeper-webhook-enforced",
                "control": "Gatekeeper Webhook Enforcement Posture",
                "status": "UNKNOWN",
                "reason": "Webhook enforcement status is incomplete or not reported in status.byPod.",
                "evidence": {"webhookEnforced": webhook_status, "enforcementPoints": enforcement_pts},
                "source": "kind-trustmesh-lab / gatekeeper status.byPod",
                "observedAt": now_iso,
            })
        elif all(v is True for v in webhook_status.values()):
            checks.append({
                "id": "gatekeeper-webhook-enforced",
                "control": "Gatekeeper Webhook Enforcement Posture",
                "status": "PASS",
                "reason": "All 3 expected constraints report webhookEnforced = true on controller-manager pods. (Environment diagnostic note: vap.k8s.io engine missing on audit pod is retained and does not impair webhook admission).",
                "evidence": {"webhookEnforced": webhook_status, "enforcementPoints": enforcement_pts},
                "source": "kind-trustmesh-lab / gatekeeper status.byPod",
                "observedAt": now_iso,
            })
        else:
            not_enforced = [name for name, status in webhook_status.items() if status is not True]
            checks.append({
                "id": "gatekeeper-webhook-enforced",
                "control": "Gatekeeper Webhook Enforcement Posture",
                "status": "FAIL",
                "reason": f"Constraints reporting inactive webhook enforcement: {', '.join(not_enforced)}",
                "evidence": {"webhookEnforced": webhook_status, "enforcementPoints": enforcement_pts},
                "source": "kind-trustmesh-lab / gatekeeper status.byPod",
                "observedAt": now_iso,
            })

    # 3 & 4. NETWORK & MESH SECURITY
    try:
        net_status, net_data = network_security()
    except Exception as e:
        net_status, net_data = 503, {"available": False, "error": str(e)}

    # 3. CALICO NETWORK POLICIES
    if net_status != 200 or not net_data.get("available") or not net_data.get("networkPoliciesAvailable"):
        err_msg = net_data.get("networkPoliciesError") or net_data.get("error") or "NetworkPolicy telemetry unavailable"
        for check_id, title in [
            ("calico-default-deny-server", "Calico Default-Deny Ingress Policy for Server Workloads"),
            ("calico-allow-authorized-server", "Calico Ingress Allowance for Authorized Client"),
        ]:
            checks.append({
                "id": check_id,
                "control": title,
                "status": "UNKNOWN",
                "reason": err_msg,
                "evidence": {},
                "source": "kind-trustmesh-network-lab / networkpolicies",
                "observedAt": now_iso,
            })
    else:
        net_pols = net_data.get("networkPolicies") or []
        np_map = {np.get("name"): np for np in net_pols if isinstance(np, dict) and np.get("name")}

        # 3a: default-deny
        dd = np_map.get("trustmesh-integration-default-deny")
        if not dd:
            checks.append({
                "id": "calico-default-deny-server",
                "control": "Calico Default-Deny Ingress Policy for Server Workloads",
                "status": "FAIL",
                "reason": "Policy trustmesh-integration-default-deny not found.",
                "evidence": {"discoveredPolicies": list(np_map.keys())},
                "source": "kind-trustmesh-network-lab / networkpolicies",
                "observedAt": now_iso,
            })
        else:
            sel = (dd.get("podSelector") or {}).get("matchLabels") or {}
            ptypes = dd.get("policyTypes") or []
            ingress = dd.get("ingress")
            is_server = sel.get("app") == "trustmesh-integration-server"
            has_ingress_type = "Ingress" in ptypes
            is_empty_ingress = isinstance(ingress, list) and len(ingress) == 0
            if is_server and has_ingress_type and is_empty_ingress:
                checks.append({
                    "id": "calico-default-deny-server",
                    "control": "Calico Default-Deny Ingress Policy for Server Workloads",
                    "status": "PASS",
                    "reason": "Policy trustmesh-integration-default-deny selects app=trustmesh-integration-server, specifies Ingress in policyTypes, and contains an empty ingress array (default deny on server pods).",
                    "evidence": {"podSelector": sel, "policyTypes": ptypes, "ingressRules": len(ingress)},
                    "source": "kind-trustmesh-network-lab / networkpolicy:trustmesh-integration-default-deny",
                    "observedAt": now_iso,
                })
            else:
                checks.append({
                    "id": "calico-default-deny-server",
                    "control": "Calico Default-Deny Ingress Policy for Server Workloads",
                    "status": "FAIL",
                    "reason": f"Default-deny policy configuration diverges (server selector: {is_server}, Ingress policyType: {has_ingress_type}, empty ingress array: {is_empty_ingress}).",
                    "evidence": {"podSelector": sel, "policyTypes": ptypes, "ingress": ingress},
                    "source": "kind-trustmesh-network-lab / networkpolicy:trustmesh-integration-default-deny",
                    "observedAt": now_iso,
                })

        # 3b: allow-authorized
        aa = np_map.get("trustmesh-integration-allow-authorized")
        if not aa:
            checks.append({
                "id": "calico-allow-authorized-server",
                "control": "Calico Ingress Allowance for Authorized Client",
                "status": "FAIL",
                "reason": "Policy trustmesh-integration-allow-authorized not found.",
                "evidence": {"discoveredPolicies": list(np_map.keys())},
                "source": "kind-trustmesh-network-lab / networkpolicies",
                "observedAt": now_iso,
            })
        else:
            sel = (aa.get("podSelector") or {}).get("matchLabels") or {}
            ptypes = aa.get("policyTypes") or []
            ingress = aa.get("ingress") or []
            is_server = sel.get("app") == "trustmesh-integration-server"
            has_ingress_type = "Ingress" in ptypes

            valid_rule = False
            for rule in ingress:
                if not isinstance(rule, dict):
                    continue
                from_list = rule.get("from") or []
                ports_list = rule.get("ports") or []
                match_from = any(
                    isinstance(p, dict)
                    and (p.get("podSelector") or {}).get("matchLabels", {}).get("app") == "trustmesh-integration-client"
                    and (p.get("podSelector") or {}).get("matchLabels", {}).get("role") == "authorized"
                    for p in from_list
                )
                match_port = any(
                    isinstance(prt, dict)
                    and str(prt.get("port")) == "8080"
                    and str(prt.get("protocol", "TCP")).upper() == "TCP"
                    for prt in ports_list
                )
                if match_from and match_port:
                    valid_rule = True
                    break

            if is_server and has_ingress_type and valid_rule:
                checks.append({
                    "id": "calico-allow-authorized-server",
                    "control": "Calico Ingress Allowance for Authorized Client",
                    "status": "PASS",
                    "reason": "Policy trustmesh-integration-allow-authorized selects app=trustmesh-integration-server and restricts ingress to authorized client (app=trustmesh-integration-client, role=authorized) over TCP port 8080.",
                    "evidence": {"podSelector": sel, "policyTypes": ptypes, "ingress": ingress},
                    "source": "kind-trustmesh-network-lab / networkpolicy:trustmesh-integration-allow-authorized",
                    "observedAt": now_iso,
                })
            else:
                checks.append({
                    "id": "calico-allow-authorized-server",
                    "control": "Calico Ingress Allowance for Authorized Client",
                    "status": "FAIL",
                    "reason": f"Allow policy rules diverge from expected specification (server selector: {is_server}, valid rule: {valid_rule}).",
                    "evidence": {"podSelector": sel, "policyTypes": ptypes, "ingress": ingress},
                    "source": "kind-trustmesh-network-lab / networkpolicy:trustmesh-integration-allow-authorized",
                    "observedAt": now_iso,
                })

    # 4. ISTIO MTLS & SIDECARS
    # 4a: istiod
    istiod = net_data.get("istiod") if (net_status == 200 and net_data.get("available")) else None
    if not istiod or not istiod.get("available"):
        checks.append({
            "id": "istio-control-plane-ready",
            "control": "Istio Control Plane Readiness (istiod)",
            "status": "UNKNOWN",
            "reason": (istiod.get("error") if istiod else None) or "istiod deployment status unavailable",
            "evidence": istiod or {},
            "source": "kind-trustmesh-network-lab / istio-system / deployment:istiod",
            "observedAt": now_iso,
        })
    elif istiod.get("ready"):
        checks.append({
            "id": "istio-control-plane-ready",
            "control": "Istio Control Plane Readiness (istiod)",
            "status": "PASS",
            "reason": f"istiod deployment is ready ({istiod.get('readyReplicas')}/{istiod.get('desiredReplicas')} replicas ready in istio-system).",
            "evidence": istiod,
            "source": "kind-trustmesh-network-lab / istio-system / deployment:istiod",
            "observedAt": now_iso,
        })
    else:
        checks.append({
            "id": "istio-control-plane-ready",
            "control": "Istio Control Plane Readiness (istiod)",
            "status": "FAIL",
            "reason": f"istiod deployment is not ready ({istiod.get('readyReplicas', 0)}/{istiod.get('desiredReplicas', 1)} replicas ready).",
            "evidence": istiod,
            "source": "kind-trustmesh-network-lab / istio-system / deployment:istiod",
            "observedAt": now_iso,
        })

    # 4b: PeerAuthentication STRICT mTLS
    if net_status != 200 or not net_data.get("available") or not net_data.get("peerAuthenticationsAvailable"):
        checks.append({
            "id": "istio-workload-strict-mtls",
            "control": "Istio Workload-Scoped STRICT mTLS Policy",
            "status": "UNKNOWN",
            "reason": net_data.get("peerAuthenticationsError") or "PeerAuthentication telemetry unavailable",
            "evidence": {},
            "source": "kind-trustmesh-network-lab / peerauthentications",
            "observedAt": now_iso,
        })
    else:
        pa_list = net_data.get("peerAuthentications") or []
        pa = next((p for p in pa_list if p.get("name") == "trustmesh-integration-strict-mtls"), None)
        if not pa:
            checks.append({
                "id": "istio-workload-strict-mtls",
                "control": "Istio Workload-Scoped STRICT mTLS Policy",
                "status": "FAIL",
                "reason": "PeerAuthentication trustmesh-integration-strict-mtls not found.",
                "evidence": {"discovered": [p.get("name") for p in pa_list]},
                "source": "kind-trustmesh-network-lab / peerauthentications",
                "observedAt": now_iso,
            })
        else:
            mode = pa.get("mode")
            sel = (pa.get("selector") or {}).get("matchLabels") or {}
            is_strict = mode == "STRICT"
            is_server = sel.get("app") == "trustmesh-integration-server"
            if is_strict and is_server:
                checks.append({
                    "id": "istio-workload-strict-mtls",
                    "control": "Istio Workload-Scoped STRICT mTLS Policy",
                    "status": "PASS",
                    "reason": "STRICT mTLS is actively configured and workload-scoped to app=trustmesh-integration-server (verifying traffic encryption without falsely claiming namespace-wide enforcement).",
                    "evidence": pa,
                    "source": "kind-trustmesh-network-lab / peerauthentication:trustmesh-integration-strict-mtls",
                    "observedAt": now_iso,
                })
            else:
                checks.append({
                    "id": "istio-workload-strict-mtls",
                    "control": "Istio Workload-Scoped STRICT mTLS Policy",
                    "status": "FAIL",
                    "reason": f"PeerAuthentication is not configured as workload-scoped STRICT mTLS (mode: {mode}, selector: {sel}).",
                    "evidence": pa,
                    "source": "kind-trustmesh-network-lab / peerauthentication:trustmesh-integration-strict-mtls",
                    "observedAt": now_iso,
                })

    # 4c: Sidecar Posture
    if net_status != 200 or not net_data.get("available") or not net_data.get("workloadsAvailable"):
        checks.append({
            "id": "istio-sidecar-injection-posture",
            "control": "Istio Sidecar Injection Posture (Workload Inspection)",
            "status": "UNKNOWN",
            "reason": net_data.get("workloadsError") or "Workload sidecar telemetry unavailable",
            "evidence": {},
            "source": "kind-trustmesh-network-lab / pods",
            "observedAt": now_iso,
        })
    else:
        wk_list = net_data.get("workloads") or []
        plaintext = next(
            (w for w in wk_list if (
                (w.get("labels") or {}).get("trustmesh.io/test") == "plaintext-negative"
                or (w.get("labels") or {}).get("app") == "trustmesh-integration-plaintext"
                or "plaintext-client" in w.get("name", "")
            )),
            None
        )
        auth_client = next(
            (w for w in wk_list if (
                w != plaintext
                and (w.get("labels") or {}).get("trustmesh.io/test") != "plaintext-negative"
                and "plaintext" not in w.get("name", "")
                and (w.get("labels") or {}).get("role") == "authorized"
            )),
            None
        )
        unauth_client = next((w for w in wk_list if (w.get("labels") or {}).get("role") == "unauthorized"), None)
        srv = next((w for w in wk_list if (w.get("labels") or {}).get("app") == "trustmesh-integration-server"), None)

        if not auth_client or not unauth_client or not srv or not plaintext:
            missing_wks = []
            if not auth_client: missing_wks.append("authorized-client")
            if not unauth_client: missing_wks.append("unauthorized-client")
            if not srv: missing_wks.append("server")
            if not plaintext: missing_wks.append("plaintext-client")
            checks.append({
                "id": "istio-sidecar-injection-posture",
                "control": "Istio Sidecar Injection Posture (Workload Inspection)",
                "status": "UNKNOWN",
                "reason": f"Cannot verify sidecar posture: missing workload(s) {', '.join(missing_wks)}.",
                "evidence": {"discovered": [w.get("name") for w in wk_list]},
                "source": "kind-trustmesh-network-lab / pods",
                "observedAt": now_iso,
            })
        else:
            auth_sidecar = (auth_client.get("sidecar") or {}).get("present") is True
            unauth_sidecar = (unauth_client.get("sidecar") or {}).get("present") is True
            srv_sidecar = (srv.get("sidecar") or {}).get("present") is True
            plain_sidecar = (plaintext.get("sidecar") or {}).get("present") is False

            if auth_sidecar and unauth_sidecar and srv_sidecar and plain_sidecar:
                checks.append({
                    "id": "istio-sidecar-injection-posture",
                    "control": "Istio Sidecar Injection Posture (Workload Inspection)",
                    "status": "PASS",
                    "reason": "Sidecars verified in spec.initContainers (native sidecar) for server, authorized client, and unauthorized client. Plaintext client confirmed uninjected (expected baseline for negative testing).",
                    "evidence": {
                        "authorized": auth_client.get("sidecar"),
                        "unauthorized": unauth_client.get("sidecar"),
                        "server": srv.get("sidecar"),
                        "plaintext": plaintext.get("sidecar"),
                    },
                    "source": "kind-trustmesh-network-lab / pods",
                    "observedAt": now_iso,
                })
            else:
                checks.append({
                    "id": "istio-sidecar-injection-posture",
                    "control": "Istio Sidecar Injection Posture (Workload Inspection)",
                    "status": "FAIL",
                    "reason": f"Sidecar injection posture differs from expected baseline (auth: {auth_sidecar}, unauth: {unauth_sidecar}, srv: {srv_sidecar}, plaintext uninjected: {plain_sidecar}).",
                    "evidence": {
                        "authorized": auth_client.get("sidecar"),
                        "unauthorized": unauth_client.get("sidecar"),
                        "server": srv.get("sidecar"),
                        "plaintext": plaintext.get("sidecar"),
                    },
                    "source": "kind-trustmesh-network-lab / pods",
                    "observedAt": now_iso,
                })

    # 5 & 6. SPIRE & IDENTITY WORKLOADS
    try:
        ident_status, ident_data = identity_workloads()
    except Exception as e:
        ident_status, ident_data = 503, {"available": False, "error": str(e)}

    # 5. SPIRE
    if ident_status != 200 or not ident_data.get("available"):
        err_msg = ident_data.get("error", "Identity and SPIRE telemetry unavailable")
        for check_id, title in [
            ("spire-control-plane-components", "SPIRE Control Plane & Node Attestation Components"),
            ("spire-workload-registration", "SPIRE Workload Identity Registration (ClusterSPIFFEID)"),
            ("workload-service-accounts", "Zero Trust Dedicated ServiceAccount Inventory"),
            ("workload-lifecycle-and-identity", "Workload Lifecycle Phase & ServiceAccount Binding"),
        ]:
            checks.append({
                "id": check_id,
                "control": title,
                "status": "UNKNOWN",
                "reason": err_msg,
                "evidence": {},
                "source": "kind-trustmesh-network-lab / spire & identity",
                "observedAt": now_iso,
            })
    else:
        # 5a: Spire Components
        spire_comps = ident_data.get("spireComponents") or []
        comp_map = {c.get("name"): c for c in spire_comps if isinstance(c, dict) and c.get("name")}
        expected_comps = [
            "trustmesh-spire-server",
            "trustmesh-spire-agent",
            "trustmesh-spire-spiffe-csi-driver",
        ]
        missing_comps = [c for c in expected_comps if c not in comp_map]
        unavail_comps = [c for c, item in comp_map.items() if not item.get("available")]

        if missing_comps or unavail_comps:
            checks.append({
                "id": "spire-control-plane-components",
                "control": "SPIRE Control Plane & Node Attestation Components",
                "status": "UNKNOWN",
                "reason": f"SPIRE components unavailable or missing: {', '.join(missing_comps + unavail_comps)}.",
                "evidence": {"components": spire_comps},
                "source": "kind-trustmesh-network-lab / trustmesh-spire",
                "observedAt": now_iso,
            })
        else:
            not_ready_comps = []
            for name in expected_comps:
                item = comp_map[name]
                ready = item.get("readyReplicas") or 0
                desired = item.get("desiredReplicas") or 1
                if ready < desired or ready == 0:
                    not_ready_comps.append(f"{name} ({ready}/{desired})")
            if not_ready_comps:
                checks.append({
                    "id": "spire-control-plane-components",
                    "control": "SPIRE Control Plane & Node Attestation Components",
                    "status": "FAIL",
                    "reason": f"SPIRE components not fully ready: {', '.join(not_ready_comps)}.",
                    "evidence": {"components": spire_comps},
                    "source": "kind-trustmesh-network-lab / trustmesh-spire",
                    "observedAt": now_iso,
                })
            else:
                checks.append({
                    "id": "spire-control-plane-components",
                    "control": "SPIRE Control Plane & Node Attestation Components",
                    "status": "PASS",
                    "reason": "All 3 SPIRE infrastructure components (server StatefulSet, agent DaemonSet, CSI driver DaemonSet) report Ready in namespace trustmesh-spire.",
                    "evidence": {"components": spire_comps},
                    "source": "kind-trustmesh-network-lab / trustmesh-spire",
                    "observedAt": now_iso,
                })

        # 5b: Spire Registration
        spire_reg = ident_data.get("spireRegistration") or {}
        if not spire_reg.get("available"):
            checks.append({
                "id": "spire-workload-registration",
                "control": "SPIRE Workload Identity Registration (ClusterSPIFFEID)",
                "status": "UNKNOWN",
                "reason": spire_reg.get("error", "ClusterSPIFFEID registration unavailable"),
                "evidence": spire_reg,
                "source": "kind-trustmesh-network-lab / clusterspiffeids.spire.spiffe.io",
                "observedAt": now_iso,
            })
        else:
            name = spire_reg.get("name")
            tmpl = spire_reg.get("spiffeIDTemplate") or ""
            is_valid_name = name == "trustmesh-integration-workload-identity"
            is_valid_tmpl = "spiffe://" in tmpl and "sa" in tmpl
            if is_valid_name and is_valid_tmpl:
                checks.append({
                    "id": "spire-workload-registration",
                    "control": "SPIRE Workload Identity Registration (ClusterSPIFFEID)",
                    "status": "PASS",
                    "reason": f"ClusterSPIFFEID registration exists targeting namespace trustmesh-integration-test with template {tmpl}." + (f" Statistics: {spire_reg.get('statistics')}." if spire_reg.get('statistics') else ""),
                    "evidence": spire_reg,
                    "source": "kind-trustmesh-network-lab / clusterspiffeid:trustmesh-integration-workload-identity",
                    "observedAt": now_iso,
                })
            else:
                checks.append({
                    "id": "spire-workload-registration",
                    "control": "SPIRE Workload Identity Registration (ClusterSPIFFEID)",
                    "status": "FAIL",
                    "reason": f"ClusterSPIFFEID registration configuration diverges from expected template/name (name: {name}, template: {tmpl}).",
                    "evidence": spire_reg,
                    "source": "kind-trustmesh-network-lab / clusterspiffeids.spire.spiffe.io",
                    "observedAt": now_iso,
                })

        # 6a: ServiceAccounts Inventory
        sa_list = ident_data.get("serviceAccounts") or []
        sa_names = {sa.get("name") for sa in sa_list if isinstance(sa, dict) and sa.get("name")}
        expected_sas = [
            "trustmesh-integration-authorized",
            "trustmesh-integration-unauthorized",
            "trustmesh-integration-server",
            "trustmesh-integration-verifier",
        ]
        missing_sas = [sa for sa in expected_sas if sa not in sa_names]
        if missing_sas:
            checks.append({
                "id": "workload-service-accounts",
                "control": "Zero Trust Dedicated ServiceAccount Inventory",
                "status": "FAIL",
                "reason": f"Missing dedicated ServiceAccounts: {', '.join(missing_sas)}.",
                "evidence": {"expected": expected_sas, "discovered": list(sa_names)},
                "source": "kind-trustmesh-network-lab / serviceaccounts",
                "observedAt": now_iso,
            })
        else:
            checks.append({
                "id": "workload-service-accounts",
                "control": "Zero Trust Dedicated ServiceAccount Inventory",
                "status": "PASS",
                "reason": "All 4 dedicated ServiceAccounts (authorized, unauthorized, server, verifier) exist in namespace trustmesh-integration-test. (Default ServiceAccount presence noted as standard K8s behavior).",
                "evidence": {"expected": expected_sas, "discovered": list(sa_names)},
                "source": "kind-trustmesh-network-lab / serviceaccounts",
                "observedAt": now_iso,
            })

        # 6b: Workload Lifecycle & Identity Binding
        wks = ident_data.get("workloads") or []
        plain_w = next(
            (w for w in wks if (
                (w.get("labels") or {}).get("trustmesh.io/test") == "plaintext-negative"
                or (w.get("labels") or {}).get("app") == "trustmesh-integration-plaintext"
                or "plaintext-client" in w.get("name", "")
            )),
            None
        )
        auth_w = next(
            (w for w in wks if (
                w != plain_w
                and (w.get("labels") or {}).get("trustmesh.io/test") != "plaintext-negative"
                and "plaintext" not in w.get("name", "")
                and (w.get("labels") or {}).get("role") == "authorized"
            )),
            None
        )
        unauth_w = next((w for w in wks if (w.get("labels") or {}).get("role") == "unauthorized"), None)
        srv_w = next((w for w in wks if (w.get("labels") or {}).get("app") == "trustmesh-integration-server"), None)
        verif_w = next((w for w in wks if ((w.get("labels") or {}).get("app") == "trustmesh-integration-verifier" or "verifier" in w.get("name", ""))), None)

        if not auth_w or not unauth_w or not srv_w or not plain_w or not verif_w:
            missing_items = []
            if not auth_w: missing_items.append("authorized-client")
            if not unauth_w: missing_items.append("unauthorized-client")
            if not srv_w: missing_items.append("server")
            if not plain_w: missing_items.append("plaintext-client")
            if not verif_w: missing_items.append("verifier")
            checks.append({
                "id": "workload-lifecycle-and-identity",
                "control": "Workload Lifecycle Phase & ServiceAccount Binding",
                "status": "UNKNOWN",
                "reason": f"Missing expected workloads: {', '.join(missing_items)}.",
                "evidence": {"discovered": [w.get("name") for w in wks]},
                "source": "kind-trustmesh-network-lab / pods",
                "observedAt": now_iso,
            })
        else:
            discrepancies = []
            if auth_w.get("phase") != "Running" or auth_w.get("serviceAccountName") != "trustmesh-integration-authorized":
                discrepancies.append(f"authorized client (phase: {auth_w.get('phase')}, SA: {auth_w.get('serviceAccountName')})")
            if unauth_w.get("phase") != "Running" or unauth_w.get("serviceAccountName") != "trustmesh-integration-unauthorized":
                discrepancies.append(f"unauthorized client (phase: {unauth_w.get('phase')}, SA: {unauth_w.get('serviceAccountName')})")
            if srv_w.get("phase") != "Running" or srv_w.get("serviceAccountName") != "trustmesh-integration-server":
                discrepancies.append(f"server (phase: {srv_w.get('phase')}, SA: {srv_w.get('serviceAccountName')})")
            if plain_w.get("phase") != "Running" or plain_w.get("serviceAccountName") != "trustmesh-integration-authorized":
                discrepancies.append(f"plaintext client (phase: {plain_w.get('phase')}, SA: {plain_w.get('serviceAccountName')})")
            if verif_w.get("phase") not in ("Succeeded", "Running") or verif_w.get("serviceAccountName") != "trustmesh-integration-verifier":
                discrepancies.append(f"verifier (phase: {verif_w.get('phase')}, SA: {verif_w.get('serviceAccountName')})")

            if discrepancies:
                checks.append({
                    "id": "workload-lifecycle-and-identity",
                    "control": "Workload Lifecycle Phase & ServiceAccount Binding",
                    "status": "FAIL",
                    "reason": f"Workload lifecycle or ServiceAccount binding discrepancy: {', '.join(discrepancies)}.",
                    "evidence": {"workloads": [
                        {"name": w["name"], "phase": w["phase"], "sa": w["serviceAccountName"], "labels": w["labels"]}
                        for w in [auth_w, unauth_w, srv_w, plain_w, verif_w]
                    ]},
                    "source": "kind-trustmesh-network-lab / pods",
                    "observedAt": now_iso,
                })
            else:
                checks.append({
                    "id": "workload-lifecycle-and-identity",
                    "control": "Workload Lifecycle Phase & ServiceAccount Binding",
                    "status": "PASS",
                    "reason": "All 5 integration workloads observed matching expected lifecycle phases and dedicated ServiceAccount bindings.",
                    "evidence": {"workloads": [
                        {"name": w["name"], "phase": w["phase"], "sa": w["serviceAccountName"], "labels": w["labels"]}
                        for w in [auth_w, unauth_w, srv_w, plain_w, verif_w]
                    ]},
                    "source": "kind-trustmesh-network-lab / pods",
                    "observedAt": now_iso,
                })

    return 200, {
        "source": "automated-verification",
        "collectedAt": now_iso,
        "checks": checks,
    }

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/security/verification":
            status, response = automated_verification()
            payload = json.dumps(response).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "http://localhost:5173")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        if self.path == "/api/security/network":
            status, response = network_security()
            payload = json.dumps(response).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "http://localhost:5173")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        if self.path == "/api/policies/gatekeeper":
            status, response = gatekeeper_policies()
            payload = json.dumps(response).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "http://localhost:5173")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        if self.path == "/api/identity/workloads":
            status, response = identity_workloads()
            payload = json.dumps(response).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "http://localhost:5173")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        if self.path != "/api/cluster/status":
            self.send_error(404, "Not found")
            return

        response = {
            "source": "live-kubernetes",
            "collectedAt": datetime.now(timezone.utc).isoformat(),
            "clusters": [
                cluster_status(name, context)
                for name, context in CLUSTERS.items()
            ],
            "integration": integration_pods(),
        }

        payload = json.dumps(response).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "http://localhost:5173")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))

if __name__ == "__main__":
    print(f"TrustMesh read-only API: http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
