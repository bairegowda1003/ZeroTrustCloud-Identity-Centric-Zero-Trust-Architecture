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
      setSyncNotice('Gatekeeper validating webhook verified. 4 constraints synchronized.');
      setTimeout(() => setSyncNotice(null), 4000);
    }, 700);
  };

  return (
    <div className="policy-governance-container">
      {/* 1. Gatekeeper Engine Status Banner */}
      <div className="policy-engine-banner">
        <div className="engine-banner-left">
          <div className="engine-badge">
            <span className="engine-dot" />
            <span>OPA GATEKEEPER v3.15.0</span>
          </div>
          <div className="engine-banner-copy">
            <h1 className="engine-banner-title">Policy-as-Code & Admission Control</h1>
            <p className="engine-banner-subtitle">
              Validating admission webhook enforcement intercepting Kubernetes deployment requests. Rego constraint templates, non-root baselines, and dedicated identity requirements.
            </p>
          </div>
        </div>

        <div className="engine-banner-right">
          <div className="engine-meta-pills">
            <span className="meta-pill">
              <strong>Engine:</strong> {GATEKEEPER_ENGINE_INFO.version}
            </span>
            <span className="meta-pill">
              <strong>Mode:</strong> Enforce & Audit
            </span>
            <span className="meta-pill">
              <strong>Cluster:</strong> {GATEKEEPER_ENGINE_INFO.clusterContext}
            </span>
          </div>

          <button
            className={`sync-engine-btn ${isSyncing ? 'syncing' : ''}`}
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

