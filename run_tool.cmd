@echo off
setlocal

set "ROOT=%~dp0"
set "SCRIPT=%ROOT%tools\invest_research_tool.py"
set "BUNDLED_PY=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if exist "%ROOT%.venv\Scripts\python.exe" (
  set "PYTHON_EXE=%ROOT%.venv\Scripts\python.exe"
  goto run_python
)

where python >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_EXE=python"
  goto run_python
)

where py >nul 2>nul
if not errorlevel 1 (
  py -3 "%SCRIPT%" %*
  exit /b %ERRORLEVEL%
)

if exist "%BUNDLED_PY%" (
  set "PYTHON_EXE=%BUNDLED_PY%"
  goto run_python
)

echo Python runtime was not found. Install Python 3 or run inside Codex with the bundled runtime. 1>&2
exit /b 1

:run_python
"%PYTHON_EXE%" "%SCRIPT%" %*
exit /b %ERRORLEVEL%
