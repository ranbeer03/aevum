---
name: Aevum
description: A UAE cement-materials trading house rendered as its own ground — a live procedural quarry world behind every page, translucent ivory plates, antique gold, tracked-out Josefin display.
colors:
  forest-975: "#071510"
  forest-950: "#0a1b14"
  forest-900: "#0d221a"
  forest-850: "#112b21"
  forest-800: "#16362a"
  forest-700: "#1f4736"
  forest-line: "rgba(198, 169, 108, 0.22)"
  ivory: "#f3efe4"
  ivory-soft: "#ece7d8"
  ivory-deep: "#e4ddca"
  gold: "#c6a96c"
  gold-bright: "#d8bc80"
  gold-deep: "#77613a"
  ink-on-ivory: "#14261d"
  error: "#d97b6c"
typography:
  hero:
    fontFamily: "Josefin Sans, Futura, Avenir Next, sans-serif"
    fontSize: "clamp(1.9rem, 0.9rem + 4.2vw, 4rem)"
    fontWeight: 300
    lineHeight: 1.32
    letterSpacing: "0.2em"
  h1:
    fontFamily: "Josefin Sans, Futura, Avenir Next, sans-serif"
    fontSize: "clamp(1.7rem, 1rem + 3vw, 3.3rem)"
    fontWeight: 300
    lineHeight: 1.32
    letterSpacing: "0.2em"
  h2:
    fontFamily: "Josefin Sans, Futura, Avenir Next, sans-serif"
    fontSize: "clamp(1.35rem, 0.95rem + 1.8vw, 2.3rem)"
    fontWeight: 300
    lineHeight: 1.32
    letterSpacing: "0.2em"
  h3:
    fontFamily: "Josefin Sans, Futura, Avenir Next, sans-serif"
    fontSize: "clamp(1.05rem, 0.95rem + 0.6vw, 1.35rem)"
    fontWeight: 300
    lineHeight: 1.22
    letterSpacing: "0.2em"
  lede:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "clamp(1.06rem, 1rem + 0.35vw, 1.25rem)"
    fontWeight: 300
    lineHeight: 1.58
  body:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.62
  small:
    fontFamily: "Josefin Sans, Futura, Avenir Next, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    letterSpacing: "0.16em"
  small-caps:
    fontFamily: "Josefin Sans, Futura, Avenir Next, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    letterSpacing: "0.24em"
rounded:
  none: "0"
  pill: "999px"
spacing:
  section: "clamp(4rem, 2.5rem + 5vw, 7rem)"
  block: "clamp(1.8rem, 1.3rem + 2.2vw, 3.2rem)"
  gutter: "clamp(1.25rem, 4vw, 3.5rem)"
  container: "84rem"
  container-text: "46rem"
components:
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    rounded: "{rounded.pill}"
    padding: "0.95rem 1.9rem"
  button-outline-hover:
    textColor: "{colors.gold-bright}"
  button-solid:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.forest-950}"
    rounded: "{rounded.pill}"
    padding: "0.95rem 1.9rem"
  button-solid-hover:
    backgroundColor: "{colors.gold-bright}"
    textColor: "{colors.forest-950}"
  link-line:
    textColor: "{colors.gold}"
    typography: "{typography.small}"
  field-input:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    rounded: "{rounded.none}"
    padding: "0.7rem 0 0.85rem"
---

# Design System: Aevum

Ground truth: `src/styles/global.css` (tokens, primitives, plates), `src/scripts/world.js` (the 3D world + the `STOPS` registry), `src/scripts/motion.js` (motion engine + `measureAnchors()`), `src/layouts/Base.astro` (shell + direction-contract comment), page-scoped styles in `src/pages/*.astro` and `src/components/*.astro`. This file documents the built v3 "the world" system. Earlier systems (Marcellus/Hanken page veil; Gloock serif with DOM `.scene` layers) no longer exist.

## Overview

**Creative North Star: "The Living Quarry"**

Aevum trades the ground itself — limestone and clinker — and the site **is** that ground: one persistent, procedurally built Three.js world behind every page. A terraced open-pit quarry carved into an arid faceted mountain range, lit by one low dawn sun, gold dust hanging in the pit air, a kiln ember burning at the floor. Every section names a camera **stop** in that world (`data-cam="rim"`), and scrolling spans the camera between the stops above and below the reader — down into the pit and back up, in both directions; the pointer orbits the view; navigating to another page **flies** the camera to that page's stops while Astro View Transitions morph the content and a gold seam sweeps the top edge. The whole site is one continuous excavation seen from a moving camera, never four separate pages. Content rides over the world as transparent passages or translucent ivory plates, with local scrims wherever bare copy meets the world's rim-light.

The doctrine is **hybrid scrub**: everything spatial (the camera flight, parallax media, drawn lines, the vein) is tied to scroll position and plays in both directions — the world moves with the reader's hand. Text reveals once and stays legible — words are never scrubbed, never re-hidden. The genre defaults it refuses: cool corporate sans + blue duotone, the cream-serif editorial default, stock ships and handshakes, scroll-jacked chapters. Content is never gated behind motion; with JS off or WebGL unavailable, every word and image stands on the dark ground alone.

**Key Characteristics:**
- One procedural 3D quarry world behind everything; sections name camera stops, scroll spans them, pages fly across them
- Tracked-out uppercase Josefin Sans display (mont-fort DNA) over editorial Spectral text
- Translucent ivory plates and scrims floating over the live world — alpha only, never blur
- Antique gold spent as a precious seam: hairlines, small caps, dust, the vein, one solid action — never poured
- One-shot text reveals; raking-light hovers; film grain over everything
- Hairline-ruled rows instead of cards; square frames, pill buttons

## Colors

A dark mineral palette: six forest greens as strata of depth, three ivories as the limestone seam, three golds as the vein running through it. The WebGL world carries its own Three.js constants (bench ivory, heat-toned rock, ember orange) documented in **The World** — they harmonize with, but are not, the CSS tokens.

