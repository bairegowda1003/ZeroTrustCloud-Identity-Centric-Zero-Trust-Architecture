import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  User,
  Shield,
  Network,
  ShieldAlert,
  Package,
  BarChart3,
  Link2,
  Settings,
  Pin,
  PinOff,
  Menu,
} from 'lucide-react';
import type { ActiveModule } from '../types/security';

interface SidebarProps {
  currentModule: ActiveModule;
  onModuleChange: (module: ActiveModule) => void;
  unresolvedFindingsCount?: number;
}

interface NavItem {
  id: ActiveModule;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onModuleChange,
  unresolvedFindingsCount = 3,
}) => {
  // Starts expanded on initial page load so user sees full menu, then morphs to minimal dock
  const [isIntroExpanded, setIsIntroExpanded] = useState(true);
  const [isIntroMorphing, setIsIntroMorphing] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial Morph Sequence: Dwells expanded for 1400ms, then liquid morphs down into minimal dock
  useEffect(() => {
    const collapseTimer = setTimeout(() => {
      setIsIntroExpanded(false);
    }, 1400);

    // After slow-motion morph finishes (1400ms + 950ms = 2350ms), switch to regular fast hover transitions
    const morphEndTimer = setTimeout(() => {
      setIsIntroMorphing(false);
    }, 2400);

    return () => {
      clearTimeout(collapseTimer);
      clearTimeout(morphEndTimer);
    };
  }, []);

  const isExpanded = isPinned || isHovered || isIntroExpanded;

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const navItems: NavItem[] = [
    {
      id: 'command_center',
      label: 'Overview',
      icon: <Home size={16} />,
    },
    {
      id: 'workload_identity',
      label: 'Identity & Access',
      icon: <User size={16} />,
    },
    {
      id: 'policy_governance',
      label: 'Policies & Workloads',
      icon: <Shield size={16} />,
    },
    {
      id: 'service_mesh',
      label: 'Trust Architecture',
      icon: <Network size={16} />,
    },
    {
      id: 'supply_chain',
      label: 'Supply Chain Defense',
      icon: <Package size={16} />,
      badge: 2, // 2 blocked artifacts (1 unsigned + 1 vulnerable)
    },
    {
      id: 'experiments',
      label: 'Audit & Observability',
      icon: <BarChart3 size={16} />,
      badge: 8, // 8 correlated multi-domain security events
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <Link2 size={16} />,
    },
  ];

  return (
    <aside
      className={`master-app-sidebar ${isExpanded ? 'expanded' : 'collapsed'} ${
        isIntroMorphing ? 'intro-morph' : ''
      }`}
      role="navigation"
      aria-label="Main Navigation"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Navigation Links Stack */}
      <div className="sidebar-nav-stack">
        <div className="sidebar-nav-header-row">
          {isExpanded ? (
            <>
              <span className="sidebar-nav-section-title">NAVIGATION</span>
              <button
                type="button"
                className={`sidebar-pin-btn ${isPinned ? 'pinned' : ''}`}
                onClick={() => setIsPinned(!isPinned)}
                title={isPinned ? 'Unpin sidebar (auto-collapse)' : 'Pin sidebar open'}
                aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              >
                {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="sidebar-morph-toggle-btn"
              onClick={() => setIsPinned(!isPinned)}
              title="Expand navigation menu"
              aria-label="Expand navigation menu"
            >
              <Menu size={14} className="morph-menu-icon" />
            </button>
          )}
        </div>

        {navItems.map((item) => {
          const isActive = currentModule === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onModuleChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              title={!isExpanded ? item.label : undefined}
            >
              {/* Luminous left accent indicator for active state (expanded view) */}
              {isActive && isExpanded && (
                <span className="nav-active-glow-pill" aria-hidden="true" />
              )}

              {/* Luminous ambient icon ring for active state (collapsed view) */}
              {isActive && !isExpanded && (
                <span className="nav-active-collapsed-ring" aria-hidden="true" />
              )}

              <div className="nav-icon-wrap" aria-hidden="true">
                {item.icon}
              </div>

              {/* Text label with slide & fade transitions */}
              <span className="nav-label-text">{item.label}</span>

              {/* Frosted jewel red badge on Security Findings */}
              {item.badge !== undefined && item.badge > 0 && (
                <>
                  {isExpanded ? (
                    <span
                      className="nav-counter-badge"
                      title={`${item.badge} active security findings`}
                    >
                      <span className="badge-pulse-aura" />
                      <span className="badge-number">{item.badge}</span>
                    </span>
                  ) : (
                    <span
                      className="nav-counter-mini-pip"
                      title={`${item.badge} active security findings`}
                      aria-hidden="true"
                    />
                  )}
                </>
              )}
            </button>
          );
        })}

      </div>

      {/* Bottom Pinned Settings Action */}
      <div className="sidebar-bottom-section">
        <div className="sidebar-nav-divider" />
        <button
          type="button"
          className="sidebar-nav-item settings-item"
          onClick={() => onModuleChange('integrations')}
          aria-label="Settings and System Configurations"
          title={!isExpanded ? 'Settings' : undefined}
        >
          <div className="nav-icon-wrap" aria-hidden="true">
            <Settings size={16} />
          </div>
          <span className="nav-label-text">Settings</span>
          {isExpanded && <span className="nav-shortcut-key">⌘S</span>}
        </button>
      </div>
    </aside>
  );
};
