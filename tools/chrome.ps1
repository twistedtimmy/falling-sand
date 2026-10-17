# Headless Google Chrome for the checks and the link picture. Dot-source it, then call Invoke-HeadlessChrome.
# Each run gets its own throwaway profile folder (removed afterwards), nothing opens on screen, and what Chrome
# printed comes back as text. (A plain `& chrome.exe ...` capture comes back empty; a .NET process with redirected
# output gets everything.)

function Find-Chrome {
    $places = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    foreach ($c in $places) { if ($c -and (Test-Path $c)) { return $c } }
    throw 'Google Chrome was not found.'
}

# A file path as a file:/// address (spaces become %20).
function ConvertTo-FileUrl([string]$Path) { ([Uri](Resolve-Path $Path).Path).AbsoluteUri }

# Runs headless Chrome once. Returns @{ Out = what it printed; Err = its log; Code = exit code }.
function Invoke-HeadlessChrome([string[]]$ChromeArgs, [int]$TimeoutSec = 90) {
    $chrome = Find-Chrome
    $profileDir = Join-Path ([IO.Path]::GetTempPath()) ('falling-sand-' + [guid]::NewGuid().ToString('N'))
    $all = @('--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
             '--disable-extensions', '--mute-audio', "--user-data-dir=$profileDir") + $ChromeArgs
    $line = ($all | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join ' '
    $psi = New-Object Diagnostics.ProcessStartInfo $chrome, $line
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $p = [Diagnostics.Process]::Start($psi)
    $out = $p.StandardOutput.ReadToEndAsync()
    $err = $p.StandardError.ReadToEndAsync()
    if (-not $p.WaitForExit($TimeoutSec * 1000)) {
        & taskkill.exe /PID $p.Id /T /F 2>&1 | Out-Null    # only the Chrome this function started
        throw "Chrome did not finish within $TimeoutSec s."
    }
    $result = @{ Out = $out.Result; Err = $err.Result; Code = $p.ExitCode }
    for ($i = 0; $i -lt 10 -and (Test-Path $profileDir); $i++) {
        Start-Sleep -Milliseconds 300
        Remove-Item $profileDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    $result
}
