// Falling Sand test driver. tests/check.ps1 adds it to a copy of index.html (tests/out/drive.html) and reads the
// report back with headless Chrome's --dump-dom. It uses only the page's test hook (window.sim) and real DOM events -
// nothing touches the real mouse - and runs the physics itself through sim.step(), because headless Chrome does not
// run animation frames for us. Modes, from the address's #hash:
//   (none)   physics, pointer, touch, keys, speed and cost, with snapshots of the box for the picture
//   #layout  how the page fits the window it was opened in (nothing wide is added to the page)
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
  report.id = 'report';
  const log = s => { report.textContent += s + '\n'; };
  const check = (ok, what) => log((ok ? 'PASS ' : 'FAIL ') + what);
  const errors = [];
  window.addEventListener('error', e => { errors.push(e.message); log('JS ERROR: ' + e.message + ' @' + e.lineno); });

  const sim = window.sim;
  const canvas = document.getElementById('sim');
  if (!sim || !canvas) { document.body.appendChild(report); log('FAIL no test hook: window.sim is missing'); return; }
  const { W, H, grid, life } = sim;

  if (location.hash === '#layout') {
    report.style.display = 'none';
    // check.ps1 opens this page in a frame of the exact size (headless Chrome won't make a window narrower than
    // 500 px), so the report goes into the frame's host - the page Chrome hands back.
    (window.parent !== window ? window.parent.document : document).body.appendChild(report);
    const vw = innerWidth, vh = innerHeight, at = `at ${vw} x ${vh}`;
    const pageW = document.documentElement.scrollWidth;
    check(pageW <= vw, `no sideways scrolling ${at} (the page is ${pageW} px wide)`);
    const box = canvas.getBoundingClientRect(), minW = Math.min(350, vw - 40);
    check(box.width >= minW, `the box is ${Math.round(box.width)} x ${Math.round(box.height)} px ${at} (${minW} wide at least)`);
    check(box.bottom <= vh, `the whole box is on screen without scrolling ${at} (its bottom edge at ${Math.round(box.bottom)})`);
    const stuck = [document.documentElement, document.body].some(el => getComputedStyle(el).overflowY === 'hidden');
    check(!stuck, `the page can scroll ${at}`);
    if (vw <= 640) {
      const small = [...document.querySelectorAll('button, input')].filter(el => {
        const r = el.getBoundingClientRect();
        return r.height < 44 || r.width < 44;
      });
      check(small.length === 0, `buttons and the slider are thumb-sized, 44 px or more, ${at}` +
        (small.length ? ` - too small: ${small.map(el => el.textContent.trim() || el.id).join(', ')}` : ''));
    }
    check(document.title === 'Falling Sand' && document.querySelector('h1').textContent.trim() === 'Falling Sand',
      `the title and the heading read "Falling Sand" ${at}`);
    check(errors.length === 0, `no errors on the page ${at}`);
    return;
  }

  report.style.cssText = 'color:#fff;font:13px/1.35 monospace;white-space:pre-wrap;width:960px;margin:16px auto 0;text-align:left';
  document.body.appendChild(report);
  const strip = document.createElement('div');
  strip.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;width:980px;margin:8px auto 0';
  document.body.appendChild(strip);

  const pointer = (type, cx, cy, o = {}) => {
    const r = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent(type, {
      clientX: r.left + (cx + 0.5) / W * r.width, clientY: r.top + (cy + 0.5) / H * r.height,
      pointerId: o.id ?? 1, pointerType: o.type ?? 'mouse', isPrimary: o.primary ?? true,
      button: type === 'pointermove' ? -1 : 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true
    }));
  };
  const pick = id => document.querySelector(`.mat[data-id="${id}"]`).click();
  const brush = n => { const b = document.getElementById('brush'); b.value = n; b.dispatchEvent(new Event('input')); };
  const clear = () => document.getElementById('clearBtn').click();
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
    box.style.cssText = 'width:320px;color:#ccc;font:12px monospace;text-align:left';
    const im = new Image(); im.src = canvas.toDataURL(); im.width = 320; im.style.imageRendering = 'pixelated';
    im.style.border = '1px solid #444';
    const cap = document.createElement('div'); cap.textContent = label;
    box.appendChild(im); box.appendChild(cap); strip.appendChild(box);
  };
  const run = (frames, fn) => { for (let k = 0; k < frames; k++) sim.step(); sim.draw(); fn && fn(); };

  // A. A fast swipe: one move from x=20 to x=220 between two steps. Joined up, or two blobs?
  pick(3); brush(2);
  pointer('pointerdown', 20, 40); run(1); pointer('pointermove', 220, 40); run(1); pointer('pointerup', 220, 40);
  const swipe = cols(3).size;
  check(swipe >= 150, `fast swipe: wood landed in ${swipe} columns (a joined line from 20 to 220 is ~205)`);
  clear();

  // B. A quick tap: pressed and released before the next step.
  pointer('pointerdown', 120, 75); pointer('pointerup', 120, 75); run(1);
  check(count(3) > 0, `a quick tap (pressed and let go between two steps) still draws: ${count(3)} wood cells`);
  clear();

  // C. Sand poured at the top-left falls and piles on the floor.
  pick(1); brush(5); pointer('pointerdown', 40, 15); run(25); pointer('pointerup', 40, 15);
  run(150, () => {
    const total = count(1), floor = count(1, 0, H - 1, W, H), top = count(1, 0, 0, W, 20);
    check(total > 150 && floor > 0 && top === 0, `sand: ${total} grains, ${floor} on the floor row, ${top} left near the top`);
    snap('1  sand poured at the top-left, 150 steps later');
  });

  // D. Water poured onto a solid wood shelf (written straight into the grid) pools and spreads.
  plank(80, 150, 94, 96);
  pick(2); brush(4); pointer('pointerdown', 115, 60); run(30); pointer('pointerup', 115, 60);
  run(150, () => {
    const water = count(2), onShelf = count(2, 80, 60, 151, 94), spread = cols(2, 80, 60, 151, 94).size;
    check(onShelf > 100 && spread > 40, `water: ${water} drops, ${onShelf} resting on the shelf, spread over ${spread} of its 71 columns`);
    snap('2  water poured on a solid wood shelf');
  });

  // E. Fire lit at the right end of a dry plank creeps along the wood.
  plank(160, 235, 120, 122);
  const plankBefore = count(3, 160, 120, 236, 123);
  pick(4); brush(2); pointer('pointerdown', 233, 121); run(8); pointer('pointerup', 233, 121);
  run(300, () => {
    const left = count(3, 160, 120, 236, 123), burnt = plankBefore - left;
    check(burnt > 10, `fire on a dry plank: ${burnt} of ${plankBefore} wood cells burnt in 300 steps`);
    snap('3  fire lit at the right end of the lower plank, 300 steps later');
  });

  // F. Fire touching water goes out. The exact case, written straight into the grid: a flame on top of every surface
  // water cell of the pool, touching it. Then, for information only, fire brushed onto the pool the way a person
  // would (a brush cell above the surface isn't touching water, and rightly rises), and fire deep under water.
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
  run(45);
  const surf = surfaceRow(105, 125, 94);
  pick(4); brush(1); pointer('pointerdown', 115, surf); run(2); pointer('pointerup', 115, surf);
  const seen = [];
  run(2, () => seen.push(`+2: ${count(4, 78, 0, 153, 94)}`));
  run(18, () => {
    seen.push(`+20: ${count(4, 78, 0, 153, 94)}`);
    log(`info: fire brushed onto the pool (surface row ${surf}): fire cells over the pool after ${seen.join(', ')} steps`);
    snap('4  fire on the pool: written on its water, then brushed on');
  });
  plank(200, 200, 20, 50); plank(230, 230, 20, 50); plank(200, 230, 50, 50);
  for (let y = 30; y < 50; y++) for (let x = 201; x < 230; x++) grid[y * W + x] = 2;
  pick(4); brush(1); pointer('pointerdown', 215, 46); run(1); pointer('pointerup', 215, 46);
  run(2, () => check(count(4, 195, 0, 236, 52) === 0, `fire placed deep under water: ${count(4, 195, 0, 236, 52)} fire cells left after 2 steps`));

  // G. Acid poured onto the sand pile eats it.
  const sandBefore = count(1);
  pick(5); brush(3); pointer('pointerdown', 40, 110); run(10); pointer('pointerup', 40, 110);
  run(120, () => {
    const sand = count(1);
    check(sand < sandBefore - 30, `acid: sand ${sandBefore} -> ${sand} (ate ${sandBefore - sand})`);
    snap('5  acid poured on the sand pile, 120 steps later');
  });
  for (let i = 0; i < W * H; i++) if (grid[i] === 5) grid[i] = 0;   // no acid left to eat sand in the tests below

  // H. Dragged out of the box with the button held: the stroke stops at the edge. Brought back in: it goes on.
  pick(1); brush(3); pointer('pointerdown', 60, 60); run(3);
  pointer('pointermove', W + 40, 60); run(1);
  const atEdge = count(1);
  run(20);
  const outside = count(1) - atEdge;
  check(outside === 0, `pointer dragged out of the box, button held: ${outside} grains added in 20 steps outside (it used to pour on at the last spot)`);
  pointer('pointermove', 100, 60); run(1);
  const back = count(1) - atEdge;
  check(back > 0, `pointer brought back in, button still held: drawing goes on (${back} grains)`);
  pointer('pointerup', 100, 60);

  // I. A finger draws; a second finger at the same time is ignored.
  brush(2);
  let before = count(1);
  pointer('pointerdown', 120, 20, { type: 'touch', id: 7 }); run(3); pointer('pointerup', 120, 20, { type: 'touch', id: 7 });
  check(count(1) > before, `a finger draws (a touch pointer): ${count(1) - before} grains`);
  before = count(1);
  pointer('pointerdown', 150, 20, { type: 'touch', id: 8, primary: false }); run(3); pointer('pointerup', 150, 20, { type: 'touch', id: 8, primary: false });
  check(count(1) === before, `a second finger at the same time is ignored: ${count(1) - before} grains`);

  // J. Keys: 3 picks Wood; Ctrl+1 (the browser's tab key) is left alone.
  const pressed = () => [...document.querySelectorAll('.mat')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.textContent.replace(/^\d/, '').trim());
  window.dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true }));
  const afterKey = pressed();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', ctrlKey: true, bubbles: true }));
  const afterCtrl = pressed();
  check(afterKey.join() === 'Wood' && afterCtrl.join() === 'Wood', `key 3 picks Wood (pressed: ${afterKey.join(', ')}); Ctrl+1 leaves it (pressed: ${afterCtrl.join(', ')})`);

  // K. Gravity flipped: the sand ends up on the ceiling. (Flipped back after.)
  document.getElementById('gravBtn').click();
  run(250, () => {
    const ceiling = count(1, 0, 0, W, 1), floor = count(1, 0, H - 1, W, H);
    const label = document.getElementById('gravBtn').textContent;
    check(ceiling > 0 && floor === 0 && label === 'Gravity: up', `gravity up: ${ceiling} grains on the ceiling row, ${floor} on the floor, the button reads "${label}"`);
    snap('6  gravity flipped, 250 steps later');
  });
  document.getElementById('gravBtn').click();

  // L. Fixed speed: steps follow the clock (60 a second), not the screen.
  sim.resetClock();
  let s0 = sim.stepsDone;
  for (const t of [1000, 1008, 1016, 1024, 1032, 1040]) sim.advance(t);
  const in40ms = sim.stepsDone - s0;
  sim.resetClock(); s0 = sim.stepsDone;
  let t = 2000;
  for (let i = 0; i < 240; i++, t += 8.33) sim.advance(t);
  const hz120 = sim.stepsDone - s0;
  s0 = sim.stepsDone; sim.advance(t + 5000);
  const afterAway = sim.stepsDone - s0;
  sim.resetClock(); s0 = sim.stepsDone; t = 20000;
  for (let i = 0; i <= 120; i++, t += 1000 / 60) sim.advance(t);
  const hz60 = sim.stepsDone - s0;
  check(in40ms === 2 && hz120 >= 119 && hz120 <= 120 && hz60 >= 119 && hz60 <= 120 && afterAway >= 5 && afterAway <= 6,
    `fixed speed: 40 ms -> ${in40ms} steps (2); 2 s on a 120 Hz screen -> ${hz120} (119-120); 2 s on a 60 Hz screen -> ${hz60} (119-120); back after 5 s away -> ${afterAway} (5-6, no fast-forward)`);

  // M. No errors, and the cost of one step.
  check(errors.length === 0, `no errors on the page`);
  const t0 = performance.now(); for (let i = 0; i < 100; i++) sim.step(); const ms = (performance.now() - t0) / 100;
  check(ms < 1, `one physics step costs ${ms.toFixed(3)} ms (a 60-a-second screen allows 16.7)`);
})();
