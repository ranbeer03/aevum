# Aevum — aevumfze.com

Corporate site for Aevum FZE (cement clinker & limestone trading, UAE).
Astro + GSAP + Lenis, fully static output. Design system documented in
`DESIGN.md`; product truth in `PRODUCT.md`; asset generation prompts in
`ASSET-PROMPTS.md`.

## Run

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site → dist/
npm run preview    # serve dist/ — judge performance and the preloader here, not on dev
```

`npm run dev` serves unbundled modules, which makes the first load slow and the
preloader linger far longer than it will in production. Any judgement about
speed or about how long the loading mark stays up has to be made against
`npm run preview`.

## Design system

`DESIGN.md` is the design contract. Its "HIG pass" section records the review
of the site against Apple's Human Interface Guidelines foundations on the
`apple-design` branch: every colour pair's measured contrast, the weight and
tracking decisions, what gold is allowed to mean, and the accessibility states
the one glass surface answers to.

## Checking motion without a screen

```bash
node dev/motion-harness.mjs check http://localhost:4322 1440x900 /,/about,/commodities,/contact
```

`dev/motion-harness.mjs` drives the built site in headless Chromium
(playwright-core, already a dev dependency). `check` sweeps each page on a
viewport, in normal and reduced motion, and reports page errors, reveal targets
left unrevealed, anything still hidden, leftover split markup and horizontal
overflow. `anchors` screenshots every camera stop settled; `stop <name[:frac]>`
screenshots one stop, or a point between two, with optional patches to stops,
placements and depths as JSON, so a framing can be tried without editing
`world.js`; `trace <selector>` prints an element's reveal frame by frame;
`intro` and `hover` capture frame sequences; `perf` measures scroll frame gaps
on the GPU. The in-app browser pane does not run rAF while hidden, which is why
this exists. Two things it learned the hard way: the world's damp caps `dt` at
50ms a frame, so under the software renderer a fixed wait is not enough and
every shot polls until the camera has stopped moving; and captures must run one
at a time, since three at once starve the renderer and the camera never arrives.

## Tuning camera stops

```bash
npm run dev:camera
```

That opens the real site at `/?cam=1` with a tuning bar along the bottom. Not a
separate page: you scroll the actual pages, with the actual content and clips,
and adjust the camera in place.

**The loop.** Scroll to a section. The bar names the stop the scroll is nearest
and which breakpoint you are editing. Press **Take control** (or `C`) and the
camera is yours: drag to orbit, right-drag to pan, wheel to zoom. Press **Save
stop** (or `S`) and the numbers are written into `STOPS` in
`src/scripts/world.js`. Press **Release** and the scroll drives again, easing
onto the value you just saved. **Revert view** restores the stop's saved framing
if an adjustment went wrong.

**It edits the breakpoint you are on.** A wide window writes the stop's `pos`
and `look`; a window under 860px writes its `sm` variant instead, creating one
if the stop does not have it yet.

**How the write works.** `dev/cam-writer.mjs` is a Vite plugin with
`apply: 'serve'`, so it exists only under `astro dev`. It exposes `POST /__cam`,
locates the named entry in `world.js`, patches `pos`/`look`, and **parses the
result with esbuild before committing it**. This file is the whole 3D world,
and a regex that damaged it would be a bad way to find out.

Three things that were wrong before they were right, all of them worth keeping
in mind if you touch the patcher:

- An entry ends at the next key **at the same indentation**. Anchoring on any
  indentation truncated multi-line entries before their `sm:` continuation and
  dropped their closing braces.
- A comment line belongs to the **next** stop. Not stopping at one swallowed it
  and left no closing brace to insert before.
- A new `sm` block goes **inside** the entry, before its closing brace.
  Appending after it made `sm` a sibling key of the stop rather than part of it.

**The save does not reload the page.** Writing a watched source file would trip
HMR, reload the module and tear the live scene down, losing the session at the
moment it succeeded. The writer unwatches `world.js` across the write and
restores the watcher after, and the overlay applies the value in memory through
`World.setStop`, so a reload buys nothing. Hand edits to `world.js` still
reload normally.

**Nothing reaches production.** Base.astro imports the overlay through a
dynamic `import.meta.env.DEV` branch, so a build never sees the component and
cannot emit its script or pull OrbitControls in. Verified: no `camdev`,
`__cam` or `OrbitControls` in `dist`. A static import plus a render-time guard
bundled both, which is why the import itself is conditional.

**To remove it all:** `src/components/CamDev.astro`, its branch in
`src/layouts/Base.astro`, `dev/cam-writer.mjs`, the plugin line in
`astro.config.mjs`, the `dev:camera` script, the `aevum-dev-4323` entry in
`.claude/launch.json`, and `manual`/`nearStop`/`small`/`setStop`/`lookAt` on the
World API.

## Before launch## Before launch — the swap list

Everything pending is a data edit, not code surgery:

| What | Where | Status |
|---|---|---|
| Enquiry email | `src/data/site.js` → `contact.email` | confirm with IT/admin |
| Phone number | `src/data/site.js` → `contact.phone` + `phoneHref` | hidden until filled |
| FZE address | `src/data/site.js` → `contact.address` | generic until received |
| Form endpoint | `src/data/site.js` → `FORM_KEY` (free key from web3forms.com, submissions → email) | button drafts an email until set |
| Partner names | `src/data/site.js` → `partners` (activates "Working alongside" strip) | wait for Jai's clearance — note: "ABGT" could not be verified as an entity; confirm exact name before publishing |
| Commodity specs | `src/data/commodities.js` → `specs[].value` | rows appear as values arrive |
| Privacy / Terms | `src/pages/privacy.astro`, `terms.astro` | holding copy until Dhanesh's text |
| Logo | replace wordmark + sigil in `Nav.astro`, `Footer.astro`, `public/favicon.svg` | interim sigil in place |
| Remove the camera overlay | see "Tuning camera stops" | dev only, already excluded from the build |
| Scroll videos | drop Seedance renders in `public/media/video/`, add `video=... scrub` to the `Media` slots (see ASSET-PROMPTS.md §2) | optional upgrade |

## 3D model pipeline

The world behind every page is a procedural quarry (`src/scripts/world.js`).
To replace it with a sculpted model:

**1. Download GLB — the 1k texture variant.** GLB is the only web format
here: one binary file with geometry, materials and textures inside. Skip
`.obj` (no packed materials), `.usdz` (Apple AR only) and `.gltf` (loose
sidecar files). Take **1k textures, not 4k/8k** — the model is seen through
fog at distance, and an 8k texture costs ~256 MB of VRAM decoded while 1k
costs ~4 MB.

**2. Compress it — never ship the raw download.**

```bash
npx gltf-transform optimize ~/Downloads/model.glb public/media/quarry.glb --compress draco --texture-compress webp --texture-size 1024
```

Measured on a representative 8.6 MB export: **8.64 MB → 399 KB (21×)**.
A textured 13 MB download should land near 2–4 MB. Draco and KTX2/Basis decoders are bundled automatically as lazy chunks —
nothing to host by hand.

**3. Switch it on.** In `src/scripts/world.js`:

```js
const MODEL_URL = '/media/quarry.glb';
```

**Currently live:** `quarry_slope.glb` (Sketchfab photogrammetry, 14.57 MB)
compressed to **859 KB**, 290k triangles. Three things had to be true for it
to actually read on screen:

1. **It is a quarried hill, not a landscape** — it nests inside the procedural
   mountains, which supply the horizon, and the procedural pit carve is
   switched off when the model loads (`buildTerrain(N, !shouldLoadModel())`)
   so two quarries don't compete for the same ground.
2. **It sits *on* the ground, not under it** — auto-fit rests its base just
   below the apron (`y = -3 - box.min.y`). Sinking it into the old pit made
   our own terrain bury it.
3. **Its texture is baked midday sun and unlit** — import re-materialises it
   to Lambert so the dawn sun and kiln ember play across it, and
   `MODEL_TINT` seats it in the palette instead of glaring white.

The seven camera stops orbit the hill rather than diving into a pit, and fog
densities were lowered because `FogExp2` opacity grows with the **square** of
density × distance — the far stops were washing the model out completely.

That is the whole integration. What happens automatically:

- **The page waits for it, once.** On first load the branded preloader
  (`.loader` in `Base.astro`) holds the page while the model streams; the gold
  seam fills the mark in fifths from `GLTFLoader`'s progress events, and the
  copy reveals in the same moment the world appears. It lifts on success, on
  failure, when the device skips the model, and on an 8-second timeout — and
  an inline failsafe in `<head>` removes it after 10s even if the bundle never
  boots. Client-side navigations strip it from the incoming document, so it is
  a first-visit device only.
- **Auto-fitted to the camera** — scaled so its footprint matches the pit,
  centred, and dropped so its lowest point sits at the pit floor, so all seven
  camera stops keep framing it. The console logs triangles, draw calls and the
  computed transform on every load: that is your budget read when you swap a
  heavier model in.
- **Compiled before it is shown** — `renderer.compileAsync` warms the shaders
  while the model is still invisible, so a large model can never land as a
  dropped frame.
- **On every device.** The sculpt ships to phones too: holding it back made
  mobile a lesser version of the same page. What keeps it affordable is the
  adaptive resolution, which already caps small screens at 1x and steps down
  from there on its own. Measured on a 390px viewport at 4x CPU throttle: zero
  of 180 frames over 32 ms. Save-Data is still honoured, because that is the
  visitor asking. A stop can carry an `sm` variant for its phone framing, which
  is resolved once into a parallel table rather than merged per frame.
- **Perf-guarded** — PBR materials convert to Lambert on import (same look
  under this lighting, far cheaper per pixel), and the renderer adapts its own
  resolution (see below).

### The three meshes

The world is three separate meshes and all of them matter:

1. **`terrain`** is the procedural range. It supplies the horizon and the
   background, and on phones (which skip the sculpt) it carries the whole
   scene, so it is built with the pit carved and at higher density there.
2. **`model`** is the sculpted quarry GLB, auto-fitted onto the pit centre.
3. **`collar`** is the join between them, generated at load from the model
   itself. It exists because the sculpt is a slab with a hard outer edge:
   its base plane sits at roughly y=0 while the range at the same radius is
   already 1 to 8 units high and climbing to about 27 by r=60, so dropped in
   raw it reads as an object set on a table.

The collar closes that gap. `sampleModelHeights` renders the sculpt straight
down into a 192x192 heightfield with an orthographic pass (a raycast per vertex
against 290k triangles is not affordable, one render is), `extend` carries those
heights outward with a breadth-first flood whose pass number doubles as the
distance field, and `buildCollar` eases them into `terrainHeight()`. Triangles
that end up buried under the sculpt or under the range are dropped, so what
remains is only the join: about 38k triangles, which measured no change in
frame time at all.

Two details keep the seam invisible. The collar's far edge is set half a unit
*under* the terrain so it disappears beneath the range rather than fighting it
for the same pixels, and it carries the same fine noise the range does, faded
out as it approaches the sculpt so the join itself stays exact.

The lights follow the sculpt too. The ember and seam glows were positioned for
the procedural pit; once a model loads they are re-placed against its real
bounding box, high on the terraces so the glow rakes down them, and the sun is
re-aimed at the model's mass rather than the world origin.

> One thing to know if you swap the model: bench colours in `buildTerrain` are
> gated on `carve`. With a sculpt loaded there is no procedural pit, and
> painting that ring pale turned the apron into a white plate for the model to
> sit on. Phones still get the bench colours, because they still get the pit.

### How a page arrives

Reveals are declared in CSS and driven by Motion. CSS holds only the *hidden*
state of each variant (`[data-reveal]`, `="strata"`, `="rule"`, `="plate"`,
`.split-line`), so the page is correct before the script runs and if it never
does; `motion.js` animates the entrance, which is what lets a page arrival
stagger its content as one movement instead of every element firing at once.

Three rules keep it smooth, each of which was a visible bug first:

- **The entrance starts at `astro:after-swap`, not `astro:page-load`.** Astro
  fires page-load only after the view-transition lifecycle settles, which left
  about 150 ms of a fully painted page with its headings still hidden.
- **The container fades up with its content.** Without it the swap snapped every
  background, plate and image to full strength in one frame and only the words
  animated, so a page change read as a cut with some text sliding afterwards.
- **Reveal targets are scoped to `#main` and `footer`.** The persisted nav's
  drawer links are `.split-line` too and sit in the DOM *before* `#main`, so an
  unscoped query gave them the first three stagger slots and pushed every real
  heading back by 165 ms. The drawer runs its own entrance when it opens, and
  owns both its closed and open states rather than borrowing `.in`.

