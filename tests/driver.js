// Test driver for Gemini's sand.html: appended as a second <script>, so it shares the page's top-level
// consts (canvas, grid, W, H, step, draw). It fakes mouse events on the canvas (nothing touches the real mouse),
// paints each material in turn, reads the grid back, and writes a report + canvas snapshots into the page for the
// headless screenshot. Headless Chrome screenshots right after load and does not advance rAF for us, so the physics
// is run here, synchronously, by calling the page's own step().
(() => {
  // Seeded dice (mulberry32), before any step(): a run repeats exactly, so no check passes or fails on luck.
  let seed = 20261016;
  Math.random = () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const report = document.createElement('pre');
  report.style.cssText = 'color:#fff;font:13px/1.35 monospace;white-space:pre-wrap;width:960px;margin:10px 0 0';
  document.body.appendChild(report);
  const strip = document.createElement('div');
  strip.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;width:980px';
  document.body.appendChild(strip);
  document.body.style.cssText += ';height:auto;overflow:visible;justify-content:flex-start;padding-top:10px';
  const log = s => { report.textContent += s + '\n'; };
  window.addEventListener('error', e => log('JS ERROR: ' + e.message + ' @' + e.lineno));

  const mouse = (type, cx, cy) => {
    const r = canvas.getBoundingClientRect();
    const e = new MouseEvent(type, { clientX: r.left + (cx + 0.5) / W * r.width, clientY: r.top + (cy + 0.5) / H * r.height, bubbles: true });
    (type === 'mouseup' ? window : canvas).dispatchEvent(e);
  };
  const pick = id => document.querySelector(`.mat[data-id="${id}"]`).click();
  const brush = n => { const b = document.getElementById('brush'); b.value = n; b.dispatchEvent(new Event('input')); };
  const count = (t, x0 = 0, y0 = 0, x1 = W, y1 = H) => {
    let n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (grid[y * W + x] === t) n++;
    return n;
  };
  const cols = (t, x0 = 0, y0 = 0, x1 = W, y1 = H) => {
    const s = new Set();
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (grid[y * W + x] === t) s.add(x);
    return s;
  };
  const plank = (x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y * W + x] = 3; };
  const surfaceRow = (x0, x1, yMax) => { for (let y = 0; y < yMax; y++) for (let x = x0; x <= x1; x++) if (grid[y * W + x] === 2) return y; return -1; };
  const snap = label => {
    const box = document.createElement('div');
    box.style.cssText = 'width:480px;color:#ccc;font:12px monospace';
    const im = new Image(); im.src = canvas.toDataURL(); im.width = 480; im.style.imageRendering = 'pixelated';
    im.style.border = '1px solid #444';
    const cap = document.createElement('div'); cap.textContent = label;
    box.appendChild(im); box.appendChild(cap); strip.appendChild(box);
  };
  const check = (ok, what) => log((ok ? 'PASS ' : 'FAIL ') + what);
  const run = (frames, fn) => { for (let k = 0; k < frames; k++) step(); draw(); fn && fn(); };

  // A. A fast swipe: one mousemove from x=20 to x=220. Is the stroke joined up, or just two blobs?
  pick(3); brush(2); mouse('mousedown', 20, 40); run(1); mouse('mousemove', 220, 40); run(1); mouse('mouseup', 220, 40);
  const swipeCols = cols(3).size;
  check(swipeCols > 150, `fast swipe: wood landed in ${swipeCols} columns (a joined line from 20 to 220 would be ~205)`);
  document.getElementById('clearBtn').click();

  // B. Sand poured at the top-left falls and piles on the floor.
  pick(1); brush(5); mouse('mousedown', 40, 15); run(25); mouse('mouseup', 40, 15);
  run(150, () => {
    const total = count(1), floor = count(1, 0, H - 1, W, H), top = count(1, 0, 0, W, 20);
    check(total > 150 && floor > 0 && top === 0, `sand: ${total} grains, ${floor} on the floor row, ${top} left near the top`);
    snap('1  sand poured at the top-left, 150 frames later');
  });

  // C. Water poured onto a solid wood shelf (written straight into the grid) pools and spreads.
  plank(80, 150, 94, 96);
  pick(2); brush(4); mouse('mousedown', 115, 60); run(30); mouse('mouseup', 115, 60);
  run(150, () => {
    const water = count(2), onShelf = count(2, 80, 60, 151, 94), spread = cols(2, 80, 60, 151, 94).size;
    check(onShelf > 100 && spread > 40, `water: ${water} drops, ${onShelf} resting on the shelf, spread over ${spread} of its 71 columns`);
    snap('2  water poured on a solid wood shelf, 150 frames later');
  });

  // D. Fire lit at the right end of a dry plank: does it creep along the wood?
  plank(160, 235, 120, 122);
  const plankBefore = count(3, 160, 120, 236, 123);
  pick(4); brush(2); mouse('mousedown', 233, 121); run(8); mouse('mouseup', 233, 121);
  run(300, () => {
    const left = count(3, 160, 120, 236, 123), burnt = plankBefore - left;
    const remaining = cols(3, 160, 120, 236, 123); const maxX = Math.max(...remaining);
    check(burnt > 10, `fire on a dry plank: ${burnt} of ${plankBefore} wood cells burnt in 300 frames; wood now ends at x=${maxX} (was 235)`);
    snap('3  fire lit at the right end of the lower plank, 300 frames later');
  });

  // E. Fire touching water. The code's comment says fire "dies in water". The exact case first, written straight into
  // the grid: a flame on top of every surface water cell of the pool, touching it. Then, for information only, fire
  // brushed onto the pool the way a person would (a brush cell above the surface isn't touching water and may rise).
  const tops = [];
  for (let x = 82; x <= 148; x++) {
    for (let y = 40; y < 94; y++) {
      if (grid[y * W + x] === 2) { if (grid[(y - 1) * W + x] === 0) tops.push((y - 1) * W + x); break; }
    }
  }
  for (const i of tops) { grid[i] = 4; life[i] = 40; }
  run(1, () => {
    const left = count(4, 78, 0, 153, 94);
    check(tops.length > 20 && left === 0, `fire touching water: ${tops.length} flames written on top of the pool's surface water, ${left} still alight after one step`);
  });
  run(45);    // any flames that got away burn out (life 40) before the next test
  const surf = surfaceRow(105, 125, 94);
  pick(4); brush(1); mouse('mousedown', 115, surf); run(2); mouse('mouseup', 115, surf);
  const seen = [];
  run(2, () => seen.push(`+2f: ${count(4, 78, 0, 153, 94)}`));
  run(18, () => {
    seen.push(`+20f: ${count(4, 78, 0, 153, 94)}`);
    log(`info: fire brushed onto the pool (surface row ${surf}): fire cells over the pool ${seen.join(', ')}`);
    snap('4  fire on the pool: written on its water, then brushed on, 20 frames later');
  });
  // Deep water: a wood tank written into the grid (walls x=200 and x=230, floor y=50), 20 rows of water, fire 4 rows
  // above its floor - fully under water, nowhere near the surface.
  plank(200, 200, 20, 50); plank(230, 230, 20, 50); plank(200, 230, 50, 50);
  for (let y = 30; y < 50; y++) for (let x = 201; x < 230; x++) grid[y * W + x] = 2;
  pick(4); brush(1); mouse('mousedown', 215, 46); run(2); mouse('mouseup', 215, 46);
  run(2, () => check(count(4, 195, 0, 236, 52) === 0, `fire placed deep under water: ${count(4, 195, 0, 236, 52)} fire cells left after 2 frames`));

  // F. Acid poured onto the sand pile eats it.
  const sandBefore = count(1);
  pick(5); brush(3); mouse('mousedown', 40, 110); run(10); mouse('mouseup', 40, 110);
  run(120, () => {
    const sand = count(1);
    check(sand < sandBefore - 30, `acid: sand ${sandBefore} -> ${sand} (ate ${sandBefore - sand})`);
    snap('5  acid poured on the sand pile, 120 frames later');
  });

  // G. Pointer leaves the box while the button is held: does it keep painting at the last spot?
  const before = count(1);
  pick(1); brush(3); mouse('mousedown', 60, 60); run(20); mouse('mouseup', 60, 60);
  log(`info: button held 20 frames with no further mouse events: ${count(1) - before} grains were still added at the last spot`);

  // H. Gravity flipped: the sand ends up on the ceiling.
  document.getElementById('gravBtn').click();
  run(250, () => {
    const ceiling = count(1, 0, 0, W, 1), floor = count(1, 0, H - 1, W, H);
    check(ceiling > 0 && floor === 0, `gravity up: ${ceiling} grains on the ceiling row, ${floor} on the floor`);
    snap('6  gravity flipped, 250 frames later');
  });

  // I. Cost of one physics step, measured directly (the FPS label means nothing headless).
  const t0 = performance.now(); for (let i = 0; i < 100; i++) step(); const ms = (performance.now() - t0) / 100;
  log(`step() cost: ${ms.toFixed(3)} ms per frame (60 fps allows 16.7). DONE`);
})();
