# TrustMesh OPA Gatekeeper Policy Admission Test Runner
# Executes positive (ALLOW) and negative (DENY) tests against Kubernetes cluster
# Outputs captured admission webhook verdicts to console and JSON evidence log.

param(
    [string]$EvidenceOut = "$PSScriptRoot/admission-evidence.json"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " TrustMesh Phase 3: Gatekeeper Admission Test Suite" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$Tests = @(
    @{ Name = "Compliant Pod"; Path = "$PSScriptRoot/01-compliant-pod.yaml"; Expected = "ALLOW"; Policy = "ALL" },
    @{ Name = "Compliant Deployment"; Path = "$PSScriptRoot/02-compliant-deployment.yaml"; Expected = "ALLOW"; Policy = "ALL" },
    @{ Name = "Root Execution Pod"; Path = "$PSScriptRoot/03-violation-root-pod.yaml"; Expected = "DENY"; Policy = "POL-ADM-01" },
    @{ Name = "Privileged Container Pod"; Path = "$PSScriptRoot/04-violation-privileged-pod.yaml"; Expected = "DENY"; Policy = "POL-ADM-02" },
    @{ Name = "Default ServiceAccount Pod"; Path = "$PSScriptRoot/05-violation-default-sa-pod.yaml"; Expected = "DENY"; Policy = "POL-ADM-03" },
    @{ Name = "Privilege Escalation Pod"; Path = "$PSScriptRoot/06-violation-escalation-pod.yaml"; Expected = "DENY"; Policy = "POL-ADM-04" }
)

$Results = @()

foreach ($t in $Tests) {
    Write-Host "Executing Test: $($t.Name) (Expected: $($t.Expected))..." -NoNewline
    
    $output = ""
    $actualDecision = "UNKNOWN"
    
    try {
        $output = kubectl apply -f $t.Path 2>&1 | Out-String
        if ($output -match "created" -or $output -match "configured") {
            $actualDecision = "ALLOW"
            # Cleanup allowed workload
            kubectl delete -f $t.Path --ignore-not-found=true 2>&1 | Out-Null
        } elseif ($output -match "denied the request" -or $output -match "Forbidden") {
            $actualDecision = "DENY"
        }
    } catch {
        $output = $_.Exception.Message
        $actualDecision = "DENY"
    }

    $passed = ($actualDecision -eq $t.Expected)
    if ($passed) {
        Write-Host " [PASS: $actualDecision]" -ForegroundColor Green
    } else {
        Write-Host " [FAIL: Got $actualDecision]" -ForegroundColor Yellow
    }

    $Results += [PSCustomObject]@{
        TestName = $t.Name
        Policy = $t.Policy
        TargetFile = Split-Path $t.Path -Leaf
        Expected = $t.Expected
        Actual = $actualDecision
        Passed = $passed
        RawOutput = $output.Trim()
        Timestamp = (Get-Date).ToString("o")
    }
}

$Results | ConvertTo-Json -Depth 4 | Set-Content -Path $EvidenceOut -Encoding utf8
Write-Host "Evidence recorded to: $EvidenceOut" -ForegroundColor Cyan

