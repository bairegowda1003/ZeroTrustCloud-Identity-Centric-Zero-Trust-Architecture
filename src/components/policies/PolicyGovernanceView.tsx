import React, { useState } from 'react';
import {
  ShieldCheck,
  Sliders,
  Terminal,
  Activity,
  RefreshCw,
  CheckCircle2,
  ListFilter,
  CheckSquare,
  AlertOctagon,
} from 'lucide-react';
import {
  GATEKEEPER_ENGINE_INFO,
  GATEKEEPER_POLICIES,
  ADMISSION_DECISIONS,
  POLICY_AUDIT_VIOLATIONS,
} from '../../data/demoPolicies';
import { GatekeeperPolicyRecord } from '../../types/policy';
import { PolicySummaryCards } from './PolicySummaryCards';
import { PolicyInventoryTable } from './PolicyInventoryTable';
import { PolicyDetailDrawer } from './PolicyDetailDrawer';
import { AdmissionDecisionsFeed } from './AdmissionDecisionsFeed';
import { PolicyAuditViolationsTable } from './PolicyAuditViolationsTable';

interface PolicyGovernanceViewProps {
  onNavigateToFinding?: (findingId: string) => void;
}

export const PolicyGovernanceView: React.FC<PolicyGovernanceViewProps> = ({
  onNavigateToFinding,
}) => {
  const [policies] = useState<GatekeeperPolicyRecord[]>(GATEKEEPER_POLICIES);
  const [decisions] = useState(ADMISSION_DECISIONS);
  const [auditViolations] = useState(POLICY_AUDIT_VIOLATIONS);

  const [activeTab, setActiveTab] = useState<'inventory' | 'decisions' | 'audit'>('inventory');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<GatekeeperPolicyRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleSelectPolicy = (policy: GatekeeperPolicyRecord) => {
    setSelectedPolicy(policy);
    setIsDrawerOpen(true);
  };

  const handleSyncEngine = () => {
    setIsSyncing(true);
    setSyncNotice(null);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncNotice('Standalone evaluation: 4 Gatekeeper constraint templates verified against testbed baseline.');
      setTimeout(() => setSyncNotice(null), 4000);
    }, 700);
  };

  return (
    <div className="policy-governance-container">
      {/* 1. Official Domain Header */}
      <div className="domain-page-header">
        <div className="domain-header-left">
          <div className="domain-title-row">
            <div className="domain-icon-squircle policy" aria-hidden="true">
              <ShieldCheck size={18} />
            </div>
            <h1 className="domain-page-title">Policy-as-Code & Admission Control</h1>
            <span className="domain-live-badge policy">
              <span className="live-pip emerald" />
              OPA Gatekeeper {GATEKEEPER_ENGINE_INFO.version}
            </span>
          </div>
          <div className="domain-meta-subrow">
            <span className="domain-meta-crumb">
              Mode: <strong>Enforce & Audit</strong>
            </span>
            <span className="domain-meta-sep">•</span>
            <span className="domain-meta-crumb">
              Cluster: <strong>{GATEKEEPER_ENGINE_INFO.clusterContext}</strong>
            </span>
            <span className="domain-meta-sep">•</span>
            <span className="domain-meta-crumb">
              Webhook: <strong>Validating Webhook Active (100% Intercept)</strong>
            </span>
          </div>
        </div>

        <div className="domain-header-right">
          <button
            className={`domain-action-btn ${isSyncing ? 'syncing' : ''}`}
            onClick={handleSyncEngine}
            disabled={isSyncing}
            title="Verify Gatekeeper admission webhook status"
          >
            <RefreshCw size={13} className={isSyncing ? 'spin-icon' : ''} />
            <span>{isSyncing ? 'Evaluating Webhook...' : 'Sync Constraints'}</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="sync-notice-banner animate-fade-in">
          <CheckCircle2 size={15} />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* 2. Dynamic KPI Summary Cards */}
      <PolicySummaryCards
        policies={policies}
        decisions={decisions}
        auditViolations={auditViolations}
        activeFilter={activeTab === 'decisions' ? 'blocked' : activeTab === 'audit' ? 'audit' : null}
        onFilterChange={(filter) => {
          if (filter === 'blocked') setActiveTab('decisions');
          else if (filter === 'audit') setActiveTab('audit');
          else setActiveTab('inventory');
        }}
      />

      {/* 3. Navigation View Switcher (Inventory vs Decisions vs Audit) */}
      <div className="policy-subview-nav" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'inventory'}
          className={`subview-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Sliders size={15} />
          <span>Policy Inventory ({policies.length})</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'decisions'}
          className={`subview-tab-btn ${activeTab === 'decisions' ? 'active' : ''}`}
          onClick={() => setActiveTab('decisions')}
        >
          <Activity size={15} />
          <span>Admission Decisions ({decisions.length})</span>
          <span className="tab-counter-badge">{decisions.filter(d => d.decision === 'DENY').length} blocked</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'audit'}
          className={`subview-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <AlertOctagon size={15} />
          <span>Cluster Audit Violations ({auditViolations.length})</span>
        </button>
      </div>

      {/* 4. Active Subview Content */}
      <div className="policy-subview-content">
        {activeTab === 'inventory' && (
          <PolicyInventoryTable
            policies={policies}
            onSelectPolicy={handleSelectPolicy}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        )}

        {activeTab === 'decisions' && (
          <AdmissionDecisionsFeed
            decisions={decisions}
            onNavigateToFinding={onNavigateToFinding}
          />
        )}

        {activeTab === 'audit' && (
          <PolicyAuditViolationsTable
            violations={auditViolations}
            onNavigateToFinding={onNavigateToFinding}
          />
        )}
      </div>

      {/* 5. Policy Detail Drawer (Rego Viewer & Remediation) */}
      <PolicyDetailDrawer
        policy={selectedPolicy}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigateToFinding={onNavigateToFinding}
      />
    </div>
  );
};

