# Makes assets/og.png, the picture shown when someone shares the link (1200 x 630). The page builds a scene with its
# own engine (tools/og_scene.js) and draws it; headless Chrome hands the picture back through --dump-dom.
#   powershell -ExecutionPolicy Bypass -File tools\make_og.ps1
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'chrome.ps1')
$root = Split-Path $PSScriptRoot -Parent
$out = Join-Path $root 'tests\out'
New-Item -ItemType Directory -Force $out, (Join-Path $root 'assets') | Out-Null

$html = [IO.File]::ReadAllText((Join-Path $root 'index.html'))
$page = Join-Path $out 'og.html'
[IO.File]::WriteAllText($page, $html.Replace('</body>', "<script src=`"../../tools/og_scene.js`"></script>`n</body>"))
$run = Invoke-HeadlessChrome @('--window-size=1000,1200', '--dump-dom', (ConvertTo-FileUrl $page))
$m = [regex]::Match($run.Out, '<pre id="og-data">data:image/png;base64,([A-Za-z0-9+/=]+)</pre>')
if (-not $m.Success) { throw 'The page did not hand back a picture.' }

$bytes = [Convert]::FromBase64String($m.Groups[1].Value)
$png = Join-Path $root 'assets\og.png'
[IO.File]::WriteAllBytes($png, $bytes)
$w = [BitConverter]::ToUInt32([byte[]]$bytes[19..16], 0)    # PNG header: width and height, big-endian
$h = [BitConverter]::ToUInt32([byte[]]$bytes[23..20], 0)
"assets\og.png: $($bytes.Length) bytes, $w x $h"
exit [int]($w -ne 1200 -or $h -ne 630)
