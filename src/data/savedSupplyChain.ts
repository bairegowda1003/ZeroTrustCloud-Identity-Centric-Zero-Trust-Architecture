/// <reference types="vite/client" />
import { readCollection } from '../utils/supplyChainEvidence';

const files = import.meta.glob<string>([
  '/k8s/supply-chain/trivy/reports/*.json',
  '/k8s/supply-chain/cosign/signatures/*.json'
], { eager: true, query: '?raw', import: 'default' });
export const savedSupplyChain = readCollection(files);
