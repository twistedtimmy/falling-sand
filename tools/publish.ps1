# Puts the site on GitHub Pages: creates the public repo if it isn't there, pushes main, switches Pages on (from main,
# the top folder), and waits until the live address serves exactly this index.html. Safe to run again.
# The GitHub login is the one git already keeps on this PC (Git Credential Manager): its token is read into a variable
# for the requests below and is never printed or written anywhere. Nothing pops up.
#   powershell -ExecutionPolicy Bypass -File tools\publish.ps1
param([string]$Owner = 'twistedtimmy', [string]$Repo = 'falling-sand')
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path $PSScriptRoot -Parent
$site = "https://$Owner.github.io/$Repo/"
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE = 'never'

function Get-GitToken {
    # The question goes in from a plain ASCII file: a .NET pipe on this PC starts with a byte-order mark, and git then
    # can't read "protocol=". The answer comes back through a pipe and never touches the disk.
    $ask = Join-Path ([IO.Path]::GetTempPath()) "falling-sand-ask-$PID.txt"
    [IO.File]::WriteAllBytes($ask, [Text.Encoding]::ASCII.GetBytes("protocol=https`nhost=github.com`n`n"))
    try {
        $psi = New-Object Diagnostics.ProcessStartInfo 'cmd.exe', "/d /c git credential fill < `"$ask`""
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $p = [Diagnostics.Process]::Start($psi)
        $out = $p.StandardOutput.ReadToEndAsync()
        $null = $p.StandardError.ReadToEndAsync()
        if (-not $p.WaitForExit(30000)) { & taskkill.exe /PID $p.Id /T /F 2>&1 | Out-Null; throw 'git credential fill did not answer.' }
    } finally { Remove-Item $ask -ErrorAction SilentlyContinue }
    $line = $out.Result -split "`n" | Where-Object { $_ -like 'password=*' } | Select-Object -First 1
    if (-not $line) { throw 'No GitHub login is saved for git on this PC.' }
    $line.Substring(9).Trim()
}

$token = Get-GitToken
$headers = @{ Authorization = "Bearer $token"; Accept = 'application/vnd.github+json'; 'X-GitHub-Api-Version' = '2022-11-28'; 'User-Agent' = 'falling-sand-publish' }
function Invoke-GitHub([string]$Method, [string]$Path, $Body) {
    $req = @{ Method = $Method; Uri = "https://api.github.com$Path"; Headers = $headers; UseBasicParsing = $true }
    if ($Body) { $req.Body = ($Body | ConvertTo-Json -Depth 5); $req.ContentType = 'application/json' }
    try {
        $r = Invoke-WebRequest @req
        @{ Status = [int]$r.StatusCode; Json = $(if ($r.Content) { $r.Content | ConvertFrom-Json }); Headers = $r.Headers }
    } catch {
        $resp = $_.Exception.Response
        if (-not $resp) { throw "GitHub could not be reached: $($_.Exception.Message)" }
        $text = ''
        try { $text = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd() } catch {}
        @{ Status = [int]$resp.StatusCode; Json = $(try { $text | ConvertFrom-Json } catch { $null }) }
    }
}

try {
    $me = Invoke-GitHub GET '/user'
    if ($me.Status -ne 200) { throw "GitHub did not accept the saved login (HTTP $($me.Status))." }
    $scopes = $me.Headers['X-OAuth-Scopes']
    "GitHub login: $($me.Json.login); token scopes: $(if ($scopes) { $scopes } else { '(none listed - a fine-grained token)' })"
    if ($me.Json.login -ne $Owner) { throw "The saved login is $($me.Json.login), not $Owner." }

    # 1. The repo: public, made here if missing. ($found, not $repo: PowerShell names ignore case, and [string]$Repo
    # would turn the answer into text.)
    $found = Invoke-GitHub GET "/repos/$Owner/$Repo"
    if ($found.Status -eq 404) {
        $made = Invoke-GitHub POST '/user/repos' @{
            name = $Repo; description = 'Draw with sand, water, wood, fire and acid, then watch what happens.'
            homepage = $site; private = $false; has_wiki = $false; has_projects = $false; auto_init = $false
        }
        if ($made.Status -ne 201) {
            "GitHub would not create the repo (HTTP $($made.Status): $($made.Json.message))."
            "By hand: github.com/new -> name '$Repo' -> Public -> Create repository; then run this again."
            exit 1
        }
        "created https://github.com/$Owner/$Repo (public)"
    } elseif ($found.Status -eq 200) {
        if ($found.Json.private) { throw "$Owner/$Repo exists and is private - not publishing into it." }
        "the repo is already there (public)"
    } else { throw "Looking up the repo: HTTP $($found.Status)." }

    # 2. Push.
    $remote = git -C $root remote 2>$null
    if (@($remote) -notcontains 'origin') { git -C $root remote add origin "https://github.com/$Owner/$Repo.git" }
    git -C $root push -q -u origin main
    if ($LASTEXITCODE -ne 0) { throw 'git push failed.' }
    "pushed main ($(git -C $root rev-parse --short HEAD))"

    # 3. Pages, from main, the top folder.
    $pages = Invoke-GitHub GET "/repos/$Owner/$Repo/pages"
    if ($pages.Status -eq 404) {
        $on = Invoke-GitHub POST "/repos/$Owner/$Repo/pages" @{ build_type = 'legacy'; source = @{ branch = 'main'; path = '/' } }
        if ($on.Status -notin 201, 409) {
            "Pages could not be switched on (HTTP $($on.Status): $($on.Json.message))."
            "By hand: https://github.com/$Owner/$Repo/settings/pages -> Deploy from a branch -> main, / (root) -> Save; then run this again."
            exit 1
        }
        "Pages switched on: main, / (root)"
    } else { "Pages already on ($($pages.Json.status))" }

    # 4. Wait until the live address serves exactly this commit's index.html (10 minutes at most).
    $want = (Get-FileHash (Join-Path $root 'index.html') -Algorithm SHA256).Hash
    $tmp = Join-Path ([IO.Path]::GetTempPath()) ("falling-sand-live-$PID.html")
    $deadline = (Get-Date).AddMinutes(10)
    $same = $false
    do {
        Start-Sleep -Seconds 15
        $status = (Invoke-GitHub GET "/repos/$Owner/$Repo/pages").Json.status
        $code = 0
        try { $code = [int](Invoke-WebRequest -UseBasicParsing -Uri "$($site)?v=$([DateTime]::UtcNow.Ticks)" -OutFile $tmp -PassThru -TimeoutSec 20).StatusCode } catch { if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode } }
        $same = $code -eq 200 -and (Get-FileHash $tmp -Algorithm SHA256).Hash -eq $want
        "  Pages build: $status; $site -> $code$(if ($same) { ', the same bytes as index.html' })"
    } until ($same -or (Get-Date) -gt $deadline)
    Remove-Item $tmp -ErrorAction SilentlyContinue
    if (-not $same) { "Not live after 10 minutes - GitHub may still be building; run this again later."; exit 1 }
    $og = Invoke-WebRequest -UseBasicParsing -Uri "$($site)assets/og.png" -Method Head
    "link picture: $($site)assets/og.png -> $([int]$og.StatusCode) $($og.Headers['Content-Type'])"
    "LIVE: $site"
} finally {
    $token = $null
    $headers = $null
}
