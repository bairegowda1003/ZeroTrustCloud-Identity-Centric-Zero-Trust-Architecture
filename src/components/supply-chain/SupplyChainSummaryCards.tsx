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
          <span className="sc-kpi-title">Monitored Images (Demo)</span>
          <div className="sc-kpi-icon-wrap images">
            <Package size={15} />
          </div>
        </div>
        <div className="sc-kpi-val cyan">
          {summary.totalScannedImages} <span className="sc-kpi-unit">Demo Images</span>
        </div>
        
        {/* Apple iOS Fluid Bar */}
        <div className="sc-fluid-bar-track" aria-hidden="true">
          <div className="sc-fluid-bar-fill cyan" style={{ width: '100%' }}>
            <div className="sc-fluid-shimmer" />
          </div>
        </div>

        <div className="sc-kpi-subtext cyan">
          <CheckCircle2 size={13} />
          <span>Aqua Trivy (Demo Inventory)</span>
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
          <span className="sc-kpi-title">Cosign Signatures (Simulated)</span>
          <div className="sc-kpi-icon-wrap signatures">
            <ShieldCheck size={15} />
          </div>
        </div>
        <div className="sc-kpi-val emerald">
          {summary.signedPercentage}% <span className="sc-kpi-unit">({summary.signedImagesCount}/{summary.totalScannedImages} Simulated)</span>
        </div>

        {/* Apple iOS Fluid Bar (80% Fill) */}
        <div className="sc-fluid-bar-track" aria-hidden="true">
          <div className="sc-fluid-bar-fill emerald" style={{ width: `${summary.signedPercentage}%` }}>
            <div className="sc-fluid-shimmer" />
          </div>
        </div>

        <div className="sc-kpi-subtext emerald">
          <Lock size={13} />
          <span>cosign.pub (Test Key ID)</span>
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
          <span className="sc-kpi-title">Critical Vulnerabilities (Demo)</span>
          <div className="sc-kpi-icon-wrap critical">
            <ShieldAlert size={15} />
          </div>
        </div>
        <div className="sc-kpi-val red">
          {summary.criticalCveCount} <span className="sc-kpi-unit">(Demo CVE-2024-21508)</span>
        </div>

        {/* Apple iOS Fluid Bar (Critical Threshold) */}
        <div className="sc-fluid-bar-track" aria-hidden="true">
          <div className="sc-fluid-bar-fill red" style={{ width: summary.criticalCveCount > 0 ? '30%' : '0%' }}>
            <div className="sc-fluid-shimmer" />
          </div>
        </div>

        <div className="sc-kpi-subtext red">
          <span>Policy: 0 Allowed (Simulated Mode)</span>
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
          <span className="sc-kpi-title">Admission Blocked (Simulated)</span>
          <div className="sc-kpi-icon-wrap blocked">
            <Lock size={15} />
          </div>
        </div>
        <div className="sc-kpi-val amber">
          {summary.blockedDeploymentsCount} <span className="sc-kpi-unit">Simulated Denials</span>
        </div>

        {/* Apple iOS Fluid Bar (Quarantine Threshold) */}
        <div className="sc-fluid-bar-track" aria-hidden="true">
          <div className="sc-fluid-bar-fill amber" style={{ width: summary.blockedDeploymentsCount > 0 ? '55%' : '0%' }}>
            <div className="sc-fluid-shimmer" />
          </div>
        </div>

        <div className="sc-kpi-subtext amber">
          <span>Simulated Gatekeeper Outcomes</span>
        </div>
      </div>

      {/* Specular Ambient Bottom Glass Horizon */}
      <div className="sc-specular-glass-horizon" aria-hidden="true" />
    </div>
  );
};
