$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$composePath = Join-Path $root 'docker-compose.yml'
$compose = Get-Content -Raw -Encoding UTF8 $composePath

function Assert-True([bool]$condition, [string]$message) {
    if (-not $condition) {
        throw $message
    }
}

Assert-True ($compose -match '(?m)^  activemq:') 'ActiveMQ service is required'
Assert-True ($compose -notmatch '(?m)^  (rabbitmq|rocketmq-namesrv|rocketmq-broker):') 'Only ActiveMQ is allowed'

$ips = [regex]::Matches($compose, '(?m)^\s+ipv4_address:\s*([^\r\n]+)') |
    ForEach-Object { $_.Groups[1].Value.Trim() }
Assert-True (($ips | Group-Object | Where-Object Count -gt 1).Count -eq 0) 'Duplicate static IP found'

@(
    'openhubs-pay-payment/Dockerfile',
    'openhubs-pay-manager/Dockerfile',
    'openhubs-pay-merchant/Dockerfile',
    'openhubs-pay-ui/Dockerfile'
) | ForEach-Object {
    Assert-True (Test-Path (Join-Path $root $_)) "Missing $_"
}

Get-ChildItem (Join-Path $root 'conf') -Filter application.yml -Recurse |
    Where-Object FullName -notmatch 'devCommons' |
    ForEach-Object {
        $yaml = Get-Content -Raw -Encoding UTF8 $_.FullName
        Assert-True ($yaml -notmatch 'mysql8|redis6|activemq5') "Legacy hostname in $($_.FullName)"
        Assert-True ($yaml -notmatch '(?m)^\s+jwt-secret:\s*(?!\$\{)\S+') "Plain JWT secret in $($_.FullName)"
    }

Assert-True ($compose -notmatch 'nginx\.tar\.gz') 'Compose references missing nginx.tar.gz'
@('openhubs-pay-payment', 'openhubs-pay-manager', 'openhubs-pay-merchant') | ForEach-Object {
    Assert-True ($compose -match "dockerfile:\s+$_/Dockerfile") "Compose does not reference $_/Dockerfile"
}

Write-Host 'Deployment verification passed.'
