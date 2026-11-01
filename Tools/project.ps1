[CmdletBinding()]
param(
    [Parameter(Position=0)]
    [ValidateSet('Run','Editor','TestLevel','Preview','Check','Verify')]
    [string]$Action = 'Run',
    [ValidateSet('level','transition','world-map','plant-preview','sandbox','all')]
    [string]$Suite = 'level',
    [switch]$Headless
)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskConfig = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'team-environment.json') -Raw | ConvertFrom-Json
$taskExe = Join-Path (Join-Path $taskRoot $taskConfig.godot.directory) $taskConfig.godot.executable
$taskProject = Join-Path $taskRoot 'GodotPamDemo'
if (-not (Test-Path -LiteralPath $taskExe)) { throw 'Run Tools/setup.ps1 first.' }
function Invoke-ProjectGodot {
    param([string[]]$Arguments, [string]$SuccessMarker = '')
    $taskPreviousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $taskLog = @(& $taskExe @Arguments 2>&1)
        $taskExitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $taskPreviousPreference
    }
    $taskLog | ForEach-Object { Write-Host $_ }
    if ($taskExitCode -ne 0 -or ($taskLog -match 'SCRIPT ERROR:|ERROR:')) {
        throw "Godot command failed (exit $taskExitCode). See output above."
    }
    if ($SuccessMarker -and -not ($taskLog -match [regex]::Escape($SuccessMarker))) {
        throw "Verification ended without success marker: $SuccessMarker"
    }
}
$taskArgs = @('--path', $taskProject)
if ($Headless -or $Action -eq 'Check') { $taskArgs += '--headless' }
switch ($Action) {
    'Editor' { $taskArgs += '--editor' }
    'TestLevel' { $taskArgs += 'res://scenes/development_sandbox.tscn' }
    'Preview' { $taskArgs += 'res://scenes/plant_preview.tscn' }
    'Check' { $taskArgs += @('--editor','--import') }
    'Verify' {
        $taskSuites = [ordered]@{level='verify_level_01.gd'; transition='verify_scene_transition.gd'; 'world-map'='verify_world_map.gd'; 'plant-preview'='verify_plant_preview.gd'; sandbox='verify_development_sandbox.gd'}
        $taskMarkers = @{level='LEVEL_01_VERIFIED'; transition='SCENE_TRANSITION_OK'; 'world-map'='WORLD_MAP_OK'; 'plant-preview'='PLANT_PREVIEW_OK'; sandbox='DEVELOPMENT_SANDBOX_OK'}
        $taskSelected = if ($Suite -eq 'all') { @($taskSuites.Keys) } else { @($Suite) }
        foreach ($taskName in $taskSelected) {
            Write-Host "Verifying: $taskName"
            Invoke-ProjectGodot -Arguments ($taskArgs + @('--script', ('res://scripts/tests/' + $taskSuites[$taskName]))) -SuccessMarker $taskMarkers[$taskName]
        }
        exit 0
    }
}
if ($Action -eq 'Check') {
    Invoke-ProjectGodot -Arguments $taskArgs
} else {
    & $taskExe @taskArgs
    if ($LASTEXITCODE -ne 0) { throw "Godot failed: $Action ($LASTEXITCODE)" }
}