### Primary
- **Antique Gold** (#c6a96c): the vein of value. Hairlines (`--forest-line` is gold at 0.22 alpha), small caps, link-lines, the sigil, the drawn route and vein lines, focus outlines, `::selection`, the gold seam inside the 3D pit wall, and exactly one solid button per view.
- **Bright Gold** (#d8bc80): hover/active states of gold elements — button hover text, solid-button hover fill, footer link hover, depth-rail labels, the `<em>` in the About hero. In the world it is the dawn horizon, the sun color, and the dust.
- **Deep Gold** (#77613a): `--accent` on ivory sections, where #c6a96c would fail contrast.

### Neutral
- **Forest 900** (#0d221a): the primary dark ground (`--bg`, body, theme-color). The body color is static — the sense of darkening with depth now comes from the world's fog and sky grading, not a background scrub.
- **Forest 975** (#071510): bedrock — footer, mobile drawer, and the base of every translucent plate over the world: the solid-nav gradient (0.92→0.72), the contact-form panel (0.76), the ContactCTA band (0.5), `.copy-shield` scrims, depth-rail label chips (0.86). All alpha, never blur.
- **Forest 950** (#0a1b14): ink on gold — the solid button's label and `::selection` text; also the world sky's deep horizon (`horizonDeep`).
- **Forest 850** (#112b21): media-frame loading background.
- **Forest 700** (#1f4736): faint display accents (the 404 numeral).
- **Ivory** (#f3efe4): light text on dark; the `.is-light` plate tint, rendered at **0.87 alpha** over the live world (never blurred — see The No-Blur Rule).
- **Ink on Ivory** (#14261d): text color inside `.is-light` sections and `<option>` elements.
- **Error** (#d97b6c): field errors only.
- Text tiers on dark: `--text-dim` rgba(243,239,228,0.72), `--text-faint` rgba(222,210,180,0.6).

**The Gold Discipline Rule.** Gold is a seam, not a flood. It may be: a hairline, small caps, a link-line, a vein/route stroke, the sigil, a focus ring, dust and seam inside the world, or the one solid action button. Display type is never set in gold — headings are ivory (or ink on ivory); only state may warm it (chain names `.passed`, the drawer's current-page link, depth-rail labels).

**The Semantic Swap Rule.** Components style against the semantic tokens only (`--bg`, `--text`, `--text-dim`, `--text-faint`, `--line`, `--accent`). Adding `.is-light` to a section remaps all six to the ivory scheme (accent becomes gold-deep) *and* gives the section its translucent ivory plate surface — the whole subtree just works. Never hard-code a forest or ivory hex inside a component that could live on either ground.

## Typography

**Display Font:** Josefin Sans (with Futura, Avenir Next, sans-serif) — weights 200/300/400 imported; headings set in **300**, UI type (buttons, links, labels) in **400**.
**Body Font:** Spectral (with Georgia, serif) — weights 300, 400, 400 italic, 500.

Both are self-hosted via `@fontsource` imports in `Base.astro`; the latin josefin-sans-300 and spectral-400 woff2 files are `<link rel="preload">`ed. No external font hosts, no other weights — do not import new weights casually.

**Character:** Josefin Sans is a geometric sans set light, uppercase, and tracked wide open (0.2em on headings) — engraved signage, not editorial serif. Because tracked uppercase reads wider, the display sizes deliberately sit *below* a serif scale. Spectral keeps long trade copy readable. Hierarchy comes from size, tracking, and the sans/serif contrast — never from weight.

### Hierarchy
- **Hero** (300, clamp(1.9rem→4rem), 1.32, 0.2em, uppercase): homepage headline only, split-line revealed over the live world.
- **H1** (300, clamp(1.7rem→3.3rem), 1.32, 0.2em): page-hero titles, chapter and commodity H2s, the ContactCTA heading (`--size-h1` reused).
- **H2** (300, clamp(1.35rem→2.3rem), 1.32, 0.2em): section headings.
- **H3** (300, clamp(1.05rem→1.35rem), 1.22, 0.2em): row names (chain, pillars), facts titles' scale peers.
- **Lede** (Spectral 300, clamp(1.06rem→1.25rem), 1.58, `--text-dim`): standfirst under every heading, max-width `--container-text`.
- **Body** (Spectral 400, 1.0625rem, 1.62): running text. `p + p` gets 1em top margin.
- **Small** (Josefin 400, 0.9375rem, 0.16em, uppercase): button and link-line type.
- **Micro / small caps** (Josefin 400, 0.8125rem, 0.24em, uppercase, `--accent`): `.small-caps`; variants — field labels 0.18em `--text-dim`, facts titles / ports label / footer headings 0.22em, the "Descend" cue 0.26em, depth-rail labels 0.6rem at 0.3em.
- **Display runs**: nav links 0.9rem/0.12em; incoterm run clamp(1.15rem→1.7rem)/0.12em; port names clamp(1.4rem→2.3rem); drawer links clamp(2.2rem→3.4rem); 404 numeral clamp(5rem→11rem) in forest-700.
- **Wordmark**: Josefin uppercase, 0.3em tracking (nav 1.35rem, footer 1.6rem), beside the gold triangle sigil.

**The Tracked-Light Rule.** Display type is always uppercase, always tracked (≥0.12em), and never bold — headings at 300, UI at 400, nothing heavier. `text-wrap: balance` and line breaks do the composition work.

**The No Kicker Rule.** No eyebrow/kicker labels above headings. Small caps exist only as labels *inside* content blocks (facts titles, field labels, "Working through", "Or write directly"), never as heading decoration.

## Layout

- **Container:** `min(100% - 2 * gutter, 84rem)` centered; text measure capped at 46rem (`--container-text`); copy blocks use ch-caps (40–58ch).
- **Stacking ground:** the world is `position: fixed; inset: 0; z-index: 0`; `main` and `footer` sit at z-index 1 above it. Everything the reader touches floats over the world.
- **Rhythm:** sections pad `--space-section` clamp(4rem, 2.5rem + 5vw, 7rem); intra-section gaps use `--space-block` clamp(1.8rem, 1.3rem + 2.2vw, 3.2rem); `.section--flush` zeroes padding.
- **Asymmetric grids:** chapters 5fr/7fr (text/media), chain head 6fr/5fr, chain rows 5fr/7fr, pillars 4fr/8fr, commodities 5fr/6fr, contact 5fr/6fr, About who 6fr/5fr, CTA 8fr/4fr. `--flip` variants swap order via `order`, not markup.
- **Strata alternation:** pages alternate transparent dark passages (world visible) and `.is-light` ivory plates, reading as a cross-section. Commodities alternates automatically (`i % 2`).
- **Sticky pin:** on Commodities, the sample images sit in a `position: sticky; top: 6rem` column while the "certificate" copy scrolls past. On ≤860px the pin unsticks and drops **below** the text so anchor jumps land on the name.
- **Page heroes:** interior pages open with `padding-top: clamp(8rem, 18–20vh, 11rem)` and a faint gold radial from a corner; Home's hero is a full `100dvh` of type floating directly over the live world, behind a left-edge scrim (vertical gradient scrim ≤860px).
- **Breakpoints (max-width):** 860px — nav collapses to drawer, chapter/chain/pillar/commodity/emirates grids stack, depth rail hides, world DPR drops to 1.0; 960px — contact stacks; 760px — footer stacks; 620px — form rows stack; 480px — buttons compact to one line. One min-width: 1560px — depth-rail labels appear only above it.
- **Overflow:** body uses `overflow-x: clip`; media frames clip their own overflow.

## The World

Engine: `src/scripts/world.js` — Three.js, one scene built **once per session**, hosted by `Base.astro` as `<div class="world" transition:persist="world"><canvas id="world-canvas"></canvas></div>` (fixed, z-index 0, `pointer-events: none`, `aria-hidden`). No photo plates, no DOM layers — one coherent procedural model. `motion.js` owns the DOM→world bridge; `world.js` owns the scene, the camera and its own render loop. Live state is exposed as `window.__world` for debugging.

### The model
- **Terrain:** a 300×300 plane at **200×200 segments** (~80k triangles), displaced by deterministic value-noise/fbm (seeded 11, no dependency), made non-indexed, `computeVertexNormals`, `uv` attribute deleted (unused, smaller buffer) and **flat-shaded** — a faceted low-poly range. Material is **`MeshLambertMaterial`** with `vertexColors` + `flatShading` — *not* `MeshStandardMaterial`: the world is stylised and flat-shaded, so PBR fragment cost buys nothing and costs a lot at high DPR.
- **The pit:** `PIT = { x: 6, z: -30, R: 36, depth: 30, bench: 4.4 }` — a terraced open-pit quarry: the bowl (`depth^0.82` falloff) is quantized to bench height, producing flat treads and sharp risers (the riser edge is softened by a cubic lerp back toward the smooth bowl); a haul-road **spiral notch** (period 9, width 1.1, up to 1.4 deep, only where r > 6) cuts down the wall; the range is flattened ×0.92 into a working apron across `R+26 → R+4`.
- **The approach corridor:** mountains are scaled down to 0.18 along the camera's inbound line ((−70, 92) → the pit), recovering to full height across 12→30 units of lateral distance, so the opening vantage reads as a valley leading to the pit, never a rock face.
- **Per-face vertex color** (from each face's centroid): inside the pit (r < R+3, y < 2), treads (normal.y > 0.82) get **benchFlat** limestone ivory `#e8e0c4`, cut faces **benchRiser** `#8b8a70`, both lerped toward heat-toned **benchDeep** `#503f2b` toward the floor; a **gold seam** band at height −7…−14 lerps toward `#c6a96c` (0.35 on treads, 0.75 on risers). Outside: **rockLow** `#12291f` → **rockMid** `#1d4032` by height → **rockHigh** `#5c6b57` up high; faces steeper than normal.y 0.55 darkened ×0.78; ±6% noise jitter per facet.
- **Light (4 lights, fixed):** one warm dawn sun (DirectionalLight, gold `#d8bc80`, base intensity **2.6**, driven down to `2.6 − deep × 1.5`) at (60, 26, 40); a green HemisphereLight (`#26443a`/`#0a140f`, 0.75); a soft valley fill (`#9aa886`, 0.5) at (−70, 40, 60) from the camera's side; a static goldVein PointLight (intensity 30, distance 46, decay 1.8) hugging the seam band so the vein reads mid-descent.
- **The kiln:** at the pit floor (`PIT.x−4, −22, PIT.z+2`), an ember `#d87834` PointLight (distance 70, decay 1.6, intensity `kiln × 300 × pulse`) plus an additive, **depth-test-free** radial glow sprite (56×34, opacity `kiln × 0.95`, never clipped by terrain facets). Both pulse `1 + sin(t·1.9)·0.08` and are driven 0→1 by the interpolated `kiln` grade.
- **Gold dust:** two counter-rotating additive point clouds (**300 each**, sizes 0.28 and 0.5, `sizeAttenuation`) centred on the pit, spread to R+20 and spanning +12 down to −(depth+16); rotating at +0.017 and −0.012 rad/s; opacity `0.3 + kiln × 0.4`, tint lerping gold→ember by `kiln × 0.6`.
- **Sky & fog:** a 2×2 gradient shader plane scaled 900×500 at z −320, **parented to the camera** (renderOrder −1, no depth test/write): `mix(top, horizon, pow(1 − uv.y, 3.1))`, where top grades `#071510`→`#020604` and horizon grades dawn `#d8bc80`→`#0a1b14`, both by the `deep` uniform. Plus scene-wide `FogExp2` whose density is the `fog` grade and whose color lerps `#0c2018`→`#050d0a` by `deep`.

### Camera stops
PerspectiveCamera, 52° fov, near 0.5, far 380. There are no per-page moods and no curves. `STOPS` is a flat registry of **named vantages in world space**; each carries `pos`, `look`, and the three atmosphere grades that travel with it — `fog` (FogExp2 density), `deep` (0 dawn → 1 depth, drives sky + fog color + sun dimming), `kiln` (ember intensity). Atmosphere is section-linked, not just position.

| stop | pos | look | fog | deep | kiln | reads as |
|---|---|---|---|---|---|---|
| `approach` | −52, 28, 68 | 8, 2, −30 | 0.011 | 0.00 | 0.00 | high in the valley, the whole range and pit ahead |
| `rim` | −24, 15, 22 | 8, −8, −30 | 0.013 | 0.18 | 0.05 | standing on the rim, the terraced bowl opening below |
| `benchWall` | −18, 7, −2 | 16, −12, −34 | 0.015 | 0.34 | 0.12 | across the bowl from the ivory bench walls |
| `seam` | 28, 5, 6 | 0, −13, −34 | 0.016 | 0.52 | 0.50 | level with the gold seam band, read across the pit |
| `spiral` | 42, 1, −14 | 0, −17, −34 | 0.017 | 0.70 | 0.70 | the haul-road spiral seen from the far rim |
| `basin` | 22, 9, 12 | 6, −16, −32 | 0.014 | 0.55 | 0.35 | wide again, the working pit read whole |
| `floor` | 18, −9, −48 | 2, −24, −28 | 0.019 | 0.92 | 1.00 | down on the kiln floor |

Unknown names fall back to `rim` (`FALLBACK`).

### Scroll → camera (the anchor contract)
- **Sections declare a stop:** any top-level section may carry `data-cam="rim"`. No layout prop, no page-level environment — the section is the unit.
- **`measureAnchors()` (motion.js)** collects `#main [data-cam]` in document order and maps each to the scroll offset where that section sits **centred in the viewport** (`elementTop + scrollY + height/2 − vh/2`), clamped to `[0, scrollHeight − vh]`, then **forces the list strictly increasing** (+1px where a later anchor would land at or above an earlier one — short sections and stacked heroes otherwise produce a zero/negative span). It hands `[{ y, stop }, …]` to `World.setAnchors()`.
- **When it runs:** on `astro:page-load` (immediately), again inside the deferred 620ms post-transition block once layout, images and ScrollTriggers have settled, and on a **160ms-debounced** resize.
- **`sampleTarget(scrollY)` (world.js)** finds the bracketing anchor pair, computes `t` across the span and **smoothsteps** it (`t²(3−2t)`, so the camera eases into every stop), then lerps `pos`, `look`, `fog`, `deep` and `kiln` between the two stops. Above the last anchor and below the first, the target simply holds that end stop. Scrolling therefore spans the vantages **in both directions** — up is the same path in reverse, not a rewind.
- A page with a single `[data-cam]` holds that one stop for its whole length (404 → `approach`; Contact, Privacy, Terms → `rim`). With none, the camera holds its last pose.
- **Current assignments:** Home `approach` → `rim` → `seam` → `spiral` → `basin` → `floor`; About `approach` → `rim` → `benchWall` → `basin` → `floor`; Commodities `rim` → `seam` (first commodity) → `benchWall` (every later one, deliberately repeated so the camera holds while the reader works through specs) → `floor`. `ContactCTA.astro` carries `data-cam="floor"`, so every page that ends in the CTA lands on the kiln floor.

### The damped follow, and page flights
The live pose never jumps to the target; it follows it through a **frame-rate-independent critical damp**:

```
k = 1 - Math.exp(-lambda * dt)   // dt in real SECONDS, clamped to 0.05
pos.lerp(tPos, k); look.lerp(tLook, k); // fog/deep/kiln follow with the same k
```

- **Standing `lambda` is 4.5** — identical feel at 30fps or 144fps.
- **`World.flight()`** (called by `motion.js` on every page change after the first) drops `lambda` to **1.6**. The target has already jumped to the new page's stops, so the low damp rate *is* the flight: the camera eases into the new vantage over **~1.8s** (measured — `lambda` recovers toward 4.5 at +1.6/s, i.e. (4.5−1.6)/1.6 ≈ 1.81s). There is no flight tween, no captured pose, no blend state to get out of sync.
- **`setAnchors` snaps only on the very first page** (`anchoredOnce`). Every later call — navigation, resize, the post-transition re-measure — leaves the live pose alone so the damp flies it instead of teleporting mid-read.
- **Pointer orbit:** the smoothed pointer (`dt × 3.2` follow) yaws the *damped* pose around its own look target (±0.16 rad) and lifts it vertically (`−pointer.y × |offset| × 0.06`); slow idle sines (`sin(t·0.07)·0.02` yaw, `sin(t·0.22)·0.35` lift) keep the frame alive when the pointer rests. Orbit is applied to the offset from the look target, so it never fights the scroll target.

### The frame loop
`world.js` runs **its own `requestAnimationFrame` loop** on real seconds from `performance.now()`. It renders every frame while `state.ready`, skipping work only while `document.hidden`. There is no settled/idle early return and no external ticker.

> **CRITICAL — never drive world timing from `gsap.ticker`.** GSAP's ticker reports elapsed time in **SECONDS**, not milliseconds. The previous implementation read that value as ms, so `dt` came out ~1000× too small, `k = 1 − exp(−λ·dt)` collapsed to ~0, and **every camera flight froze at the origin**. `motion.js` still adds Lenis to `gsap.ticker` (`lenis.raf(t * 1000)` — note the conversion), but the world must never share it.

### Swapping in a sculpted model
`await World.loadModel('/media/quarry.glb', { scale: 1, y: 0 })` lazy-imports `GLTFLoader` (zero cost until called), loads the GLB, positions it at the pit centre, disposes the procedural mesh named **`terrain`** and takes its name. Stops, grading, lighting, dust and kiln all keep working — only the geometry changes. Keep the model's origin at the pit centre and its ground plane at y = 0 so the existing stops still frame it.

### Performance contract (measured — do not regress)
- **NO `backdrop-filter` anywhere on this site.** Blurring a large area over a live WebGL canvas re-samples the backdrop every frame: **61fps with it, 105fps without**, and the gap widens again on Retina. Translucent plates use **alpha only** — `.is-light` `rgba(243,239,228,0.87)`, the nav's `rgba(7,21,16,0.92→0.72)` gradient, the contact form panel `rgba(7,21,16,0.76)`, the ContactCTA band `rgba(7,21,16,0.5)`. Alpha alone gives the layered depth at effectively zero cost.
- **`MeshLambertMaterial`, never `MeshStandardMaterial`,** for the flat-shaded terrain.
- **DPR capped at 1.25 desktop / 1.0 at ≤860px** (`dprCap()`, re-applied on resize) — fragment cost dominates, so this is the single biggest lever on Retina.
- **Measured result: 60fps at simulated Retina, 5 draw calls** (sky, terrain, kiln sprite, two dust clouds), **~80k triangles**, negligible CPU submission cost. No per-frame allocation: the loop reuses three module-scope `Vector3` scratch values.
- **Depth-rail labels render only at ≥1560px.** Below that the right gutter is too narrow and the label chips collide with body copy; the ticks still animate, the labels just stay at opacity 0.

### Failure and reduced motion
- **WebGL unavailable:** `World.init()` throwing in `motion.js` removes the `.world` element and the site stands on flat forest-900 ground. **Context loss:** the `webglcontextlost` handler calls `preventDefault()`, removes `.world` and clears `state.ready`, which ends the rAF loop. The world is an enhancement, never a dependency.
- **`prefers-reduced-motion: reduce`:** no rAF loop and no pointer listener are ever installed. The scene renders **one still frame** from the initial `approach` pose and re-renders only on resize. Anchors are still measured (the pose snaps), but nothing animates.

### The direction contract
Pages declare vantages, not environments: add `data-cam="<stop>"` to a section and it becomes an anchor. There is **no `world` prop, no `main[data-world]` and no `setMood()`** — `Base.astro` no longer destructures a `world` prop and renders a bare `<main id="main">`; the layout prop, the per-page mood registry and the blend-based page flight were all removed with the curve system.

The full design thesis lives as the direction-contract comment at the top of `Base.astro`'s body (THESIS / OWN-WORLD / STORY / FIRST VIEWPORT / FORM / FINISH) — read it before changing the world. It now states the stop system in THESIS ("Every section declares a named camera STOP via data-cam; scroll spans the camera between those vantages in both directions and a page change flies it to the next page's stops"), the alpha-only rule in OWN-WORLD ("ALPHA ONLY — no backdrop-filter anywhere; blur over the live canvas measured 61fps vs 105fps"), and names the `approach` stop as the FIRST VIEWPORT. Keep that comment and this section in step.

## Elevation & Depth

Surfaces are flat; **depth is the world's job**. The camera's traverse between stops, fog and sky grading, the kiln ember, and the gold dust convey all spatial depth; the film grain (fixed, 0.05 opacity, SVG turbulence, 1.2s stepped shift, z 8000) unifies every plane. Between content and world sits a **plate vocabulary** rather than shadows: flat translucent panels that let the live world read through them.

**The No-Blur Rule.** There is **no `backdrop-filter` anywhere on this site**, and none may be added. Blurring a large plate over a live WebGL canvas re-samples the backdrop every frame and measured **61fps with it against 105fps without**, worsening again at Retina DPR. Every plate below is **alpha only** — that alone gives the layered depth at effectively zero cost. If a plate reads too weak, raise its alpha; never reach for blur.

### Plate Vocabulary
- **`.is-light` sections**: `rgba(243, 239, 228, 0.87)`, gold hairline border-block (rgba gold 0.28). No blur, no fallback branch — the alpha *is* the treatment.
- **Solid nav (`.nav.is-solid`)**: `linear-gradient(rgba(7, 21, 16, 0.92), rgba(7, 21, 16, 0.72))` — denser at the top edge so the wordmark stays legible while the lower edge dissolves into the world — plus a gold hairline bottom border (rgba gold 0.14).
- **Contact form panel**: `rgba(7, 21, 16, 0.76)` inside a hairline border.
- **ContactCTA band**: a corner gold radial (`rgba(198,169,108,0.1)` at 85% 110%) over `rgba(7, 21, 16, 0.5)` — the most transparent plate on the site, so the world's kiln ember at the `floor` stop glows through the closing band.
- **`.copy-shield`** (utility): a soft radial forest scrim (`inset: -1.5rem -2rem`, z −1, 2rem radius, `rgba(7,21,16,0.55)` → 0.18 at 70% → transparent) behind any bare copy block sitting directly over the world — ivory text never fights the rim-light. Page-scoped cousins: the hero's edge scrim, the chain rows' gradient panel.
- **Depth-rail label chips**: `rgba(7, 21, 16, 0.86)`, 2px radius.

### Shadow Vocabulary
- **Collage lift** (`box-shadow: 0 1.5rem 3rem rgba(4,12,9,0.35)`): the overlapping secondary image in Home's commodity chapters.
- **Station glow** (`box-shadow: 0 0 12px rgba(198,169,108,0.5)`): a chain-station dot once the drawn route passes it.
- **Vein terminus glow** (`box-shadow: 0 0 14px rgba(198,169,108,0.7)`): the diamond node ending the page vein.

**The Flat Surface Rule.** No new box-shadows. If something needs separation, use a hairline (`--line`), an alpha plate, or a scrim — depth belongs to the world, not to surfaces.

### Fixed overlay stack (z-index map)
`.world` 0 → `main`/`footer` 1 → `.vein` 5 (absolute in `#main`) → `.depth-rail` 500 → drawer 900 → `.nav` 1000 → `.grain` 8000 → `.seam` 9500 → focused skip link 10000.

## Shapes

Square-cut and hairline over faceted ground. Media frames, forms, and sections have no border-radius — stone is cut, not rounded. The deliberate curves: the pill (999px) on buttons, 9px circular station dots on the chain, a 1px radius on focus rings, 2px on depth-rail label chips, and soft 1.5–2rem corners on the invisible scrim panels. The vein terminates in a 7px 45°-rotated gold diamond — a node, not thin air. Lines are 1px hairlines in `--line` everywhere: `.rule`, row borders (`border-top`, last-child adds `border-bottom`), field underlines, link underlines, glass-band borders. The identity mark is a stroked triangle sigil (1.2–1.4 stroke, gold) — kiln / mountain / delta — beside the wordmark. The world itself sets the form language's other half: faceted low-poly geometry, terraced benches, one spiral cut. Lists are never cards: they are hairline-ruled rows with asymmetric columns.

## Components

### Buttons (`.btn`)
- **Shape:** pill (999px), 0.95rem 1.9rem padding, min-height 44px, uppercase Josefin 400 at 0.16em.
- **Outline (default):** transparent fill, 1px `--line` border, `--text` label. Hover/focus: border and label warm to gold.
- **Solid (`.btn--solid`):** gold fill, forest-950 label — the one primary action per view (Enquire / Send enquiry / Start the conversation). Hover: gold-bright.
- **Raking light:** every button carries a `::after` diagonal gold gradient band (105deg) parked at `translateX(-101%)`; hover/focus sweeps it across in 0.7s `--ease-out`. Solid buttons sweep a warm-white band instead.
- **Arrow:** inline 16×16 stroked SVG (`.btn-arrow`) nudges 4px right on hover.
- **≤480px:** tracked uppercase pills must hold one line — tracking drops to 0.1em, size to 0.85rem, padding to 0.85rem 1.4rem, `white-space: nowrap`.

### Link-line (`.link-line`)
Uppercase small link in `--accent` (Josefin 400, 0.16em) with a 1px `currentColor` underline that rests at `scaleX(0.32)` and grows to full on hover/focus — a seam extending. Carries a small inline arrow SVG.

### Raking-light hovers (`.rake-row`, `.rake-media`)
The inspection-light metaphor: hovering rakes a diagonal gold light across the surface, the way a trader inspects material. `.rake-row` (chain rows, application list items) sweeps a 9%-alpha gold band in 0.9s; `.rake-media` (image panels) sweeps a 16%-alpha band, skewed -4deg, in 1s, above the image (z-index 2). One-directional: the band snaps back off-hover with no transition. Use on interactive rows and linked imagery only.

### Media (`src/components/Media.astro`)
The single imagery primitive — a `.media` figure (forest-850 ground, `overflow: clip`, cover-fit child). Props:
- `src` (required poster/image), `alt`
- `video` — mp4 path in `/public/media/video/`; renders `<video>` with `src` as poster, muted + playsinline; loops/autoplays **unless** scrub
- `scrub` — ties video playback position to scroll (see Motion); disables autoplay/loop
- `parallax` — vertical drift factor, e.g. `"0.12"` (framed drift) or `"0.3"` (collage accents); omit for static
- `ratio` — CSS aspect-ratio, e.g. `"4 / 5"` (primary panels), `"4 / 3"` / `"16 / 9"` (secondaries)
- `pos` — object-position, to differentiate crops of a reused photo
- `vtName` — `view-transition-name`; give the same name to the twin image on another page and it morphs during navigation (`media-limestone`, `media-clinker` between Home chapters and Commodities pins)
- extra attrs pass through (`data-reveal="strata"` is the norm for primary panels)

### Chapters / collage (Home)
Text column + media collage: a primary 4/5 panel wrapped in a link to its commodity (`.chapter__primary-link`, `rake-media`, `vtName`, strata reveal, parallax 0.12, width `min(100%, 30rem)`) with a smaller 4/3 secondary overlapped at the bottom corner (parallax 0.3, the system's one lift shadow). `.chapter--flip` mirrors the layout. The limestone chapter is an `.is-light` ivory plate; the clinker chapter is a dark transparent passage with `.copy-shield` on its text.

### Chain rows (Home services)
A vertical gold SVG route line (`path[data-draw]`, riding the same seam as the page vein) beside hairline-ruled rows (`.chain__row.rake-row[data-station]`) over a soft gradient scrim. Each row has a 9px gold-stroked dot; when the drawn line reaches it the row gains `.passed`: dot fills gold with a 12px glow, name warms to gold-bright. Incoterms render as an inline display run separated by dots.

### Spec lists / facts blocks (Commodities)
Facts blocks open with a hairline and a small-caps gold title. Unconfirmed specs render as prose ("on request" + param run separated by `·`); confirmed values render as a `dl.spec-list` of hairline rows (param left in `--text`, value right in `--text-dim`). Applications are `.rake-row` hairline list items.

### Fields (`.field`)
Underline-only inputs: transparent ground, 1px `--line` bottom border, no radius, min-height 44px; label above in micro caps (0.18em, `--text-dim`). Focus: border warms to gold (no outline). Error: `.has-error` turns the underline and message #d97b6c; messages are written, human sentences. Selects get a custom stroked chevron in `.select-wrap`. The contact form itself is a hairline-bordered translucent plate (rgba(7,21,16,0.76), no blur).

### Nav (`Nav.astro`, `transition:persist`)
Fixed header, transparent at top; past 40px scroll it gains `.is-solid` (a `rgba(7,21,16,0.92)→0.72` forest gradient plate — alpha, not blur — plus a gold hairline bottom border). Scrolling down past 200px hides it (`translateY(-100%)`); any upward scroll returns it. Links are 0.9rem uppercase Josefin in `--text-dim` with a gold underline growing from left on hover/current. Desktop shows a pill Enquire CTA; ≤860px collapses to a two-line toggle opening a full-screen forest-975 drawer that wipes down via `clip-path`, with display links staggered by `--i` and Lenis stopped while open.

### Footer (`Footer.astro`)
Forest-975 bedrock band: sigil + wordmark + tagline, Navigate and "Reach us" columns under gold small-caps headings, hairline, then legal line (© year `site.legalName`, Privacy/Terms). Contact rows render only when data exists in `src/data/site.js` — no placeholder text ever ships.

### ContactCTA (`ContactCTA.astro`)
The closing band on the three main pages — Home, About and Commodities (`data-depth="Bedrock"`, `data-cam="floor"`). Contact, Privacy, Terms and 404 do **not** import it: Contact already *is* the enquiry, and the legal/404 pages end on their own copy. Translucent forest plate (rgba(7,21,16,0.5), no blur) with a corner gold radial, riding over the world's kiln ember at the `floor` stop. A revealed rule, an H1-scale heading (`heading`/`copy` props for page-specific wording), the page's one solid gold button, and an "Or write directly" email aside. Where it appears, it is the page's last word — one action: enquire.

### Depth rail
Fixed right-edge instrument (hidden ≤860px): one tick per top-level `#main > section/article` (built by JS, needs ≥2). Ticks are 1.1rem dull-gold dashes (rgba(150,124,74,0.7)) that widen to 1.8rem full gold while their section spans the viewport middle. A section's `data-depth` attribute (Home: Surface / Strata / Kiln / The Chain / Ports; CTA: Bedrock) renders as a label chip left of the active tick — 0.6rem uppercase at 0.3em, gold-bright on an `rgba(7,21,16,0.86)` forest chip (2px radius, no blur) — bench-level markers for the descent. **Labels only appear at ≥1560px**: below that the right gutter is too narrow and the chips sit on top of body copy, so the ticks still animate while the labels stay at opacity 0.

## Motion

Engine: `src/scripts/motion.js` — Lenis (smooth scroll, lerp 0.11) + GSAP ScrollTrigger + the World (`world.js`), loaded once from `Base.astro`. Easing: CSS transitions use `--ease-out` `cubic-bezier(0.16,1,0.3,1)`; every scrubbed tween is `ease: 'none'` (the scrollbar is the easing).

**The Hybrid Scrub Rule.** The *world* is scrubbed — the camera flight, parallax media, drawn lines, and the vein all track scroll position and play backward when the reader ascends. *Text* is one-shot — an IntersectionObserver (rootMargin `0px 0px -8% 0px`, threshold 0.05) adds `.in` once and unobserves; words never re-hide.

### One-shot reveal primitives (CSS in global.css, gated on `html.js`)
- `[data-reveal]` — fade + 1.3rem rise, 0.6s; stagger via `--reveal-delay` inline (0.08s steps typical).
- `[data-reveal="mask"]` — clip-path wipe downward, 1s.
- `[data-reveal="strata"]` — **starts VISIBLE**: `clip-path: inset(24% 0 24% 0)` opening to full in 1.2s. Imagery is never fully hidden, even pre-reveal; this is the default for primary panels.
- `[data-reveal="rule"]` — hairline grows `scaleX(0→1)` from left, 1.1s.
- `.split-line > .split-inner` — line-mask rise (110%→0, 0.9s) for hero/headline lines, two lines offset ~0.1s.

### Scrubbed systems
- **The world camera:** the primary spatial motion of the whole site (see **The World**). `measureAnchors()` maps every `#main [data-cam]` section to the scroll offset where it sits centred in the viewport and hands the list to `World.setAnchors()`; `sampleTarget(scrollY)` smoothsteps the camera's target pose and atmosphere between the two bracketing stops. Real scroll position, not normalised progress — no `scrollY / maxScroll`. The live pose follows the target through a damped lerp (`lambda` 4.5), on world.js's **own rAF loop in real seconds** — never the GSAP ticker — rendering every frame while the tab is visible.
- **Framed parallax:** `[data-parallax]` media — JS sets the inner img/video height to `100 + ceil(strength*220)%` (overscan grows with strength so edges never show) and tweens `yPercent: -strength*100 → 0` (scrub 0.4). Torn down and rebuilt per page.
- **Scrub video:** `video[data-scrub]` maps `currentTime` 0→duration across its section's transit (scrub 0.6), waiting for `loadedmetadata`.
- **The gold vein:** injected by JS into `#main` on every page (1px, gold→25%-alpha gradient, left-aligned just outside the container, 0.65 opacity, ending in its diamond terminus), drawn `scaleY: 0 → 1` over the *entire page* scroll (scrub 0.3).
- **Drawn routes:** `svg path[data-draw]` / `line[data-draw]` get dasharray = length and scrub `strokeDashoffset` to 0 (scrub 0.4, start `top 70%`, end `bottom 55%`). `[data-station]` rows toggle `.passed` at `top 62%` (removed on leave-back — stations dim when ascending).
- **Depth rail:** per-section triggers toggle tick `.is-active` while the section spans 55% viewport.

### View transitions (Astro `<ClientRouter />`)
- Root: `vt-out` 0.3s (fade + rise -1.5rem) / `vt-in` 0.55s (fade + rise from 2rem), wrapped in `prefers-reduced-motion: no-preference`.
- **Page flight:** the persistent world does not transition — it *flies*. `World.flight()` drops the damp rate to `lambda` 1.6 and the re-measured anchors move the target to the incoming page's stops, so the camera eases into the new vantage over ~1.8s while the DOM morphs over it. No tween, no captured pose.
- **Morphs:** `Media` `vtName` gives paired images a shared `view-transition-name` — the commodity panel on Home morphs into its pin on Commodities.
- **Seam sweep:** on every `astro:after-swap` the fixed 2px gold `#seam` replays `seam-sweep` (0.7s: scaleX 0→1, then fades).
- `.world`, `Nav`, `.seam`, and `.grain` carry `transition:persist` — the shell and the world never re-render.

### Lifecycle (the fragile part — read before touching)
- **Lenis is persistent.** Created once per session and **never destroyed on navigation** — tearing it down around a view transition churns scrollbar state mid-snapshot and **aborts the morph**. Do not "clean up" Lenis in teardown.
- **The World is persistent.** `World.init()` runs once per session against the persisted canvas; navigation only calls `World.flight()` and re-runs `measureAnchors()`. Never rebuild the scene per page. `setAnchors` snaps the pose **only on the very first page** (`anchoredOnce`) — every later call leaves the live pose alone so the damp flies it instead of teleporting mid-read. If WebGL init throws or the context is lost, `.world` is removed and the site continues on the dark ground.
- `astro:page-load` → `boot()`: Lenis (first run), the world (`World.init()` on first run, else `World.flight()`, then `measureAnchors()`), reveals, nav bindings (bound once, guarded), a synthetic `scroll` event so the persisted nav re-reads its state, then **deferred scrub construction**: on navigations after the first, `initScrub()` + `initDepthRail()` + `ScrollTrigger.refresh()` + a second `measureAnchors()` wait 620ms so measurement never runs mid-morph (measuring/re-triggering layout during a view transition also aborts it). First load runs immediately. Anchors are also re-measured on a 160ms-debounced resize.
- `astro:before-swap` → `teardown()`: close the drawer, disconnect the reveal observer, kill all ScrollTriggers. Nothing else.
- `astro:after-swap` **must restore `<html>` classes**: Astro's swap replaces the root element's classes from the incoming static document, dropping `js` (added inline in `<head>`) and Lenis's `lenis`/`lenis-smooth`. The handler re-adds them synchronously before paint — without this, reveals re-hide, smooth scroll CSS drops, and the view transition aborts. Keep this handler if you touch anything in the lifecycle.

### Reduced motion
`prefers-reduced-motion: reduce`: no Lenis, no GSAP scrubs (initLenis/initScrub return early); the world still initializes but installs **no rAF loop and no pointer listener** — it renders a **single still frame** from the initial `approach` pose (the dawn valley) and re-renders only on resize; reveals force-visible via CSS `!important`; grain static; vein fully drawn; seam `display: none`; hero cue still; view-transition animations skipped. The site is fully readable as a still document over a still landscape.

**The Content-First Motion Rule.** Motion may reveal, pace, or rank content; it may never gate it. Nothing pins the scroll, no content requires JS or WebGL to exist, and imagery is never fully hidden pre-reveal (strata reveals start at a visible band).

## Do's and Don'ts

### Do:
- **Do** spend gold only as hairlines, small caps, link-lines, vein/route strokes, the sigil, focus rings, world dust/seam, and one solid button per view (The Gold Discipline Rule).
- **Do** style against semantic tokens (`--bg`/`--text`/`--text-dim`/`--text-faint`/`--line`/`--accent`) so `.is-light` plates work for free.
- **Do** shield copy that sits directly over the world: an `.is-light` plate, or `.copy-shield` on the block.
- **Do** use `data-reveal="strata"` for primary imagery, split-line for hero headlines, `--reveal-delay` for stagger, and `--ease-out` for every CSS transition.
- **Do** scrub the world and one-shot the words: spatial motion is bidirectional and scroll-tied; text reveals once.
- **Do** give every section a `data-cam` stop (approach/rim/benchWall/seam/spiral/basin/floor) and every major section a `data-depth` label for the rail — the section is the unit of camera direction; there is no page-level world setting.
- **Do** express lists as hairline-ruled rows with asymmetric grids — never cards.
- **Do** end every *content* page in `<ContactCTA />` (Home, About, Commodities) — one action: enquire. Contact, Privacy, Terms and 404 are the exceptions and stay without it.
- **Do** keep tap targets ≥44px, honor reduced motion, and keep every word readable with JS off.
- **Do** art-direct imagery to the world: macro mineral surfaces and quarry terrain in deep shadow with warm gold rim light, desaturated toward the forest palette — never blue-corporate, never ships/handshakes/skylines.

### Don't:
- **Don't** add kicker/eyebrow labels above headings.
- **Don't** set display type in gold, embolden it past 400, drop its uppercase/tracking, or import new font weights.
- **Don't** fake depth in the DOM — no layered `.scene` planes, body-background scrubs, or fixed glow elements. The world owns depth; content owns alpha plates and hairlines.
- **Don't** invent figures — no tonnage, volumes, years, or client names until they exist in `src/data/`. Specs stay `value: null` ("on request" prose); `partners` stays `[]` until cleared.
- **Don't** abbreviate the name — always "Aevum", never "A.G"/"AG".
- **Don't** mention steel or claim markets beyond the UAE — clinker and limestone, UAE only.
- **Don't** add border-radius (beyond the documented pills, dots, and chips), box-shadows (beyond the three documented glows/lifts), blue tones, or pure black/white.
- **Don't** add `backdrop-filter` anywhere, for any reason. Blur over the live canvas measured 61fps against 105fps without it. Translucent plates are alpha only — raise the alpha instead (The No-Blur Rule).
- **Don't** drive world timing from `gsap.ticker`. It reports elapsed time in **SECONDS**, not milliseconds; reading it as ms collapses `dt`, and with it `k = 1 − exp(−lambda·dt)`, which froze every camera flight at the origin. `world.js` keeps its own rAF loop on `performance.now()`.
- **Don't** destroy Lenis or the World on navigation, rebuild the Three.js scene per page (use `World.flight()` + `measureAnchors()`), snap the pose on anything but the first page, run scrub construction inside the 620ms transition window, or remove the `astro:after-swap` class-restore — each of these aborts view transitions or churns the world.
- **Don't** scroll-jack, autoplay sound, fully hide imagery pre-reveal, or gate content behind motion or WebGL.
- **Don't** hard-code contact details, nav items, or commodity content in pages — everything reads from `src/data/`.

## Maintenance

- **Add a commodity:** append one object to `src/data/commodities.js` (slug, name, short, image/panelImage + alts, intro, body, specsNote, specs `{param, value|null}`, applications, logistics) and drop its images in `/public/media/`. The Commodities page renders it in order (alternating dark passage / ivory plate, and `data-cam` `seam` for the first, `benchWall` for every later one), and the contact form's commodity select picks it up. Use `vtName={'media-' + slug}` on any Home panel you add so it morphs to its pin.
- **Contact / partners / form:** `src/data/site.js` is the single source: `contact` (email; phone and address render **nowhere** until real values land — never ship placeholders), `FORM_KEY` (Web3Forms — while empty, the form relabels its button "Draft an enquiry email" and falls back to a prefilled `mailto:` draft), `nav`, and `partners` (first name added activates the hidden "Working alongside" strip on Home). `TODO(launch)` comments mark every pending slot.
- **Tune the world:** everything lives in `src/scripts/world.js` — `PIT` constants (position, radius, depth, bench height), the `C` palette, and the `STOPS` registry. **Re-framing a section is one line**: change its `data-cam` to another stop name. Adding a vantage is one entry in `STOPS` (`pos`, `look`, `fog`, `deep`, `kiln`) — no page wiring, no layout prop; unknown names fall back to `rim`. Tune the arrival feel with `state.lambda` (4.5 standing) and `World.flight()`'s 1.6. When a sculpted quarry model is ready, `await World.loadModel('/media/quarry.glb', { scale, y })` swaps the mesh named `terrain` for the GLB (GLTFLoader is lazy-imported) and keeps every stop, light and grade — origin at the pit centre, ground plane at y = 0.
- **Scroll-video (Seedance renders):** drop the mp4 in `/public/media/video/` and pass `video` + `scrub` to `<Media>` — playback follows the scroll via `data-scrub`. (The hero has no media layer any more — the live world is the hero visual.)
- **Deferred slots already built:** partner strip, spec values, privacy/terms body copy (`src/pages/privacy.astro`, `terms.astro`), scrub video in section media.

## Direction contract

Previously an HTML comment in `Base.astro`; kept here so it is not shipped to
every visitor on every page.

```
THESIS: The site IS the ground Aevum trades — one persistent Three.js
quarry (terraced open pit, gold seam, kiln at the floor) behind every
page. Every section declares a named camera STOP via data-cam; scroll
spans the camera between those vantages in both directions and a page
change flies it to the next page's stops. Kage's scroll-cinema grammar +
mont-fort's tracked-light type, refusing the cream-serif editorial
default; words stay in the DOM, always legible.
OWN-WORLD: Deep forest atmosphere #071510–#0d221a; ivory as light and as
translucent plates over the world (ALPHA ONLY — no backdrop-filter
anywhere; blur over the live canvas measured 61fps vs 105fps); #c6a96c
gold as dust, seam, vein, hairline, small caps, one solid action — never
display type. Josefin Sans 300 tracked-out uppercase display, Spectral
text. Raking-light hovers; film grain.
STORY: A procurement manager sees two commodities and full-chain UAE
execution within one screen, believes Aevum is a serious specialist, and
enquires.
FIRST VIEWPORT: the 'approach' stop — the pit read across the valley at
dawn; left-aligned tracked JOSEFIN headline over it, factual sub-line,
Clinker + Limestone quick links and Enquire; wordmark top-left, nav right.
FORM: User-pinned direction (mont-fort.com + MengTo/kage named as
references, 3D/three.js/transparent layers/orbit/parallax requested) —
no seed roll, pinned by brief.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md.
```
