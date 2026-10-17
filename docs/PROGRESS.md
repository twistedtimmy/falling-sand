# Falling Sand: progress

One entry per item of `docs/PLAN.md`, written in the same commit as the work. Tim gave no answers to the plan's
decisions, so every default (a) applies: the name Falling Sand, GitHub Pages from a public repo, phones supported,
Gemini's engine kept with only the faults fixed, the plan's words, no extras.

- **S1 done - the project, with Gemini's page untouched as `index.html`.** `README.md`, `.gitignore` (`tests/out/`),
  `.nojekyll`, `.gitattributes` (`* text=auto eol=lf`: this PC's git turns files into CRLF on checkout otherwise, and
  S3 compares the served page byte for byte). `tools/chrome.ps1`: one helper for every headless run - finds Chrome, a
  throwaway profile per run, output read through a .NET process (a plain `& chrome.exe` capture comes back empty), a
  time limit, the profile removed after. `tests/check.ps1`: the page plus `tests/driver.js` → the report (exit 1 on
  any FAIL, `JS ERROR`, `DRIVER ERROR` or `Uncaught` in Chrome's log) and `tests/out/check.png`. The driver now seeds
  the dice first (a run repeats exactly), and its fire test is the exact case: flames written straight onto the
  pool's surface water must be out after one step; fire brushed onto the pool became an `info:` line (a brush cell
  above the surface isn't touching water; a correct engine lets it rise). The plan's text was corrected to match
  (and its personal email address taken out - this repo will be public).
- **S2 done - a real web page.** `index.html` keeps Gemini's engine (palette, grid, six materials, rules, 75 % grain)
  and fixes the faults: strokes join up - every cell within the brush of the line from the last spot to this one is
  painted **once** at 75 % (the plan said "one stamp per cell of the longer axis"; stacked stamps would roll each cell
  2r+1 times and make every stroke solid, so the grain would be lost); fire checks for water first, then burns down
  (the 8-bit counter no longer wraps), then lights wood, then rises; pointer events for mouse, finger and pen, with
  capture, moves followed on the whole page while pressed (a stroke dragged out stops at the edge, and goes on when it
  comes back), one finger at a time, and a quick tap still draws; 60 steps a second whatever the screen, painting
  inside the step so pouring is the same speed everywhere, gaps counted as 100 ms at most. The page: viewport tag,
  title, description, Open Graph with an absolute `og:image`, a favicon of the four colours, a normal page that
  scrolls, the box sized to fit the window's width **and height** (beyond the plan: the whole box is on screen down to
  a 1280 x 560 window - results first), thumb-sized controls (44 px) on touch screens and below 640 px wide (also
  beyond the plan: it makes them checkable headless), the plan's words (the counter's tooltip says "60 or more is
  perfect": a 120 Hz screen draws 120), `role="img"` and a label on the box, `aria-pressed` on the materials, focus
  rings, the key badges hidden from screen readers. `window.sim` is the test hook.
  Checks: `tests\check.ps1` exit 0, **36 passed, 0 failed** - the swipe 204 columns (was 10); fire touching water 0 of
  62 left (was 47 of 61); deep water 0; a finger draws, a second finger is ignored; key 3 picks Wood, Ctrl+1 is left
  to the browser; dragged out: 0 grains added; fixed speed exact (40 ms -> 2 steps, 2 s at 120 Hz -> 119, at 60 Hz ->
  120, after 5 s away -> 6); a step costs 0.1 ms; and at 1000 x 1200, 390 x 844 and 1280 x 560: no sideways scrolling,
  the box at least 350 px wide and wholly on screen, the page scrolls, thumb-sized controls at 390. Found on the way:
  headless Chrome won't make a window narrower than 500 px (a `--dump-dom` window also loses ~95 px of height), so the
  first "phone" run had really measured 500 x 749 - each size now runs in a frame of exactly that size. Pictures looked
  at: `tests/out/check.png`, `plain-desktop.png`, `plain-phone.png`, `plain-short.png`.
  `assets/og.png` (1200 x 630, 44 KB): `tools/make_og.ps1` has the page's own engine build a seeded scene (a sand heap
  with acid biting it, water on a shelf, a fire on a post) and draw it under the title. Tim's Website Auditor
  (`webpilot scan`, headless Edge, the page served on 127.0.0.1 for the scan, its results and settings in a scratch
  folder - Tim's own audits folder untouched): **0 problems, 0 to check by hand, 16 passed, no best-practice notes**;
  reflow at 640 px, text spacing, visible focus and Tab reach (9 stops) all pass.
  Not seen: the touch-screen-only styling (the counter and the key badges hidden) - headless Chrome is never a touch
  screen; that the page doesn't scroll while a finger draws (`touch-action: none`) on a real phone; how it feels.
- **S3 done - live at https://twistedtimmy.github.io/falling-sand/.** `tools/publish.ps1` (safe to run again): reads
  the GitHub login git already keeps on this PC (Git Credential Manager - the token stays in a variable, is never
  printed or written, and nothing pops up), checks it (`twistedtimmy`, scopes gist, repo, workflow), creates the
  public repo with its description and homepage, pushes main, switches Pages on (main, the top folder), then polls
  until the live page's bytes equal `index.html` (SHA-256) and the link picture answers. The first build took about
  30 seconds. Verify: the live address 200 with the same bytes as `index.html`; `assets/og.png` 200 `image/png`;
  `check.ps1 -Url` - the title PASS, and its picture is byte for byte the local desktop picture (45,078 bytes both);
  seen from outside with no login: public, homepage set, both commits by `twistedtimmy
  <twistedtimmy@users.noreply.github.com>`. Two bugs found on the way, both in the script: a .NET pipe on this PC
  starts with a byte-order mark, so git couldn't read `protocol=` (the question now goes in from a plain ASCII file);
  and PowerShell names ignore case, so a `$repo` result was the `[string]$Repo` parameter and became text.
- **S4 done - the hand-over.** `README.md` in plain English: the address; what it is and where it came from; where
  each word and colour lives in `index.html`; how to put a change online (`git push` - live about a minute later);
  how to run the checks and remake the link picture. After this commit's push, `tools\publish.ps1` once more: the live
  page still byte for byte `index.html`. Tier B: none picked (decision 6's default). Nobody has looked at the site on
  a real screen yet - only headless pictures; a real finger on a real phone, a real mouse, and how it feels are Tim's
  to try.
