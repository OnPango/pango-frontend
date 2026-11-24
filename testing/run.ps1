$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
New-Item -ItemType Directory -Force validation-results | Out-Null
git rev-parse HEAD | Set-Content validation-results/commit.txt
git status --short | Set-Content validation-results/worktree.txt
$failed = @()
pnpm install --frozen-lockfile 2>&1 | Tee-Object validation-results/install.txt
if ($LASTEXITCODE -ne 0) { throw 'Install failed' }
foreach ($step in @('format:check','lint','typecheck','build')) {
    $name = $step.Replace(':','-')
    pnpm run $step 2>&1 | Tee-Object "validation-results/$name.txt"
    if ($LASTEXITCODE -ne 0) { $failed += $step }
}
$failed | Set-Content validation-results/failed-steps.txt
if ($failed.Count) { throw "Failed: $($failed -join ', ')" }
