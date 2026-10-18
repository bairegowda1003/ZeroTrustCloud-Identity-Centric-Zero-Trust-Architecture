import React from 'react';
import { Filter, Layers, Sun, Moon, ShieldCheck, ChevronDown } from 'lucide-react';

interface HeaderProps {
  title: string;
  breadcrumb?: string;
  activeTab?: string;
  tabs?: { id: string; label: string }[];
  onTabChange?: (tab: string) => void;
  onConnectDataSource?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  breadcrumb,
  activeTab,
  tabs,
  onTabChange,
  onConnectDataSource,
  theme = 'dark',
  onToggleTheme,
}) => {
  return (
    <header className="header" role="banner">
      <div className="header-left">
        {breadcrumb && (
          <div className="header-breadcrumb">
            <span>{breadcrumb}</span>
          </div>
        )}
        <div className="header-title-row">
          <h1 className="header-title">{title}</h1>
          <ChevronDown size={14} className="header-title-chevron" />
        </div>
      </div>

      {tabs && tabs.length > 0 && (
        <div className="header-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`header-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange?.(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="header-spacer" />

      <div className="header-actions">
        {/* Honest Demo Badge */}
        <span className="header-demo-badge">
          <ShieldCheck size={12} className="demo-badge-icon" />
          <span>Demo Data · Simulated Testbed</span>
        </span>

        {/* Planned Integrations Button */}
        {onConnectDataSource && (
          <button
            className="header-btn header-btn-ghost"
            onClick={onConnectDataSource}
            title="Inspect planned cloud provider and policy engine integrations"
          >
            <Layers size={14} />
            <span>Integrations (6)</span>
          </button>
        )}

        {/* Hithaishi.OS Signature Theme Toggle */}
        {onToggleTheme && (
          <button
            type="button"
            className="theme-toggle-pill"
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            title={`Switch to ${theme === 'dark' ? 'Morning (Light)' : 'Night (Dark)'} theme`}
          >
            <span className={`theme-dot ${theme}`} />
            {theme === 'dark' ? (
              <Moon size={13} className="theme-icon moon" />
            ) : (
              <Sun size={13} className="theme-icon sun" />
            )}
            <span className="theme-text">{theme === 'dark' ? 'Night' : 'Morning'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
