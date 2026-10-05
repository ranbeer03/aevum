// AEVUM: the world, v3.
// One persistent Three.js environment behind every page: a terraced open-pit
// quarry carved into an arid range, the thing Aevum actually trades.
//
// CAMERA MODEL (mont-fort / kage): every section of every page declares a
// named camera STOP via data-cam. The camera's target pose is interpolated
// from the real scroll position between the stops of the sections above and
// below the viewport, so scrolling up and down literally spans those
// vantages. The live pose then follows the target through a frame-rate
// independent critical damp, which also makes page changes a smooth flight
// (the target jumps to the new page's stops; the pose eases there).
//
// Perf contract: no per-frame allocation, one draw material, damped follow in
// real seconds, renders only when the pose actually changed.

import * as THREE from 'three';

/* ------------------------------------------------------------ palette */
const C = {
  fogSurface: new THREE.Color('#0c2018'),
  fogDeep: new THREE.Color('#050d0a'),
  horizonDawn: new THREE.Color('#d8bc80'),
  horizonDeep: new THREE.Color('#0a1b14'),
  skyTop: new THREE.Color('#071510'),
  skyTopDeep: new THREE.Color('#020604'),
  rockLow: new THREE.Color('#12291f'),
  rockMid: new THREE.Color('#1d4032'),
  rockHigh: new THREE.Color('#5c6b57'),
  benchFlat: new THREE.Color('#e8e0c4'),
  benchRiser: new THREE.Color('#8b8a70'),
  benchDeep: new THREE.Color('#503f2b'),
  goldVein: new THREE.Color('#c6a96c'),
  ember: new THREE.Color('#d87834'),
  gold: new THREE.Color('#d8bc80'),
};

const PIT = { x: 6, z: -30, R: 36, depth: 30, bench: 4.4 };

/* ------------------------------------------------------------ sculpted model
   Drop an optimised quarry GLB at the path below and set MODEL_URL to it; the
   procedural terrain stays on screen until it finishes loading, then swaps.
   null = ship the procedural model only.  See README → "3D model pipeline".  */
const MODEL_URL = '/media/quarry.glb';
// Multiplies the model's baked photogrammetry texture into this palette.
const MODEL_TINT = 0xc2bda6;
// Phones skip the sculpted model and keep the (much cheaper) procedural
// terrain. Gated on a coarse pointer AND a small viewport, not width alone:
// width alone also skipped desktops with DevTools docked to the side.
// The sculpt ships everywhere now, phones included: it is the site's identity
// and holding it back made mobile a lesser version of the same page. What
// keeps it affordable there is the adaptive resolution below, which already
// caps small screens at 1x and steps down from there on its own. Save-Data is
// still honoured, because that is the visitor asking.
function shouldLoadModel() {
  if (!MODEL_URL) return false;
  if (navigator.connection?.saveData) return console.info('[aevum:world] model skipped: Save-Data'), false;
  return true;
}

// Phones get their own framing for a stop when the desktop one does not read
// at that aspect. Resolved once into a parallel table rather than merged per
// frame, so sampling stays allocation free.
const narrow = () => matchMedia('(max-width: 860px)').matches;
let small = typeof matchMedia === 'function' ? narrow() : false;
const STOPS_SM = {};

/* ------------------------------------------------------------ camera stops
   Named vantages in world space. Sections reference these by name.
   fog / deep (0 dawn → 1 depth) / kiln (ember intensity) grade with them, so
   the whole atmosphere is section-linked, not just the position.            */
// A stop may also carry:
//   layer / clipT   which backdrop clip is showing here, and where in that
//                   clip's own four seconds this scroll position sits. Both
//                   interpolate between stops exactly like position and fog,
//                   so a handoff is locked to the camera move rather than run
//                   beside it.
const STOPS = {
  // Stops orbit the quarried hill standing at the pit centre (6, ~0, -30).
  // the approach: high down the valley, the whole terraced mass ahead
  // Fog is FogExp2: opacity grows with the SQUARE of density×distance, so a
  // far stop needs a much lower density than a near one to stay readable.
  approach:  { pos: [32, 21.6, -68.4],  look: [2.3, 12.2, -25.9],   fog: 0.0050, deep: 0.00, kiln: 0.00 },
  // closing on it, benches beginning to read
  rim:       { pos: [39.3, 12.5, 1.9],  look: [9, 8.1, -32.8],   fog: 0.0065, deep: 0.18, kiln: 0.05 },
  // in close along the west bench walls
  benchWall: { pos: [-26.5, 29, 2],  look: [8, 4, -32],   fog: 0.0085, deep: 0.34, kiln: 0.15 },
  // round to the east face, low and raking
  seam:      { pos: [44, 12, -4],   look: [4, 3, -32],   fog: 0.0095, deep: 0.52, kiln: 0.5 },
  // looking along the haul roads from behind the hill
  spiral:    { pos: [30, 9, -74],   look: [4, 4, -30],   fog: 0.0100, deep: 0.70, kiln: 0.7 },
  // wide and high again, the working quarry read whole
  basin:     { pos: [23.5, 15.1, 20.7],   look: [14.3, 13.7, -20.4],   fog: 0.0065, deep: 0.55, kiln: 0.35 },
  // down at its foot, the terraces rising over you
  floor:     { pos: [22, 28.9, 5.6],    look: [6.9, 9, -9.2],  fog: 0.0120, deep: 0.92, kiln: 1.00 },

  /* ---- the backdrop clips ---------------------------------------------
     `layer` names which clip is showing at a stop; `clipT` is where in that
     clip's own four seconds the stop sits. The playhead runs linearly with the
     scroll between stops (see sampleTarget), so two stops with the same clipT
     are a hold and anything else is playback at a steady rate.

     Measured off the clips, frame by frame:
       vessel   keel line 0.08 to 0.18, hull 0.19 to 0.36, complete 0.66,
                hatches lift 0.71, gone 1.00                                   */

  // The vessel has a pinned chapter (an .interlude in index.astro): the
  // screen holds while the clip plays from its own start to its own end, and
  // the camera holds with it, so there is one motion at a time. In is the
  // chapter's top crossing the screen, Pin and End the ends of the hold.
  // In clear sky, nothing in frame but the vessel. It plays straight
  // through, building, complete and coming apart, at one steady rate: a
  // hold in the middle read as the clip stalling before it had finished.
  // halfway up as the chapter slides in, so the climb from the benches is
  // spread over the clinker chapter leaving and this one arriving. The clip
  // is on its first frames here, already in its final place.
  vesselIn:    { pos: [39, 12, -5],  look: [4, 30, -14], fog: 0.0095, deep: 0.64, kiln: 0.55, layer: 'vessel', clipT: 0.02 },
  vesselPin:   { pos: [34, 12, -6],  look: [5, 52, 0],  fog: 0.0100, deep: 0.74, kiln: 0.55, layer: 'vessel', clipT: 0.24 },
  vesselEnd:   { pos: [34, 12, -6],  look: [5, 52, 0],  fog: 0.0100, deep: 0.76, kiln: 0.50, layer: 'vessel', clipT: 0.97 },
};
const FALLBACK = 'rim';


