import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, ChevronDown, Layers, Check, ExternalLink, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  clusterName?: string;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenClusterModal?: () => void;
  onSelectCluster?: (clusterName: string) => void;
}

interface ClusterOption {
  id: string;
  name: string;
  context: string;
  status: 'active' | 'planned';
  details: string;
  badge: string;
}

const CLUSTERS: ClusterOption[] = [
  {
    id: 'local_k8s',
    name: 'Local Kubernetes',
    context: 'kind-trustmesh-lab',
    status: 'active',
    details: '12 Workloads · 6 Services Attested',
    badge: 'ACTIVE',
  },
  {
    id: 'aws_eks',
    name: 'AWS EKS Sandbox',
    context: 'eks-us-east-1 · PRJ-34',
    status: 'planned',
    details: 'Phase 2 Cloud Telemetry Integration',
    badge: 'PLANNED',
  },
  {
    id: 'azure_aks',
    name: 'Azure AKS Cluster',
    context: 'aks-central-us · PRJ-34',
    status: 'planned',
    details: 'Phase 3 Multi-Cloud Federation',
    badge: 'PLANNED',
  },
];

export const Header: React.FC<HeaderProps> = ({
  clusterName = 'Local Kubernetes',
  theme = 'dark',
  onToggleTheme,
  onOpenClusterModal,
  onSelectCluster,
}) => {
  const [isClusterMenuOpen, setIsClusterMenuOpen] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const clusterMenuRef = useRef<HTMLDivElement>(null);

  // Apple iPhone Dynamic Island Opening Sequence
  // Dwells in compact camera cutout state, then fluidly expands in slow-motion spring
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIslandExpanded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Close cluster menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clusterMenuRef.current && !clusterMenuRef.current.contains(e.target as Node)) {
        setIsClusterMenuOpen(false);
      }
    };
    if (isClusterMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClusterMenuOpen]);

  return (
    <header className="master-app-header-container" role="banner">
      {/* Apple iPhone Dynamic Island Morphing Shell */}
      <div
        className={`apple-dynamic-island ${
          isIslandExpanded ? 'island-expanded' : 'island-compact'
        }`}
      >
        {/* COMPACT ISLAND VIEW (Symmetrical iPhone Camera Cutout Notch) */}
        <div
          className={`dynamic-island-compact-view ${
            isIslandExpanded ? 'compact-hidden' : 'compact-visible'
          }`}
          onClick={() => setIsIslandExpanded(true)}
          title="Click to expand header"
          aria-hidden={isIslandExpanded}
        >
          {/* Leading (Left): Wireframe cube + Brand */}
          <div className="island-compact-leading">
            <svg viewBox="0 0 32 32" fill="none" className="island-compact-cube-svg">
              <path
                d="M16 2 L28 8.5 L28 23.5 L16 30 L4 23.5 L4 8.5 Z"
                stroke="#16D9E8"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path
                d="M16 2 L16 16 M28 8.5 L16 16 M4 8.5 L16 16"
                stroke="#16D9E8"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            </svg>
            <span className="island-compact-brand-text">TrustMesh</span>
          </div>

          {/* Center: iPhone Hardware Camera Sensor Cutout */}
          <div className="island-compact-sensor" aria-hidden="true">
            <span className="island-sensor-iris" />
          </div>

          {/* Trailing (Right): Live Zero-Trust Radar Signal */}
          <div className="island-compact-trailing" aria-hidden="true">
            <span className="island-compact-radar-ping" />
            <span className="island-compact-radar-core" />
          </div>
        </div>

        {/* EXPANDED FULL MASTER HEADER VIEW */}
        <div
          className={`dynamic-island-expanded-view ${
            isIslandExpanded ? 'expanded-visible' : 'expanded-hidden'
          }`}
          aria-hidden={!isIslandExpanded}
        >
          {/* 1. Left Product Brand & Subtitle */}
          <div className="header-brand-block">
            <div
              className="header-logo-container"
              onClick={() => setIsIslandExpanded(false)}
              title="Click to morph into Dynamic Island"
              role="button"
              tabIndex={0}
            >
              <div className="header-logo-glow" aria-hidden="true" />
              <div className="header-logo-icon" aria-hidden="true">
                <svg viewBox="0 0 32 32" fill="none" className="logo-cube-svg">
                  <defs>
                    <linearGradient id="cube-grad-top" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#16D9E8" />
                      <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>
                    <linearGradient id="cube-grad-front" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="100%" stopColor="#818CF8" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M16 2 L28 8.5 L28 23.5 L16 30 L4 23.5 L4 8.5 Z"
                    stroke="url(#cube-grad-top)"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 2 L16 16 M28 8.5 L16 16 M4 8.5 L16 16"
                    stroke="url(#cube-grad-top)"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 16 L16 30 M28 23.5 L16 16 M4 23.5 L16 16"
                    stroke="url(#cube-grad-front)"
                    strokeWidth="1.2"
                    strokeDasharray="2 3"
                    opacity="0.65"
                  />
                </svg>
              </div>
            </div>

            <div className="header-title-stack">
              <div className="header-brand-line">
                <span className="brand-primary">ZeroTrustCloud</span>
                <span className="brand-sep" aria-hidden="true">/</span>
                <span className="brand-product">TrustMesh</span>
              </div>
              <div className="header-sub-line">
                <span>Identity-Centric Zero-Trust</span>
                <span className="sub-line-bullet" aria-hidden="true">·</span>
                <span className="platform-tag">
                  <span className="platform-tag-pulse" />
                  Platform
                </span>
              </div>
            </div>
          </div>

          {/* 2. Center System Health Liquid Capsule */}
          <div className="header-health-block">
            <div className="system-health-pill" title="Local verification testbed active">
              <div className="health-ping-wrap" aria-hidden="true">
                <span className="health-ping-ring" />
                <span className="health-pulsing-dot" />
              </div>
              <span className="health-label">SYSTEM HEALTH</span>
              <span className="health-divider" aria-hidden="true">|</span>
              <span className="health-state">Operational</span>
            </div>
          </div>

          {/* 3. Right Controls: Cluster Selector, Theme Toggle, User Profile */}
          <div className="header-controls-block">
            {/* Cluster Selector Dropdown Wrap */}
            <div className="cluster-selector-wrapper" ref={clusterMenuRef}>
              <button
                type="button"
                className={`cluster-selector-btn ${isClusterMenuOpen ? 'active' : ''}`}
                onClick={() => setIsClusterMenuOpen(!isClusterMenuOpen)}
                aria-expanded={isClusterMenuOpen}
                aria-haspopup="true"
                title="Switch cluster environment context"
              >
                <div className="cluster-icon-orb" aria-hidden="true">
                  <Layers size={13} className="cluster-icon" />
                </div>
                <span className="cluster-name">{clusterName}</span>
                <span className="cluster-env-tag">
                  {clusterName.includes('Local') ? 'LAB' : 'CLOUD'}
                </span>
                <ChevronDown
                  size={13}
                  className={`cluster-chevron ${isClusterMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Liquid Frosted Glass Dropdown Menu */}
              {isClusterMenuOpen && (
                <div className="cluster-dropdown-menu" role="menu">
                  <div className="cluster-dropdown-header">
                    <span className="dropdown-section-tag">CLUSTER CONTEXT</span>
                    <span className="dropdown-count-tag">{CLUSTERS.length} ENVIRONMENTS</span>
                  </div>

                  <div className="cluster-dropdown-list">
                    {CLUSTERS.map((c) => {
                      const isSelected = clusterName === c.name;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          role="menuitem"
                          className={`cluster-option-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            onSelectCluster?.(c.name);
                            setIsClusterMenuOpen(false);
                          }}
                        >
                          <div className="cluster-option-icon-orb">
                            {isSelected ? (
                              <ShieldCheck size={14} className="text-cyan-400" />
                            ) : (
                              <Layers size={14} className="text-slate-400" />
                            )}
                          </div>
                          <div className="cluster-option-info">
                            <div className="cluster-option-title-row">
                              <span className="cluster-option-name">{c.name}</span>
                              <span className={`cluster-option-badge ${c.status}`}>
                                {c.badge}
                              </span>
                            </div>
                            <div className="cluster-option-details">{c.details}</div>
                          </div>
                          {isSelected && (
                            <div className="cluster-option-check">
                              <Check size={13} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="cluster-dropdown-footer">
                    <button
                      type="button"
                      className="cluster-dropdown-action-btn"
                      onClick={() => {
                        setIsClusterMenuOpen(false);
                        onOpenClusterModal?.();
                      }}
                    >
                      <span>Connect External Clusters...</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={onToggleTheme}
                aria-label="Toggle visual theme"
                title={`Switch to ${theme === 'dark' ? 'Morning (Light)' : 'Night (Dark)'} theme`}
              >
                {theme === 'dark' ? (
                  <Moon size={15} className="theme-icon moon-icon" />
                ) : (
                  <Sun size={15} className="theme-icon sun-icon" />
                )}
              </button>
            )}

            {/* User Profile Liquid Glass Capsule */}
            <div className="user-profile-badge" title="Student MCA Project Administrator (PRJ-34)">
              <div className="user-avatar-ring">
                <div className="user-avatar-circle">
                  <span>HS</span>
                </div>
              </div>
              <div className="user-details-col">
                <span className="user-name">Hithaishi S.P.</span>
                <div className="user-role-row">
                  <span className="user-role">Student · MCA</span>
                  <span className="user-tag">PRJ-34</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
