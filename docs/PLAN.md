# Falling Sand: the plan (Gemini's `sand.html` made into Tim's website), written to be executed

For the model doing the work. Written by Fable 5.1 on 2026-10-16 from: Tim's five screenshots
(`Pictures\Screenshots\Screenshot (2481)` to `(2485)`: a Gemini chat called "Creating Local HTML Test Websites",
scrolling through the code of a page Gemini named `sand.html`; `(2480)` is Gemini's summary of it), and the code Tim
pasted, transcribed from the paste into `original/sand.html` (that copy is what the checks ran). Tim's words: *"make a plan to build those 5 screenshots i just took for a
website"*. The plain reading, and this plan's default: the page becomes its own small website at a public address.

Gemini's page was **run and checked** before this was written (headless Chrome, a fake mouse, nothing on Tim's
screen): the results are in "What the page does today", the pictures in `docs/evidence/`, the test in
`tests/driver.js`. Nothing else was built. Tim answers the decisions first ("1 ok, 2 b, 6 none"); until they do, the
**default** of each decision is the plan. Work the items in order. Each has Why, Where, Steps, Verify, Done when.
Commit after every item passes Verify; `docs/PROGRESS.md` gets a short entry in the same commit.

---------------------------------------------------------------------------------------------------------------------

## What the page does today (checked, not guessed)

Gemini's claims that hold: no dependencies, one file; six things to draw with (its "Void" is the eraser); the keys
1-6; gravity flips; it is fast - one physics step costs **under 0.1 ms** on this PC (0.05-0.10 across runs; 60 fps
allows 16.7), so "60 fps" is true here. The physics behaves: sand falls and piles into a heap, sinks through water;
water pools on a solid shelf and spreads (about 270 of 290 drops rested on a 71-column shelf, over about 65 columns);
fire creeps along dry wood; acid eats the sand pile (about 85 grains in 120 frames); with gravity flipped the sand
ends on the ceiling. Picture: `docs/evidence/original-check.png` (the report and six snapshots; the numbers move a
little from run to run - the engine rolls dice).

Faults, each seen:

1. **Dots, not lines.** The brush paints only where the pointer *is* on each frame; nothing joins one reading to the
   next. A fast swipe from x=20 to x=220 left wood in **10 columns** of a 205-column stroke. Anyone drawing quickly
   gets a dotted line.
2. **Fire is not put out by water.** The code's comment says fire "dies in water"; fire dropped onto a pool rose
   away and burned out on its own (3-5 cells still alight 20 frames later; fire placed deep under water does go out -
   only the surface escapes). Cause: the fire branch moves the flame
   *up* first, then runs its water check on the cell it just left, so `grid[idx] = 0` empties the vacated cell.
3. **Phones: nothing works.** Mouse events only - a finger draws nothing. No viewport tag. The box is a fixed 800 px
   wide: on a 390-px screen the HUD is cut off and the box runs off the right edge (`original-phone-390.png`).
4. **Short windows cut the box off.** `height: 100vh; overflow: hidden` on the body: at 1280 x 560 the lower part of
   the box is not shown and cannot be scrolled to (`original-short-1280x560.png`).
5. **Speed follows the screen.** One physics step per animation frame: a 120 Hz screen runs everything twice as fast,
   144 Hz 2.4x. Tim's own monitor is 60 Hz (RTX 3060, 1920 x 1080), so they would never see it; visitors would.
   (Read in the code, not measured - there is no fast screen here.)
6. Smaller: with the button held and the pointer dragged out of the box it keeps painting at the last spot (about
   150 grains in 20 frames); fire's life counter is an 8-bit number that wraps to 255 on its way to 0 (harmless today);
   no title, description or icon for a shared link; "Grav: Down", "[1] Sand" and "60 FPS" are not plain words; no
   tooltips; the box has no accessible name; number keys are the only hint of the shortcuts.

Not faults, just Gemini's tuning (kept): fire creeps slowly along wood (about 20 of 228 cells in 300 frames), the 75 %
brush density, fire life 25-55 frames, acid's 25 % / 15 % chances, the 240 x 150 grid, the palette.

---------------------------------------------------------------------------------------------------------------------

## Decisions for Tim

Each has a recommended default (a) and alternatives. Answer like "1 ok, 2 b, 6 B3 B4".

1. **Name and address.** (a) *default:* **Falling Sand** (what this kind of toy has been called since the 2000s),
   folder `Claude Projects\falling-sand`, repo `twistedtimmy/falling-sand`, address
   `https://twistedtimmy.github.io/falling-sand/`. (b) Another name - say it; folder, repo and address follow it.
   (c) Your own domain later: any registrar, one CNAME record, GitHub gives the HTTPS certificate free.
