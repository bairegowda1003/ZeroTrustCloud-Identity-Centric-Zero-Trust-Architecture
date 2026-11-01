import React, { useState, useMemo } from 'react';
import {
  Lock,
  Network,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
} from 'lucide-react';
import { MeshServiceRoute } from '../../types/mesh';

interface ServiceMeshMatrixProps {
  routes: MeshServiceRoute[];
  onSelectRoute?: (route: MeshServiceRoute) => void;
  onNavigateToFinding?: (findingId: string) => void;
}

export const ServiceMeshMatrix: React.FC<ServiceMeshMatrixProps> = ({
  routes,
  onSelectRoute,
  onNavigateToFinding,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ALLOWED' | 'DENIED'>('ALL');

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const matchesSearch =
        searchTerm === '' ||
        r.sourceService.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.targetService.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cipherSuite.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.policyName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || r.authzStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [routes, searchTerm, statusFilter]);

  return (
    <div className="mesh-matrix-wrapper">
      {/* Toolbar */}
      <div className="mesh-matrix-toolbar">
        <div className="toolbar-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search routes by service, cipher suite, or policy..."
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

        {/* Filter Pills */}
        <div className="matrix-filter-pills" role="tablist">
          <button
            role="tab"
            aria-selected={statusFilter === 'ALL'}
            className={`matrix-filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All Routes ({routes.length})
          </button>
          <button
            role="tab"
            aria-selected={statusFilter === 'ALLOWED'}
            className={`matrix-filter-pill allow ${statusFilter === 'ALLOWED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALLOWED')}
          >
            Allowed ({routes.filter((r) => r.authzStatus === 'ALLOWED').length})
          </button>
          <button
            role="tab"
            aria-selected={statusFilter === 'DENIED'}
            className={`matrix-filter-pill deny ${statusFilter === 'DENIED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('DENIED')}
          >
            Blocked ({routes.filter((r) => r.authzStatus === 'DENIED').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mesh-matrix-table-container">
        <table className="mesh-matrix-table" aria-label="Service Mesh Communication Paths">
          <thead>
            <tr>
              <th scope="col">Communication Path</th>
              <th scope="col">mTLS Enforcement</th>
              <th scope="col">TLS Version & Cipher Suite</th>
              <th scope="col">Authorization Policy</th>
              <th scope="col">Traffic Rate</th>
              <th scope="col" className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty-row">
                  <div className="empty-message-box">
                    <Filter size={24} />
                    <h4>No Service Routes Found</h4>
                    <p>Adjust your search query or reset filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRoutes.map((r) => {
                const isStrict = r.mtlsMode === 'STRICT';
                const isAllowed = r.authzStatus === 'ALLOWED';

                return (
                  <tr key={r.id} className="mesh-route-row">
                    {/* 1. Path */}
                    <td className="cell-path">
                      <div className="path-box">
                        <div className="service-node">
                          <code className="service-name">{r.sourceService}</code>
                          <small className="service-ns">({r.sourceNamespace})</small>
                        </div>
                        <ArrowRight size={14} className="path-arrow" />
                        <div className="service-node">
                          <code className="service-name">{r.targetService}</code>
                          <small className="service-ns">({r.targetNamespace})</small>
                        </div>
                      </div>
                    </td>

                    {/* 2. mTLS Mode */}
                    <td className="cell-mtls">
                      <span className={`mtls-badge ${isStrict ? 'strict' : 'disabled'}`}>
                        <Lock size={12} />
                        <span>{isStrict ? 'STRICT mTLS' : 'DISABLED (Plaintext)'}</span>
                      </span>
                    </td>

                    {/* 3. TLS Version & Dynamic Cipher */}
                    <td className="cell-cipher">
                      <div className="cipher-box">
                        <span className="tls-version-tag">{r.tlsVersion}</span>
                        <code className="cipher-name" title={r.cipherSuite}>
                          {r.cipherSuite}
                        </code>
                      </div>
                    </td>

                    {/* 4. Authorization Policy */}
                    <td className="cell-authz">
                      <div className="authz-box">
                        <span className={`authz-pill ${isAllowed ? 'allowed' : 'denied'}`}>
                          {isAllowed ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                          <span>{r.authzStatus}</span>
                        </span>
                        <small className="policy-name-sub">{r.policyName}</small>
                      </div>
                    </td>

                    {/* 5. Traffic Rate */}
                    <td className="cell-rate">
                      <span className="rate-text">{r.trafficRate}</span>
                    </td>

                    {/* 6. Action */}
                    <td className="cell-action text-right">
                      {r.linkedFindingId && onNavigateToFinding ? (
                        <button
                          className="finding-link-btn"
                          onClick={() => onNavigateToFinding(r.linkedFindingId!)}
                        >
                          <span>Finding Alert</span>
                        </button>
                      ) : (
                        <span className="encrypted-badge">Encrypted</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mesh-matrix-footer">
        <span>
          Showing <strong>{filteredRoutes.length}</strong> of <strong>{routes.length}</strong> service mesh paths
        </span>
        <span className="mesh-info-hint">
          PeerAuthentication: <code>STRICT (Zero Plaintext Ingress)</code>
        </span>
      </div>
    </div>
  );
};
