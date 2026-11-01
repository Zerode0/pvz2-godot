[CmdletBinding()]
param([switch]$AssetTools)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskConfig = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'team-environment.json') -Raw | ConvertFrom-Json
$taskGodot = Join-Path $taskRoot $taskConfig.godot.directory
$taskExe = Join-Path $taskGodot $taskConfig.godot.executable
if (-not (Test-Path -LiteralPath $taskExe)) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $taskCache = Join-Path $taskRoot 'Tools/.cache'
    New-Item -ItemType Directory -Force -Path $taskCache | Out-Null
    $taskZip = Join-Path $taskCache ('godot-' + $taskConfig.godot.version + '-win64.zip')
    if (-not (Test-Path -LiteralPath $taskZip)) {
        Invoke-WebRequest -UseBasicParsing -Uri $taskConfig.godot.url -OutFile $taskZip
    }
    if ((Get-FileHash -LiteralPath $taskZip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskConfig.godot.sha256) {
        Remove-Item -LiteralPath $taskZip
        throw 'Godot download checksum mismatch. Run setup again to download a fresh copy.'
    }
    New-Item -ItemType Directory -Force -Path $taskGodot | Out-Null
    Expand-Archive -LiteralPath $taskZip -DestinationPath $taskGodot -Force
}
$taskVersion = & $taskExe --version
if ($LASTEXITCODE -ne 0 -or $taskVersion -notlike ($taskConfig.godot.version + '.stable.*')) {
    throw "Unexpected Godot executable: $taskVersion"
}
Write-Host "Godot ready: $taskVersion"
if ($AssetTools) {
    foreach ($taskDependency in @(@{Command='python'; Package='Python.Python.3.13'}, @{Command='node'; Package='OpenJS.NodeJS.LTS'})) {
        if (-not (Get-Command $taskDependency.Command -ErrorAction SilentlyContinue)) {
            if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { throw 'Install Windows App Installer (winget) and run setup -AssetTools again.' }
            & winget install --id $taskDependency.Package --exact --accept-package-agreements --accept-source-agreements
            if ($LASTEXITCODE -ne 0) { throw "Installation failed: $($taskDependency.Package)" }
            $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
        }
    }
    $taskVenv = Join-Path $taskRoot 'Tools/.venv'
    if (-not (Test-Path -LiteralPath (Join-Path $taskVenv 'Scripts/python.exe'))) {
        & python -m venv $taskVenv
        if ($LASTEXITCODE -ne 0) { throw 'Python virtual environment creation failed.' }
    }
    & (Join-Path $taskVenv 'Scripts/python.exe') -m pip install -r (Join-Path $PSScriptRoot 'requirements-assets.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Python asset dependency installation failed.' }
    & npm.cmd ci --prefix (Join-Path $taskRoot 'reference/dragonbones-tooling/compiler') --ignore-scripts --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'TypeScript dependency installation failed.' }
    Write-Host 'Asset tools ready. Use Tools/.venv/Scripts/python.exe for asset scripts.'
}
& (Join-Path $PSScriptRoot 'project.ps1') Check
Write-Host 'Ready. Run: powershell -ExecutionPolicy Bypass -File Tools/project.ps1 Run'
