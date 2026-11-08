import React, { useState } from 'react';
import { 
  Search, 
  Package, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ChevronRight 
} from 'lucide-react';
import { ContainerImageRecord } from '../../types/supplyChain';

interface ContainerImageInventoryTableProps {
  images: ContainerImageRecord[];
  onSelectImage: (image: ContainerImageRecord) => void;
  statusFilter?: string;
}

export const ContainerImageInventoryTable: React.FC<ContainerImageInventoryTableProps> = ({
  images,
  onSelectImage,
  statusFilter = 'ALL'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNamespace, setFilterNamespace] = useState('ALL');

  const namespaces = ['ALL', ...Array.from(new Set(images.map((img) => img.namespace)))];

  const filteredImages = images.filter((img) => {
    if (statusFilter === 'SIGNED' && img.cosignSignature.verificationStatus !== 'VERIFIED') return false;
    if (statusFilter === 'VULNERABLE' && img.criticalCount === 0) return false;
    if (statusFilter === 'BLOCKED' && img.admissionStatus !== 'BLOCKED') return false;
    if (filterNamespace !== 'ALL' && img.namespace !== filterNamespace) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        img.repository.toLowerCase().includes(q) ||
        img.tag.toLowerCase().includes(q) ||
        img.workloadName.toLowerCase().includes(q) ||
        img.digest.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="sc-inventory-card">
      {/* Header controls */}
      <div className="sc-table-header">
        <div className="sc-table-title">
          <Package size={16} color="#38bdf8" />
          <span>Monitored Container Image Inventory</span>
          <span style={{ 
            fontSize: '0.7rem', 
            fontFamily: 'var(--font-mono, monospace)', 
            padding: '2px 8px', 
            borderRadius: '9999px', 
            background: 'rgba(148, 163, 184, 0.1)', 
            color: 'var(--text-tertiary, #64748b)' 
          }}>
            {filteredImages.length} of {images.length}
          </span>
        </div>

        <div className="sc-table-controls">
          <div className="sc-search-wrap">
            <Search size={14} className="sc-search-icon" />
            <input
              type="text"
              placeholder="Search images or digests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sc-search-input"
            />
          </div>

          <select
            value={filterNamespace}
            onChange={(e) => setFilterNamespace(e.target.value)}
            className="sc-select"
          >
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>
                Namespace: {ns}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="sc-table-scroll">
        <table className="sc-table">
          <thead>
            <tr>
              <th className="sc-th">Artifact / Tag</th>
              <th className="sc-th">Workload / Namespace</th>
              <th className="sc-th">Trivy Vulnerabilities</th>
              <th className="sc-th">Cosign Signature</th>
              <th className="sc-th">Gatekeeper Verdict</th>
              <th className="sc-th" style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredImages.length === 0 ? (
              <tr>
                <td colSpan={6} className="sc-td" style={{ textAlign: 'center', padding: '32px' }}>
                  No container images matched the selected criteria.
                </td>
              </tr>
            ) : (
              filteredImages.map((img) => (
                <tr
                  key={img.id}
                  onClick={() => onSelectImage(img)}
                  className="sc-tr"
                >
                  <td className="sc-td">
                    <div className="sc-art-title">
                      {img.repository}:{img.tag}
                    </div>
                    <div className="sc-art-digest">{img.digest}</div>
                  </td>

                  <td className="sc-td">
                    <div style={{ fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                      {img.workloadName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary, #64748b)', fontFamily: 'var(--font-mono, monospace)' }}>
                      ns: {img.namespace}
                    </div>
                  </td>

                  <td className="sc-td">
                    {img.criticalCount > 0 ? (
                      <div>
                        <span style={{ 
                          fontWeight: 700, 
                          color: '#f87171', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontFamily: 'var(--font-mono, monospace)'
                        }}>
                          <ShieldAlert size={14} /> {img.criticalCount} Critical CVE
                        </span>
                        <div style={{ fontSize: '0.68rem', color: '#f87171', fontFamily: 'var(--font-mono, monospace)' }}>
                          CVE-2024-21508 (mysql2)
                        </div>
                      </div>
                    ) : img.lowCount > 0 ? (
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.74rem' }}>
                        0 Critical • {img.lowCount} Low
                      </span>
                    ) : (
                      <span style={{ 
                        fontFamily: 'var(--font-mono, monospace)', 
                        color: '#34d399', 
                        fontWeight: 600, 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px' 
                      }}>
                        <CheckCircle2 size={13} /> 0 CVEs Clean
                      </span>
                    )}
                  </td>

                  <td className="sc-td">
                    {img.cosignSignature.verificationStatus === 'VERIFIED' ? (
                      <span className="sc-status-pill verified">
                        <ShieldCheck size={12} /> Signed (cosign.pub)
                      </span>
                    ) : (
                      <span className="sc-status-pill unsigned">
                        <XCircle size={12} /> Unsigned Image
                      </span>
                    )}
                  </td>

                  <td className="sc-td">
                    {img.admissionStatus === 'ADMITTED' ? (
                      <span className="sc-status-pill admitted">
                        ALLOW (201)
                      </span>
                    ) : (
                      <span className="sc-status-pill blocked">
                        DENY (403)
                      </span>
                    )}
                  </td>

                  <td className="sc-td" style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectImage(img);
                      }}
                      className="sc-inspect-btn"
                    >
                      <span>Inspect</span>
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
