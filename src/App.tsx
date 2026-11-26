import { DemoNotice } from './components/DemoNotice';
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { TrustMeshLaunch } from './components/TrustMeshLaunch';
import { Sidebar } from './components/Sidebar';
import { CommandCenterHero } from './components/CommandCenterHero';
import { FindingsTable } from './components/FindingsTable';
import { FindingDetailDrawer } from './components/FindingDetailDrawer';
import { EnvironmentIntegrations } from './components/EnvironmentIntegrations';
import { environmentStatus } from './utils/labEvidence';
import { WorkspacePreferences } from './components/WorkspacePreferences';
import { useSource } from './hooks/useCommandSources';
import { requestKubernetesStatus, snapshotAgeReason } from './utils/kubernetesStatus';
import { IdentityAccessView } from './components/identity/IdentityAccessView';
import { PolicyGovernanceView } from './components/policies/PolicyGovernanceView';
import { TrustArchitectureView } from './components/mesh/TrustArchitectureView';
import { savedSupplyChain } from './data/savedSupplyChain';
import { SupplyChainView } from './components/supply-chain/SupplyChainView';
import { SecurityObservabilityView } from './components/observability/SecurityObservabilityView';
import { INITIAL_DEMO_FINDINGS } from './data/demoFindings';
import { ActiveModule, SecurityFinding, FindingStatus } from './types/security';

type CommandCenterTab = 'overview' | 'findings';

export const App: React.FC = () => {
  const [launch, setLaunch] = useState<'open' | 'leaving' | 'closed'>(() => {
    try { return sessionStorage.getItem('trustmesh.launch.entered') === '1' ? 'closed' : 'open'; }
    catch { return 'open'; }
  });
  const entered = useRef(launch === 'closed');
  const focusWorkspace = useRef(false);
  const [currentModule, setCurrentModule] = useState<ActiveModule>('command_center');
  const [commandCenterTab, setCommandCenterTab] = useState<CommandCenterTab>('overview');
  const [findings, setFindings] = useState<SecurityFinding[]>(INITIAL_DEMO_FINDINGS);
  const cluster = useSource(requestKubernetesStatus, snapshotAgeReason);
  const [pinned, setPinned] = useState(false);
  const settings = useRef<HTMLDialogElement>(null);
  const main = useRef<HTMLElement>(null);
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

  function enterWorkspace() {
    if (launch !== 'open') return;
    try { sessionStorage.setItem('trustmesh.launch.entered', '1'); } catch { /* Document state still works. */ }
    entered.current = true;
    focusWorkspace.current = true;
    navigate('command_center');
    setLaunch(matchMedia('(prefers-reduced-motion: reduce)').matches ? 'closed' : 'leaving');
  }

  React.useLayoutEffect(() => {
    if (!focusWorkspace.current) return;
    focusWorkspace.current = false;
    const heading = main.current?.querySelector('h1');
    if (heading) { heading.tabIndex = -1; heading.focus({preventScroll:true}); }
  }, [launch]);

  useEffect(() => {
    if (launch !== 'leaving') return;
    const finish = () => setLaunch('closed');
    const timer = window.setTimeout(finish, 650);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', finish);
    return () => { clearTimeout(timer); media.removeEventListener('change', finish); };
  }, [launch]);

  function navigate(module: ActiveModule) {
    setCurrentModule(module);
    if (module === 'command_center') setCommandCenterTab('overview');
    if (main.current) main.current.scrollTop = 0;
  }

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
    <>
    {launch !== 'closed' && <TrustMeshLaunch leaving={launch === 'leaving'} onEnter={enterWorkspace}/>}
    <div className={`trustmesh-app-root ${theme}`} style={launch === 'open' ? {display:'none'} : undefined}>
      {entered.current && <Header collectedAt={cluster.data?.collectedAt} lastKnown={Boolean(cluster.staleReason)}
        environmentStatus={environmentStatus(cluster)} theme={theme} onToggleTheme={toggleTheme}
        onHome={() => navigate('command_center')} onIntegrations={() => {
          navigate('integrations');
          requestAnimationFrame(() => main.current?.querySelector('h1')?.focus());
        }}/>}

      <div className="app-body-container shell-body">
        <Sidebar currentModule={currentModule} onModuleChange={navigate} pinned={pinned}
          onTogglePinned={() => setPinned(value => !value)} onSettings={() => settings.current?.showModal()}/>

        <main className="main-content-viewport" ref={main}>
          {currentModule === 'command_center' ? (
            commandCenterTab === 'overview' ? (
              <CommandCenterHero
                cluster={cluster}
                onNavigate={navigate}
                onViewAllFindings={() => setCommandCenterTab('findings')}
              />
            ) : (
              <div className="findings-subview-wrapper">
                <DemoNotice>Findings and risk scores are fixtures. Triage is session-only and does not remediate Kubernetes resources.</DemoNotice>
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
            <IdentityAccessView />
          ) : currentModule === 'policy_governance' ? (
            <PolicyGovernanceView onNavigateToFinding={handleNavigateToFinding} />
          ) : currentModule === 'service_mesh' ? (
            <TrustArchitectureView />
          ) : currentModule === 'supply_chain' ? (
            <SupplyChainView records={savedSupplyChain} />
          ) : currentModule === 'experiments' ? (
            <SecurityObservabilityView />
          ) : (
            <EnvironmentIntegrations cluster={cluster} onVerification={() => navigate('experiments')}/>
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

      <WorkspacePreferences onReplay={() => { settings.current?.close(); setLaunch('open'); }}
        dialog={settings} theme={theme} setTheme={setTheme} pinned={pinned} setPinned={setPinned} cluster={cluster}/>
    </div>
    </>
  );
};

export default App;
