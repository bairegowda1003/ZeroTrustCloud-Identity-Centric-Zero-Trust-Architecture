import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CommandCenterHero } from './components/CommandCenterHero';
import { FindingsTable } from './components/FindingsTable';
import { FindingDetailDrawer } from './components/FindingDetailDrawer';
import { ModulePlaceholder } from './components/ModulePlaceholder';
import { IntegrationModal } from './components/IntegrationModal';
import { INITIAL_DEMO_FINDINGS, PLANNED_INTEGRATIONS } from './data/demoFindings';
import { ActiveModule, SecurityFinding, FindingStatus } from './types/security';

type CommandCenterTab = 'overview' | 'findings';

const MODULE_META: Record<string, { title: string; breadcrumb: string; description: string }> = {
  command_center: { title: 'Cloud Security Command Center', breadcrumb: 'ZeroTrustCloud · PRJ-34', description: '' },
  workload_identity: {
    title: 'Workload Identity (SPIRE)',
    breadcrumb: 'Security Modules',
    description: 'SPIFFE/SPIRE workload attestation and cryptographic identity management. Hardware-attested SVIDs replace static credentials across pods.',
  },
  policy_governance: {
    title: 'Policy Governance (OPA)',
    breadcrumb: 'Security Modules',
    description: 'OPA Gatekeeper admission control and Rego constraint templates. Declarative policy enforcement at the Kubernetes API server level.',
  },
  service_mesh: {
    title: 'Service Mesh Trust (Istio)',
    breadcrumb: 'Security Modules',
    description: 'Istio mutual TLS enforcement and Layer-7 AuthorizationPolicy management. Zero plaintext east-west traffic between microservices.',
  },
  supply_chain: {
    title: 'Supply Chain Defense',
    breadcrumb: 'Security Modules',
    description: 'Cosign/Sigstore container image signature verification and Trivy SBOM vulnerability scanning. CI/CD provenance attestation.',
  },
  experiments: {
    title: 'Empirical Experiments (EXP-01–08)',
    breadcrumb: 'Research',
    description: 'Experimental validation framework for zero-trust architecture claims. Latency, compliance, and security metrics under controlled conditions.',
  },
  integrations: {
    title: 'Cluster Integrations',
    breadcrumb: 'Configuration',
    description: 'Cloud provider connections, policy engine integrations, and identity platform federation. Planned AWS EKS, Azure AKS, and more.',
  },
};

const CC_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'findings', label: 'Findings' },
];

export const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ActiveModule>('command_center');
  const [commandCenterTab, setCommandCenterTab] = useState<CommandCenterTab>('overview');
  const [findings, setFindings] = useState<SecurityFinding[]>(INITIAL_DEMO_FINDINGS);
  const [providers] = useState(PLANNED_INTEGRATIONS);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar
        currentModule={currentModule}
        onModuleChange={(mod) => {
          setCurrentModule(mod);
          if (mod === 'command_center') {
            setCommandCenterTab('overview');
          }
          if (mod === 'integrations') {
            setIsIntegrationsModalOpen(true);
          }
        }}
      />

      <div className="main-layout">
        <Header
          title={meta.title}
          breadcrumb={meta.breadcrumb}
          tabs={currentModule === 'command_center' ? CC_TABS : undefined}
          activeTab={commandCenterTab}
          onTabChange={(tab) => setCommandCenterTab(tab as CommandCenterTab)}
          onConnectDataSource={() => setIsIntegrationsModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="content-viewport">
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
              <FindingsTable
                findings={findings}
                onFindingClick={handleFindingClick}
              />
            )
          ) : (
            <ModulePlaceholder
              title={meta.title}
              description={meta.description}
              phase="Phase 2+"
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
