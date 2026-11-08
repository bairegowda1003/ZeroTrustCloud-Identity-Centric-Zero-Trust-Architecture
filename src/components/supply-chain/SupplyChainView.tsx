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
      {/* 1. Tooling Status Banner */}
      <div className="supply-chain-banner">
        <div className="sc-banner-left">
          <div className="sc-banner-badges">
            <span className="sc-badge trivy">
              <Package size={12} />
              <span>Trivy {INITIAL_SUPPLY_CHAIN_SUMMARY.trivyVersion}</span>
            </span>
            <span className="sc-badge cosign">
              <ShieldCheck size={12} />
              <span>Cosign {INITIAL_SUPPLY_CHAIN_SUMMARY.cosignVersion}</span>
            </span>
            <span className="sc-badge enforced">
              <CheckCircle2 size={12} />
              <span>ENFORCED</span>
            </span>
          </div>
          <div>
            <h1 className="sc-banner-title">
              Software Supply Chain Defense & Vulnerability Scanning
            </h1>
            <p className="sc-banner-subtitle">
              Pre-deployment artifact integrity validation via Aqua Trivy, Sigstore Cosign, and OPA Gatekeeper External Data admission control.
            </p>
          </div>
        </div>

        <div className="sc-banner-right">
          <div className="sc-meta-pills">
            <span className="sc-meta-pill">
              Trivy: <strong>{INITIAL_SUPPLY_CHAIN_SUMMARY.trivyVersion}</strong>
            </span>
            <span className="sc-meta-pill">
              Cosign: <strong>{INITIAL_SUPPLY_CHAIN_SUMMARY.cosignVersion}</strong>
            </span>
            <span className="sc-meta-pill">
              Threshold: <strong>Critical: 0 (FAIL_CLOSED)</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <SupplyChainSummaryCards
        summary={INITIAL_SUPPLY_CHAIN_SUMMARY}
        onFilterStatus={(filter) => setStatusFilter(filter)}
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
