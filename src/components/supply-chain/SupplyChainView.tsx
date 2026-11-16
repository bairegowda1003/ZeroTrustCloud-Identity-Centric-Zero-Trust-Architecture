import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Package, 
  Search, 
  KeyRound, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { SupplyChainSummaryCards } from './SupplyChainSummaryCards';
import { SupplyChainPipelineHero } from './SupplyChainPipelineHero';
import { ContainerImageInventoryTable } from './ContainerImageInventoryTable';
import { ImageDetailDrawer } from './ImageDetailDrawer';
import { VulnerabilityExplorerTable } from './VulnerabilityExplorerTable';
import { DEMO_CONTAINER_IMAGES, INITIAL_SUPPLY_CHAIN_SUMMARY } from '../../data/demoSupplyChain';
import { ContainerImageRecord } from '../../types/supplyChain';

interface SupplyChainViewProps {
  onNavigateToFinding?: (findingId: string) => void;
}

export const SupplyChainView: React.FC<SupplyChainViewProps> = ({
  onNavigateToFinding
}) => {
  const [selectedImage, setSelectedImage] = useState<ContainerImageRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'CVES'>('INVENTORY');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  return (
    <div className="supply-chain-container">
      {/* 1. Official Domain Header */}
      <div className="domain-page-header">
        <div className="domain-header-left">
          <div className="domain-title-row">
            <div className="domain-icon-squircle supply" aria-hidden="true">
              <Package size={18} />
            </div>
            <h1 className="domain-page-title">Software Supply Chain Defense</h1>
            <span className="domain-live-badge supply">
              <span className="live-pip rose" />
              FAIL-CLOSED Enforced
            </span>
          </div>
          <div className="domain-meta-subrow">
            <span className="domain-meta-crumb">
              Scanner: <strong>Aqua Trivy {INITIAL_SUPPLY_CHAIN_SUMMARY.trivyVersion}</strong>
            </span>
            <span className="domain-meta-sep">•</span>
            <span className="domain-meta-crumb">
              Signatures: <strong>Sigstore Cosign {INITIAL_SUPPLY_CHAIN_SUMMARY.cosignVersion}</strong>
            </span>
            <span className="domain-meta-sep">•</span>
            <span className="domain-meta-crumb">
              Gatekeeper: <strong>External Data Provider Active</strong>
            </span>
          </div>
        </div>

        <div className="domain-header-right">
          <div className="domain-header-status-pill">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Admission Webhook Enforcing</span>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <SupplyChainSummaryCards
        summary={INITIAL_SUPPLY_CHAIN_SUMMARY}
        onFilterStatus={(filter) => setStatusFilter(filter)}
        activeFilter={statusFilter}
      />

      {/* 3. Interactive 4-Step Pipeline Hero */}
      <SupplyChainPipelineHero onNavigateToFinding={onNavigateToFinding} />

      {/* 4. Subview Tabs */}
      <div className="sc-tabs-bar">
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`sc-tab-btn ${activeTab === 'INVENTORY' ? 'active' : ''}`}
        >
          <Package size={15} />
          <span>Container Image Inventory & Signatures ({DEMO_CONTAINER_IMAGES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CVES')}
          className={`sc-tab-btn ${activeTab === 'CVES' ? 'active' : ''}`}
        >
          <Search size={15} />
          <span>Vulnerability Explorer (CVEs)</span>
        </button>
      </div>

      {/* 5. Active Tab View */}
      {activeTab === 'INVENTORY' ? (
        <ContainerImageInventoryTable
          images={DEMO_CONTAINER_IMAGES}
          onSelectImage={(img) => setSelectedImage(img)}
          statusFilter={statusFilter}
        />
      ) : (
        <VulnerabilityExplorerTable
          images={DEMO_CONTAINER_IMAGES}
          onSelectImage={(img) => setSelectedImage(img)}
        />
      )}

      {/* 6. Artifact Inspection Drawer */}
      <ImageDetailDrawer
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
        onNavigateToFinding={onNavigateToFinding}
      />
    </div>
  );
};
