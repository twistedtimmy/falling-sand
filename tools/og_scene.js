// Builds the link-preview picture (assets/og.png) with the page's own engine. tools/make_og.ps1 adds this script to a
// copy of index.html and reads the picture back out of the page with headless Chrome's --dump-dom.
(() => {
  let seed = 7;   // seeded dice: the same picture every time
  Math.random = () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const sim = window.sim, { W, grid } = sim;
  const pick = id => document.querySelector(`.mat[data-id="${id}"]`).click();
  const brush = n => { const b = document.getElementById('brush'); b.value = n; b.dispatchEvent(new Event('input')); };
  const run = n => { for (let i = 0; i < n; i++) sim.step(); };
  const pour = (x, y, steps) => { sim.setPointer(x, y, true); run(steps); sim.setPointer(x, y, false); };
  const wood = (x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y * W + x] = 3; };

  // The grid is 240 x 150; the picture shows rows 24-149 at five times the size, with the title over the empty top.
  wood(104, 168, 104, 106);                          // a shelf
  wood(192, 201, 100, 149); wood(184, 209, 97, 99);  // a thick post with a top
  pick(1); brush(5); pour(52, 70, 70); run(260);     // a heap of sand
  pick(2); brush(4); pour(136, 74, 40); run(170);    // water onto the shelf
  pick(4); brush(3); pour(196, 95, 28);              // fire on top of the post, still being fed
  pick(5); brush(3); pour(66, 140, 2); run(1);       // acid biting into the heap's slope
  sim.draw();

  const c = document.createElement('canvas');
  c.width = 1200; c.height = 630;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(document.getElementById('sim'), 0, 24, 240, 126, 0, 0, 1200, 630);
  ['#f6c33c', '#3b82f6', '#ff5522', '#42f538'].forEach((col, k) => {
    g.fillStyle = col;
    g.fillRect(60 + (k % 2) * 24, 50 + Math.floor(k / 2) * 24, 21, 21);
  });
  const font = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  g.textBaseline = 'middle';
  g.fillStyle = '#e0e0e8';
  g.font = `bold 66px ${font}`;
  g.fillText('Falling Sand', 128, 74);
  g.fillStyle = '#b8b8c8';
  g.font = `28px ${font}`;
  g.fillText('Draw with sand, water, wood, fire and acid,', 62, 146);
  g.fillText('then watch what happens.', 62, 184);

  const pre = document.createElement('pre');
  pre.id = 'og-data';
  pre.textContent = c.toDataURL('image/png');
  document.body.appendChild(pre);
})();
