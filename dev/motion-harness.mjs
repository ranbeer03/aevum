// Aevum motion harness. Modes:
//   node harness.mjs anchors <base> <w>x<h> <outdir> [names,comma]   screenshot each camera anchor (settled)
//   node harness.mjs sweep   <base> <w>x<h> <outdir> <from> <to> <step>  screenshots across a scroll range
//   node harness.mjs trace   <base> <w>x<h> <selector>               numeric reveal trajectory of one element
//   node harness.mjs intro   <base> <w>x<h> <outdir>                 frames of the first-load intro
//   node harness.mjs hover   <base> <w>x<h> <outdir> <selector>      frames while the pointer crosses an element
import pw from 'playwright-core'; const { chromium } = pw;
import fs from 'node:fs';

const [mode, base, size, ...rest] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const ARGS = ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'];

const browser = await chromium.launch({ headless: true, args: ARGS });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });

async function ready() {
  await page.waitForFunction(() => !document.documentElement.classList.contains('is-loading') && window.AevumWorld?.ready, null, { timeout: 30000 });
  await page.waitForFunction(() => window.AevumWorld.anchors.length > 0, null, { timeout: 10000 });
  await page.evaluate(() => { window.__camPolls = 0; });
  await settle(); // the intro flight
}
const scrollTo = (y) => page.evaluate((y) => { window.scrollTo(0, y); dispatchEvent(new Event('scroll')); }, y);
// The world's damp caps dt at 50ms a frame, so under a slow software renderer
// a fixed wait is not enough: poll until the camera has stopped moving (the
// ambient drift is under 0.05 units per 400ms).
async function settle(ms = 12000) {
  await page.waitForFunction(() => {
    const p = window.AevumWorld.camera.position;
    const last = window.__cam || p.clone(); window.__cam = p.clone();
    return p.distanceTo(last) < 0.08 && window.__camPolls++ > 1;
  }, null, { polling: 400, timeout: ms }).catch(() => console.log('  (settle timeout)'));
  await page.evaluate(() => { window.__camPolls = 0; });
}
const anchors = () => page.evaluate(() => window.AevumWorld.anchors.map((a) => ({ y: Math.round(a.y), stop: a.stop })));

if (mode === 'anchors' || mode === 'sweep') {
  const out = rest[0]; fs.mkdirSync(out, { recursive: true });
  await page.goto(base + (process.env.P || '/'), { waitUntil: 'load' });
  await ready();
  const A = await anchors();
  console.log('anchors', JSON.stringify(A), 'scrollHeight', await page.evaluate(() => document.documentElement.scrollHeight));
  let points;
  if (mode === 'anchors') {
    const only = rest[1] ? rest[1].split(',') : null;
    points = A.filter((a) => !only || only.includes(a.stop)).map((a, i) => ({ y: a.y, name: `${String(i).padStart(2, '0')}-${a.stop}` }));
  } else {
    const [from, to, step] = rest.slice(1).map(Number);
    points = [];
    for (let y = from; y <= to; y += step) points.push({ y, name: `y${String(y).padStart(5, '0')}` });
  }
  for (const p of points) {
    await scrollTo(p.y);
    await page.evaluate(() => { window.__camPolls = 0; });
    await settle();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${p.name}.png` });
    console.log('shot', p.name, p.y);
  }
}

if (mode === 'stop') {
  // node harness.mjs stop <base> <w>x<h> <outdir> <anchor[:frac]> '<json patches>' [label]
  // patches: { stops: { name: {...} }, place: { clinker: {...} }, depth: { clinker: 1.2 } }
  const out = rest[0]; fs.mkdirSync(out, { recursive: true });
  const [name, fracS] = rest[1].split(':'); const frac = fracS ? +fracS : 0;
  const patches = rest[2] ? JSON.parse(rest[2]) : {};
  const label = rest[3] || 'stop';
  await page.goto(base + (process.env.P || '/'), { waitUntil: 'load' });
  await ready();
  await page.evaluate((p) => {
    const W = window.AevumWorld;
    for (const [k, v] of Object.entries(p.stops || {})) W.setStop(k, v, false);
    for (const [k, v] of Object.entries(p.place || {})) Object.assign(W.place[k], v);
    for (const [k, v] of Object.entries(p.depth || {})) W.clipDepth[k] = v;
  }, patches);
  const A = await anchors();
  const i = A.findIndex((a) => a.stop === name);
  const y = Math.round(A[i].y + (A[i + 1] ? (A[i + 1].y - A[i].y) * frac : 0));
  await scrollTo(y);
  await page.evaluate(() => { window.__camPolls = 0; });
  await settle();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${label}-${name}${fracS ? '-' + fracS : ''}.png` });
  console.log('shot', label, name, frac, 'y', y);
}

