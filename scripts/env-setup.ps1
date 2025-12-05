#!/usr/bin/env pwsh
<#
Set up a Python virtual environment and install backend requirements.
Run this from the project root: `pwsh -File .\scripts\env-setup.ps1`
#>
Write-Host "Setting up Python virtualenv and installing backend requirements..."

# Locate python or py launcher
$pythonCmd = $null
try { $pythonCmd = (Get-Command python -ErrorAction Stop).Source } catch { }
if (-not $pythonCmd) {
  try { $pythonCmd = (Get-Command py -ErrorAction Stop).Source } catch { }
}

if (-not $pythonCmd) {
  Write-Error "No 'python' or 'py' command found in PATH. Install Python 3 and try again."
  exit 1
}

Write-Host "Using Python: $pythonCmd"

# Create venv
& $pythonCmd -m venv .venv
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to create virtual environment (.venv)."
  exit 1
}

$venvPython = Join-Path $PWD ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) { $venvPython = $pythonCmd }

Write-Host "Upgrading pip and installing backend requirements..."
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r .\backend\requirements.txt
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to install requirements. Check the output above for errors."
  exit 1
}

Write-Host "Setup complete.`nActivate the environment with:`n  .\.venv\Scripts\Activate.ps1`nThen run the backend:`n  python .\backend\manage.py runserver"
