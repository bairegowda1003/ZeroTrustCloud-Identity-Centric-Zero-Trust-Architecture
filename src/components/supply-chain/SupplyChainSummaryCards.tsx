import React from 'react';
import { ShieldCheck, ShieldAlert, Package, CheckCircle2, Lock } from 'lucide-react';
import { SupplyChainSummary } from '../../types/supplyChain';

interface SupplyChainSummaryCardsProps {
  summary: SupplyChainSummary;
  onFilterStatus?: (filter: string) => void;
}

export const SupplyChainSummaryCards: React.FC<SupplyChainSummaryCardsProps> = ({
  summary,
  onFilterStatus
}) => {
  return (
    <div className="sc-kpi-grid">
      {/* 1. Scanned Images */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('ALL')}
        className="sc-kpi-card"
      >
        <div className="sc-kpi-header">
          <span className="sc-kpi-title">Monitored Images</span>
          <div className="sc-kpi-icon-wrap images">
            <Package size={16} />
          </div>
        </div>
        <div className="sc-kpi-val">
          {summary.totalScannedImages} <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary, #64748b)', fontWeight: 500 }}>OCI Artifacts</span>
        </div>
        <div className="sc-kpi-subtext" style={{ color: '#38bdf8' }}>
          <CheckCircle2 size={13} />
          <span>Aqua Trivy {summary.trivyVersion}</span>
        </div>
      </div>

      {/* 2. Cosign Signature Rate */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('SIGNED')}
        className="sc-kpi-card"
      >
        <div className="sc-kpi-header">
          <span className="sc-kpi-title">Cosign Signatures</span>
          <div className="sc-kpi-icon-wrap signatures">
            <ShieldCheck size={16} />
          </div>
        </div>
        <div className="sc-kpi-val emerald">
          {summary.signedPercentage}% <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary, #64748b)', fontWeight: 500 }}>({summary.signedImagesCount}/{summary.totalScannedImages} Verified)</span>
        </div>
        <div className="sc-kpi-subtext" style={{ color: '#34d399' }}>
          <Lock size={13} />
          <span>ECDSA P-256 (cosign.pub)</span>
        </div>
      </div>

      {/* 3. Critical CVEs */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('VULNERABLE')}
        className="sc-kpi-card"
      >
        <div className="sc-kpi-header">
          <span className="sc-kpi-title">Critical Vulnerabilities</span>
          <div className="sc-kpi-icon-wrap critical">
            <ShieldAlert size={16} />
          </div>
        </div>
        <div className="sc-kpi-val red">
          {summary.criticalCveCount} <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 500 }}>(CVE-2024-21508)</span>
        </div>
        <div className="sc-kpi-subtext" style={{ color: '#f87171' }}>
          <span>Policy: 0 Allowed (FAIL-CLOSED)</span>
        </div>
      </div>

      {/* 4. Gatekeeper Admission Blocked */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('BLOCKED')}
        className="sc-kpi-card"
      >
        <div className="sc-kpi-header">
          <span className="sc-kpi-title">Admission Blocked</span>
          <div className="sc-kpi-icon-wrap blocked">
            <Lock size={16} />
          </div>
        </div>
        <div className="sc-kpi-val amber">
          {summary.blockedDeploymentsCount} <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary, #64748b)', fontWeight: 500 }}>Deployments Denied</span>
        </div>
        <div className="sc-kpi-subtext" style={{ color: '#fbbf24' }}>
          <span>1 Unsigned + 1 Vulnerable</span>
        </div>
      </div>
    </div>
  );
};
