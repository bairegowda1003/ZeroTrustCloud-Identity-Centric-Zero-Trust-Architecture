import React, { useState } from 'react';
import {
  Server,
  KeyRound,
  ShieldCheck,
  Lock,
  ArrowRight,
  Activity,
  CheckCircle2,
  XCircle,
  FileCode,
} from 'lucide-react';

export const TrustConduitHero: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<'authorized' | 'unauthorized' | 'plaintext'>('authorized');

  const getExplanation = () => {
    switch (activeScenario) {
      case 'authorized':
        return {
          title: 'Cryptographic Handshake Validated: Peer Identity Attested & L7 Ingress Authorized',
          description:
            'order-api presents its attested X.509 SVID during the mutual TLS handshake. Envoy verifies the SAN URI against payment-service-authz and admits the session on TLSv1.3 with cipher TLS_AES_256_GCM_SHA384.',
        };
      case 'unauthorized':
        return {
          title: 'Zero-Trust Segmentation Enforced: Caller Excluded by payment-service-authz',
          description:
            'frontend-proxy connects over valid mTLS, but payment-service-authz explicitly restricts ingress to order-api-sa. Envoy immediately returns HTTP 403 RBAC: access denied.',
        };
      case 'plaintext':
        return {
          title: 'PeerAuthentication STRICT Active: Unencrypted Plaintext Dropped by Envoy Data Plane',
          description:
            'legacy-cron attempts unencrypted HTTP on port 8443. Istio PeerAuthentication mode STRICT enforces mutual TLS; the packet sequence lacks a TLS ClientHello and is reset with TCP RST.',
        };
    }
  };

  const explanation = getExplanation();

  return (
    <section className="trust-conduit-container" aria-label="Zero Trust Communication Conduit">
      {/* Header & Scenario Switcher */}
      <div className="conduit-header">
        <div className="conduit-title-group">
          <div className="conduit-badge">
            <Activity size={14} className="pulse-icon" />
            <span>CRYPTOGRAPHIC DATA PLANE</span>
          </div>
          <h2 className="conduit-title">Zero-Trust Service-to-Service Flow</h2>
          <p className="conduit-subtitle">
            Cryptographic trust pipeline: Pod attestation via SPIRE Workload API, short-lived X.509 SVID issuance, and Istio STRICT mutual TLS negotiation.
          </p>
        </div>

        {/* Interactive Scenario Tabs */}
        <div className="conduit-scenario-pills" role="tablist">
          <button
            role="tab"
            aria-selected={activeScenario === 'authorized'}
            className={`conduit-pill ${activeScenario === 'authorized' ? 'active allow' : ''}`}
            onClick={() => setActiveScenario('authorized')}
          >
            <span className="pill-dot allow" />
            <span>Authorized: order-api → payment-service (mTLS 200)</span>
          </button>
          <button
            role="tab"
            aria-selected={activeScenario === 'unauthorized'}
            className={`conduit-pill ${activeScenario === 'unauthorized' ? 'active deny' : ''}`}
            onClick={() => setActiveScenario('unauthorized')}
          >
            <span className="pill-dot deny" />
            <span>Unauthorized: frontend-proxy → payments (RBAC 403)</span>
          </button>
          <button
            role="tab"
            aria-selected={activeScenario === 'plaintext'}
            className={`conduit-pill ${activeScenario === 'plaintext' ? 'active deny' : ''}`}
            onClick={() => setActiveScenario('plaintext')}
          >
            <span className="pill-dot deny" />
            <span>Plaintext TCP Injection (Envoy RST)</span>
          </button>
        </div>
      </div>

      {/* 5-Hop Visual Flow */}
      <div className="conduit-flow-grid">
        {/* Hop 1: Caller Pod */}
        <div className="conduit-node">
          <div className="node-step">01</div>
          <div className="node-icon-box blue">
            <Server size={18} />
          </div>
          <span className="node-label">CALLER WORKLOAD</span>
          <h4 className="node-title">
            {activeScenario === 'authorized' ? 'order-api' : activeScenario === 'unauthorized' ? 'frontend-proxy' : 'legacy-cron'}
          </h4>
          <span className="node-sub">
            ns: {activeScenario === 'authorized' ? 'orders' : activeScenario === 'unauthorized' ? 'web' : 'default'}
          </span>
        </div>

        {/* Connector */}
        <div className="conduit-connector">
          <div className="connector-wire" />
          <ArrowRight size={14} className="wire-arrow" />
        </div>

        {/* Hop 2: SPIFFE CSI Attestor */}
        <div className="conduit-node">
          <div className="node-step">02</div>
          <div className="node-icon-box purple">
            <KeyRound size={18} />
          </div>
          <span className="node-label">SPIRE ATTESTOR</span>
          <h4 className="node-title">Workload API</h4>
          <span className="node-sub">k8s_pod_attestor</span>
        </div>

        {/* Connector */}
        <div className="conduit-connector">
          <div className="connector-wire" />
          <ArrowRight size={14} className="wire-arrow" />
        </div>

        {/* Hop 3: X.509 SVID */}
        <div className="conduit-node">
          <div className="node-step">03</div>
          <div className="node-icon-box amber">
            <FileCode size={18} />
          </div>
          <span className="node-label">SPIFFE IDENTITY</span>
          <h4 className="node-title">X.509 SVID</h4>
          <span className="node-sub">
            {activeScenario === 'plaintext' ? 'Unregistered (Denied)' : 'TTL 3600s (Auto-rotate)'}
          </span>
        </div>

        {/* Connector */}
        <div className="conduit-connector">
          <div className="connector-wire" />
          <ArrowRight size={14} className="wire-arrow" />
        </div>

        {/* Hop 4: Envoy Sidecar mTLS */}
        <div className="conduit-node">
          <div className="node-step">04</div>
          <div className="node-icon-box cyan">
            <Lock size={18} />
          </div>
          <span className="node-label">DATA PLANE</span>
          <h4 className="node-title">Envoy Sidecar</h4>
          <span className="node-sub">
            {activeScenario === 'plaintext' ? 'STRICT Drop (RST)' : 'TLSv1.3 AES-GCM'}
          </span>
        </div>

        {/* Connector */}
        <div className="conduit-connector">
          <div className="connector-wire" />
          <ArrowRight size={14} className="wire-arrow" />
        </div>

        {/* Hop 5: Authorization Policy */}
        <div className={`conduit-node decision-node ${activeScenario === 'authorized' ? 'allow' : 'deny'}`}>
          <div className="node-step">05</div>
          <div className={`node-icon-box ${activeScenario === 'authorized' ? 'green' : 'red'}`}>
            {activeScenario === 'authorized' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          </div>
          <span className="node-label">TARGET INGRESS</span>
          <h4 className="node-title">payment-service</h4>
          <span className="node-sub">
            {activeScenario === 'authorized'
              ? 'ALLOW (HTTP 200)'
              : activeScenario === 'unauthorized'
              ? 'DENY (HTTP 403 RBAC)'
              : 'DROP (TCP Reset)'}
          </span>
        </div>
      </div>

      {/* Dynamic Detail Card based on active scenario */}
      <div className={`conduit-explanation-card ${activeScenario === 'authorized' ? 'allow' : 'deny'}`}>
        <div className="explanation-icon">
          {activeScenario === 'authorized' ? <ShieldCheck size={20} /> : <XCircle size={20} />}
        </div>
        <div className="explanation-body">
          <div className="explanation-heading">{explanation.title}</div>
          <p className="explanation-p">{explanation.description}</p>
        </div>
      </div>
    </section>
  );
};
