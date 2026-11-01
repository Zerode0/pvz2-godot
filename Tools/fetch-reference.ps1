[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskDest = Join-Path $taskRoot 'reference/research/pvzge_web-readonly'
$taskCommit = '462f1161d5a29423409002936f2e05f1c24ac630'
if (Test-Path -LiteralPath $taskDest) {
    if (Test-Path -LiteralPath (Join-Path $taskDest 'docs/index.html')) {
        Write-Host 'Existing reference found. See its source records for the pinned revision.'
        exit 0
    }
    throw 'Reference directory exists but is incomplete. Inspect it before retrying.'
}
New-Item -ItemType Directory -Force -Path $taskDest | Out-Null
& git -C $taskDest init --quiet
if ($LASTEXITCODE -ne 0) { throw 'git init failed.' }
& git -C $taskDest remote add origin https://github.com/Gzh0821/pvzge_web.git
if ($LASTEXITCODE -ne 0) { throw 'git remote failed.' }
& git -C $taskDest fetch --depth 1 origin $taskCommit
if ($LASTEXITCODE -ne 0) { throw 'Reference fetch failed. The partial directory has been retained for inspection.' }
& git -C $taskDest checkout --detach $taskCommit
if ($LASTEXITCODE -ne 0) { throw 'Reference checkout failed.' }
Write-Host "Reference ready at pinned commit $taskCommit"
