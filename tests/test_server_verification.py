"""Synthetic Kubernetes JSON exercises the production collection and verification path."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

module = importlib.util.spec_from_file_location(
    "staging", Path(__file__).resolve().parents[1] / "trustmesh-server-staging.py"
)
server = importlib.util.module_from_spec(module)
module.loader.exec_module(server)

NS = "trustmesh-integration-test"
PREFIX = "trustmesh-integration-"
DENY = "calico-default-deny-server"
ALLOW = "calico-allow-authorized-server"
STRICT = "istio-workload-strict-mtls"
SIDECAR = "istio-sidecar-injection-posture"
REG = "spire-workload-registration"
COMPONENTS = "spire-control-plane-components"
LIFE = "workload-lifecycle-and-identity"
SCOPE = "gatekeeper-scope-workload-deployments"
WEBHOOK = "gatekeeper-webhook-enforced"
IDS = {DENY, ALLOW, STRICT, SIDECAR, REG, COMPONENTS, LIFE, SCOPE, WEBHOOK,
       "k8s-cluster-readiness-lab", "k8s-cluster-readiness-network-lab",
       "gatekeeper-constraints-inventory", "gatekeeper-enforcement-action-deny",
       "istio-control-plane-ready", "workload-service-accounts"}
DELETE = object()
ABSENT = object()


def resource(name, **fields):
    return {"metadata": {"name": name, "namespace": NS}, **fields}


def selector(**labels):
    return {"matchLabels": labels}


def pod(role):
    account = "authorized" if role == "plaintext" else role
    labels = {"app": PREFIX + role}
    if role in ("authorized", "unauthorized", "plaintext"):
        labels = {"app": PREFIX + "client", "role": account}
    if role == "plaintext":
        labels["trustmesh.io/test"] = "plaintext-negative"
    containers = [{"name": "app"}]
    spec = {"containers": containers, "serviceAccountName": PREFIX + account}
    status = {"phase": "Running", "containerStatuses": [{"name": "app", "ready": True}]}
    if role in ("authorized", "server"):
        spec["initContainers"] = [{"name": "istio-proxy", "restartPolicy": "Always"}]
        status["initContainerStatuses"] = [{"name": "istio-proxy", "ready": True}]
    if role == "unauthorized":
        containers.append({"name": "istio-proxy"})
        status["containerStatuses"].append({"name": "istio-proxy", "ready": True})
    if role == "verifier":
        status.update(phase="Succeeded", containerStatuses=[{"name": "app", "ready": False}])
    result = resource(role + "-fixture", spec=spec, status=status)
    result["metadata"]["labels"] = labels
    return result


def fixture():
    destination = selector(app=PREFIX + "server")
    rule = {"from": [{"podSelector": selector(app=PREFIX + "client", role="authorized")}],
            "ports": [{"port": 8080, "protocol": "TCP"}]}
    registration = resource(PREFIX + "workload-identity", spec={
        "namespaceSelector": selector(**{"kubernetes.io/metadata.name": NS}),
        "podSelector": selector(app=PREFIX + "verifier"),
        "spiffeIDTemplate": "spiffe://{{ .TrustDomain }}/ns/{{.PodMeta.Namespace}}/sa/{{  .PodSpec.ServiceAccountName }}",
    }, status={"stats": {"namespacesSelected": 1, "podsSelected": 2, "entriesToSet": 2,
                         "entryFailures": 0, "podEntryRenderFailures": 0, "entriesMasked": 0}})
    data = {
        "nodes": {"items": [resource("fixture-node", status={"conditions": [{"type": "Ready", "status": "True"}]})]},
        "deployment": resource("istiod", spec={"replicas": 1}, status={"readyReplicas": 1}),
        "namespace": resource(NS),
        "networkpolicies": {"items": [
            resource(PREFIX + "default-deny", spec={"podSelector": copy.deepcopy(destination), "policyTypes": ["Ingress"]}),
            resource(PREFIX + "allow-authorized", spec={"podSelector": copy.deepcopy(destination), "policyTypes": ["Ingress"], "ingress": [rule]}),
        ]},
        "peerauthentications": {"items": [resource(PREFIX + "strict-mtls", spec={"selector": destination, "mtls": {"mode": "STRICT"}})]},
        "pods": {"items": [pod(r) for r in ("authorized", "unauthorized", "server", "plaintext", "verifier")]},
        "serviceaccounts": {"items": [resource(PREFIX + r) for r in ("authorized", "unauthorized", "server", "verifier")]},
        "clusterspiffeids.spire.spiffe.io": registration,
        "trustmesh-spire-server": resource("trustmesh-spire-server", spec={"replicas": 1}, status={"readyReplicas": 1}),
    }
    for name in ("trustmesh-spire-agent", "trustmesh-spire-spiffe-csi-driver"):
        data[name] = resource(name, status={"desiredNumberScheduled": 1, "numberReady": 1})
    for kind, name in zip(server.GATEKEEPER_CONSTRAINT_KINDS,
                          ("trustmesh-container-security", "trustmesh-require-dedicated-sa", "trustmesh-workload-hardening")):
        data[kind] = {"items": [resource(name, kind=kind, spec={"enforcementAction": "deny", "match": {
            "namespaces": ["trustmesh-lab"], "kinds": [{"apiGroups": ["apps"], "kinds": ["Deployment"]}]}},
            status={"byPod": [{"operations": ["webhook"], "enforced": True},
                              {"operations": ["audit"], "enforcementPointsStatus": [{"name": "vap.k8s.io", "state": "error"}]}]})]}
    return data


class VerificationTests(unittest.TestCase):
    def setUp(self):
        self.data = fixture()
        self.commands = []
        mock = patch.object(server.subprocess, "run", side_effect=self.kubectl)
        mock.start()
        self.addCleanup(mock.stop)

    def kubectl(self, command, **kwargs):
        self.commands.append(command)
        self.assertEqual(command[0], "kubectl")
        self.assertIn("--request-timeout=8s", command)
        self.assertEqual(kwargs["timeout"], 12)
        index = command.index("get") + 1
        key = command[index]
        if key in ("daemonset", "statefulset"):
            key = command[index + 1]
        value = self.data[key]
        if isinstance(value, Exception):
            raise value
        if value is ABSENT:
            self.assertIn("--ignore-not-found", command)
        return subprocess.CompletedProcess(command, 0, stdout="" if value is ABSENT else json.dumps(value))

    def results(self):
        code, data = server.automated_verification()
        self.assertEqual(code, 200)
        self.assertEqual(set(data), {"source", "collectedAt", "checks"})
        self.assertEqual(data["source"], "automated-verification")
        self.assertEqual(len(data["checks"]), 15)
        for row in data["checks"]:
            self.assertEqual(set(row), {"id", "control", "reason", "status", "evidence", "source", "observedAt"})
            self.assertEqual(row["observedAt"], data["collectedAt"])
            self.assertTrue(row["reason"] and row["source"])
            self.assertIsInstance(row["evidence"], dict)
        rows = {row["id"]: row for row in data["checks"]}
        self.assertEqual(set(rows), IDS)
        return rows

    def expect(self, check, status):
        row = self.results()[check]
        self.assertEqual(row["status"], status, row)
        return row

    def cases(self, check, root, cases):
        for path, value, outcome in cases:
            with self.subTest(check=check, path=path, value=value, outcome=outcome):
                self.data = fixture()
                target = self.data
                *parents, last = root + path
                for part in parents:
                    target = target[part]
                if value is DELETE:
                    del target[last]
                else:
                    target[last] = value
                self.expect(check, outcome)

    def test_healthy_fixture_contract_and_reasons(self):
        rows = self.results()
        self.assertEqual(len(self.commands), 16)
        self.assertTrue(all(row["status"] == "PASS" for row in rows.values()), rows)
        for check, phrase in ((SCOPE, "include apps/Deployment"), (WEBHOOK, "status.byPod"),
                              (DENY, "contributes no ingress rules"), (ALLOW, "same-namespace"),
                              (STRICT, "PeerAuthentication configures STRICT"), (REG, "SVID issuance"),
                              (SIDECAR, "native initContainers and regular containers"),
                              (LIFE, "expected ServiceAccount bindings"), (COMPONENTS, "positive desired counts")):
            self.assertIn(phrase, rows[check]["reason"])
        self.assertIn("vap.k8s.io", json.dumps(rows[WEBHOOK]["evidence"]))
        self.assertNotIn("does not impair", rows[WEBHOOK]["reason"])
        self.assertNotIn("verifying traffic encryption", rows[STRICT]["reason"])

    def test_public_collectors(self):
        code, net = server.network_security()
        self.assertEqual(code, 200)
        self.assertEqual(set(net["networkPolicies"][1]), {"name", "podSelector", "policyTypes", "ingress", "workloadScoped"})
        self.assertEqual(set(net["peerAuthentications"][0]), {"name", "mode", "selector", "workloadScoped"})
        self.assertEqual(set(net["workloads"][0]), {"name", "phase", "labels", "sidecar"})
        code, identity = server.identity_workloads()
        self.assertEqual(code, 200)
        reg = identity["spireRegistration"]
        self.assertEqual(set(reg), {"name", "spiffeIDTemplate", "namespaceSelector", "podSelector", "statistics", "available", "error"})
        self.assertNotIn("podEntryRenderFailures", reg["statistics"])
        self.assertEqual(set(identity["workloads"][0]), {"name", "phase", "labels", "serviceAccountName", "readyContainers", "totalContainers"})

    def test_gatekeeper_scope(self):
        self.cases(SCOPE, ["k8scontainersecurity", "items", 0, "spec", "match"], [
            (["kinds", 0, "apiGroups"], [""], "FAIL"), (["namespaces"], ["wrong"], "FAIL"),
            (["kinds"], None, "UNKNOWN"), (["kinds", 0, "apiGroups"], "apps", "UNKNOWN")])

    def test_webhook_observations(self):
        self.cases(WEBHOOK, ["k8scontainersecurity", "items", 0, "status"], [
            (["byPod"], DELETE, "UNKNOWN"), (["byPod", 0, "enforced"], DELETE, "UNKNOWN"),
            (["byPod", 0, "enforced"], False, "FAIL"), (["byPod", 0, "enforced"], "true", "UNKNOWN")])

    def test_default_deny(self):
        self.cases(DENY, ["networkpolicies", "items", 0, "spec"], [
            (["ingress"], [], "PASS"), (["policyTypes"], DELETE, "PASS"),
            (["policyTypes"], ["Egress"], "FAIL"), (["ingress"], [{}], "FAIL"),
            (["ingress"], {}, "UNKNOWN"), (["ingress"], [None], "UNKNOWN"),
            (["podSelector"], DELETE, "UNKNOWN"), (["podSelector"], {}, "FAIL"),
            (["podSelector", "matchExpressions"], [{"key": "stage", "operator": "Exists"}], "FAIL")])

    def test_named_resource_and_namespace(self):
        self.cases(DENY, ["networkpolicies"], [
            (["items"], [], "FAIL"), (["items", 0, "metadata", "namespace"], "other", "FAIL"),
            (["items", 0, "metadata", "namespace"], DELETE, "UNKNOWN"),
            (["items"], [{}], "UNKNOWN"), (["items"], DELETE, "UNKNOWN")])

    def test_exact_ingress(self):
        root = ["networkpolicies", "items", 1, "spec", "ingress"]
        rule = self.data["networkpolicies"]["items"][1]["spec"]["ingress"][0]
        self.cases(ALLOW, root[:-1], [(["ingress"], [rule, {}], "FAIL")])
        self.cases(ALLOW, root + [0], [
            (["from"], rule["from"] + [{}], "FAIL"), (["from"], [], "FAIL"),
            (["from", 0, "namespaceSelector"], {}, "FAIL"),
            (["from"], [{"ipBlock": {"cidr": "10.0.0.0/8"}}], "FAIL"),
            (["from", 0, "podSelector", "matchLabels", "role"], "other", "FAIL"),
            (["from", 0, "podSelector", "matchExpressions"], [{"key": "stage", "operator": "Exists"}], "FAIL"),
            (["ports"], [{"port": 8080}, {"port": 80}], "FAIL"),
            (["ports", 0, "endPort"], 8082, "FAIL"), (["ports", 0, "protocol"], DELETE, "PASS"),
            (["ports", 0, "protocol"], "UDP", "FAIL"), (["ports", 0, "port"], 8081, "FAIL"),
            (["from"], True, "UNKNOWN"), (["ports", 0, "port"], None, "UNKNOWN")])

    def test_mtls(self):
        self.cases(STRICT, ["peerauthentications", "items", 0, "spec"], [
            (["selector"], selector(app="other"), "FAIL"), (["mtls", "mode"], "PERMISSIVE", "FAIL"),
            (["portLevelMtls"], {"8080": {"mode": "DISABLE"}}, "FAIL"),
            (["portLevelMtls"], {"8080": {"mode": "STRICT"}}, "PASS"),
            (["portLevelMtls"], [], "UNKNOWN"), (["mtls"], None, "UNKNOWN")])

    def test_sidecars(self):
        self.cases(SIDECAR, ["pods", "items"], [
            ([0, "spec", "initContainers"], DELETE, "FAIL"),
            ([0, "status", "initContainerStatuses", 0, "ready"], False, "FAIL"),
            ([0, "status", "initContainerStatuses"], [], "UNKNOWN"),
            ([0, "status", "initContainerStatuses", 0, "ready"], 1, "UNKNOWN"),
            ([3, "spec", "containers"], [{"name": "app"}, {"name": "istio-proxy"}], "FAIL"),
            ([3, "spec", "containers"], DELETE, "UNKNOWN"), ([3], DELETE, "UNKNOWN")])

    def test_second_replica(self):
        second = copy.deepcopy(self.data["pods"]["items"][2])
        second["metadata"]["name"] += "-replica"
        second["status"]["initContainerStatuses"][0]["ready"] = False
        self.data["pods"]["items"].append(second)
        for check in (SIDECAR, LIFE):
            self.assertIn("-replica", self.expect(check, "FAIL")["reason"])

    def test_component_readiness(self):
        self.cases(COMPONENTS, ["trustmesh-spire-agent", "status"], [
            (["numberReady"], DELETE, "UNKNOWN"), (["desiredNumberScheduled"], DELETE, "UNKNOWN"),
            (["numberReady"], None, "UNKNOWN"), (["numberReady"], True, "UNKNOWN"),
            (["desiredNumberScheduled"], 0, "FAIL"), (["desiredNumberScheduled"], 2, "FAIL")])
        self.cases(COMPONENTS, ["trustmesh-spire-server"], [
            (["spec", "replicas"], DELETE, "PASS"), (["spec"], DELETE, "UNKNOWN"),
            (["spec", "replicas"], None, "UNKNOWN"), (["status", "readyReplicas"], DELETE, "UNKNOWN")])

    def test_registration(self):
        root = ["clusterspiffeids.spire.spiffe.io"]
        self.cases(REG, root + ["spec"], [
            (["namespaceSelector"], selector(namespace="other"), "FAIL"),
            (["podSelector"], selector(app="other"), "FAIL"), (["podSelector"], DELETE, "UNKNOWN"),
            (["podSelector", "matchExpressions"], [{"key": "stage", "operator": "Exists"}], "FAIL"),
            (["spiffeIDTemplate"], "spiffe://{{ .TrustDomain }}/sa/fixed", "FAIL")])
        self.cases(REG, root + ["status"], [
            (["stats"], DELETE, "UNKNOWN"), (["stats", "entryFailures"], DELETE, "UNKNOWN"),
            (["stats", "podEntryRenderFailures"], DELETE, "UNKNOWN"),
            (["stats", "namespacesSelected"], 2, "FAIL"), (["stats", "podsSelected"], 0, "FAIL"),
            (["stats", "entriesToSet"], 0, "FAIL"), (["stats", "entryFailures"], 1, "FAIL"),
            (["stats", "podEntryRenderFailures"], 1, "FAIL"), (["stats", "entriesMasked"], 1, "FAIL"),
            (["stats", "entryFailures"], False, "UNKNOWN")])

    def test_lifecycle(self):
        self.cases(LIFE, ["pods", "items"], [
            ([0, "spec", "serviceAccountName"], "wrong", "FAIL"),
            ([3, "spec", "serviceAccountName"], DELETE, "UNKNOWN"),
            ([1, "status", "phase"], "Pending", "FAIL"),
            ([2, "status", "phase"], DELETE, "UNKNOWN"),
            ([0, "status", "containerStatuses", 0, "ready"], False, "FAIL"),
            ([0, "status", "containerStatuses", 0, "ready"], "true", "UNKNOWN"),
            ([0, "status", "containerStatuses"], [], "UNKNOWN"),
            ([4, "status", "phase"], "Running", "FAIL"),
            ([4, "status", "phase"], "Succeeded", "PASS"), ([4], DELETE, "UNKNOWN")])

    def test_failed_collections_and_confirmed_absence(self):
        for resource_key, checks in (
            ("networkpolicies", [DENY, ALLOW]), ("peerauthentications", [STRICT]),
            ("pods", [SIDECAR, LIFE]), ("k8scontainersecurity", [SCOPE, WEBHOOK]),
            ("clusterspiffeids.spire.spiffe.io", [REG]), ("trustmesh-spire-agent", [COMPONENTS])
        ):
            with self.subTest(resource=resource_key):
                self.data = fixture()
                self.data[resource_key] = subprocess.CalledProcessError(1, "kubectl")
                rows = self.results()
                for check in checks:
                    self.assertEqual(rows[check]["status"], "UNKNOWN", rows[check])
        self.data = fixture()
        self.data["clusterspiffeids.spire.spiffe.io"] = ABSENT
        self.data["trustmesh-spire-agent"] = ABSENT
        for check in (REG, COMPONENTS):
            self.expect(check, "FAIL")


    def test_public_projection_cannot_hide_restrictions_or_failures(self):
        original_net = server.network_security()[1]
        original_reg = server.identity_workloads()[1]["spireRegistration"]
        self.data["networkpolicies"]["items"][1]["spec"]["ingress"][0]["ports"][0]["endPort"] = 8088
        self.data["peerauthentications"]["items"][0]["spec"]["portLevelMtls"] = {"8080": {"mode": "PERMISSIVE"}}
        self.data["clusterspiffeids.spire.spiffe.io"]["status"]["stats"]["podEntryRenderFailures"] = 1
        changed_net = server.network_security()[1]
        for key in ("networkPolicies", "peerAuthentications"):
            self.assertEqual(original_net[key], changed_net[key])
        self.assertEqual(original_reg, server.identity_workloads()[1]["spireRegistration"])
        rows = self.results()
        for check in (ALLOW, STRICT, REG):
            self.assertEqual(rows[check]["status"], "FAIL", rows[check])

    def test_named_get_null_is_malformed(self):
        self.data["clusterspiffeids.spire.spiffe.io"] = None
        self.data["trustmesh-spire-agent"] = None
        for check in (REG, COMPONENTS):
            self.expect(check, "UNKNOWN")

    def test_running_ready_verifier(self):
        verifier = self.data["pods"]["items"][4]
        verifier["status"].update(phase="Running", containerStatuses=[{"name": "app", "ready": True}])
        self.expect(LIFE, "PASS")

