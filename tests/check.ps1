# Falling Sand checks. Runs the page in headless Chrome with tests/driver.js added, prints the driver's PASS/FAIL
# report, saves a picture in tests/out, and exits 0 only when every check passes. Nothing opens on screen and the
# real mouse is never touched: the driver fakes the pointer and runs the physics itself.
#   powershell -ExecutionPolicy Bypass -File tests\check.ps1
param(
    [string]$Page = (Join-Path $PSScriptRoot '..\index.html'),
    [string]$Url,                      # a live address instead: its picture (at -Width x -Height) and its title
    [int]$Width = 1000, [int]$Height = 1200
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\tools\chrome.ps1')
$out = Join-Path $PSScriptRoot 'out'
New-Item -ItemType Directory -Force $out | Out-Null
$failed = 0

function Read-Report([string]$Dom, [string]$Log) {
    $m = [regex]::Match($Dom, '(?s)<pre[^>]*>(.*?)</pre>')
    if ($m.Success) {
        ([Net.WebUtility]::HtmlDecode($m.Groups[1].Value).Trim() -split "`n") | ForEach-Object { $_.TrimEnd() }
    } else { 'FAIL no report: the driver did not run' }
    foreach ($e in [regex]::Matches($Log, 'Uncaught[^\r\n]*')) { "JS ERROR (Chrome's log): $($e.Value)" }
}

if ($Url) {
    $shot = Join-Path $out 'live.png'
    Invoke-HeadlessChrome @("--window-size=$Width,$Height", "--screenshot=$shot", $Url) | Out-Null
    $dom = (Invoke-HeadlessChrome @('--dump-dom', $Url)).Out
    $title = [regex]::Match($dom, '<title>(.*?)</title>').Groups[1].Value
    if ($title -eq 'Falling Sand') { "PASS live page answers, title '$title'" } else { "FAIL live page title '$title'"; $failed++ }
    "picture: $shot ($((Get-Item $shot -ErrorAction SilentlyContinue).Length) bytes)"
    exit [int]($failed -gt 0)
}

# The page with the driver added, beside tests/out so `../driver.js` finds tests/driver.js.
$html = [IO.File]::ReadAllText((Resolve-Path $Page).Path)
$drive = Join-Path $out 'drive.html'
[IO.File]::WriteAllText($drive, $html.Replace('</body>', "<script src=`"../driver.js`"></script>`n</body>"))
$driveUrl = ConvertTo-FileUrl $drive

$run = Invoke-HeadlessChrome @('--window-size=1000,1900', '--enable-logging=stderr', '--v=0', '--dump-dom', $driveUrl)
$lines = @(Read-Report $run.Out $run.Err)
$lines | ForEach-Object { "  $_" }
$fails = @($lines | Where-Object { $_ -match '^(FAIL|JS ERROR|DRIVER ERROR)' })
$passes = @($lines | Where-Object { $_ -match '^PASS' })
$failed += $fails.Count

$shot = Join-Path $out 'check.png'
Invoke-HeadlessChrome @('--window-size=1000,1900', "--screenshot=$shot", $driveUrl) | Out-Null
"picture: $shot ($((Get-Item $shot -ErrorAction SilentlyContinue).Length) bytes)"

"$($passes.Count) passed, $($fails.Count) failed"
exit [int]($failed -gt 0)
