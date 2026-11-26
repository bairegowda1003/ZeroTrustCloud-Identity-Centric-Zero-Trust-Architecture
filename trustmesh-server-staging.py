import json
import re
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
    if "--ignore-not-found" in args and not result.stdout.strip():
        return None
    resource = json.loads(result.stdout)
    if resource is None and "--ignore-not-found" in args:
        raise ValueError("Invalid null resource in named GET")
    return resource

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


def identity_workloads(observations=None):
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
        if observations is not None:
            observations["identityPods"] = pods
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
            "trustmesh-integration-workload-identity", "--ignore-not-found",
        )
        if observations is not None:
            observations["registration"] = resource
        if resource is None:
            raise ValueError("Registration absent")
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
                "get", component["kind"].lower(), component["name"], "--ignore-not-found",
            )
            if observations is not None:
                observations[component["name"]] = resource
            if resource is None:
                raise ValueError("Controller absent")
            status = resource.get("status", {})
            if component["kind"] == "StatefulSet":
                spec = field(resource, "spec", dict)
                desired = spec.get("replicas", 1)
            else:
                desired = status.get("desiredNumberScheduled")
            ready = status.get("readyReplicas" if component["kind"] == "StatefulSet"
                               else "numberReady")
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

def gatekeeper_policies(observations=None):
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

    if observations is not None:
        observations["constraints"] = raw_items
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
            incomplete_operations = False
            for pod_entry in by_pod:
                if not isinstance(pod_entry, dict):
                    incomplete_operations = True
                    continue

                ops = pod_entry.get("operations")
                is_webhook = False
                if isinstance(ops, list) and all(isinstance(op, str) for op in ops) and "webhook" in ops:
                    is_webhook = True
                elif isinstance(ops, str) and ops == "webhook":
                    is_webhook = True
                elif pod_entry.get("operation") == "webhook":
                    is_webhook = True

                if is_webhook:
                    webhook_entries.append(pod_entry.get("enforced"))
                elif not (isinstance(ops, str) or isinstance(pod_entry.get("operation"), str)
                          or isinstance(ops, list) and all(isinstance(op, str) for op in ops)):
                    incomplete_operations = True

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

            if any(flag is False for flag in webhook_entries):
                webhook_enforced = False
            elif webhook_entries and not incomplete_operations and all(flag is True for flag in webhook_entries):
                webhook_enforced = True

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

def network_security(observations=None):
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
        if observations is not None:
            observations["networkPods"] = raw_pods
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
        if observations is not None:
            observations["peerAuthentications"] = raw_pa
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
        if observations is not None:
            observations["networkPolicies"] = raw_np
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


class ConfigurationMismatch(Exception):
    """Usable observations contradict the expected configuration."""


def require(condition, message):
    if not condition:
        raise ConfigurationMismatch(message)


def field(obj, key, kind):
    value = obj.get(key)
    if type(value) is not kind or (kind is str and not value):
        raise ValueError(f"missing or invalid {key}")
    return value


def objects(entries):
    if not isinstance(entries, list) or any(not isinstance(x, dict) for x in entries):
        raise ValueError("expected a list of objects")
    return entries


def strings(values):
    if not isinstance(values, list) or any(not isinstance(x, str) for x in values):
        raise ValueError("expected a list of strings")
    return values


def named_item(items, name):
    matches = [item for item in objects(items) if field(item["metadata"], "name", str) == name]
    require(matches, f"{name} is absent from the collected inventory.")
    if len(matches) != 1:
        raise ValueError(f"ambiguous inventory for {name}")
    return matches[0]


def selector_matches(selector, labels):
    observed = selector.get("matchLabels", {})
    if not isinstance(observed, dict) or any(type(v) is not str for v in observed.values()):
        raise ValueError("invalid selector labels")
    expressions = objects(selector.get("matchExpressions", []))
    for entry in expressions:
        field(entry, "key", str)
        operator = field(entry, "operator", str)
        values = strings(entry.get("values", []))
        if operator not in ("In", "NotIn", "Exists", "DoesNotExist") or bool(values) != (operator in ("In", "NotIn")):
            raise ValueError("invalid selector expression")
    return observed == labels and not expressions and selector.keys() <= {"matchLabels", "matchExpressions"}


