param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $ToolArgs
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script = Join-Path $Root "tools\invest_research_tool.py"

$Candidates = @(
  (Join-Path $Root ".venv\Scripts\python.exe"),
  "python",
  "py",
  (Join-Path $HOME ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe")
)

foreach ($Candidate in $Candidates) {
  if (Test-Path -LiteralPath $Candidate) {
    & $Candidate $Script @ToolArgs
    exit $LASTEXITCODE
  }

  $Command = Get-Command $Candidate -ErrorAction SilentlyContinue
  if ($Command) {
    & $Command $Script @ToolArgs
    exit $LASTEXITCODE
  }
}

Write-Error "Python runtime was not found. Install Python 3 or run inside Codex with the bundled runtime."
exit 1