Sections with a background (`.is-light`) carry `data-reveal="plate"` and reveal
as their own layer, ahead of the words that sit on them, via a registered
`@property --plate` that scales the band's alpha. An unregistered custom
property is not animatable, so the `@property` block is load-bearing.

An authored `--reveal-delay` on an element overrides the generic cascade, so a
hero can still time its own lines.

**Headings are split into lines at reveal time** (GSAP SplitText, `mask:
'lines'`) and rise out of a clipped box, the hero's own cut, with a 100ms
stagger between lines. Splitting happens when the heading is revealed rather
than at build time because where a line breaks depends on the viewport, and the
split is reverted once the lines are in so a later resize rewraps plain text.
The lines take the hidden transform in the same synchronous step the heading
gives up its own, so no frame can paint the finished heading first.

**Copy arrives as a focus pull,** not only a fade: `blur(6px)` to sharp over a
second, on a rounder curve than the exponential one the masks use. The reason is
measured: with the exponential curve, a 21px rise in 620ms was 91% complete
after 218ms, which read as a pop. Nine tenths of the move in the first fifth is
right for a mask and wrong for a paragraph.

**Content leaves as it arrived.** Each section's wrapper carries `data-exit`
and recedes (opacity and 44px of lift) as it passes out through the top, scrubbed
by ScrollTrigger so scrolling back brings it straight back. It is on the
wrapper, not the revealed children, because Motion owns their transforms and
two engines writing one transform fight; and it is opacity and translate only,
because it runs on every scroll frame and a blur would re-rasterise the block
each time.