def constraint_scope(evidence, observations, names):
    for name in names:
        match = field(named_item(observations["constraints"], name)["spec"], "match", dict)
        evidence[name] = match
        namespaces = strings(match["namespaces"])
        kinds = [(strings(entry["apiGroups"]), strings(entry["kinds"]))
                 for entry in objects(match["kinds"])]
        require("trustmesh-lab" in namespaces and any(
            "apps" in groups and "Deployment" in resources for groups, resources in kinds
        ), f"{name} lacks the expected apps/Deployment or trustmesh-lab match.")
    return "All three constraint match configurations include apps/Deployment and trustmesh-lab."


def webhook_status(evidence, names, summaries):
    reported = {name: summaries.get(name, {}).get("webhookEnforced") for name in names}
    evidence["webhookEnforced"] = reported
    evidence["enforcementPoints"] = {n: summaries[n]["enforcementPoints"] for n in names if n in summaries}
    for name, flag in reported.items():
        require(flag is not False, f"{name} reports enforced=false for a webhook operation.")
    incomplete = [name for name, flag in reported.items() if flag is not True]
    if incomplete:
        raise ValueError("incomplete webhook status for " + ", ".join(incomplete))
    return "All three constraints report enforced=true for webhook operations in status.byPod. Enforcement-point diagnostics are recorded separately."


SERVER_LABEL = {"app": "trustmesh-integration-server"}
CLIENT_LABELS = {"app": "trustmesh-integration-client", "role": "authorized"}


def scoped_spec(evidence, observations, inventory, name):
    item = named_item(observations[inventory], name)
    namespace = field(item["metadata"], "namespace", str)
    spec = field(item, "spec", dict)
    evidence.update(name=name, namespace=namespace, spec=spec)
    require(namespace == NETWORK_NAMESPACE, f"{name} has an unexpected namespace.")
    return spec


def network_policy(evidence, observations, suffix):
    name = "trustmesh-integration-" + suffix
    spec = scoped_spec(evidence, observations, "networkPolicies", name)
    require(selector_matches(field(spec, "podSelector", dict), SERVER_LABEL),
            f"{name} has an unexpected destination selector.")
    # When policyTypes is omitted Kubernetes always includes Ingress.
    types = strings(spec.get("policyTypes", [])) or ["Ingress"]
    if any(t not in ("Ingress", "Egress") for t in types):
        raise ValueError("invalid policyTypes")
    require("Ingress" in types, f"{name} does not specify ingress isolation.")
    rules = objects(spec.get("ingress", []))
    for rule in rules:
        if rule.keys() - {"from", "ports"}:
            raise ValueError("unrecognized ingress rule fields")
        objects(rule.get("from", []))
        objects(rule.get("ports", []))
    if suffix == "default-deny":
        require(not rules, f"{name} contributes ingress allowances.")
        return f"{name} selects the integration server for ingress isolation and contributes no ingress rules. Other policies can add allowances."
    require(len(rules) == 1, f"{name} must contain exactly one ingress rule.")
    peers = objects(rules[0].get("from", []))
    ports = objects(rules[0].get("ports", []))
    require(len(peers) == 1 and set(peers[0]) == {"podSelector"},
            f"{name} lacks exactly one same-namespace Pod peer.")
    require(selector_matches(field(peers[0], "podSelector", dict), CLIENT_LABELS),
            f"{name} has an unexpected client selector.")
    require(len(ports) == 1, f"{name} has an unexpected number of ports.")
    port = ports[0]
    if (port.keys() - {"port", "endPort", "protocol"}
            or "port" in port and type(port["port"]) not in (int, str)
            or type(port.get("protocol", "TCP")) is not str
            or "endPort" in port and type(port["endPort"]) is not int):
        raise ValueError("malformed NetworkPolicy port")
    require(port.get("port") == 8080 and port.get("protocol", "TCP") == "TCP" and "endPort" not in port,
            f"{name} differs from the single TCP 8080 allowance.")
    return f"{name} contains one same-namespace authorized-client label allowance on TCP 8080 for the integration server. Effective connectivity depends on the combined policies and dataplane."


