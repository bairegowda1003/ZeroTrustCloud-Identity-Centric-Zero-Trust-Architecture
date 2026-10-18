import React from 'react';
import { ArrowLeft, Lock } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  phase?: string;
  onGoHome: () => void;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  description,
  phase = 'Phase 2+',
  onGoHome,
}) => {
  return (
    <div className="module-placeholder">
      <div className="module-placeholder-icon">
        <Lock size={24} />
      </div>

      <span className="module-placeholder-phase">
        🔒 {phase}
      </span>

      <h2 className="module-placeholder-title">{title}</h2>
      <p className="module-placeholder-desc">{description}</p>

      <button className="module-placeholder-home-btn" onClick={onGoHome}>
        <ArrowLeft size={14} />
        Back to Command Center
      </button>
    </div>
  );
};
