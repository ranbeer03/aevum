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
npm run build
GPU=1 node dev/motion-harness.mjs check http://localhost:4324 1440x900 /,/about,/commodities,/contact
```

Point it at a **production** preview (`npm run build`, then
`npm run preview -- --port 4324`). Whatever answers on 4322 may be an
`astro dev` server, which serves live source: fine for behaviour, meaningless
for frame times. `GPU=1` drives installed Chrome on the real GPU, which
settles an order of magnitude faster than SwiftShader and is what a visitor
sees.

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

`perf` uncaps the frame rate to read raw headroom. Uncapped, the world draws
hundreds of frames a second and floods the GPU command queue, so a raster task
can stall behind it for ~400ms: that stall is the harness, not the site.
Judge smoothness with vsync on (p99 at 120Hz is 10ms, desktop and phone).

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
`astro.config.mjs`, the `dev:camera` script, and
`manual`/`nearStop`/`small`/`setStop`/`lookAt` on the World API.

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

**One entrance, never two.** Each of these was a double animation once:

- **The loader's exit** has explicit start values (`opacity: [1, 0]`,
  `transform: ['scale(1)', ...]`). Animated from `transform: none`, Motion
  starts from a zero matrix, so the full-screen mark collapsed to a point and
  grew back as a box while it faded. It is also on its own layer from the
  first paint (`will-change`); promoted only as it left, it had no tiles and
  vanished for a frame. The page exit's transform is given a start value for
  the same reason.
- **No page-level fade on arrival, at all.** Everything in a first screen
  carries its own reveal (the plates included), so the incoming text moves
  exactly once, in one beat: hero titles and subtitles are staggered 70 to
  200ms, not 260 to 360. A container fade on top was a second animation on
  every line, and the outgoing page sliding as it faded was a third; it now
  dissolves in place.
- **No named view transitions.** Photos used to carry `view-transition-name`,
  so the browser morphed them on top of the page's own exit and entrance.
- **No browser View Transitions at all.** An inline script in `Base.astro`
  sets `document.startViewTransition = undefined`, so Astro routes with its own
  swap (`fallback="swap"`; `"none"` would turn client routing off and reload
  every page). Safari captures the WebGL world blank in a View Transition
  snapshot, so every navbar click flashed the background out; and Astro's
  `animate` fallback would run its own fade on top of motion.js's.
- **Styles are inlined** (`build.inlineStylesheets: 'always'`). As linked files,
  Safari applied a swapped-in page's stylesheet a frame late: the home hero
  sat at the top of the screen, then jumped 252px into place.
- **The header is not persisted.** Each page renders its own, so the active
  link is right from the server, and motion.js rebinds the menu button per
  page; the scroll handler looks the header up each time. Bound once, it kept
  driving the first page's header after it was swapped out, and the menu
  button did nothing on every later page.


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
- **Reveal targets are scoped to `#main` and `footer`.** The nav's
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

**Quiet by default, two authored moments.** The two pinned clip chapters are
where the motion is; every other section takes one calm entrance and leaves by
scrolling away. A letter wave on every heading, a line rise on every paragraph
and a lift on every exit, all at once, is what made the page read as crowded.

- **Headings rise line by line** out of a clipped box (GSAP SplitText,
  `mask: 'lines'`, 1.1s cubic-out, 90ms apart), split at reveal time because
  line breaks depend on the viewport, and reverted afterwards. The lines take
  the hidden state in the same synchronous step the heading gives up its own,
  so no frame paints the finished heading first.
- **The hero's `.split-line` mask is never hidden.** It inherited the generic
  `[data-reveal]` state (opacity 0, 1.6rem low) and only lost it when `.in`
  landed at the END of the rise, so every page title rose invisibly for a
  second, then appeared at once and jumped 26px.
- **Everything else** rises 1rem and fades in, 1s. Images are cut open from the
  foot on an inner layer (`.media__inner`, from `Media.astro`) while the
  photograph settles from a 10% push; the figure is the observer's target and
  stays unclipped, because Chrome intersects a target through its own
  clip-path.
