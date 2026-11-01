import React, { useState, useMemo } from 'react';
import {
  Search,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  FileCode,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { GatekeeperPolicyRecord } from '../../types/policy';

interface PolicyInventoryTableProps {
  policies: GatekeeperPolicyRecord[];
  onSelectPolicy: (policy: GatekeeperPolicyRecord) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export const PolicyInventoryTable: React.FC<PolicyInventoryTableProps> = ({
  policies,
  onSelectPolicy,
  selectedCategory,
  onCategoryChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    policies.forEach((p) => set.add(p.category));
    return ['all', ...Array.from(set)];
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.templateKind.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        !selectedCategory || selectedCategory === 'all' || p.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [policies, searchTerm, selectedCategory]);

  return (
    <div className="policy-table-wrapper">
      {/* Toolbar: Search + Category Filters */}
      <div className="policy-toolbar">
        <div className="toolbar-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search policies by name, ID, or Rego template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="toolbar-category-pills" role="tablist" aria-label="Policy Categories">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat || (!selectedCategory && cat === 'all')}
              className={`category-pill ${
                (selectedCategory === cat || (!selectedCategory && cat === 'all')) ? 'active' : ''
              }`}
              onClick={() => onCategoryChange(cat === 'all' ? null : cat)}
            >
              {cat === 'all' ? 'All Policies' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="policy-table-container">
        <table className="policy-table" aria-label="OPA Gatekeeper Policies">
          <thead>
            <tr>
              <th scope="col">Policy & Constraint</th>
              <th scope="col">Category</th>
              <th scope="col">Target Kinds</th>
              <th scope="col">Enforcement Mode</th>
              <th scope="col">Audit / Blocked</th>
              <th scope="col" className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPolicies.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty-row">
                  <div className="empty-message-box">
                    <Filter size={24} />
                    <h4>No Policies Found</h4>
                    <p>Adjust your search query or reset category filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPolicies.map((p) => (
                <tr
                  key={p.id}
                  className="policy-row"
                  onClick={() => onSelectPolicy(p)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectPolicy(p);
                    }
                  }}
                >
                  {/* 1. Policy & Constraint */}
                  <td className="cell-policy">
                    <div className="policy-title-box">
                      <div className="policy-icon">
                        <FileCode size={16} />
                      </div>
                      <div className="policy-names">
                        <span className="policy-name">{p.name}</span>
                        <div className="policy-sub-row">
                          <code className="policy-id-tag">{p.id}</code>
                          <span className="policy-template-text">{p.constraintName}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Category */}
                  <td className="cell-category">
                    <span className="category-badge">{p.category}</span>
                  </td>

                  {/* 3. Target Kinds */}
                  <td className="cell-targets">
                    <div className="targets-wrap">
                      <span className="target-kinds-text">
                        {p.targetKinds.slice(0, 3).join(', ')}
                        {p.targetKinds.length > 3 && ` +${p.targetKinds.length - 3}`}
                      </span>
                      <small className="exclusions-text">
                        ({p.excludedNamespaces.length} namespaces excluded)
                      </small>
                    </div>
                  </td>

                  {/* 4. Enforcement Mode */}
                  <td className="cell-mode">
                    <span className={`enforcement-mode-pill ${p.enforcementAction}`}>
                      <ShieldCheck size={12} />
                      <span>{p.enforcementAction === 'deny' ? 'Enforce (Deny)' : 'Dryrun'}</span>
                    </span>
                  </td>

                  {/* 5. Audit / Blocked Metrics */}
                  <td className="cell-metrics">
                    <div className="policy-metrics-box">
                      <span className="metric-tag blocked" title="Blocked admission requests">
                        Blocked: {p.blockedAdmissionsCount}
                      </span>
                      <span className="metric-tag audit" title="Flagged in existing cluster audit">
                        Audit: {p.activeViolationsCount}
                      </span>
                    </div>
                  </td>

                  {/* 6. Action */}
                  <td className="cell-action text-right">
                    <button
                      className="inspect-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPolicy(p);
                      }}
                      aria-label={`Inspect ${p.name}`}
                    >
                      <span>Inspect Rego</span>
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="policy-table-footer">
        <span>
          Showing <strong>{filteredPolicies.length}</strong> of <strong>{policies.length}</strong> Gatekeeper policies
        </span>
        <span className="gatekeeper-version-hint">
          Engine: <code>OPA Gatekeeper v3.15.0</code> · Validating Webhook Active
        </span>
      </div>
    </div>
  );
};