2. **Where it lives.** (a) *default:* **GitHub Pages**, a public repo. The page is public anyway and holds no
   secrets; the git login already saved on this PC can create the repo and switch Pages on through GitHub's API, so
   nothing new is installed (`gh` is not on this PC) and nothing is typed or printed. (b) Cloudflare Pages or Netlify
   (a drag-and-drop upload; needs an account there). (c) Inside another site of yours - name it. (d) No website:
   keep it a local file, fixed up.
3. **Phones and tablets.** (a) *default:* **yes** - a finger draws, the box fits any screen, the buttons are big
   enough for a thumb. (b) Desktop only, as written.
4. **Gemini's engine.** (a) *default:* **keep it** - same look, same six things, same feel - and fix faults 1-6 only.
   (b) Change nothing in the engine; only the words and the layout. (c) A bigger engine (more things to draw with):
   that is Tier B, after it is live.
5. **Words on the page** (plain English, over-explained, as in all your apps). (a) *default:* the exact words in S2
   step 8: title "Falling Sand"; one line under it; the box right under that (the result first, words after); "What
   each one does" under the box; the footer "Made by Tim. Everything runs in your browser; nothing you draw is sent
   anywhere." (b) Just the box, no words. (c) Your words - write them in.
6. **Extras after it is live** (Tier B; *default: none*): **B1** pause / one step / speed; **B2** more things to
   draw with (stone, oil, steam, plant, lava); **B3** a "Save a picture" button; **B4** share a drawing by link;
   **B5** a bigger box; **B6** a light theme; **B7** open the live address once inside Ball World's browser as a
   check of its new sandbox on a 60 fps page. Pick by letter.

---------------------------------------------------------------------------------------------------------------------

## 0. Working rules

- **Home:** `Claude Projects\falling-sand\` (renamed with decision 1). `index.html` is the site - one file, no build
  step, no framework, no external requests. `original/sand.html` is Gemini's code, transcribed from Tim's paste, and
  is **never edited**; it is there to compare against. `tests/` holds the checks, `docs/` this plan, `PROGRESS.md` and
  `evidence/`. `assets/` only for `og.png` (the link preview picture) once S2 makes it.
- **Public repo = the noreply identity.** Commits use the identity already in git's global config
  (`twistedtimmy <twistedtimmy@users.noreply.github.com>`). **Never** pass a `-c user.email=` override here (the
  personal address used for other, private repos); one commit with it is in public history for good. Commit line:
  `git commit -q -F <msgfile>`, the message written with the Write tool, ending
  `Co-Authored-By: Claude <model> <noreply@anthropic.com>`. One commit per item.
- **Tests run headless only.** `tests\check.ps1` runs Chrome with `--headless=new` and its own throwaway
  `--user-data-dir` under the scratchpad; no window ever opens on Tim's screen; the real mouse never moves (the
  driver fakes events). Found while writing this: neither `--virtual-time-budget` nor `--timeout` advances
  animation frames in headless Chrome, so the driver runs the page's physics itself (`step()`), synchronously,
  during load. The exit code is the result: `check.ps1` exits 0 only when every line is PASS. At the end Tim opens
  the link themselves - no smoke launch by the model.
- **Secrets:** none in this project. The GitHub token for S3 comes from `git credential fill` inside the script,
  lives in a variable, goes into one request header, and is never printed, logged or written to a file.
- **Pitfalls:** write files with the Write tool (PowerShell `py -c` quoting mangles code); keep JavaScript in files
  (`$` and backticks inside PowerShell strings get eaten); `file://` URLs need forward slashes; the Write tool
  cannot make a byte-exact copy of a binary - copy pictures with `Copy-Item`; a plain `& chrome.exe ... --dump-dom`
  capture comes back empty - a .NET process with redirected output (what `tools/chrome.ps1` does) or a `cmd /c ...
  > file` redirect both get the whole page; give every headless run its own `--user-data-dir`.
- **Keep Gemini's knobs** (palette, grid, densities, lives, chances) unless an item says otherwise.
- Plain English everywhere a visitor reads: no "fps", "grav", "CA", "brush radius".

---------------------------------------------------------------------------------------------------------------------

## Tier A: ship it (about half a day)

### S1 The project, with the page exactly as Gemini wrote it (20 min)

**Why.** A known starting point: the checks run against the untouched page first, so every later change is measured.

