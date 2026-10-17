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