**Chain rows** (`data-reveal="row"`) are laid down left to right with a
`clip-path` inset, the way the route line beside them draws.

### Where the clips sit in the scroll

Camera anchors are measured where a `[data-cam]` element sits centred in the
viewport, so a zero-height `.pass--mark` placed beside a section is an anchor
pinned to that section's edge. The home page uses marks and three short passes
to time the clips against the copy, and nothing else:

| in document order | anchor | what it does |
|---|---|---|
| `#limestone` | `rim` | the chapter, centred |
| `.pass--gap` (40vh) | | the camera tilts off the benches toward open sky |
| mark | `clinkerIn` | the shaft is fully lit; the nodules begin to fall |
| `#clinker` | `clinkerHold` | nodules mid-fall with the chapter centred |
| mark | `clinkerOut` | the nodules have fallen out as the chapter leaves |
| mark | `vesselIn` | the vessel is live from 0.12 (the first half second is a keel line) |
| `.pass--build` (90vh) | | it draws itself against the sky before the chain's heading comes up |
| `.chain` | `vesselBuilt` | finished, with the chain centred |
| mark | `vesselHold` | still finished: the hold spans the chain's lower half |
| `.pass--run` (60vh) | `vesselRun` | it comes apart as the Incoterms leave the top |
| mark | `vesselOut` | gone, before the Emirates arrive |

