# Falling Sand checks. Runs the page in headless Chrome with tests/driver.js added: every physics, pointer, touch,
# key and speed check in a tall window, then how the page fits a desktop, a phone and a short laptop window. Prints
# the driver's PASS/FAIL lines, saves pictures in tests/out, and exits 0 only when every check passes. Nothing opens
# on screen and the real mouse is never touched: the driver fakes the pointer and runs the physics itself.
#   powershell -ExecutionPolicy Bypass -File tests\check.ps1
#   powershell -ExecutionPolicy Bypass -File tests\check.ps1 -Url https://twistedtimmy.github.io/falling-sand/
param(
    [string]$Page = (Join-Path $PSScriptRoot '..\index.html'),
    [string]$Url,                      # a live address instead: its picture (at -Width x -Height) and its title
    [int]$Width = 1000, [int]$Height = 1200
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\tools\chrome.ps1')
$out = Join-Path $PSScriptRoot 'out'
New-Item -ItemType Directory -Force $out | Out-Null

function Read-Report([hashtable]$Run) {
    $m = [regex]::Match($Run.Out, '(?s)<pre id="report"[^>]*>(.*?)</pre>')
    if ($m.Success) {
        ([Net.WebUtility]::HtmlDecode($m.Groups[1].Value).Trim() -split "`n") | ForEach-Object { $_.TrimEnd() }
    } else { 'FAIL no report: the driver did not run' }
    foreach ($e in [regex]::Matches($Run.Err, 'Uncaught[^\r\n]*')) { "JS ERROR (Chrome's log): $($e.Value)" }
}
# Headless Chrome won't make a window narrower than 500 px (and a --dump-dom window loses some height too), so each
# size is a frame of exactly that size inside a host page.
function New-Frame([string]$Src, [int]$W, [int]$H, [string]$Name) {
    $file = Join-Path $out $Name
    [IO.File]::WriteAllText($file, "<!DOCTYPE html><html><head><meta charset=`"UTF-8`"><style>html,body{margin:0;background:#0d0d11}iframe{display:block;border:0}</style></head><body><iframe src=`"$Src`" width=`"$W`" height=`"$H`"></iframe></body></html>")
    ConvertTo-FileUrl $file
}
function Save-Picture([string]$Address, [int]$W, [int]$H, [string]$Name) {
    $file = Join-Path $out $Name
    Invoke-HeadlessChrome @("--window-size=$W,$H", "--screenshot=$file", $Address) | Out-Null
    "picture: tests\out\$Name ($((Get-Item $file -ErrorAction SilentlyContinue).Length) bytes)"
}

if ($Url) {
    Save-Picture $Url $Width $Height 'live.png'
    $dom = (Invoke-HeadlessChrome @('--dump-dom', $Url)).Out
    $title = [regex]::Match($dom, '<title>(.*?)</title>').Groups[1].Value
    if ($title -eq 'Falling Sand') { "PASS the live page answers, title '$title'"; exit 0 }
    "FAIL the live page's title is '$title'"; exit 1
}

# The page with the driver added, in tests/out so that `../driver.js` is tests/driver.js.
$html = [IO.File]::ReadAllText((Resolve-Path $Page).Path)
$drive = Join-Path $out 'drive.html'
[IO.File]::WriteAllText($drive, $html.Replace('</body>', "<script src=`"../driver.js`"></script>`n</body>"))
$driveUrl = ConvertTo-FileUrl $drive
$pageUrl = ConvertTo-FileUrl $Page
$dump = @('--enable-logging=stderr', '--v=0', '--dump-dom')

$lines = @(Read-Report (Invoke-HeadlessChrome (@('--window-size=1000,2200') + $dump + $driveUrl)))
$pics = @(Save-Picture $driveUrl 1000 2200 'check.png')
foreach ($s in @(@(1000, 1200, 'desktop'), @(390, 844, 'phone'), @(1280, 560, 'short'))) {
    # The layout checks write into the host page, which needs file pages to reach each other.
    $frame = New-Frame "$driveUrl#layout" $s[0] $s[1] "layout-$($s[2]).html"
    $lines += @(Read-Report (Invoke-HeadlessChrome (@('--window-size=1400,1400', '--allow-file-access-from-files') + $dump + $frame)))
    $plain = New-Frame $pageUrl $s[0] $s[1] "plain-$($s[2]).html"
    $pics += Save-Picture $plain $s[0] $s[1] "plain-$($s[2]).png"
}
$lines | ForEach-Object { "  $_" }
$pics
$fails = @($lines | Where-Object { $_ -match '^(FAIL|JS ERROR|DRIVER ERROR)' })
"$(@($lines | Where-Object { $_ -match '^PASS' }).Count) passed, $($fails.Count) failed"
exit [int]($fails.Count -gt 0)
