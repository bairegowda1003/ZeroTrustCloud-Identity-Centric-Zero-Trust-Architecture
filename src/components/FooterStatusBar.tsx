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
        <span className="footer-version">TrustMesh v1.0.0-beta</span>
      </div>

      {/* Center: Mission Statement */}
      <div className="footer-center">
        <span>Building a more secure, identity-driven cloud.</span>
      </div>

      {/* Right: Phase Status Pill */}
      <div className="footer-right">
        <div className="phase-badge">
          <span className="phase-dot" />
          <span>Phase 1 Foundation</span>
        </div>
      </div>
    </footer>
  );
};