def strict_mtls(evidence, observations):
    spec = scoped_spec(evidence, observations, "peerAuthentications", "trustmesh-integration-strict-mtls")
    require(selector_matches(field(spec, "selector", dict), SERVER_LABEL), "Unexpected integration-server selector.")
    mode = field(spec["mtls"], "mode", str)
    if mode not in ("UNSET", "DISABLE", "PERMISSIVE", "STRICT"):
        raise ValueError("invalid workload mTLS mode")
    require(mode == "STRICT", "The workload mTLS mode differs from STRICT.")
    overrides = spec.get("portLevelMtls", {})
    if not isinstance(overrides, dict):
        raise ValueError("invalid portLevelMtls")
    for port, setting in overrides.items():
        if not port.isdecimal() or not 0 < int(port) <= 65535 or not isinstance(setting, dict):
            raise ValueError("invalid port-level override")
        mode = setting.get("mode", "UNSET")
        if mode not in ("STRICT", "UNSET", "PERMISSIVE", "DISABLE"):
            raise ValueError("invalid port-level mode")
        require(mode in ("STRICT", "UNSET"), f"Port {port} overrides workload STRICT mode with {mode}.")
    return "PeerAuthentication configures STRICT mTLS for the selected integration-server workload. Live handshakes and namespace-wide encryption are outside this check."


def count(obj, key):
    value = field(obj, key, int)
    if value < 0:
        raise ValueError(f"negative {key}")
    return value


def component_readiness(evidence, observations):
    components = evidence["components"] = {}
    incomplete = []
    for name in ("trustmesh-spire-server", "trustmesh-spire-agent", "trustmesh-spire-spiffe-csi-driver"):
        try:
            item = observations[name]
            require(item is not None, f"{name} was confirmed absent.")
            if field(item["metadata"], "name", str) != name:
                raise ValueError("unexpected resource in named GET")
            status = field(item, "status", dict)
            if name == "trustmesh-spire-server":
                # A present StatefulSet spec defaults omitted replicas to one.
                spec = field(item, "spec", dict)
                desired = count(spec, "replicas") if "replicas" in spec else 1
                ready_key = "readyReplicas"
            else:
                desired = count(status, "desiredNumberScheduled")
                ready_key = "numberReady"
            components[name] = {"desired": desired, "ready": status.get(ready_key)}
            require(desired > 0, f"{name} has zero desired replicas.")
            ready = count(status, ready_key)
            require(ready >= desired, f"{name} reports {ready}/{desired} ready replicas.")
        except (ValueError, KeyError, TypeError, AttributeError):
            incomplete.append(name)
    if incomplete:
        raise ValueError("missing or invalid readiness for " + ", ".join(incomplete))
    return "All three expected SPIRE controllers report ready replicas meeting their positive desired counts."


def registration_posture(evidence, observations):
    item = observations["registration"]
    require(item is not None, "The expected ClusterSPIFFEID was confirmed absent.")
    name = field(item["metadata"], "name", str)
    spec = field(item, "spec", dict)
    evidence.update(name=name, namespaceSelector=spec.get("namespaceSelector"), podSelector=spec.get("podSelector"),
                    spiffeIDTemplate=spec.get("spiffeIDTemplate"), statistics=item.get("status", {}).get("stats"))
    require(name == "trustmesh-integration-workload-identity", "Unexpected ClusterSPIFFEID name.")
    for key, labels in (("namespaceSelector", {"kubernetes.io/metadata.name": IDENTITY_NAMESPACE}),
                        ("podSelector", {"app": "trustmesh-integration-verifier"})):
        require(selector_matches(field(spec, key, dict), labels), f"Unexpected ClusterSPIFFEID {key}.")
    template = field(spec, "spiffeIDTemplate", str)
    expected = r"spiffe://{{\s*\.TrustDomain\s*}}/ns/{{\s*\.PodMeta\.Namespace\s*}}/sa/{{\s*\.PodSpec\.ServiceAccountName\s*}}"
    require(re.fullmatch(expected, template), "Unexpected ClusterSPIFFEID identity template.")
    stats = field(item["status"], "stats", dict)
    for key in ("namespacesSelected", "podsSelected", "entriesToSet", "entryFailures", "podEntryRenderFailures", "entriesMasked"):
        value = count(stats, key)
        if key in ("podsSelected", "entriesToSet"):
            require(value > 0, f"Registration reports {key}=0.")
        elif key == "namespacesSelected":
            require(value == 1, f"Registration reports namespacesSelected={value}.")
        else:
            require(value == 0, f"Registration reports {key}={value}.")
    return "The ClusterSPIFFEID selects the integration verifier with the expected ServiceAccount identity template and reports selected workloads and entries without failures or masking. Current SVID issuance and validity require separate evidence."