The previous layout did the same job with six tall spacers that added up to
592vh of page with nothing on it; this is 190vh, and the page is a third
shorter. Adjacent marks (`clinkerOut`, `vesselIn`) share a camera pose so the
camera is never asked for a step between two anchors a pixel apart.

**`scrubTo` never seeks to exactly 0.** A clip that has not been seeked yet
uploads a black frame however ready it reports itself, so the first stop of a
clip drew nothing until the reader had scrolled a little past it. The floor is
40ms.

### The backdrop clips

Two clips sit behind the clinker and supply-chain chapters: nodules falling
through a shaft of light, and a bulk carrier drawing itself as a wireframe.
Both are line art and light on pure black, and both animate themselves on and
off inside their own four seconds.

**There is no transition.** That is the point of the current design. Because
the clips open and close on black, and black keys out, the clip's own entrance
and exit are the handoff. `drawClip()` renders one fullscreen quad over the
finished world and nothing else happens.

**Keyed on brightness, not blended additively.** Additive suits glowing line
art but makes a solid object translucent, and one clip is lit rock: you could
see the terrain through the stones. The key is
`smoothstep(0.015, 0.20, max(r, g, b))`, which gives both cases, since a bright
surface keys to opaque and a dim glow keys to a soft blend, which is what
additive did anyway. `max()` rather than perceptual luma, or saturated gold
lines key too weakly.

