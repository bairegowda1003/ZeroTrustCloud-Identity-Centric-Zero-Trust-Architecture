import React from 'react';
import { ShieldCheck, ShieldAlert, Package, CheckCircle2, Lock } from 'lucide-react';
import { SupplyChainSummary } from '../../types/supplyChain';

interface SupplyChainSummaryCardsProps {
  summary: SupplyChainSummary;
  onFilterStatus?: (filter: string) => void;
  activeFilter?: string;
}

export const SupplyChainSummaryCards: React.FC<SupplyChainSummaryCardsProps> = ({
  summary,
  onFilterStatus,
  activeFilter = 'ALL',
}) => {
  return (
    <div className="sc-kpi-unified-console" role="region" aria-label="Supply Chain Security Metrics">
      {/* Flowing Bottom Funnel Wave (Matching Reference Image) */}
      <div className="sc-funnel-wave-wrap" aria-hidden="true">
        <svg className="sc-funnel-wave-svg" viewBox="0 0 1000 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id="scFunnelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
              <stop offset="28%" stopColor="#fb7185" stopOpacity="0.65" />
              <stop offset="65%" stopColor="#e11d48" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="scFunnelStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#f43f5e" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M 0,35 C 90,38 180,86 280,94 C 420,98 560,96 700,105 C 840,112 920,116 1000,118 L 1000,120 L 0,120 Z"
            fill="url(#scFunnelGradient)"
          />
          <path
            d="M 0,35 C 90,38 180,86 280,94 C 420,98 560,96 700,105 C 840,112 920,116 1000,118"
            fill="none"
            stroke="url(#scFunnelStroke)"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* 1. Scanned Images */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('ALL')}
        className={`sc-kpi-segment ${activeFilter === 'ALL' ? 'active-segment' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterStatus?.('ALL');
          }
        }}
        title="Filter all monitored images"
      >
        <div className="sc-kpi-header">
          <span className="sc-kpi-title">Monitored Images</span>
          <div className="sc-kpi-icon-wrap images">
            <Package size={15} />
          </div>
        </div>
        <div className="sc-kpi-val">
          {summary.totalScannedImages} <span className="sc-kpi-unit">OCI Artifacts</span>
        </div>
        <div className="sc-kpi-subtext" style={{ color: '#38bdf8' }}>
          <CheckCircle2 size={13} />
          <span>Aqua Trivy {summary.trivyVersion}</span>
        </div>
      </div>

      {/* 2. Cosign Signature Rate */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('SIGNED')}
        className={`sc-kpi-segment ${activeFilter === 'SIGNED' ? 'active-segment' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterStatus?.('SIGNED');
          }
        }}
        title="Filter verified signed images"
      >
        <div className="sc-kpi-header">
          <span className="sc-kpi-title">Cosign Signatures</span>
          <div className="sc-kpi-icon-wrap signatures">
            <ShieldCheck size={15} />
          </div>
        </div>
        <div className="sc-kpi-val emerald">
          {summary.signedPercentage}% <span className="sc-kpi-unit">({summary.signedImagesCount}/{summary.totalScannedImages} Verified)</span>
        </div>
        <div className="sc-kpi-subtext" style={{ color: '#34d399' }}>
          <Lock size={13} />
          <span>ECDSA P-256 (cosign.pub)</span>
        </div>
      </div>

      {/* 3. Critical CVEs */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('VULNERABLE')}
        className={`sc-kpi-segment ${activeFilter === 'VULNERABLE' ? 'active-segment' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterStatus?.('VULNERABLE');
          }
        }}
        title="Filter vulnerable images"
      >
        <div className="sc-kpi-header">
          <span className="sc-kpi-title">Critical Vulnerabilities</span>
          <div className="sc-kpi-icon-wrap critical">
            <ShieldAlert size={15} />
          </div>
        </div>
        <div className="sc-kpi-val red">
          {summary.criticalCveCount} <span className="sc-kpi-unit" style={{ color: '#f87171' }}>(CVE-2024-21508)</span>
        </div>
        <div className="sc-kpi-subtext" style={{ color: '#f87171' }}>
          <span>Policy: 0 Allowed (FAIL-CLOSED)</span>
        </div>
      </div>

      {/* 4. Gatekeeper Admission Blocked */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('BLOCKED')}
        className={`sc-kpi-segment ${activeFilter === 'BLOCKED' ? 'active-segment' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterStatus?.('BLOCKED');
          }
        }}
        title="Filter blocked admission deployments"
      >
        <div className="sc-kpi-header">
          <span className="sc-kpi-title">Admission Blocked</span>
          <div className="sc-kpi-icon-wrap blocked">
            <Lock size={15} />
          </div>
        </div>
        <div className="sc-kpi-val amber">
          {summary.blockedDeploymentsCount} <span className="sc-kpi-unit">Deployments Denied</span>
        </div>
        <div className="sc-kpi-subtext" style={{ color: '#fbbf24' }}>
          <span>1 Unsigned + 1 Vulnerable</span>
        </div>
      </div>
    </div>
  );
};