def pod_role(name, labels):
    app = labels.get("app")
    if (labels.get("trustmesh.io/test") == "plaintext-negative"
            or app == "trustmesh-integration-plaintext" or "plaintext-client" in name):
        return "plaintext"
    if app == SERVER_LABEL["app"]:
        return "server"
    if app == "trustmesh-integration-verifier" or "verifier" in name:
        return "verifier"
    if labels.get("role") in ("authorized", "unauthorized"):
        return labels["role"]
    if app == "trustmesh-integration-client":
        raise ValueError(f"unrecognized client role for {name}")
    return None


def named_containers(entries):
    result = {}
    for entry in objects(entries):
        name = field(entry, "name", str)
        if name in result:
            raise ValueError(f"duplicate container {name}")
        result[name] = entry
    return result


def pod_containers(pod):
    spec = field(pod, "spec", dict)
    regular = named_containers(spec["containers"])
    init = named_containers(spec.get("initContainers", []))
    if not regular or regular.keys() & init.keys():
        raise ValueError("empty or ambiguous container spec")
    return regular, init


def reported_ready(status, group, names):
    observed = named_containers(status[group])
    return {name: field(observed[name], "ready", bool) for name in names}


def sidecar_posture(pod, role, row):
    regular, init = pod_containers(pod)
    proxy = "istio-proxy"
    present = proxy in regular or proxy in init
    row["present"] = present
    if role == "plaintext":
        require(not present, "plaintext Pod unexpectedly contains istio-proxy")
        return
    require(present, "missing istio-proxy")
    native = proxy in init
    row.update(location="initContainers" if native else "containers", nativeSidecar=False)
    if native:
        require(init[proxy].get("restartPolicy") == "Always", "istio-proxy init container is not a restartable sidecar")
        row["nativeSidecar"] = True
    group = "initContainerStatuses" if native else "containerStatuses"
    row["ready"] = reported_ready(pod["status"], group, [proxy])[proxy]
    require(row["ready"], "istio-proxy reports unready")


def lifecycle_posture(pod, role, row):
    expected_account = "trustmesh-integration-" + ("authorized" if role == "plaintext" else role)
    row["sa"] = field(pod["spec"], "serviceAccountName", str)
    require(row["sa"] == expected_account, f"expected ServiceAccount {expected_account}")
    phase = row["phase"] = field(pod["status"], "phase", str)
    if phase not in ("Running", "Succeeded", "Pending", "Failed"):
        raise ValueError(f"unusable Pod phase {phase}")
    if role == "verifier" and phase == "Succeeded":
        return
    require(phase == "Running", f"unexpected phase {phase}")
    regular, init = pod_containers(pod)
    ready = reported_ready(pod["status"], "containerStatuses", regular)
    native = [name for name, entry in init.items() if entry.get("restartPolicy") == "Always"]
    if native:
        ready.update(reported_ready(pod["status"], "initContainerStatuses", native))
    row["readiness"] = ready
    require(all(ready.values()), "Running Pod reports unready containers")