if (mode === 'perf') {
  // node harness.mjs perf <base> <w>x<h>   frame gaps while scrolling the whole page at 9px/frame
  // GPU-backed launch: SwiftShader numbers would say nothing about a real device.
  await browser.close();
  const b2 = await chromium.launch({ headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal', '--disable-frame-rate-limit', '--disable-gpu-vsync'] });
  const p2 = await b2.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p2.goto(base + (process.env.P || '/'), { waitUntil: 'load' });
  await p2.waitForFunction(() => !document.documentElement.classList.contains('is-loading') && window.AevumWorld?.ready && window.AevumWorld.anchors.length > 0, null, { timeout: 30000 });
  await p2.waitForTimeout(800);
  const r = await p2.evaluate(() => new Promise((done) => {
    const gaps = []; let last = performance.now(); let y = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const tick = (now) => {
      gaps.push(now - last); last = now;
      y += 9; window.scrollTo(0, y);
      if (y < max) requestAnimationFrame(tick); else done(gaps.slice(5));
    };
    requestAnimationFrame(tick);
  }));
  r.sort((a, b) => a - b);
  const q = (f) => r[Math.floor(r.length * f)].toFixed(1);
  console.log(JSON.stringify({ frames: r.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: r[r.length - 1].toFixed(1), over32: r.filter((g) => g > 32).length, gl: await p2.evaluate(() => { const c = document.createElement('canvas').getContext('webgl'); const d = c.getExtension('WEBGL_debug_renderer_info'); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a'; }) }));
  await b2.close();
  process.exit(0);
}

if (mode === 'check') {
  // node harness.mjs check <base> <w>x<h> <paths,comma>   sweep each page; report errors, unrevealed, hScroll; then again under reduced motion
  const paths = rest[0].split(',');
  const errors = [];
  page.removeAllListeners('pageerror'); page.removeAllListeners('console');
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text().slice(0, 160)); });
  for (const reduce of [false, true]) {
    await page.emulateMedia({ reducedMotion: reduce ? 'reduce' : 'no-preference' });
    for (const path of paths) {
      errors.length = 0;
      await page.goto(base + path, { waitUntil: 'load' });
      await page.waitForFunction(() => !document.documentElement.classList.contains('is-loading'), null, { timeout: 30000 });
      await page.waitForTimeout(500);
      const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      for (let y = 0; y <= max; y += 300) { await scrollTo(y); await page.waitForTimeout(reduce ? 60 : 220); }
      await page.waitForTimeout(2600);
      const r = await page.evaluate(() => {
        const all = [...document.querySelectorAll('[data-reveal]')];
        const unrevealed = all.filter((el) => !el.classList.contains('in')).length;
        const hidden = all.filter((el) => +getComputedStyle(el).opacity < 0.5).length;
        const lines = document.querySelectorAll('.line, .line-mask').length; // split should have been reverted
        const list = all.filter((el) => !el.classList.contains('in')).map((el) => `${el.tagName}.${el.className.split(' ')[0]}[${el.dataset.reveal}]@${Math.round(el.getBoundingClientRect().top + scrollY)} shown=${el.dataset.shown || '-'} clip=${getComputedStyle(el).clipPath.slice(0, 22)} anims=${el.getAnimations().length}`);
        return { reveals: all.length, unrevealed, hidden, lines, hScroll: document.documentElement.scrollWidth - innerWidth, maskLeft: document.querySelectorAll('h1 div, h2 div, h3 div').length, list, scrollH: document.documentElement.scrollHeight };
      });
      console.log(JSON.stringify({ path, reduce, ...r, errors: errors.slice(0, 3) }));
    }
  }
}

if (mode === 'trace') {
  const sel = rest[0];
  await page.goto(base + (process.env.P || '/'), { waitUntil: 'load' });
  await ready();
  const res = await page.evaluate(async (sel) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    // park the element just under the fold, then step it up past the IO line
    window.scrollTo(0, r.top + scrollY - innerHeight - 20);
    await new Promise((r) => setTimeout(r, 300));
    window.scrollTo(0, scrollY + innerHeight * 0.25);
    dispatchEvent(new Event('scroll'));
    const samples = [];
    const t0 = performance.now();
    await new Promise((done) => {
      const tick = () => {
        // re-resolve each sample: a heading is split into .line pieces at reveal time
        const target = el.querySelector('.split-inner, .line') || el;
        const cs = getComputedStyle(target);
        samples.push([Math.round(performance.now() - t0), +(+cs.opacity).toFixed(2), cs.transform.replace(/matrix\(1, 0, 0, 1, /, 'm(').slice(0, 24), cs.clipPath.slice(0, 20), cs.filter.slice(0, 14)]);
        if (performance.now() - t0 < 1800) setTimeout(tick, 40); else done();
      };
      setTimeout(tick, 0);
    });
    return { shown: el.dataset.shown, inClass: el.classList.contains('in'), inline: el.getAttribute('style'), anims: el.getAnimations({ subtree: true }).length, html: el.outerHTML.slice(0, 360), samples: samples.filter((_, i) => i % 2 === 0) };
  }, sel);
  console.log(JSON.stringify(res, null, 0));
}

if (mode === 'intro') {
  const out = rest[0]; fs.mkdirSync(out, { recursive: true });
  await page.goto(base + (process.env.P || '/'), { waitUntil: 'commit' });
  await page.waitForFunction(() => !document.documentElement.classList.contains('is-loading'), null, { timeout: 30000 });
  const t0 = Date.now();
  for (let i = 0; i < 12; i++) {
    await page.screenshot({ path: `${out}/intro-${String(i).padStart(2, '0')}.png` });
    const el = Date.now() - t0; console.log('frame', i, el + 'ms');
    await page.waitForTimeout(160);
  }
}

if (mode === 'hover') {
  const out = rest[0], sel = rest[1]; fs.mkdirSync(out, { recursive: true });
  await page.goto(base + (process.env.P || '/'), { waitUntil: 'load' });
  await ready();
  const box = await page.evaluate((sel) => { const el = document.querySelector(sel); el.scrollIntoView({ block: 'center' }); dispatchEvent(new Event('scroll')); const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, sel);
  await page.waitForTimeout(1800);
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    await page.mouse.move(box.x - 10 + (box.w + 20) * (i / steps), box.y + box.h * 0.5, { steps: 3 });
    await page.waitForTimeout(90);
    await page.screenshot({ path: `${out}/hover-${String(i).padStart(2, '0')}.png`, clip: { x: box.x - 20, y: box.y - 20, width: box.w + 40, height: box.h + 40 } });
  }
  console.log('hover frames', steps + 1, JSON.stringify(box));
}

await browser.close();
