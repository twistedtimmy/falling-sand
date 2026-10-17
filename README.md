# Falling Sand

**Play it: https://twistedtimmy.github.io/falling-sand/**

A small drawing toy. Pick sand, water, wood, fire or acid, draw in the box, and watch what happens: sand piles up and
sinks through water, water flows into the low spots and puts fire out, fire climbs and burns wood, acid eats what it
touches. It works with a mouse, a finger or a pen, and everything runs in your browser - nothing you draw is sent
anywhere.

It began as `sand.html`, a page Gemini wrote (kept exactly as it was in `original/sand.html`). The engine is still
Gemini's; this version fixes what didn't work (fast strokes drew dots, water didn't put fire out, phones couldn't
draw, the speed followed the screen) and makes it a proper web page. The whole story: `docs/PLAN.md` and
`docs/PROGRESS.md`.

## Where things are in `index.html`
- **The words**: the title and the line under it at the top of `<body>`; the button names, and the tips that show
  when you hover over them (`title="..."`), in the `hud` box; "What each one does" in the `legend` section; the line
  at the bottom in `<footer>`. What a shared link shows comes from the `og:` lines in `<head>`.
- **The colours of the page** (background, panels, text): `:root` at the top of `<style>`.
- **The colours in the box**: `PALETTE` in the script. They're written back to front: `0xFF3CC3F6` is sand, the colour
  `#F6C33C` (take the last six digits in pairs, starting from the right).
- **The coloured line under each button**: that button's `style="border-bottom: ..."`.
- **How each thing behaves**: `step()` in the script, one block each (`// 1: SAND`, `// 2: WATER`, `// 4: FIRE`,
  `// 5: ACID`; wood never moves).
- **The speed**: `STEP_MS` - 60 steps a second.

## Changing it and putting the change online
Edit `index.html`, run the checks (below), then:
```
git add -A
git commit -m "what you changed"
git push
```
GitHub rebuilds the site by itself; the change is live about a minute later. (`tools\publish.ps1` made the site the
first time and checks that the live page is exactly your `index.html` - it's safe to run again any time.)

## Checks
```
powershell -ExecutionPolicy Bypass -File tests\check.ps1
```
Runs the page in a hidden Chrome (nothing opens on the screen) and tries everything: each material, a fast swipe, a
quick tap, a finger, the number keys, dragging out of the box, the speed, and how the page fits a desktop, a phone
(390 x 844) and a short laptop window. It ends with "N passed, 0 failed" and exit code 0 when all is well, and saves
pictures in `tests\out`.

`powershell -ExecutionPolicy Bypass -File tools\make_og.ps1` remakes `assets/og.png`, the picture shown when someone
shares the link.
