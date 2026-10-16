$ErrorActionPreference = 'Stop'
$newjobRoot = $PSScriptRoot
$newjobUrl = 'http://127.0.0.1:4317'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) { Write-Host 'NewJob needs Node.js 22.13 or newer. Install it from https://nodejs.org, then open this launcher again.'; Read-Host 'Press Enter to close'; exit 1 }
if (-not (Test-Path -LiteralPath (Join-Path $newjobRoot 'node_modules/pdfjs-dist/package.json'))) {
 Push-Location $newjobRoot
 try { & npm.cmd install --no-audit --no-fund; if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' } } finally { Pop-Location }
}
$running = $false
try { $status = Invoke-RestMethod ($newjobUrl + '/api/status') -TimeoutSec 2; $running = $status.name -eq 'NewJob' } catch {}
if (-not $running) {
 New-Item -ItemType Directory -Force -Path (Join-Path $newjobRoot 'data') | Out-Null
 $process = Start-Process -FilePath $nodeCommand.Source -ArgumentList @('server.mjs') -WorkingDirectory $newjobRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $newjobRoot 'data/server.log') -RedirectStandardError (Join-Path $newjobRoot 'data/server-error.log') -PassThru
 $process.Id | Set-Content -LiteralPath (Join-Path $newjobRoot 'data/server.pid')
 for ($i=0; $i -lt 30; $i++) { try { $status=Invoke-RestMethod ($newjobUrl+'/api/status') -TimeoutSec 2; if ($status.name -eq 'NewJob') {$running=$true;break} } catch {}; Start-Sleep -Milliseconds 400 }
}
if (-not $running) { Write-Host 'NewJob could not start. Check data/server-error.log or whether port 4317 is already in use.'; Read-Host 'Press Enter to close'; exit 1 }
Start-Process $newjobUrl
