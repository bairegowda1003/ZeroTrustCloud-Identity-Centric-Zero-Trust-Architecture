import React from 'react';

export const DemoNotice: React.FC<{ title?: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="demo-provenance-notice" role="note">
    <strong>{title ?? 'DEMONSTRATION DATA — NOT LIVE SECURITY TELEMETRY'}</strong>
    <span>{children ?? 'Illustrative fixtures and example outcomes only. No security controls are verified or executed by this view.'}</span>
  </div>
);
