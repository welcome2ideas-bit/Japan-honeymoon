$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$japanNodeCommand = Get-Command node -ErrorAction SilentlyContinue
$japanNodePath = if ($japanNodeCommand) { $japanNodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
if (-not (Test-Path -LiteralPath $japanNodePath)) { throw 'Instala Node.js 22 o posterior y ejecuta npm install y npm run dev.' }
$japanVitePath = Join-Path $PSScriptRoot 'node_modules\vite\bin\vite.js'
if (-not (Test-Path -LiteralPath $japanVitePath)) { throw 'Faltan las dependencias. Ejecuta npm install primero.' }
& $japanNodePath $japanVitePath --host 0.0.0.0
