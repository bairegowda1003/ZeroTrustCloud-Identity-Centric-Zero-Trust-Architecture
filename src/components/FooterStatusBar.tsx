import React from 'react';
import { Shield } from 'lucide-react';

export const FooterStatusBar: React.FC = () => {
  return (
    <footer className="footer-status-bar" role="contentinfo">
      {/* Left: Branding & Version */}
      <div className="footer-left">
        <Shield size={16} className="text-cyan-400" />
        <span className="footer-brand">ZeroTrustCloud</span>
        <span className="footer-divider">|</span>
        <span className="footer-version">TrustMesh Dashboard Foundation</span>
      </div>

      {/* Center: Mission Statement */}
      <div className="footer-center">
        <span>Building a more secure, identity-driven cloud.</span>
      </div>

      {/* Right: Operational Status Pill */}
      <div className="footer-right">
        <div className="phase-badge">
          <span className="phase-dot" />
          <span>Security Controls: Demo</span>
        </div>
      </div>
    </footer>
  );
};

