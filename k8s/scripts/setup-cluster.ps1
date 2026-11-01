# TrustMesh Local Kubernetes Testbed Provisioning Script
# Requires: kind, kubectl, docker

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "TrustMesh Phase 2: Local Kubernetes Testbed Provisioning" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check prerequisite tools
$hasKind = Get-Command kind -ErrorAction SilentlyContinue
$hasKubectl = Get-Command kubectl -ErrorAction SilentlyContinue
$hasDocker = Get-Command docker -ErrorAction SilentlyContinue

if (-not $hasDocker) {
    Write-Warning "Docker daemon not found in PATH. Please start Docker Desktop to provision local cluster."
    Write-Host "TrustMesh will continue in Laboratory Fixture mode using manifest specifications." -ForegroundColor Yellow
    exit 0
}

if (-not $hasKind) {
    Write-Warning "Kind (Kubernetes in Docker) not found. Install via: choco install kind / winget install Kubernetes.kind"
    exit 0
}

# 2. Provision kind cluster
Write-Host "[1/3] Creating kind cluster 'trustmesh-lab'..." -ForegroundColor Green
kind create cluster --config k8s/cluster/kind-config.yaml --name trustmesh-lab

# 3. Apply namespaces and ServiceAccounts
Write-Host "[2/3] Applying Zero-Trust Namespaces and dedicated ServiceAccounts..." -ForegroundColor Green
kubectl apply -f k8s/microservices/00-namespaces.yaml
kubectl apply -f k8s/microservices/01-serviceaccounts.yaml

# 4. Deploy microservices
Write-Host "[3/3] Deploying multi-tier microservices..." -ForegroundColor Green
kubectl apply -f k8s/microservices/02-workloads.yaml

Write-Host "[TrustMesh] Local testbed ready. Run node k8s/scripts/discover-workloads.js to export live data." -ForegroundColor Cyan