def workload_posture(evidence, observations, sidecars):
    roles = {"authorized", "unauthorized", "server", "plaintext"}
    if not sidecars:
        roles.add("verifier")
    seen = set()
    locations = set()
    incomplete = []
    rows = evidence["workloads"] = []
    for pod in objects(observations["networkPods" if sidecars else "identityPods"]):
        name = "unidentified Pod"
        try:
            name = field(pod["metadata"], "name", str)
            labels = field(pod["metadata"], "labels", dict)
            role = pod_role(name, labels)
            if role not in roles:
                continue
            seen.add(role)
            row = {"name": name, "role": role}
            rows.append(row)
            if sidecars:
                sidecar_posture(pod, role, row)
                if row["present"]:
                    locations.add("native initContainers" if row["nativeSidecar"] else "regular containers")
            else:
                lifecycle_posture(pod, role, row)
        except ConfigurationMismatch as error:
            raise ConfigurationMismatch(f"{name}: {error}.") from error
        except (ValueError, KeyError, TypeError, AttributeError) as error:
            incomplete.append(f"{name}: {error}")
    incomplete.extend("missing role " + role for role in sorted(roles - seen))
    if incomplete:
        raise ValueError(", ".join(incomplete))
    if sidecars:
        return ("All observed authorized-client, unauthorized-client and server Pods report ready Istio sidecars in "
                + " and ".join(sorted(locations)) + ". All observed plaintext clients omit istio-proxy.")
    return ("All observed Pods for the five roles have expected ServiceAccount bindings and lifecycle phases. "
            "Running Pods report ready containers. A Succeeded verifier requires no current container readiness.")


def automated_verification():
    now_iso = datetime.now(timezone.utc).isoformat()
    checks = []
    # Request-local raw observations retain fields deliberately omitted by the public inventory views.
    observations = {}

    def record(check_id, control, source, evaluate, *args):
        evidence = {}
        try:
            reason = evaluate(evidence, *args)
            status = "PASS"
        except ConfigurationMismatch as error:
            status, reason = "FAIL", str(error)
        except (ValueError, KeyError, TypeError, AttributeError) as error:
            status, reason = "UNKNOWN", f"Incomplete or unusable observation: {error}"
        checks.append({"id": check_id, "control": control, "source": source,
                       "status": status, "reason": reason, "evidence": evidence,
                       "observedAt": now_iso})

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
        gk_status, gk_data = gatekeeper_policies(observations)
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

        record("gatekeeper-scope-workload-deployments", "Gatekeeper Target Scope (apps/Deployment in trustmesh-lab)",
               "kind-trustmesh-lab / gatekeeper spec.match", constraint_scope, observations, expected_constraints)
        record("gatekeeper-webhook-enforced", "Gatekeeper Webhook Enforcement Posture",
               "kind-trustmesh-lab / gatekeeper status.byPod", webhook_status, expected_constraints, c_map)

    # 3 & 4. NETWORK & MESH SECURITY
    try:
        net_status, net_data = network_security(observations)
    except Exception as e:
        net_status, net_data = 503, {"available": False, "error": str(e)}

    network_source = NETWORK_CONTEXT + " / "
    for check_id, title, name in (
        ("calico-default-deny-server", "Calico Default-Deny Ingress Policy for Server Workloads", "default-deny"),
        ("calico-allow-authorized-server", "Calico Ingress Allowance for Authorized Client", "allow-authorized"),
    ):
        record(check_id, title, network_source + "networkpolicies", network_policy, observations, name)

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

    record("istio-workload-strict-mtls", "Istio Workload-Scoped STRICT mTLS Policy",
           network_source + "peerauthentications", strict_mtls, observations)
    record("istio-sidecar-injection-posture", "Istio Sidecar Injection Posture (Workload Inspection)",
           network_source + "pods", workload_posture, observations, True)

    # 5 & 6. SPIRE & IDENTITY WORKLOADS
    try:
        ident_status, ident_data = identity_workloads(observations)
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
        record("spire-control-plane-components", "SPIRE Control Plane & Node Attestation Components",
               network_source + SPIRE_NAMESPACE, component_readiness, observations)
        record("spire-workload-registration", "SPIRE Workload Identity Registration (ClusterSPIFFEID)",
               network_source + "clusterspiffeids.spire.spiffe.io", registration_posture, observations)

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

        record("workload-lifecycle-and-identity", "Workload Lifecycle Phase & ServiceAccount Binding",
               network_source + "pods", workload_posture, observations, False)

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