**Placed, not full-bleed.** Each clip occupies a defined box, set in `PLACE` as
a fraction of viewport width plus a centre. Aspect is preserved by computing the
box in JS, so nothing is cropped or stretched. The clinker beam falls through
the upper right with the quarry held down into the lower left; the vessel runs
across a middle lane with the chapter's copy pushed out to either side of it.
`sm` is the phone framing, and `dim` steps a clip back there, because a narrow
viewport has no side lane and the copy has to sit over the clip rather than
beside it.

The centre column of `.chain__head` and `.chain__row` is deliberately empty:
that is the lane the vessel travels down. Letting text sit under it made the
text unreadable rather than layered.

**Scroll is the transport.** The clips never play. `clipT` interpolates between
stops and is written straight to `currentTime`, so stopping the scroll holds
the frame. Both are encoded **all-intra** (`-g 1`), which is what makes that
affordable: a seek costs one frame of decode instead of a whole group of
pictures.

**Frame count is what makes a scrub smooth, not seek speed.** At 20fps the
clips had 81 frames spread over about 2000px of scroll, which is 26px per
frame: seeks completed in 2.6ms but the clip still advanced in visible steps,
because a wheel notch skipped four frames at once. Motion-interpolating to
60fps gives 238 frames and roughly 8px per frame. Diagnose this by counting
frames actually presented, not by frame rate:

```js
v.requestVideoFrameCallback(function cb(){ n++; v.requestVideoFrameCallback(cb); });
```

**`clipT` can plateau.** Two adjacent stops with the same `clipT` freeze the
clip between them. The vessel uses this to finish building before the copy
arrives, hold while it is read, and resume only once the reader has moved past.

**Clips have depth.** The quad is drawn at an NDC depth derived from the
camera's distance to its look target (`CLIP_DEPTH` per clip), with depth testing
on, so terrain occludes it. Without this the nodules stopped dead against the
terrace edge instead of falling behind it. It is computed from the projection
rather than hardcoded, because a constant would silently stop occluding when
the camera changes.

**Stops carry `layer` and `clipT`,** nothing else. No tint, no fog flattening:
the world stays visible behind the artwork and is meant to, so the wireframe
hangs inside the quarry rather than covering it.

**Re-encoding a clip.** All-intra, low frame rate, and it must be black-backed
with its own fade in and out or none of the above holds.

```bash
ffmpeg -y -i in.mp4 \
  -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,scale=640:-2" \
  -an -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -preset slow \
  -g 1 -keyint_min 1 -bf 0 -sc_threshold 0 -movflags +faststart clip-clinker.mp4
```

Interpolating up and scaling down together is close to free: 238 frames at
640px came out smaller than 81 frames at 864px, because these are line art and
light on black.

The clips are not fetched until `World.whenReady` resolves: on a slow
connection they otherwise compete with the model for bandwidth and hold the
preloader up. A Save-Data visitor downloads neither, and the elements carry no
`poster`, since a poster is fetched even under `preload="none"`.

**The box may bleed off the top and bottom** (`placeClip` clamps only
sideways). The clinker shaft runs the clip's full height, so a visible top edge
is a hard line across the light; the box is set high enough that its top is
above the viewport, and the `clinkerHold` camera looks low enough that the near
terraces cover its foot. Where no camera framing can do that, a portrait phone
having no spare height, each placement carries a `feather`: the clip thins out
over its lowest stretch instead of ending on a line.

