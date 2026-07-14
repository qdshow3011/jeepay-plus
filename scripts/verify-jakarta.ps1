$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$modules = @(
    'openhubs-pay-core',
    'openhubs-pay-service',
    'openhubs-pay-components',
    'openhubs-pay-manager',
    'openhubs-pay-merchant',
    'openhubs-pay-payment'
) | ForEach-Object { Join-Path $root $_ }

$hits = & rg -n 'import javax\.(servlet|validation|annotation|jms|websocket)' @modules --glob '*.java'
if ($LASTEXITCODE -eq 0) {
    throw "Legacy Java EE imports remain:`n$($hits -join "`n")"
}

Write-Host 'Jakarta import verification passed.'
