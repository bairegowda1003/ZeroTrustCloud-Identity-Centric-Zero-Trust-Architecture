import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CommandCenterHero } from './components/CommandCenterHero';
import { FindingsTable } from './components/FindingsTable';
import { FindingDetailDrawer } from './components/FindingDetailDrawer';
import { ModulePlaceholder } from './components/ModulePlaceholder';
import { IntegrationModal } from './components/IntegrationModal';
import { IdentityAccessView } from './components/identity/IdentityAccessView';
import { PolicyGovernanceView } from './components/policies/PolicyGovernanceView';
import { TrustArchitectureView } from './components/mesh/TrustArchitectureView';
import { INITIAL_DEMO_FINDINGS, PLANNED_INTEGRATIONS } from './data/demoFindings';
import { ActiveModule, SecurityFinding, FindingStatus } from './types/security';

type CommandCenterTab = 'overview' | 'findings';

const MODULE_META: Record<string, { title: string; breadcrumb: string; description: string }> = {
  command_center: { title: 'Security Command Center', breadcrumb: 'ZeroTrustCloud · PRJ-34', description: '' },
  workload_identity: {
    title: 'Workload Identity & Access',
    breadcrumb: 'Security Modules',
    description: 'Kubernetes Workload Identity, ServiceAccount token projection, and namespace boundary enforcement.',
  },
  policy_governance: {
    title: 'Policies & Workloads (OPA)',
    breadcrumb: 'Security Modules',
    description: 'OPA Gatekeeper admission control and Rego constraint templates. Declarative policy enforcement at the Kubernetes API server level.',
  },
  service_mesh: {
    title: 'Trust Architecture (Istio)',
    breadcrumb: 'Security Modules',
    description: 'Istio mutual TLS enforcement and Layer-7 AuthorizationPolicy management. Zero plaintext east-west traffic between microservices.',
  },
  supply_chain: {
    title: 'Security Findings',
    breadcrumb: 'Security Modules',
    description: 'Central findings management, vulnerability prioritization, and admission violation auditing.',
  },
  experiments: {
    title: 'Audit & Events',
    breadcrumb: 'Research',
    description: 'Experimental validation framework and continuous audit telemetry under controlled conditions.',
  },
  integrations: {
    title: 'Integrations & Providers',
    breadcrumb: 'Configuration',
    description: 'Cloud provider connections, policy engine integrations, and identity platform federation. Planned AWS EKS, Azure AKS, and more.',
  },
};

export const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ActiveModule>('command_center');
  const [commandCenterTab, setCommandCenterTab] = useState<CommandCenterTab>('overview');
  const [findings, setFindings] = useState<SecurityFinding[]>(INITIAL_DEMO_FINDINGS);
  const [providers] = useState(PLANNED_INTEGRATIONS);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [clusterName, setClusterName] = useState<string>('Local Kubernetes');

  // Theme Management (Light 'morning' / Dark 'night')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'morning' || saved === 'light') return 'light';
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('theme', 'morning');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'night');
      }
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const meta = MODULE_META[currentModule] || MODULE_META.command_center;

  const handleUpdateFindingStatus = (id: string, newStatus: FindingStatus) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
    );
    if (selectedFinding?.id === id) {
      setSelectedFinding((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleFindingClick = (finding: SecurityFinding) => {
    setSelectedFinding(finding);
    setIsDrawerOpen(true);
  };

  const handleNavigateToFinding = (findingId: string) => {
    const target = findings.find((f) => f.id === findingId);
    if (target) {
      setSelectedFinding(target);
      setIsDrawerOpen(true);
    } else {
      setCurrentModule('command_center');
      setCommandCenterTab('findings');
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div className={`trustmesh-app-root ${theme}`}>
      {/* Top Application Header */}
      <Header
        clusterName={clusterName}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSelectCluster={(name) => setClusterName(name)}
        onOpenClusterModal={() => setIsIntegrationsModalOpen(true)}
      />

      {/* Main Body Shell: Sidebar + Content Viewport */}
      <div className="app-body-container">
        <Sidebar
          currentModule={currentModule}
          onModuleChange={(mod) => {
            setCurrentModule(mod);
            if (mod === 'command_center') {
              setCommandCenterTab('overview');
            } else if (mod === 'supply_chain') {
              // Quick jump to findings
              setCurrentModule('command_center');
              setCommandCenterTab('findings');
            } else if (mod === 'integrations') {
              setIsIntegrationsModalOpen(true);
            }
          }}
          unresolvedFindingsCount={findings.filter((f) => f.status !== 'resolved').length}
        />

        <main className="main-content-viewport" role="main">
          {currentModule === 'command_center' ? (
            commandCenterTab === 'overview' ? (
              <CommandCenterHero
                findings={findings}
                onFindingClick={handleFindingClick}
                onStatusChange={handleUpdateFindingStatus}
                onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
                onViewAllFindings={() => setCommandCenterTab('findings')}
              />
            ) : (
              <div className="findings-subview-wrapper">
                <div className="subview-header">
                  <button
                    className="back-to-overview-btn"
                    onClick={() => setCommandCenterTab('overview')}
                  >
                    ← Back to Command Center
                  </button>
                  <h1 className="subview-title">Zero-Trust Security Findings Explorer</h1>
                </div>
                <FindingsTable
                  findings={findings}
                  onFindingClick={handleFindingClick}
                />
              </div>
            )
          ) : currentModule === 'workload_identity' ? (
            <IdentityAccessView onNavigateToFinding={handleNavigateToFinding} />
          ) : currentModule === 'policy_governance' ? (
            <PolicyGovernanceView onNavigateToFinding={handleNavigateToFinding} />
          ) : currentModule === 'service_mesh' ? (
            <TrustArchitectureView onNavigateToFinding={handleNavigateToFinding} />
          ) : (
            <ModulePlaceholder
              title={meta.title}
              description={meta.description}
              phase="Phase 5+"
              onGoHome={() => {
                setCurrentModule('command_center');
                setCommandCenterTab('overview');
              }}
            />
          )}
        </main>
      </div>

      {/* Finding Detail Drawer */}
      <FindingDetailDrawer
        finding={selectedFinding}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onStatusChange={handleUpdateFindingStatus}
      />

      {/* Integration Modal */}
      <IntegrationModal
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
        providers={providers}
      />
    </div>
  );
};

export default App;