**What was removed, and where it went.** Earlier rounds used photographic clips
that had to be dissolved into the world, which needed a render target, a
displacement dissolve and per-stop fog tints photographed off the composited
frame. None of that survives contact with black-backed artwork. The dissolve is
parked, working and documented, in `src/scripts/effects/cloud-transition.js`;
it is the right tool when there are two dense photographic images to
interpenetrate, and nothing imports it today.

### Carrying a heavier model### Carrying a heavier model

Three systems keep the frame rate flat as the model grows, all in
`src/scripts/world.js`:

- **Adaptive resolution** (`DPR_TIERS`, `adapt`). Fragment cost scales with the
  *square* of pixel ratio, so this is the one lever that reliably rescues a
  slow GPU. Every ~90 rendered frames the scene compares its average frame time
  against its own fastest frame — the display's real period, so a 120 Hz panel
  and a 60 Hz one are each judged on whether they are keeping up with
  themselves — and steps between 0.65× and 1.25× device pixels. It recovers
  upward as well as downward; nothing is hardcoded about the hardware.
- **Idle throttle.** Once the camera has settled on its stop, only the slow
  ambient drift is left, which is indistinguishable at half rate. Rendering
  drops to ~30fps until the next scroll or page change and picks straight back
  up. A parked tab costs half of what it used to.
- **Terrain density follows the model.** `buildTerrain` uses a 200-segment grid
  when it must carry the scene alone and 132 when the model supplies the
  detail — roughly 90k fewer triangles on the desktop path.

**4. Tune the framing** from the browser console, then pin what works:

```js
await AevumWorld.loadModel('/media/quarry.glb', { footprint: 90, y: -6, rotationY: Math.PI / 2 })
```

If the model reads too small/large adjust `footprint`; too high/low, `y`;
facing the wrong way, `rotationY`. Pass the values you settle on into the
`MODEL_URL` load call. Re-frame any *section* by changing its `data-cam` to
another stop name (`approach`, `rim`, `benchWall`, `seam`, `spiral`,
`basin`, `floor`).

**Budget, measured on the production build with the model live**, Chrome at
1440×900 and `devicePixelRatio` 2 (so 2880×1800 real pixels), three seconds of
continuous scrolling:

| | payload | triangles | median frame | p95 | worst | frames > 32 ms |
|---|---|---|---|---|---|---|
| Desktop (model loads) | 4.05 MB | 370k | 16.6 ms | 18.1 ms | 19.1 ms | 0 of 180 |
| Mobile (model skipped) | 2.45 MB | 80k | — | — | — | — |

A locked 60 fps with no dropped frames, and the renderer held its top quality
tier throughout rather than adapting downward. Measure it yourself the same
way: an idle `about:blank` tab in the same browser reads 61 fps, so any figure
near 60 means vsync, not a ceiling you are hitting.

The model costs roughly `model size + ~750 KB` of Draco/Basis decoder, once,
cached, desktop only. If a future model lands above ~4 MB optimised, re-run
step 2 with `--texture-size 512` or add `--simplify 0.5`.

> The 702 KB main bundle (three.js + GSAP + Lenis) is uncompressed; any host
> serving gzip/brotli sends roughly a quarter of that. Converting the seven
> JPEGs to WebP is the next easy ~1 MB saving if the budget gets tight.

## Adding a commodity later

Add one object to `src/data/commodities.js` and two images to
`public/media/` — the Commodities page and Home panels render from data.

## Deploy

Static output. Cloudflare Pages / Vercel / Netlify all work:
build command `npm run build`, output directory `dist/`, then point
`aevumfze.com` at it.

> The build uses `format: 'file'`, so pages are emitted as `commodities.html`
> rather than `commodities/index.html`. All three hosts above resolve
> `/commodities` to it automatically. A bare static file server (e.g.
> `python3 -m http.server`) will 404 on those URLs — that is the server, not
> the build. Use `npm run preview` to check a build locally.