**Where.** `Claude Projects\falling-sand\`. Already there from the planning: `docs/PLAN.md`, `docs/evidence/*.png`,
`original/sand.html`, `tests/driver.js` (the driver that produced the evidence; it still reaches the page's
top-level `const`s by name, which S2 replaces with a proper hook).

**Steps.**
1. `index.html` = a copy of `original/sand.html`. `README.md` (three lines for now: what it is, "not live yet", how
   to run the checks). `.gitignore` with `tests/out/`. `.nojekyll` (GitHub Pages then serves files as they are).
2. `tests/check.ps1`: builds `tests/out/drive.html` = `index.html` with `<script src="../driver.js"></script>` before
   `</body>` (from `tests/out/` that path is `tests/driver.js` - no copy needed), runs Chrome **twice** through
   `tools/chrome.ps1` (one helper: finds Chrome, a throwaway profile per run under the temp folder - two runs
   sharing one profile made the second exit with nothing - output read through a .NET process, a time limit, the
   profile removed after): once with `--dump-dom` - parse the `<pre>` report: count `PASS`/`FAIL`, print the lines,
   exit 1 on any FAIL, on a `JS ERROR` / `DRIVER ERROR` line, or on an `Uncaught` error in Chrome's log; and once
   with `--screenshot=tests/out/check.png --window-size=1000,1900`. Parameters: `-Page <path>` (default
   `index.html`), `-Width/-Height` for the plain-page shots used in S2, `-Url` for S3's live check. The driver seeds
   the dice (`Math.random`) first, so a run repeats exactly and a check can't pass or fail on luck.
3. `docs/PROGRESS.md` started. `git init -b main`, first commit.

**Verify.** `tests\check.ps1` exits **1** with exactly the two known FAIL lines (the swipe: ~10 columns; fire
touching water: flames written straight into the grid on top of the pool's surface water, still alight after one
step) and everything else PASS, including "fire placed deep under water: 0 cells" (a tank 20 rows deep, written
straight into the grid). Fire brushed onto the pool is an `info:` line, not a check: a brush cell above the surface
isn't touching water, and a correct engine lets it rise. `check.png` matches `docs/evidence/original-check.png` in
substance.

**Done when.** The checks run from a clean clone of the folder and report what the evidence shows.

### S2 Make it a real web page (2-3 hours)

**Why.** Faults 1-6, phones (decision 3), and the words (decision 5) - the page people actually get.

**Where.** `index.html` only (plus `assets/og.png`). Keep it one file.

**Steps.**
1. **Test hook first**, so the driver stops depending on leaked `const`s: at the end of the page's script,
   `window.sim = { step, draw, advance, resetClock, grid, life, W, H, get stepsDone() {...}, setPointer(x, y, down) }`
   (`resetClock()`: the next `advance` only records its stamp and runs no steps; the clock gap is clamped to
   `[0, 100]` ms, so a stamp earlier than the last never runs anything). The driver uses only `window.sim` and real
   DOM events from here on. Hidden from visitors; costs nothing.
2. **Head:** `<meta name="viewport" content="width=device-width, initial-scale=1">`; `<title>Falling Sand</title>`;
   `<meta name="description" content="Draw with sand, water, wood, fire and acid, then watch what happens. A small
   toy that runs in your browser.">`; Open Graph title, description and `og:image` = `assets/og.png` (1200 x 630,
   made in step 10); a favicon as an inline SVG data URL: a 2 x 2 of the page's own colours (sand gold, water blue,
   fire red, acid green).
3. **Layout (faults 3 and 4):** body is a normal column with 16 px side gutters and `overflow` left alone; everything
   centred in a 832-px column; the box `width: min(800px, 100%); height: auto; aspect-ratio: 8 / 5;` (the drawing
   stays 240 x 150 cells and `image-rendering: pixelated`); the HUD wraps; under `@media (pointer: coarse)` every
   button and the slider thumb are at least 44 x 44 px and the text 14 px. The dark palette stays (it is the page's
   look): `#0d0d11` page, `#181820` panels, `#e0e0e8` text. Focus rings: `:focus-visible { outline: 2px solid #fff;
   outline-offset: 2px }`.
4. **Pointer events (fault 3, fault 6a):** `pointerdown` (primary pointer only; `setPointerCapture`;
   `preventDefault`), `pointermove`, `pointerup` / `pointercancel` / `lostpointercapture` → up. `touch-action: none`
   and `-webkit-user-select: none` on the box. Painting happens only for cells inside the box, so dragging out stops
   at the edge and coming back (button still held) resumes - capture makes the release reliable either way.
5. **Lines, not dots (fault 1):** remember the last painted cell; each frame, paint the brush along the straight
   line from it to the current cell (one stamp per cell of the longer axis), then move the memory. On `pointerdown`
   the memory is the press point. Density per stamp stays 75 %.
6. **Fire and water (fault 2), and the counter wrap (6b).** In the fire branch, in this order: (i) if any of the 8
   neighbours is water → the flame goes out (`grid[idx] = 0`, `continue`); (ii) `if (life[idx] === 0) { out;
   continue } life[idx]--`; (iii) ignite neighbouring wood (6 %, as today); (iv) rise into an empty cell above (as
   today). Nothing else in the engine changes.
7. **Fixed speed (fault 5):** `advance(now)`: an accumulator at 60 steps a second, the gap clamped to 100 ms
   (returning to a background tab does not fast-forward), `while (acc >= 1000/60) step()`, then one `draw()`.
   `requestAnimationFrame(loop)` calls `advance`. On a 60 Hz screen it is identical to today.
8. **Words (decision 5a).** Title `<h1>Falling Sand</h1>`; the line *"Draw with sand, water, wood, fire and acid,
   then watch what happens."*; the HUD; the box; then **"What each one does"**:
   - **Sand** - falls and piles up. Sinks through water.
   - **Water** - flows sideways and fills the lowest spot. Puts fire out.
   - **Wood** - stays where you draw it. Burns.
   - **Fire** - rises, burns wood, and goes out on its own after a moment.
   - **Acid** - eats whatever it touches, and is used up doing it.
   - **Eraser** - rubs things out.
   - **Brush size** - how big your drawing tip is. **Gravity** - flip it and everything falls the other way.
     **Clear the box** - empties it (there is no undo).
   - *"Keys 1 to 6 pick what you draw with."* - shown only where there is a keyboard (`@media (hover: hover)`).
   Footer: *"Made by Tim. Everything runs in your browser; nothing you draw is sent anywhere."*
   Buttons read **Sand, Water, Wood, Fire, Acid, Eraser** with a small key badge (1-6) and the legend sentence as
   their `title`; the gravity button reads **"Gravity: down"** / **"Gravity: up"** (title "Flip it and everything falls
   the other way"); **"Clear the box"**; the slider's label **"Brush size"** with `<label for>`; the frame counter
   reads **"60 a second"** with the title "How smoothly it runs - 60 is perfect", hidden on touch screens.
9. **Accessibility:** the box gets `role="img"` and `aria-label="The sandbox. Draw in it with the mouse or a
   finger."`; the chosen material button has `aria-pressed="true"`; everything reachable by Tab; contrast stays
   above 4.5:1 (the grey counter `#888` on `#181820` is 5.1:1 - keep it or lighten, never darken).
10. **The link picture:** `tools/make_og.ps1` loads `index.html` headless with a "scene" driver (sand heap, a wood
    shelf with water, a small fire), draws the box at 1200 x 630 onto an offscreen canvas with smoothing off, puts the
    PNG data URL into the DOM, and `--dump-dom` + PowerShell decode it to `assets/og.png`. No new tools.

**Verify.** `tests\check.ps1` exits **0**, its lines now: swipe ≥ 150 columns; sand; water; fire along wood; fire
touching water (written on top of the pool's surface) → 0 after one step; fire deep under water → 0; acid; gravity;
**fixed speed**: after
`sim.resetClock()`, feeding `advance` the stamps 1000, 1008, 1016, 1024, 1032, 1040 runs exactly 2 steps (40 ms of
clock), 240 calls 8.33 ms apart run 119-120, one call 5 s after the last runs 5 or 6 (the 100 ms clamp); **touch**: a `PointerEvent` with `pointerType: 'touch'` paints; **keys**: `3` makes Wood `aria-pressed`;
**no errors**; step cost < 1 ms. Then the plain page at three sizes: `--window-size=1000,1200` (desktop),
`390,844` (phone: the driver logs `scrollWidth <= innerWidth` and the box ≥ 350 px wide - PASS lines, not
eyeballing), `1280,560` (short: body `overflow` not `hidden`, the box's bottom reachable by scrolling). Pictures in
`tests/out/`; look at all three. `assets/og.png` exists, 1200 x 630, and shows the scene. Optional, if Tim's Website
Auditor (Accessibility Suite) has a command line: run it on `index.html` and fix what it flags; if it has none, Tim
runs it from the Suite later.

**Done when.** Exit 0, the three pictures read right, and `original/sand.html` is untouched (`git diff --stat` shows
only `index.html`, `assets/`, `tests/`, `tools/`, docs).

### S3 Put it on the web (30 min, plus GitHub's wait)

**Why.** Decision 2a.

**Where.** `tools/publish.ps1`; GitHub's API; the repo `twistedtimmy/falling-sand`.

**Steps.**
1. Token: `git credential fill` with `protocol=https`, `host=github.com` → the `password=` line is the token; keep it
   in a variable; never echo it, never `-Verbose`.
2. `POST https://api.github.com/user/repos` `{ "name": "falling-sand", "description": "Draw with sand, water, wood,
   fire and acid, then watch what happens.", "private": false, "has_wiki": false, "has_projects": false,
   "auto_init": false }`. **If it answers 403 or 404** (the saved login lacks the scope): stop and tell Tim the two
   clicks - *github.com/new → name `falling-sand` → Public → Create repository*; then *Settings → Pages → Build and
   deployment: Deploy from a branch → main, / (root) → Save* - and continue from step 3 when they say done.
3. `git remote add origin https://github.com/twistedtimmy/falling-sand.git`; `git push -u origin main`.
4. `POST /repos/twistedtimmy/falling-sand/pages` `{ "build_type": "legacy", "source": { "branch": "main", "path":
   "/" } }`; then `PATCH /repos/twistedtimmy/falling-sand` with `homepage` = the address.
5. Wait: `GET /repos/.../pages` until `status` is `built`, then `GET https://twistedtimmy.github.io/falling-sand/`
   until 200 (poll every 20 s, give up after 10 min and say so).
6. README gets the address at the top.

**Verify.** The live address answers 200; the SHA-256 of the fetched HTML equals the local `index.html`'s; `check.ps1
-Width 1000 -Height 1200 -Url <address>` screenshots the live page and it reads right; `git status` clean; the
repo page shows "public".

**Done when.** The link works in a headless fetch and Tim has it.

### S4 Hand-over (15 min)

**Steps.** README in plain English: what it is, the address, where each word and colour lives in `index.html`, how
to publish a change (`git add -A`, commit, `git push` - live about a minute later), how to run the checks.
`docs/PROGRESS.md` complete. Memory note updated (`project-falling-sand`). The report to Tim: the link; what to try;
what no test could do - a real finger on a real phone, a real mouse, how it *feels*; that nobody has looked at it on
a screen but through the pictures.

---------------------------------------------------------------------------------------------------------------------

## Tier B: only the letters Tim picks (decision 6)

- **B1 Pause, one step, speed (half a day).** Space pauses (button "Pause" / "Go"), "." runs one step, a speed
  switch Slow / Normal / Fast = 30 / 60 / 120 steps a second in `advance`. Verify: the step counter.
- **B2 More things to draw with (a day).** Stone (stays, acid eats it slowly), oil (floats on water, burns fast),
  steam (rises, turns back into water after a while - uses `life`), plant (grows into touching water, burns), lava
  (flows slowly, lights wood, water touching it makes steam and stone). Each is one rule block in `step()` and one
  palette entry; on phones the HUD scrolls sideways. Verify: one PASS line per thing.
- **B3 Save a picture (1 hour).** A button that downloads `falling-sand.png` at 4x with crisp pixels (offscreen
  canvas, smoothing off, `toBlob`). Verify: the driver checks the blob's size and dimensions.
- **B4 Share by link (half a day).** The grid run-length-encoded and base64url'd into `#…`; typical drawings are a
  few KB; over 8 KB the page says "Too detailed to share by link - save a picture instead." Opening such a link
  loads the drawing. Verify: encode → decode round trip equals the grid.
- **B5 A bigger box (1 hour).** A switch Small / Big = 240 x 150 / 480 x 300 cells (a step then costs about 0.2 ms).
  Verify: step cost logged under 1 ms.
- **B6 A light theme (1 hour).** `prefers-color-scheme` plus a switch; the box itself stays black (the colours are
  tuned for it).
- **B7 In Ball World's browser (30 min).** An autotest run of Ball World that opens the live address in its sandboxed
  browser and dumps a frame: a check of the game's browser on a 60 fps page, no change to the game. Follows Ball
  World's own test rules (never while Tim plays).

---------------------------------------------------------------------------------------------------------------------

## Order

S1 → S2 → S3 → S4 (about half a day), then Tier B in the order picked. Nothing here changes Ball World, PulseDial
or any other project; nothing is installed on this PC.
