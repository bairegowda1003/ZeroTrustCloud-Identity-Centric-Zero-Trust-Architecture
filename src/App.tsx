import React, { useState } from 'react';
import { Header, CommandCenterTab } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CommandCenter } from './components/CommandCenter';
import { ModulePlaceholder } from './components/ModulePlaceholder';
import { IntegrationModal } from './components/IntegrationModal';
import { INITIAL_DEMO_FINDINGS, PLANNED_INTEGRATIONS } from './data/demoFindings';
import { ActiveModule, SecurityFinding, FindingStatus } from './types/security';

export const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ActiveModule>('command_center');
  const [commandCenterTab, setCommandCenterTab] = useState<CommandCenterTab>('overview');
  const [findings, setFindings] = useState<SecurityFinding[]>(INITIAL_DEMO_FINDINGS);
  const [providers] = useState(PLANNED_INTEGRATIONS);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);

  const getModuleTitle = (mod: ActiveModule): string => {
    switch (mod) {
      case 'command_center':
        return 'Security Command Center';
      case 'workload_identity':
        return 'Workload Identity (SPIRE)';
      case 'policy_governance':
        return 'Policy Governance (OPA)';
      case 'service_mesh':
        return 'Service Mesh Trust (Istio)';
      case 'supply_chain':
        return 'Supply Chain Defense';
      case 'experiments':
        return 'Empirical Experiments (EXP-01–08)';
      case 'integrations':
        return 'Cluster Integrations';
    }
  };

  const handleUpdateFindingStatus = (id: string, newStatus: FindingStatus) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
    );
  };

  return (
    <div className="app-container">
      <Sidebar
        currentModule={currentModule}
        onSelectModule={(mod) => {
          setCurrentModule(mod);
          if (mod === 'command_center') {
            setCommandCenterTab('overview');
          }
        }}
        findingsCount={findings.length}
      />

      <div className="main-layout">
        <Header
          activeModuleTitle={getModuleTitle(currentModule)}
          activeTab={commandCenterTab}
          onTabChange={setCommandCenterTab}
          findingsCount={findings.length}
          providers={providers}
          onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
          isCommandCenterActive={currentModule === 'command_center'}
        />

        <main className="content-viewport">
          {currentModule === 'command_center' ? (
            <CommandCenter
              findings={findings}
              onUpdateFindingStatus={handleUpdateFindingStatus}
              onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
              activeTab={commandCenterTab}
              onTabChange={setCommandCenterTab}
            />
          ) : (
            <ModulePlaceholder
              module={currentModule}
              onNavigateHome={() => {
                setCurrentModule('command_center');
                setCommandCenterTab('overview');
              }}
            />
          )}
        </main>
      </div>

      <IntegrationModal
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
        providers={providers}
      />
    </div>
  );
};

export default App;