/* ------------------------------------------------------------ noise */
function makeNoise(seed) {
  const perm = new Uint8Array(512);
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h, x, y) => ((h & 1 ? -x : x) + (h & 2 ? -y : y));
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const noise2 = (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const a = perm[X + perm[Y]], b = perm[X + 1 + perm[Y]];
    const c = perm[X + perm[Y + 1]], d = perm[X + 1 + perm[Y + 1]];
    const lerp = (t, m, n) => m + t * (n - m);
    return lerp(v,
      lerp(u, grad(a, x, y), grad(b, x - 1, y)),
      lerp(u, grad(c, x, y - 1), grad(d, x - 1, y - 1)));
  };
  const fbm = (x, y, oct = 4) => {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * noise2(x * freq, y * freq);
      norm += amp;
      amp *= 0.5; freq *= 2.1;
    }
    return sum / norm;
  };
  return { noise2, fbm };
}

/* ------------------------------------------------------------ terrain */
function smooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// the approach valley: mountains part along the inbound sightline
function corridorDist(x, z) {
  const ax = -70, az = 92, bx = PIT.x, bz = PIT.z;
  const abx = bx - ax, abz = bz - az;
  const t = Math.min(1, Math.max(0, ((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz)));
  return Math.hypot(x - (ax + abx * t), z - (az + abz * t));
}

// carve = false when a sculpted quarry model provides the pit itself; the
// procedural mesh then supplies only the surrounding range and a flat apron
// for the model to sit in, instead of competing with a second quarry.
function terrainHeight(x, z, N, carve = true) {
  const m = N.fbm(x * 0.014, z * 0.014, 5);
  const ridge = 1 - Math.abs(N.fbm(x * 0.02 + 9, z * 0.02 - 4, 4)) * 2;
  let h = 8 + m * 14 + Math.max(0, ridge) * 16;

  h *= 0.18 + 0.82 * smooth(12, 30, corridorDist(x, z));

  const dx = x - PIT.x, dz = z - PIT.z;
  const r = Math.hypot(dx, dz);

  h *= 1 - smooth(PIT.R + 26, PIT.R + 4, r) * 0.92;

  if (carve && r < PIT.R + 4) {
    const t = Math.min(1, Math.max(0, (PIT.R - r) / PIT.R));
    const bowl = -PIT.depth * Math.pow(t, 0.82) * (0.7 + 0.3 * Math.pow(t, 2));
    const stepped = Math.round(bowl / PIT.bench) * PIT.bench;
    const f = Math.abs(bowl / PIT.bench - Math.round(bowl / PIT.bench));
    h = Math.min(h, THREE.MathUtils.lerp(stepped, bowl, Math.pow(Math.min(1, f * 2.4), 3)));
    const ang = Math.atan2(dz, dx);
    const spiral = Math.abs(((ang / (Math.PI * 2)) * PIT.depth * 1.9 + bowl * 0.9 + 40) % 9 - 4.5);
    if (spiral < 1.1 && r > 6) h -= (1.1 - spiral) * 1.4;
  }

  return h + N.fbm(x * 0.12, z * 0.12, 3) * 0.8;
}

function buildTerrain(N, carve = true) {
  const SIZE = 300;
  // the model carries the detail; the procedural mesh is only context
  const SEG = carve ? 200 : 132;
  let geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i), N, carve));
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  geo.deleteAttribute('uv'); // unused by Lambert here, so a smaller buffer

  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  const colors = new Float32Array(p.count * 3);
  const col = new THREE.Color();
  for (let i = 0; i < p.count; i += 3) {
    const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
    const cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const ny = (n.getY(i) + n.getY(i + 1) + n.getY(i + 2)) / 3;
    const r = Math.hypot(cx - PIT.x, cz - PIT.z);

    // Bench colours belong to the procedural pit. With the sculpt loaded there
    // is no pit here, and painting this ring pale turned the apron into a white
    // plate for the model to sit on, which is what made it read as an object
    // set on a table rather than a quarry cut into the range.
    if (carve && r < PIT.R + 3 && cy < 2) {
      const flat = ny > 0.82;
      col.copy(flat ? C.benchFlat : C.benchRiser);
      col.lerp(C.benchDeep, smooth(-12, -PIT.depth, cy) * 0.8);
      if (cy < -7 && cy > -14) col.lerp(C.goldVein, flat ? 0.35 : 0.75);
    } else {
      col.copy(C.rockLow).lerp(C.rockMid, Math.min(1, cy / 12));
      col.lerp(C.rockHigh, smooth(2, 30, cy) * 0.8);
      if (ny < 0.55) col.multiplyScalar(0.78);
    }
    const j = 0.94 + N.noise2(cx * 0.35, cz * 0.35) * 0.12;
    for (let k = 0; k < 3; k++) {
      colors[(i + k) * 3] = col.r * j;
      colors[(i + k) * 3 + 1] = col.g * j;
      colors[(i + k) * 3 + 2] = col.b * j;
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Lambert, not Standard: this world is stylised and flat-shaded, so the PBR
  // fragment cost buys nothing. Big win at high DPR.
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
}

/* ------------------------------------------------- stitching the model in
   Both existing meshes stay exactly as they are: the procedural range is the
   background and the sculpted quarry is the subject. What was missing is the
   join between them. The sculpt is a slab with a hard outer edge, and it is
   dropped onto ground that is already 1 to 8 units higher at the same radius
   and climbing to about 27 by r=60, so its base plane cuts against a rising
   slope and reads as an object set on a table.

   The collar is a third mesh that closes that join. It samples the sculpt's
   own top surface from directly overhead, carries those heights outward past
   the silhouette, and eases them into terrainHeight(), so the quarry reads as
   cut INTO the range instead of resting on it. Nothing is deleted to make
   room for it.                                                              */

const FIELD = 192;  // heightfield resolution, in samples across
const REACH = 52;   // world units the collar carries past the model's edge

// Render the model straight down into a heightfield. A raycast per vertex
// against 290k triangles is not affordable; one orthographic pass is.
function sampleModelHeights(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const c = box.getCenter(new THREE.Vector3());
  const half = Math.max(size.x, size.z) / 2 + REACH;

  const cam = new THREE.OrthographicCamera(-half, half, half, -half, 1, size.y + 220);
  cam.position.set(c.x, box.max.y + 100, c.z);
  cam.up.set(0, 0, -1);
  cam.lookAt(c.x, box.min.y, c.z);
  cam.updateMatrixWorld(true);

  const range = Math.max(0.001, size.y);
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uMin: { value: box.min.y }, uRange: { value: range } },
    vertexShader: `
      varying float vY;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vY = wp.y;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    // height packed across two channels: one byte over a 20 unit range would
    // terrace the collar, which is the one artefact it exists to avoid
    fragmentShader: `
      uniform float uMin, uRange;
      varying float vY;
      void main() {
        float h = clamp((vY - uMin) / uRange, 0.0, 1.0) * 255.0;
        gl_FragColor = vec4(floor(h) / 255.0, fract(h), 0.0, 1.0);
      }`,
  });

  const rt = new THREE.WebGLRenderTarget(FIELD, FIELD);
  const stage = new THREE.Scene();
  stage.overrideMaterial = mat;
  const parent = model.parent;
  stage.add(model);

  const r = state.renderer;
  const prevTarget = r.getRenderTarget();
  const prevClear = new THREE.Color();
  r.getClearColor(prevClear);
  const prevAlpha = r.getClearAlpha();
  r.setRenderTarget(rt);
  r.setClearColor(0x000000, 0);
  r.clear();
  r.render(stage, cam);
  const buf = new Uint8Array(FIELD * FIELD * 4);
  r.readRenderTargetPixels(rt, 0, 0, FIELD, FIELD, buf);
  r.setRenderTarget(prevTarget);
  r.setClearColor(prevClear, prevAlpha);

  stage.remove(model);
  if (parent) parent.add(model);
  rt.dispose();
  mat.dispose();

  // Grid to world taken from the camera itself, so which way the render is
  // flipped never has to be reasoned about by hand.
  const at = (u, v) => new THREE.Vector3(u * 2 - 1, v * 2 - 1, 0).unproject(cam);
  const origin = at(0, 0);
  const eu = at(1, 0).sub(origin);
  const ev = at(0, 1).sub(origin);

  const height = new Float32Array(FIELD * FIELD);
  const dist = new Float32Array(FIELD * FIELD).fill(Infinity);
  for (let i = 0; i < FIELD * FIELD; i++) {
    if (buf[i * 4 + 3] < 128) continue; // nothing drawn on this sample
    height[i] = box.min.y + ((buf[i * 4] + buf[i * 4 + 1] / 255) / 255) * range;
    dist[i] = 0;
  }

  const cell = eu.length() / FIELD;
  return { origin, eu, ev, height, dist, box, reach: Math.max(4, Math.round(REACH / cell)) };
}

// Carry the sampled heights outward. The pass a cell is filled on is its
// distance from the silhouette in cells, which is exactly the falloff the
// collar needs, so the blend comes free with the extension.
function extend(field) {
  const { height, dist, reach } = field;
  let front = [];
  for (let i = 0; i < FIELD * FIELD; i++) if (dist[i] === 0) front.push(i);
  for (let p = 1; p <= reach && front.length; p++) {
    const next = [];
    for (const i of front) {
      const x = i % FIELD, y = (i / FIELD) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0);
        const ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= FIELD || ny >= FIELD) continue;
        const j = ny * FIELD + nx;
        if (dist[j] !== Infinity) continue;
        dist[j] = p;
        height[j] = height[i];
        next.push(j);
      }
    }
    front = next;
  }
  // nearest-neighbour extension is blocky along diagonals; two box passes are
  // enough to take the stair-stepping out without softening the sculpt itself
  const tmp = new Float32Array(height.length);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < FIELD; y++) {
      for (let x = 0; x < FIELD; x++) {
        let sum = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= FIELD || ny >= FIELD) continue;
            const j = ny * FIELD + nx;
            if (dist[j] === Infinity) continue;
            sum += height[j]; n++;
          }
        }
        const i = y * FIELD + x;
        tmp[i] = n ? sum / n : height[i];
      }
    }
    height.set(tmp);
  }
}

function buildCollar(N, field) {
  const { origin, eu, ev, height, dist, reach } = field;
  const G = 208;
  const warm = new THREE.Color(MODEL_TINT);

  // sample the field bilinearly at a grid position
  const at = (gx, gy) => {
    const fx = (gx / (G - 1)) * (FIELD - 1);
    const fy = (gy / (G - 1)) * (FIELD - 1);
    const x0 = Math.min(FIELD - 2, fx | 0), y0 = Math.min(FIELD - 2, fy | 0);
    const tx = fx - x0, ty = fy - y0;
    let h = 0, m = 0;
    for (let k = 0; k < 4; k++) {
      const i = (y0 + (k >> 1)) * FIELD + x0 + (k & 1);
      const w = ((k & 1) ? tx : 1 - tx) * ((k >> 1) ? ty : 1 - ty);
      h += height[i] * w;
      m += (dist[i] === Infinity ? 1 : dist[i] / reach) * w;
    }
    return [h, 1 - smooth(0, 1, Math.min(1, m))];
  };

  const X = new Float32Array(G * G), Y = new Float32Array(G * G), Z = new Float32Array(G * G);
  const M = new Float32Array(G * G);
  for (let gy = 0; gy < G; gy++) {
    for (let gx = 0; gx < G; gx++) {
      const u = gx / (G - 1), v = gy / (G - 1);
      const wx = origin.x + eu.x * u + ev.x * v;
      const wz = origin.z + eu.z * u + ev.z * v;
      const [h, m] = at(gx, gy);
      // The far edge is set half a unit UNDER the terrain, so the collar
      // disappears beneath the range instead of fighting it for the same
      // pixels. Everything visible is the ramp in between.
      const t = terrainHeight(wx, wz, N, false) - 0.5;
      const i = gy * G + gx;
      X[i] = wx; Z[i] = wz; M[i] = m;
      // The same fine roughness the range carries, faded out as the collar
      // reaches the sculpt so the join stays exact. Without it the ramp reads
      // as polished glass against 290k triangles of photogrammetry.
      Y[i] = t + (h - t) * m + N.fbm(wx * 0.12, wz * 0.12, 3) * 0.8 * (1 - m);
    }
  }

  const pos = [];
  const msk = [];
  const push = (a, b, c) => {
    const m = (M[a] + M[b] + M[c]) / 3;
    // buried under the sculpt, or buried under the range: either way nobody
    // ever sees it, and skipping both leaves only the join itself
    if (m > 0.985 || m < 0.015) return;
    for (const i of [a, b, c]) { pos.push(X[i], Y[i], Z[i]); msk.push(M[i]); }
  };
  for (let gy = 0; gy < G - 1; gy++) {
    for (let gx = 0; gx < G - 1; gx++) {
      const a = gy * G + gx, b = a + 1, c = a + G, d = c + 1;
      push(a, c, b);
      push(b, c, d);
    }
  }
  if (!pos.length) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.computeVertexNormals();

  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  const colors = new Float32Array(p.count * 3);
  const col = new THREE.Color();
  for (let i = 0; i < p.count; i += 3) {
    const cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
    const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const ny = (n.getY(i) + n.getY(i + 1) + n.getY(i + 2)) / 3;
    // the range's own ramp, warmed toward the sculpt in step with the same
    // mask that drives the height, so neither end shows a colour step
    col.copy(C.rockLow).lerp(C.rockMid, Math.min(1, cy / 12));
    col.lerp(C.rockHigh, smooth(2, 30, cy) * 0.8);
    col.lerp(warm, ((msk[i] + msk[i + 1] + msk[i + 2]) / 3) * 0.78);
    if (ny < 0.55) col.multiplyScalar(0.8);
    const j = 0.94 + N.noise2(cx * 0.35, cz * 0.35) * 0.12;
    for (let k = 0; k < 3; k++) {
      colors[(i + k) * 3] = col.r * j;
      colors[(i + k) * 3 + 1] = col.g * j;
      colors[(i + k) * 3 + 2] = col.b * j;
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  mesh.name = 'collar';
  return mesh;
}

function glowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------ state */
const state = {
  ready: false,
  reduced: false,
  renderer: null,
  scene: null,
  camera: null,
  sky: null,
  kilnSprite: null,
  kilnLight: null,
  seamLight: null,
  kilnScale: null,
  sun: null,
  dust: [],
  // scroll → stop mapping, rebuilt per page
  anchors: [],
  // live + target pose
  pos: new THREE.Vector3(-52, 28, 68),
  look: new THREE.Vector3(8, 2, -30),
  tPos: new THREE.Vector3(-52, 28, 68),
  tLook: new THREE.Vector3(8, 2, -30),
  grade: { fog: 0.011, deep: 0, kiln: 0, clipT: 0 },
  tGrade: { fog: 0.011, deep: 0, kiln: 0, clipT: 0 },
  clips: null,                        // [videoA, videoB], set by motion.js
  blendFrom: 'world',                 // which source this stop leaves
  blendTo: 'world',                   // and which it arrives at
  blendT: 0,                          // raw scroll position between the two
  pointer: { x: 0, y: 0 },
  pointerSmooth: { x: 0, y: 0 },
  manual: false,    // dev overlay drives the camera itself
  nearStop: FALLBACK,
  lambda: 4.5,      // damp rate; briefly lowered for page flights
  clock: 0,
  intro: null,      // the first-load move while it runs
};
const INTRO_MS = 3400;

// Resolves once the world is showable: model in, or model skipped, or the
// model failed and the procedural terrain is standing in for it. The
// preloader waits on this.
let markReady;
const whenReady = new Promise((resolve) => { markReady = resolve; });
let onProgress = null;

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _off = new THREE.Vector3();
let lastNow = 0;

// Adaptive resolution. Fragment cost dominates, and it scales with the square
// of pixel ratio, so this is the one lever that reliably rescues a slow GPU,
// and the headroom that lets a heavier model stay smooth. The scene measures
// its own frame time and moves between these tiers; it never guesses at the
// hardware.
const DPR_TIERS = [0.65, 0.8, 1, 1.25];
let tier = DPR_TIERS.length - 1;

function dprCeiling() {
  return Math.min(window.devicePixelRatio || 1, innerWidth <= 860 ? 1 : 1.25);
}
function applyDpr() {
  state.renderer?.setPixelRatio(Math.min(DPR_TIERS[tier], dprCeiling()));
}

// Judged over blocks of ~90 rendered frames, so one hitch never costs a tier.
// The thresholds are absolute because vsync clamps the frame interval: a
// healthy 60Hz display reads 16.7ms whether the GPU is at 10% or 95%, so the
// only honest question is which side of the refresh budget we have fallen on.
// Above 26ms (~38fps) we are visibly missing frames; below 18ms we are holding
// 60Hz or better. Between the two it holds, which is the hysteresis.
let block = 0;
let acc = 0;
function adapt(dt) {
  acc += dt * 1000;
  if (++block < 90) return;
  const avg = acc / block;
  if (avg > 26 && tier > 0) { tier--; applyDpr(); }
  else if (avg < 18 && tier < DPR_TIERS.length - 1) { tier++; applyDpr(); }
  block = 0; acc = 0;
}

/* ------------------------------------------------------------ build */
function build(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
  });
  renderer.setPixelRatio(Math.min(DPR_TIERS[tier], dprCeiling()));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    canvas.closest('.world')?.remove();
    state.ready = false;
  });

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(C.fogSurface.clone(), 0.014);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.5, 380);
  camera.position.copy(state.pos);

  const skyMat = new THREE.ShaderMaterial({
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uDeep: { value: 0 },
      uTop: { value: C.skyTop },
      uTopDeep: { value: C.skyTopDeep },
      uHorizon: { value: C.horizonDawn },
      uHorizonDeep: { value: C.horizonDeep },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uDeep;
      uniform vec3 uTop,uTopDeep,uHorizon,uHorizonDeep;
      void main(){
        vec3 top = mix(uTop,uTopDeep,uDeep);
        vec3 hor = mix(uHorizon,uHorizonDeep,uDeep);
        gl_FragColor = vec4(mix(top,hor,pow(1.0 - vUv.y, 3.1)),1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat);
  sky.scale.set(900, 500, 1);
  sky.position.z = -320;
  sky.renderOrder = -1;
  camera.add(sky);
  scene.add(camera);

  const sun = new THREE.DirectionalLight(C.gold, 2.6);
  sun.position.set(60, 26, 40);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(new THREE.Color('#26443a'), new THREE.Color('#0a140f'), 0.75));
  const fill = new THREE.DirectionalLight(new THREE.Color('#9aa886'), 0.5);
  fill.position.set(-70, 40, 60);
  scene.add(fill);

  // Carve the procedural pit only when no sculpted model will provide one.
  // Keyed on shouldLoadModel(), not MODEL_URL: phones skip the model, so they
  // must still get a quarry carved into the terrain.
  const terrain = buildTerrain(makeNoise(11), !shouldLoadModel());
  terrain.name = 'terrain'; // named so World.loadModel can swap it out
  scene.add(terrain);

  // ember and seam glow sit at the foot of the quarry, not in a buried pit
  const base = MODEL_URL ? -1 : -PIT.depth + 8;
  const kilnLight = new THREE.PointLight(C.ember, 0, 70, 1.6);
  kilnLight.position.set(PIT.x - 6, base, PIT.z + 26);
  scene.add(kilnLight);

  const seamLight = new THREE.PointLight(C.goldVein, 30, 46, 1.8);
  seamLight.position.set(PIT.x - 20, base + 6, PIT.z + 12);
  scene.add(seamLight);
  scene.add(sun.target); // a directional light needs its target in the scene

  const kilnSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(216,120,52,0.85)', 'rgba(216,120,52,0)'),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  }));
  kilnSprite.scale.set(56, 34, 1);
  kilnSprite.position.copy(kilnLight.position);
  kilnSprite.position.y += 4;
  scene.add(kilnSprite);

  const dustTex = glowTexture('rgba(216,188,128,1)', 'rgba(216,188,128,0)');
  for (let c = 0; c < 2; c++) {
    const COUNT = 300;
    const pts = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * (PIT.R + 20);
      pts[i * 3] = Math.cos(ang) * rad;
      pts[i * 3 + 1] = MODEL_URL ? 26 - Math.random() * 30 : 12 - Math.random() * (PIT.depth + 16);
      pts[i * 3 + 2] = Math.sin(ang) * rad;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const points = new THREE.Points(g, new THREE.PointsMaterial({
      map: dustTex,
      color: C.gold,
      size: c ? 0.5 : 0.28,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }));
    points.position.set(PIT.x, 0, PIT.z);
    scene.add(points);
    state.dust.push(points);
  }

  Object.assign(state, {
    renderer, scene, camera, sky: skyMat, kilnSprite, kilnLight, seamLight, sun,
    // the sprite's resting size, scaled to the sculpt once one is loaded
    kilnScale: new THREE.Vector2(56, 34),
  });
}

/* ------------------------------------------------------------ scroll → stops */
// Called on every page load and resize. Each section with data-cam becomes an
// anchor at the scroll offset where that section sits centred in the viewport.
let anchoredOnce = false;
function setAnchors(list) {
  state.anchors = list;
  // Snap only on the very first page. Later calls (page changes, resizes)
  // leave the live pose alone so the damp flies it to the new stops.
  sampleTarget(window.scrollY, !anchoredOnce);
  anchoredOnce = true;
}

for (const [k, v] of Object.entries(STOPS)) STOPS_SM[k] = v.sm ? { ...v, ...v.sm } : v;

function stopOf(name) {
  const table = small ? STOPS_SM : STOPS;
  return table[name] || table[FALLBACK];
}

// write the scroll-interpolated pose into tPos/tLook/tGrade
function sampleTarget(scrollY, snap = false) {
  const A = state.anchors;
  if (!A.length) return;

  let a = A[0], b = A[0];
  if (scrollY <= A[0].y) {
    a = b = A[0];
  } else if (scrollY >= A[A.length - 1].y) {
    a = b = A[A.length - 1];
  } else {
    for (let i = 0; i < A.length - 1; i++) {
      if (scrollY >= A[i].y && scrollY <= A[i + 1].y) { a = A[i]; b = A[i + 1]; break; }
    }
  }
  const span = b.y - a.y;
  const raw = span > 0 ? (scrollY - a.y) / span : 0;
  const t = raw * raw * (3 - 2 * raw); // smoothstep: eases into every stop

  const sa = stopOf(a.stop), sb = stopOf(b.stop);
  _a.set(sa.pos[0], sa.pos[1], sa.pos[2]);
  _b.set(sb.pos[0], sb.pos[1], sb.pos[2]);
  state.tPos.lerpVectors(_a, _b, t);
  _a.set(sa.look[0], sa.look[1], sa.look[2]);
  _b.set(sb.look[0], sb.look[1], sb.look[2]);
  state.tLook.lerpVectors(_a, _b, t);

  state.tGrade.fog = sa.fog + (sb.fog - sa.fog) * t;
  state.tGrade.deep = sa.deep + (sb.deep - sa.deep) * t;
  state.tGrade.kiln = sa.kiln + (sb.kiln - sa.kiln) * t;

  // The clip's playhead runs LINEARLY with the scroll, not on the smoothstep
  // the camera uses. Eased, it slowed to a stop at every mark and set off
  // again, so a clip that should run straight through a mark stuttered on it.
  // A hold is now only where two stops name the same clipT.
  // A stop with no clip of its own holds the neighbour's playhead, so a clip
  // fading in or out beside a plain stop stands still rather than rewinding.
  const ca = sa.clipT ?? sb.clipT ?? 0;
  const cb = sb.clipT ?? sa.clipT ?? 0;
  state.tGrade.clipT = ca + (cb - ca) * raw;
  // Which source is showing is not damped: it is a pure function of scroll, so
  // the blend never lags behind the reader. Lenis already smooths the input.
  state.blendFrom = sa.layer || 'world';
  state.blendTo = sb.layer || 'world';
  state.blendT = t;
  // whichever stop the reader is nearer to, for the dev overlay to edit
  state.nearStop = t < 0.5 ? a.stop : b.stop;


  if (snap) {
    state.pos.copy(state.tPos);
    state.look.copy(state.tLook);
    Object.assign(state.grade, state.tGrade);
  }
}

/* ------------------------------------------------------- the backdrop clip
   The clip is a real <video> on screen, not a texture in the WebGL pass. It
   sits in .backdrop, a fixed layer between the world canvas and the page,
   which is mix-blend-mode: screen, so the clip's black ground drops out and
   only the line art lands on the sky. This is what keeps it alive in Safari:
   a video drawn into WebGL from a hidden one-pixel element is one Safari
   stops decoding after a few minutes on the page, and the ship then never
   came back; a visible video is one the browser itself keeps, and restores
   when it comes back into view.

   Scroll is the transport: the clip never plays, its currentTime follows the
   scroll, one seek in flight at a time. Every frame is a keyframe (see
   README), so a seek costs one frame of decode.                            */

const SEEK_EPS = 1 / 120;
const CLIPS = { vessel: 0 };

/* Where the clip sits: on a STAGE, an element in the page whose rect it
   fills, so the layout decides where the ship goes at every viewport.
   index.astro sizes the stage to the clip's own proportions. The clip is held
   where the stage sits once its chapter is PINNED, from the first frame to
   the last, so the ship never moves, and is shown only while its dark
   chapter covers that spot.                                                */
const PLACE = {
  vessel: { stage: '[data-clip-stage="vessel"]' },
};

let stageEl = null;
function stageRect(sel) {
  if (!stageEl || !stageEl.isConnected) stageEl = document.querySelector(sel);
  return stageEl && stageEl.getBoundingClientRect();
}

// Size and place the video on the stage's pinned rect. Returns how strongly
// to show it (0 to 1): 0 when the stage is not on this page or its chapter
// does not yet cover where the clip sits.
function placeClip(name, el) {
  const box = PLACE[name];
  const r = stageRect(box.stage);
  if (!r || !r.width) return 0;
  const vh = window.innerHeight;
  // The sticky stage's offset from the top of the screen is how far it is
  // from being pinned; subtracting it gives the rect it has when pinned.
  const host = stageEl.closest('.interlude__stage');
  const top = r.top - (host ? host.getBoundingClientRect().top : 0);
  // a stage whose styles failed to load measures 0px tall: size from width
  const va = (el.videoWidth / el.videoHeight) || 640 / 368;
  const h = r.height > 1 ? r.height : r.width / va;
  const css = `${Math.round(r.left)}px,${Math.round(top)}px,${Math.round(r.width)}px,${Math.round(h)}px`;
  if (el.__css !== css) {
    el.__css = css;
    el.style.left = `${Math.round(r.left)}px`;
    el.style.top = `${Math.round(top)}px`;
    el.style.width = `${Math.round(r.width)}px`;
    el.style.height = `${Math.round(h)}px`;
  }
  // fade up as the chapter's top edge rises past the clip's top, and out as
  // its foot comes up to the clip's bottom: never drawn over another section
  const sec = host?.parentElement?.getBoundingClientRect();
  if (!sec) return 1;
  const band = 0.12 * vh;
  const enter = Math.min(1, Math.max(0, (top - sec.top) / band));
  const leave = Math.min(1, Math.max(0, (sec.bottom - (top + h)) / band));
  return enter * leave;
}

// Which clip is showing at this scroll position, and how strongly. Only ever
// one at a time: two stops naming different clips would be a mistake in the
// registry, and it falls back to showing neither.
function activeClip() {
  const from = state.blendFrom, to = state.blendTo;
  if (from === to) return [from, from === 'world' ? 0 : 1];
  if (from === 'world') return [to, state.blendT];
  if (to === 'world') return [from, 1 - state.blendT];
  return ['world', 0];
}

function hideClip(el) {
  if (el.__on) { el.__on = false; el.style.opacity = '0'; el.style.visibility = 'hidden'; }
}

// Runs every frame, before the world's idle throttle: the camera holds still
// through the clip's chapter, and a throttled frame would scrub at half rate.
function updateClip() {
  const clips = state.clips;
  if (!clips) return;
  const [name, amt] = activeClip();
  const el = clips[CLIPS[name]];
  for (const v of clips) if (v && v !== el) hideClip(v);
  if (!el) return;
  const shown = amt * placeClip(name, el);
  if (shown <= 0.004) { hideClip(el); return; }

  // If the browser has let the clip go entirely (no data at all, after long
  // enough idle), rebuild it. Throttled, since a reload restarts its fetch.
  if (el.readyState === 0 && performance.now() - (el.__reloaded || 0) > 3000) {
    el.__reloaded = performance.now();
    el.load();
  }
  if (el.readyState >= 1) {
    if (!el.paused) el.pause();
    const dur = el.duration || 4;
    const want = Math.min(dur - 0.05, Math.max(0.04, Math.max(0, state.grade.clipT) * (dur - 0.05)));
    el.__want = want;
    if (!el.seeking && Math.abs(el.currentTime - want) > SEEK_EPS) el.currentTime = want;
  }
  if (!el.__on) { el.__on = true; el.style.visibility = 'visible'; }
  el.style.opacity = shown.toFixed(3);
}

/* ------------------------------------------------------------ frame */
// Own rAF loop, real seconds. (GSAP's ticker reports SECONDS, not ms. The
// old code read it as ms, which froze every flight. Never mix them again.)
function frame(now) {
  if (!state.ready) return;
  requestAnimationFrame(frame);
  if (document.hidden) return;

  const dt = Math.min(0.05, (now - lastNow) / 1000 || 0.016);
  lastNow = now;

  sampleTarget(window.scrollY);
  updateClip();

  state.clock += dt;
  const t = state.clock;

  // frame-rate independent critical damp, identical feel at 30 or 144fps
  const k = 1 - Math.exp(-state.lambda * dt);
  const intro = state.intro;
  if (intro) {
    // A scripted move with a soft start and a soft landing. The damp it
    // replaces did 70% of its travel in the first half second, which read as a
    // jolt followed by a long drift. Aimed at the LIVE target, so a scroll that
    // starts mid-intro still lands where the reader is.
    const p = Math.min(1, (now - intro.t0) / INTRO_MS);
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(2 - 2 * p, 3) / 2;
    const clear = 1 - Math.pow(1 - p, 2); // the haze lifts ahead of the move
    state.pos.lerpVectors(intro.pos, state.tPos, e);
    state.look.lerpVectors(intro.look, state.tLook, e);
    state.grade.fog = intro.fog + (state.tGrade.fog - intro.fog) * clear;
    state.grade.deep = intro.deep + (state.tGrade.deep - intro.deep) * clear;
    if (p >= 1) state.intro = null;
  } else {
    state.pos.lerp(state.tPos, k);
    state.look.lerp(state.tLook, k);
    state.grade.fog += (state.tGrade.fog - state.grade.fog) * k;
    state.grade.deep += (state.tGrade.deep - state.grade.deep) * k;
  }
  state.grade.kiln += (state.tGrade.kiln - state.grade.kiln) * k;
  // flights ease back to the standing rate
  if (state.lambda < 4.5) state.lambda = Math.min(4.5, state.lambda + dt * 1.6);

  state.pointerSmooth.x += (state.pointer.x - state.pointerSmooth.x) * Math.min(1, dt * 3.2);
  state.pointerSmooth.y += (state.pointer.y - state.pointerSmooth.y) * Math.min(1, dt * 3.2);

  const drift = state.reduced ? 0 : 1;
  // While a clip is up the camera holds still: the clip is fixed to the
  // screen, so a world swinging with the pointer behind it made the artwork
  // look pasted on rather than placed.
  const still = 1 - 0.9 * activeClip()[1];

  // orbit the eased pose around its own look target
  if (!state.manual) {
    _off.subVectors(state.pos, state.look);
    const yaw = (-state.pointerSmooth.x * 0.16 + Math.sin(t * 0.07) * 0.02) * drift * still;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const ox = _off.x * cy - _off.z * sy;
    const oz = _off.x * sy + _off.z * cy;
    _off.x = ox; _off.z = oz;
    _off.y += (-state.pointerSmooth.y * _off.length() * 0.06 + Math.sin(t * 0.22) * 0.35) * drift * still;
    _a.addVectors(state.look, _off);

    state.camera.position.copy(_a);
    state.camera.lookAt(state.look);
  }

  const g = state.grade;
  // The playhead is NOT damped. It is a pure function of the scroll, which
  // Lenis already smooths, so it stays locked to the copy scrolling beside
  // it; damped, it trailed the page by a quarter of a second, and gliding
  // between the two clips ran the ship backwards through its whole build.
  g.clipT = state.tGrade.clipT;
  state.scene.fog.density = g.fog;
  state.scene.fog.color.copy(C.fogSurface).lerp(C.fogDeep, g.deep);
  state.sky.uniforms.uDeep.value = g.deep;
  state.sun.intensity = 2.6 - g.deep * 1.5;



  const pulse = 1 + Math.sin(t * 1.9) * 0.08 * drift;
  state.kilnSprite.material.opacity = g.kiln * 0.95;
  state.kilnSprite.scale.set(state.kilnScale.x * pulse, state.kilnScale.y * pulse, 1);
  state.kilnLight.intensity = g.kiln * 300 * pulse;

  state.dust[0].rotation.y = t * 0.017;
  state.dust[1].rotation.y = -t * 0.012;
  state.dust[0].material.opacity = 0.3 + g.kiln * 0.4;
  state.dust[1].material.opacity = 0.3 + g.kiln * 0.4;
  state.dust[0].material.color.copy(C.gold).lerp(C.ember, g.kiln * 0.6);

  // Idle throttle. Once the pose has settled on its stop, the only motion left
  // is the slow ambient drift, indistinguishable at half rate, and it halves
  // the GPU cost of a page nobody is scrolling.
  const settled =
    !state.intro &&
    state.lambda >= 4.5 &&
    state.pos.distanceToSquared(state.tPos) < 4e-4 &&
    state.look.distanceToSquared(state.tLook) < 4e-4;
  // Reduced motion holds one still frame: with the drift off, a settled frame
  // is identical to the last one, so there is nothing to redraw at all.
  if (!state.manual && settled && (state.reduced || now - lastDraw < 32)) return;
  lastDraw = now;
  // Quality is judged only on frames doing the full job. A throttled idle
  // frame is cheap for the wrong reason and would talk us into a tier we
  // cannot hold once the scroll starts again.
  if (!settled) adapt(dt);

  state.renderer.render(state.scene, state.camera);
}

let lastDraw = 0;

function onResize() {
  if (!state.ready) return;
  small = narrow();
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  applyDpr();
  state.renderer.setSize(window.innerWidth, window.innerHeight, false);
  if (state.reduced) state.renderer.render(state.scene, state.camera);
}

/* ------------------------------------------------------------ api */
export const World = {
  init(canvas, { reduced = false } = {}) {
    if (state.ready) return;
    state.reduced = reduced;
    // A WebGL failure must still release the preloader: the site stands
    // without the world, but never behind a loading screen that will not lift.
    try {
      build(canvas);
    } catch (e) {
      markReady();
      throw e;
    }
    state.ready = true;
    window.addEventListener('resize', onResize);

    if (reduced) state.lambda = 60; // arrive at each stop, don't fly to it
    else window.addEventListener('pointermove', (e) => {
      state.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      state.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    lastNow = performance.now();
    requestAnimationFrame(frame);

    // Sculpted model, if one is configured and the device should carry it.
    // The preloader is waiting on this: whichever way it ends, mark ready.
    const model = shouldLoadModel()
      ? World.loadModel(MODEL_URL).catch((e) => console.warn('[aevum:world] model failed, keeping procedural terrain', e))
      : Promise.resolve();

    model.finally(markReady);
  },

  // motion.js hands over [{ y: scrollOffset, stop: 'rim' }, ...] per page
  setAnchors,

  // The two backdrop videos. Their opacity is graded here rather than in the
  // DOM layer so it lands on the same frame as the fog colour it hides behind.
  setClips(list) {
    state.clips = list;
    for (const el of list) {
      if (!el || el.__bound) continue;
      el.__bound = true;
      // one seek in flight at a time; when it lands, chase the scroll
      el.addEventListener('seeked', () => {
        if (el.__want != null && Math.abs(el.currentTime - el.__want) > SEEK_EPS) el.currentTime = el.__want;
      });
    }
  },

  // the clips ride the same device rule as the model
  get wantsMedia() { return shouldLoadModel(); },

  // Stop sampling until the next page hands over its anchors. The scroll is
  // reset to the top mid-navigation, and reading that against the outgoing
  // page's anchors aims the camera at a stop nobody asked for.
  hold() {
    state.anchors = [];
  },

  // Point the camera at a named stop directly, without anchors. Used at the
  // swap so the flight starts from the incoming page's first section.
  aim(name) {
    const s = stopOf(name);
    state.tPos.set(s.pos[0], s.pos[1], s.pos[2]);
    state.tLook.set(s.look[0], s.look[1], s.look[2]);
    state.tGrade.fog = s.fog;
    state.tGrade.deep = s.deep;
    state.tGrade.kiln = s.kiln;
  },

  // a page change re-aims the camera; slow the damp so the arrival is a flight
  flight() {
    if (!state.reduced) state.lambda = 1.6;
  },

  // The first sight of the world is a move, not a cut. It used to start pulled
  // back and dolly in, which framed the sculpt small enough for its outer
  // edge to show. Now it starts CLOSE and high, looking down into the benches
  // with the frame full of rock and haze, and the camera lifts back and tilts
  // up to the horizon of the opening stop while the copy rises: a surfacing,
  // the reverse of the descent the page then makes. Called when the preloader
  // lifts.
  intro() {
    if (state.reduced) return;
    // Starts a little back and well below the vantage, deep in haze, then
    // rises and pushes in to it as the haze lifts: the zoom in and fade in,
    // without the pulled-back frame that showed the sculpt's outer edge. Low is
    // what makes it safe: the near terraces cover everything past the model's
    // rim, measured clean from here all the way in. Anything further back than
    // about 1.15x shows the cut on the right of the frame.
    _off.subVectors(state.tPos, state.tLook).multiplyScalar(1.1);
    const pos = new THREE.Vector3().addVectors(state.tLook, _off);
    pos.y -= 8;
    const look = state.tLook.clone();
    look.y -= 5;
    state.intro = {
      t0: performance.now(),
      pos, look,
      fog: state.tGrade.fog * 3.2,
      deep: Math.min(1, state.tGrade.deep + 0.3),
    };
    state.pos.copy(pos);
    state.look.copy(look);
    state.grade.fog = state.intro.fog;
    state.grade.deep = state.intro.deep;
  },

  // Nest a sculpted quarry GLB in the landscape, auto-fitted so the existing
  // camera stops keep framing it. Call it again with different numbers to
  // re-frame; the previous one is disposed. See README → 3D model pipeline.
  //
  //   await AevumWorld.loadModel('/media/quarry.glb', { footprint: 90, y: -6 })
  //
  // Only Draco is wired up: the optimise step in the README compresses
  // geometry with Draco and textures to WebP, which GLTFLoader reads natively.
  // Decoder paths are left unset so Vite resolves them from three's own
  // `new URL(..., import.meta.url)` and emits them as lazy chunks.
  async loadModel(url, { footprint = PIT.R * 2.6, y = null, rotationY = 0 } = {}) {
    const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/loaders/DRACOLoader.js'),
    ]);
    const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader());
    const model = (await loader.loadAsync(url, (e) => {
      if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total);
    })).scene;
    model.rotation.y = rotationY;

    // fit: scale to footprint, centre on the pit, rest the base on the apron
    model.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.scale.setScalar(footprint / (Math.max(size.x, size.z) || 1));

    model.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    model.position.x += PIT.x - centre.x;
    model.position.z += PIT.z - centre.z;
    model.position.y += y === null ? -3 - box.min.y : y;

    // Photogrammetry arrives unlit with baked midday sun, so it ignores this
    // world's light and glares white. Lambert + tint seats it in the palette
    // and lets the dawn sun and kiln ember play across it.
    model.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      o.castShadow = o.receiveShadow = false;
      const m = o.material;
      o.material = new THREE.MeshLambertMaterial({
        map: m.map || null,
        vertexColors: !!m.vertexColors, // sculpts without textures carry colour here
        color: new THREE.Color(MODEL_TINT),
        side: m.side,
      });
      m.dispose();
    });

    const prev = state.scene.getObjectByName('model');
    model.name = 'model';
    model.visible = false;
    state.scene.add(model);
    await state.renderer.compileAsync?.(state.scene, state.camera); // no first-frame hitch
    model.visible = true;

    if (prev) {
      state.scene.remove(prev);
      prev.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
    }

    // Third mesh: the join between the sculpt and the range. Neither of the
    // other two is touched.
    const oldCollar = state.scene.getObjectByName('collar');
    if (oldCollar) {
      state.scene.remove(oldCollar);
      oldCollar.geometry.dispose();
      oldCollar.material.dispose();
    }
    const field = sampleModelHeights(model);
    extend(field);
    const collar = buildCollar(makeNoise(11), field);
    if (collar) state.scene.add(collar);

    // Move the light onto the sculpt. Everything below was positioned for the
    // procedural pit, which the model now stands in place of, so the ember was
    // glowing at the foot of a quarry that is no longer there.
    const fitted = new THREE.Box3().setFromObject(model);
    const mid = fitted.getCenter(new THREE.Vector3());
    const span = fitted.getSize(new THREE.Vector3());

    // the kiln sits high on the terraces so its glow rakes down them
    state.kilnLight.position.set(mid.x - span.x * 0.06, fitted.min.y + span.y * 0.66, mid.z + span.z * 0.24);
    state.kilnLight.distance = Math.max(70, span.x * 1.25);
    state.kilnSprite.position.copy(state.kilnLight.position);
    state.kilnSprite.position.y += span.y * 0.1;
    state.kilnScale.set(span.x * 0.62, span.y * 1.5);

    // the seam glow lower and to the west, catching the near bench walls
    state.seamLight.position.set(mid.x - span.x * 0.3, fitted.min.y + span.y * 0.3, mid.z + span.z * 0.14);
    state.seamLight.distance = Math.max(46, span.x * 0.8);

    // and the sun re-aimed at the sculpt's mass rather than the world origin
    state.sun.position.set(mid.x + 58, fitted.min.y + span.y + 26, mid.z + 52);
    state.sun.target.position.set(mid.x, fitted.min.y + span.y * 0.4, mid.z);
    state.sun.target.updateMatrixWorld();

    // Budget read for whoever swaps the model next. See README, 3D model
    // pipeline for the numbers this site is built to hold.
    let tris = 0, meshes = 0;
    model.traverse((o) => {
      if (!o.isMesh) return;
      meshes++;
      tris += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
    });
    console.info(
      `[aevum:world] model fitted: ${Math.round(tris / 1000)}k triangles in ${meshes} draw calls, ` +
      `scale ${model.scale.x.toFixed(4)}, ` +
      `position ${model.position.toArray().map((v) => v.toFixed(1)).join(', ')}`
    );
    return model;
  },

  /* ---------------------------------------------------------------- dev tool
     Used only by src/pages/camera.astro, which exists to find camera stops by
     eye. Delete these two and that page together once STOPS is settled.     */
  manual(on) { state.manual = on; },

  // Which stop the scroll is currently nearest, so the dev overlay knows what
  // it is editing without duplicating the anchor maths.
  get nearStop() { return state.nearStop; },
  get small() { return small; },

  /* Write a stop in place, from the dev overlay. Both tables are updated so the
     change takes effect at the current breakpoint immediately, and the pose is
     re-sampled so releasing manual control eases to the new value rather than
     the old one. */
  setStop(name, patch, forSmall) {
    const base = STOPS[name];
    if (!base) return false;
    if (forSmall) {
      base.sm = { ...(base.sm || {}), ...patch };
      STOPS_SM[name] = { ...base, ...base.sm };
    } else {
      Object.assign(base, patch);
      STOPS_SM[name] = base.sm ? { ...base, ...base.sm } : base;
    }
    sampleTarget(window.scrollY);
    return true;
  },
  grade(g) { Object.assign(state.grade, g); Object.assign(state.tGrade, g); },
  get stops() { return STOPS; },
  // the clip placements and depths, for the same by-eye tuning as the stops
  get place() { return PLACE; },

  get ready() { return state.ready; },
  // resolves when the world is ready to be shown; the preloader awaits it
  whenReady,
  set progress(fn) { onProgress = fn; },
  // handles for tuning a model from the console
  get scene() { return state.scene; },
  get camera() { return state.camera; },
  get renderer() { return state.renderer; },
  get anchors() { return state.anchors; },
  get lookAt() { return state.look; },
};

if (typeof window !== 'undefined') window.AevumWorld = World;
