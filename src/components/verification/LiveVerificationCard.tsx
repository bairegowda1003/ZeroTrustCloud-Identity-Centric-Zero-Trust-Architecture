import React from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  Network, Layers, Shield, KeyRound, Sailboat, Boxes, CircleDot, ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  LiveSecurityVerificationResponse,
  VerificationCheck,
} from '../../utils/securityVerification';

import type { Observation } from '../../hooks/useCommandSources';

const controlFamilies: Record<string,string> = {
  k8s:'Kubernetes readiness',gatekeeper:'Gatekeeper',calico:'Calico',istio:'Istio',spire:'SPIRE',workload:'Integration workloads',
};

const domainIcons = new Map([
  ['Kubernetes readiness', Boxes], ['Gatekeeper', Shield], ['Calico', Network],
  ['Istio', Sailboat], ['SPIRE', KeyRound], ['Integration workloads', Layers],
]);

export function LiveVerificationCard({ source }: { source: Observation<LiveSecurityVerificationResponse> }) {
  const { data, isLoading, error, staleReason, refresh: fetchVerification } = source;

  const isStale = Boolean(staleReason);
  const checks = data?.checks ?? [];

  const groups=new Map<string,VerificationCheck[]>();
  for(const check of checks){
    const family=controlFamilies[check.id.split('-')[0]] ?? 'Other reported checks';
    const group=groups.get(family) ?? [];
    group.push(check);
    groups.set(family,group);
  }

  const passCount = checks.filter((c) => c.status === 'PASS').length;
  const failCount = checks.filter((c) => c.status === 'FAIL').length;
  const unknownCount = checks.filter((c) => c.status === 'UNKNOWN').length;

  const formatTimestamp = (isoString?: string | null) => {
    if (!isoString) return 'Not reported';
    try {
      const d = new Date(isoString);
      return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="live-verification-card-compact"
      role="region"
      aria-label="Automated Zero Trust Security Verification"
    >
      <div className="compact-card-header">
        <div className="header-left">
          <div className="title-row">
            <span className="live-source-pill verification">
              <ShieldCheck size={12} />
              <span>AUTOMATED VERIFICATION</span>
            </span>
            <h2 className="card-heading">Verification explorer</h2>
          </div>
          <div className="timestamp-row">
            <Clock size={11} className="text-muted" />
            <span className="timestamp-text">
              Collected: <strong>{formatTimestamp(data?.collectedAt)}</strong>
            </span>
            {isStale && (
              <span className="stale-chip-inline" title={staleReason || undefined}>
                <AlertTriangle size={11} />
                <span>{staleReason}</span>
              </span>
            )}
          </div>
        </div>

        <div className="header-actions">
          <button
            className="compact-refresh-btn"
            onClick={() => void fetchVerification()}
            disabled={isLoading}
            title="Re-run read-only verification across Kubernetes clusters"
            aria-label="Refresh automated verification"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Verifying…' : 'Re-verify'}</span>
          </button>
        </div>
      </div>

      {error && !data && (
        <div className="compact-error-box" role="alert">
          <XCircle size={14} />
          <span>Verification unavailable. {error}</span>
          <button onClick={() => void fetchVerification()} className="compact-retry-btn">
            Retry
          </button>
        </div>
      )}

      {isLoading && !data && (
        <div className="compact-loading-box">
          <RefreshCw size={16} className="animate-spin text-cyan-400" />
          <span>Executing automated control checks across KinD clusters…</span>
        </div>
      )}

      {data && (
        <div className="compact-card-body">
          <div className="outcomes-summary-row">
            <div className="outcome-chip pass">
              <CheckCircle2 size={13} />
              <span>{passCount} PASS</span>
            </div>
            <div className="outcome-chip fail">
              <XCircle size={13} />
              <span>{failCount} FAIL</span>
            </div>
            <div className="outcome-chip unknown">
              <HelpCircle size={13} />
              <span>{unknownCount} UNKNOWN</span>
            </div>
            <div className="total-checks-note">
              <span>{isStale && 'Last-known results / '}{checks.length} controls evaluated</span>
            </div>
          </div>
          <div className="tm-verification-groups">
            {Array.from(groups,([name,items])=>{
              const Icon=domainIcons.get(name) ?? CircleDot;
              return <details key={name} open={items.some(c=>c.status!=='PASS') || undefined}>
              <summary className="tm-domain-head"><Icon size={17} aria-hidden="true"/><strong>{name}</strong><span>{items.length} checks</span>
                <span className="tm-group-counts">{(['PASS','FAIL','UNKNOWN'] as const).map(status=><b key={status} data-status={status} data-active={items.some(c=>c.status===status)}>{items.filter(c=>c.status===status).length} {status}</b>)}</span><ChevronRight size={14} className="tm-chevron" aria-hidden="true"/>
              </summary>
              {items.map(chk=>(
                <div key={chk.id} className={`compact-check-item ${chk.status.toLowerCase()}`}>
                  <div className="item-status-icon">
                    {chk.status === 'PASS' && <CheckCircle2 size={13} className="text-emerald-400" />}
                    {chk.status === 'FAIL' && <XCircle size={13} className="text-rose-400" />}
                    {chk.status === 'UNKNOWN' && <HelpCircle size={13} className="text-amber-400" />}
                  </div>
                  <div className="item-text-group">
                    <div className="item-header-line">
                      <span className="item-control-name">{chk.control}</span>
                      <span className={`item-status-pill ${chk.status.toLowerCase()}`}>{chk.status}</span>
                    </div>
                    <div className="item-reason-line">{chk.reason}</div>
                    <details className="tm-check-evidence"><summary>Inspection evidence</summary>
                      <time dateTime={chk.observedAt}>{formatTimestamp(chk.observedAt)}</time>
                      <pre>{JSON.stringify(chk.evidence,null,2)}</pre>
                    </details>
                    <div className="item-source-line">
                      Source: <code>{chk.source}</code>
                    </div>
                  </div>
                </div>
              ))}
            </details>})}
          </div>
        </div>
      )}
    </div>
  );
};
