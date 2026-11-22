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
                "labels": {key: labels[key] for key in ("app", "role") if key in labels},
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

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
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