- **Exits:** none. Sections scroll away. A scrubbed dim near the nav turned
  the lower rows of the ivory ledger into pale ink on ivory while they were
  still being read.
- **Hovers, two kinds.** Images take the inspection lamp: a soft light under
  the pointer, inside the frame and clipped by it (`.media::after`), one lamp
  per group so a collage is lit as one surface, and the photograph leans in
  4% on `.media__inner`. Ledger rows (`.ledger-row`: the services, How we
  work) take a typographic hover instead: the name steps in and an accent rule
  draws under it. A lamp on a wrapper wider than its image (the Emirates
  column) spilled light over empty world.
- **No hover while scrolling.** `html.is-scrolling` (set on every scroll event,
  cleared 160ms after the last, so it spans Lenis' glide) turns off pointer
  events on the body. Without it, every photo and ledger row that scrolled
  under a still cursor lit, leaned in and faded out in turn (five lamps, two
  images, all four service rows on one pass down the home page), which read as
  the page flickering.
- **Chain rows** (`data-reveal="row"`) are laid down left to right with a
  `clip-path` inset, the way the route line beside them draws.
- **How we work** (`data-reveal="survey"`, About) is a survey line drawn across
  the three principles (down them on a phone) at a constant rate, each
  surfacing as the line reaches it; the reveal computes when from each item's
  offset along the line.
- **Cards** (`data-reveal="shade"` on `.copy-shield`) come up behind their
  copy ahead of the words: flat translucent panels with a gold hairline,
  bleeding around the copy on desktop and sitting on the page margins with
  inner padding on a phone (see DESIGN.md, Cards behind copy on the world).
- **Photos recede** on the way out (`--recede`, scrubbed: 5% smaller, 40%
  dimmer), through the individual `scale` and `filter` properties.

### Where the clips sit in the scroll

Each clip has a **pinned chapter**, an `.interlude` in `index.astro`: a section
`100svh + --pin` tall whose stage is `position: sticky` and one screen tall, so
the screen holds while the scroll runs the clip. Native sticky, not a JS pin:
it is composited, so it cannot jank, and Lenis scrolls the window natively.
The camera moves only between chapters and holds still through each one, and
nothing scrolls across a clip, because nothing scrolls while it plays.

A camera anchor is where a `[data-cam]` element sits centred in the viewport,
or, with `data-cam-at="f"`, where its top edge crosses `f` of the viewport
height. Inside a chapter the marks are positioned at fractions of the pin
(`--f`), so a stop is timed against the clip, not the layout.

| mark | at | clipT | what happens |
|---|---|---|---|
| `#clinker` | centred | | the chapter (photographs, like limestone); the camera starts climbing as it leaves |
| `vesselIn` | top at 0.7 | 0.04 | halfway up; the keel flashes and draws as the chapter slides in |
| `vesselPin` | pin 0 | 0.24 | clear sky; the screen holds; the hull forms and the copy rises in |
| `vesselEnd` | pin 1 (160svh) | 0.97 | it has played straight through: complete at 0.66, broken up by the end |
| `.chain.is-light` | centred | | the services ledger on the page's one ivory plate; the camera comes back down behind it |

There is no hold in the clip: a pause in the middle read as the clip stalling
before it had finished. The copy (`data-scene="0.04 0.72"`) arrives with the
hull and stays through the build, and is drawn up out of frame as the hatches
lift. Each block rises through a fixed cut line: its clip inset always equals
the distance it has moved (`yPercent` 100 with `inset(0 0 100% 0)`), so the
line stays put and the text comes up through it top first.

The chapter copy is a GSAP timeline on the same scroll (`data-scene="in out"`,
fractions of the pin, `scrub: true`), so copy and clip cannot drift apart.

**`scrubTo` never seeks to exactly 0.** A clip that has not been seeked yet
uploads a black frame however ready it reports itself, so the first stop of a
clip drew nothing until the reader had scrolled a little past it. The floor is
40ms.

### The backdrop clips

One clip sits behind the supply-chain chapter: a bulk carrier drawing itself
as a wireframe, line art and light on pure black, that builds and comes apart
inside its own four seconds. (A second, nodules falling through a shaft of
light, played behind the clinker chapter until clinker was set like limestone,
with photographs, so the two commodities read as equals. The file is kept in
`media-archive/`, out of the deploy.)

**An on-screen video, screen-blended.** The clip is a real `<video>` in
`.backdrop`, a fixed layer between the world canvas and the page that is
`mix-blend-mode: screen`, so the clip's black ground drops out and only the
line art lands on the sky. `world.js` places, fades and scrubs it every frame
(`updateClip`, run before the world's idle throttle so a held camera never
halves the scrub rate). The blend sits on the layer, not the video: a fixed
element is its own stacking context, and a blend inside it would only reach
the empty layer.

It used to be drawn inside the WebGL pass as a `VideoTexture` from a hidden
one-pixel element, and that is what failed in Safari: after a few minutes on
the page Safari stops decoding a video nobody can see, and the ship never came
back. A visible video is one the browser itself keeps, and restores when it
returns to view. Checked after three minutes idle on the hero in WebKit and
Chrome. If the browser does let it go entirely (`readyState` 0 when the
chapter needs it), it is reloaded, at most every three seconds.

**Placed by the layout, not by coordinates.** The video is laid over the
measured rect of a stage element, `.chain__ship` (`data-clip-stage="vessel"`,
`PLACE` in `world.js`), which `index.astro` sizes to the clip's own 640:368
proportions in a centred column: heading above, ship, copy below. So the gaps
hold at every viewport. The ship is held where the stage sits once the
chapter is pinned (its rect minus the sticky stage's offset), from the first
keel line to the last frame, so it never moves; riding in with the section
it slid up the screen and only settled when the pin began. It is shown only
while its dark chapter covers that spot (`placeClip` gates it on the
section's edges), so it is never drawn over the clinker chapter or the
ledger. While it is up the pointer orbit and idle drift are cut to a tenth:
a world swinging behind the clip made the artwork look pasted on.

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

**The playhead runs linearly with the scroll and is not damped.** The camera
eases into every stop (smoothstep) and follows through a damp; `clipT` does
neither. Eased, a clip slowed to a dead stop at every mark; damped, it trailed
the copy by a quarter of a second and gliding between the two clips ran the
ship backwards through its build. Lenis already smooths the scroll. A hold is
only where two adjacent stops name the same `clipT`, and the vessel holds at
0.67, measured off the clip as the frame where it is complete. A stop with no
`clipT` holds its neighbour's, so a clip fading in or out stands still.

**One seek in flight at a time.** Re-targeting `currentTime` every frame
aborts the seek before it; `seeked` chases wherever the scroll has got to.
Measured: the presented frame trails the scroll by 26ms of clip time (p50),
under two of its frames.

**Stops carry `layer` and `clipT`,** nothing else. No tint, no fog flattening:
the world stays visible behind the artwork and is meant to.

**Re-encoding a clip.** All-intra, low frame rate, and it must be black-backed
with its own fade in and out or none of the above holds.

```bash
ffmpeg -y -i in.mp4 \
  -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,scale=640:-2" \
  -an -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -preset slow \
  -g 1 -keyint_min 1 -bf 0 -sc_threshold 0 -movflags +faststart clip-vessel.mp4
```

Interpolating up and scaling down together is close to free: 238 frames at
640px came out smaller than 81 frames at 864px, because these are line art and
light on black.

The clips are not fetched until `World.whenReady` resolves: on a slow
connection they otherwise compete with the model for bandwidth and hold the
preloader up. A Save-Data visitor downloads neither, and the elements carry no
`poster`, since a poster is fetched even under `preload="none"`.

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
