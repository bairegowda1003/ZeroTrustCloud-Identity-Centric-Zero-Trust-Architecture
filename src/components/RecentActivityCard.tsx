import React from 'react';
import { ArrowRight } from 'lucide-react';

interface RecentActivityCardProps {
  onViewAll?: () => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ onViewAll }) => {
  const activities = [
    {
      id: 1,
      dotColor: '#20D6A2',
      time: '10:42:18',
      description: 'Identity verified for demo-workload',
      badge: 'ALLOW',
      badgeType: 'allow',
      source: 'Kubernetes',
    },
    {
      id: 2,
      dotColor: '#38BDF8',
      time: '10:39:52',
      description: 'OPA policy evaluation completed',
      badge: 'CHECK',
      badgeType: 'check',
      source: 'OPA',
    },
    {
      id: 3,
      dotColor: '#A855F7',
      time: '10:37:11',
      description: 'Access decision recorded',
      badge: 'AUDIT',
      badgeType: 'audit',
      source: 'TrustMesh',
    },
    {
      id: 4,
      dotColor: '#FF5C75',
      time: '10:32:45',
      description: 'Suspicious request blocked',
      badge: 'BLOCKED',
      badgeType: 'blocked',
      source: 'Istio',
    },
  ];

  return (
    <div className="recent-activity-card" role="region" aria-label="Recent Zero-Trust Audit Decisions">
      {/* Header */}
      <div className="activity-card-header">
        <div className="activity-title-group">
          <h2 className="activity-title">Recent Activity</h2>
          <div className="live-telemetry-badge">
            <span className="live-dot" />
            <span>Live</span>
          </div>
        </div>
        <button className="view-all-link-btn" onClick={onViewAll} aria-label="View all recent activity">
          <span>View all</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Activity Table Rows */}
      <div className="activity-list">
        {activities.map((act) => (
          <div key={act.id} className="activity-row">
            <div className="activity-row-left">
              <span className="activity-dot" style={{ backgroundColor: act.dotColor }} />
              <span className="activity-time">{act.time}</span>
              <span className="activity-desc">{act.description}</span>
            </div>
            <div className="activity-row-right">
              <span className={`decision-badge badge-${act.badgeType}`}>{act.badge}</span>
              <span className="activity-source">{act.source}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

