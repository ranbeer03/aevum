# Aevum — Asset Generation Prompt Pack

Every prompt below is tuned to the site's committed art direction, so anything
you generate drops in without looking foreign:

> **Art direction (append to any image/video prompt):** cinematic editorial
> photography, deep forest green-black shadows (#0d221a), warm antique gold rim
> light (#c6a96c), ivory highlights (#f3efe4), subtle film grain, dark moody
> premium atmosphere, no people, no text, no watermarks.

---

## 1 · Logo prompts

Constraint from Jai: **full "Aevum" spelling only — never "A.G"/"AG"**.
Best tool for wordmarks with real letterforms: **Ideogram 3** (it renders text
reliably); Midjourney v7 for the abstract sigil directions (add `--no text` and
redraw the wordmark yourself). Generate at 1:1, white/ivory background versions
AND deep-green background versions of each.

**Direction A — Roman inscription wordmark** (matches the site's Marcellus type)
> Luxury wordmark logo for "AEVUM", elegant Roman inscriptional capitals carved
> like a stone engraving, wide letterspacing, antique gold letters on deep
> forest green background, refined serif details inspired by Trajan's Column,
> flat vector, timeless institutional luxury, minimal, no icon, no tagline

**Direction B — Sigil + wordmark: the mountain A**
> Minimal geometric logo: a triangle resembling both the letter A and a
> mountain peak, with a single horizontal line crossing its lower third like a
> geological stratum, thin elegant strokes in antique gold, beside the word
> "AEVUM" in spaced Roman capitals, deep forest green background, flat vector,
> luxury commodities trading house, timeless, restrained

**Direction C — Strata mark**
> Abstract luxury logomark: five horizontal lines of varying thickness stacked
> like sedimentary rock strata, subtly forming the letter A in negative space,
> antique gold on ivory, flat vector minimalism, geological, premium trading
> company, with "AEVUM" in refined spaced capitals beneath

**Direction D — The seal**
> Circular seal logo, the word "AEVUM" set in Roman capitals around the inner
> ring like an ancient coin, a small minimal mountain-and-stratum glyph at
> center, single-color antique gold line art on deep forest green, engraved
> luxury insignia, flat vector, institutional, timeless

**Direction E — Ligature monolith**
> Typographic logo "AEVUM" where the letters share elegant stone-like
> connections, the AE set as a classical ligature, carved marble feel rendered
> as clean flat vector, ivory letters on deep forest green, ultra-premium,
> quiet luxury, wide tracking, no icon

**Direction F — Cornerstone**
> Minimal emblem: a solid square block of antique gold with one corner cut
> away revealing layered strata lines, representing a cornerstone and quarried
> stone, beside "AEVUM" in light spaced Roman capitals, deep forest green
> ground, flat vector, luxury commodities brand

Settings worth pinning: `flat vector logo, brand identity, high contrast,
centered composition`; negatives: `gradient mesh, 3D render, drop shadow,
photorealistic, clutter, tagline text`.

---

## 2 · Seedance video prompts — scroll-linked parallax sections

The site already contains the machinery: any `Media` slot given a
`video="/media/video/x.mp4" scrub` prop becomes **scroll-driven** — GSAP
ScrollTrigger maps scroll position to video playback time, so the footage
plays forward as the visitor scrolls down and backward as they scroll up.
That is what makes it feel like living parallax rather than a background loop.

Rules for scrub footage (important — bake these into every prompt):
- **One continuous slow camera move, no cuts** — a cut reads as a glitch when scrubbed.
- **Constant velocity** — eases look wrong when the scrollbar drives time.
- 8–12 seconds is plenty; the scroll distance stretches it.
- No people, no on-screen text.

**V1 — Home hero** → save as `public/media/video/hero.mp4`
> Extremely slow forward dolly across a field of grey cement clinker nodules,
> macro scale, the camera gliding centimeters above the material like a
> low-flying aircraft over dark terrain. Deep forest green-black shadows, one
> warm antique-gold light raking from the left, edges of nodules catching the
> light as they pass. Continuous single take, constant slow speed, no cuts,
> shallow depth of field, cinematic film grain, dark premium atmosphere. 10
> seconds, 4K, 24fps.

**V2 — Quarry section (Home, "Grounded in the Emirates")** → `quarry.mp4`
> Slow constant-speed aerial drone push toward a terraced limestone quarry
> carved into arid rocky mountains at golden hour, pale ivory stone benches
> glowing in low warm sun, long deep shadows, atmospheric haze in the valleys.
> Single continuous take, no cuts, no speed changes, cinematic and grand,
> subtle film grain, inspired by the Hajar mountains. 10 seconds, 4K.

**V3 — Commodities page, clinker** → `clinker.mp4`
> Slow lateral tracking shot along a mountainous stockpile of grey cement
> clinker at dusk at an industrial plant, warm golden floodlight raking the
> material, deep teal-green twilight sky, gentle heat shimmer. One continuous
> constant-speed take, no cuts, cinematic industrial editorial, film grain,
> moody and premium. 10 seconds, 4K.

**V4 — Commodities page, limestone** → `limestone.mp4`
> Extremely slow vertical crane move up a wall of natural limestone strata,
> horizontal sedimentary layers of ivory and warm grey passing through frame
> like geological time, warm antique-gold side light grazing the texture,
> shadows falling to deep forest green. Single continuous take, constant
> speed, no cuts, macro texture detail, cinematic film grain. 10 seconds, 4K.

**V5 — About page (optional)** → `strata.mp4`
> Macro probe-lens glide across a polished cross-section of layered limestone,
> thin ivory and bone strata flowing past like contour lines, one warm gold
> light source, deep green shadow at the edges of frame, meditative and
> abstract. One continuous constant-speed take, no cuts, film grain. 8
> seconds, 4K.

**Activating a video on the site**: any `Media` slot takes
`video="/media/video/x.mp4" scrub` (the image stays as poster) — playback
follows the scroll. The Home hero is now a live Three.js world
(`src/scripts/world.js`), so V1 is optional there; V2–V5 drop straight into
the framed `Media` slots on Home, Commodities and About.

**Compress before shipping** (scrubbing needs dense keyframes — `-g 12` —
or seeking stutters):

```bash
ffmpeg -i hero_raw.mp4 -an -vf "scale=1920:-2" -c:v libx264 -crf 23 -g 12 -movflags +faststart hero.mp4
```

Target ≤ 6–8 MB per clip. Keep the `.jpg` poster — it is the no-JS,
reduced-motion and slow-network fallback.

---

## 3 · Image prompts

The seven live site images were generated with the prompts below — rerun or
riff on them any time (tool used: any strong photo model; add the art
direction block from the top).

| File (in `public/media/`) | Used on | Prompt core |
|---|---|---|
| `hero-clinker.jpg` 16:9 | Home hero (poster) | Extreme macro of grey cement clinker nodules filling frame like a dark lunar field, gold rim light upper-left |
| `clinker-panel.jpg` 3:4 | Home commodity panel | Stockpile of clinker rising like a dark mountain at dusk, one warm floodlight |
| `limestone-panel.jpg` 3:4 | Home commodity panel | Terraced limestone quarry face at first light, ivory benches, deep shadow |
| `clinker-macro.jpg` 16:9 | Commodities page | Clinker nodules on dark stone, still-life, single gold side light |
| `limestone-macro.jpg` 16:9 | Commodities page | Limestone strata stacked like pages of a book, warm grazing light |
| `quarry-hajar.jpg` 16:9 | Home, Emirates section | Aerial golden-hour view of working limestone quarry in arid mountains |
| `limestone-strata.jpg` 3:4 | About page | Vertical cross-section of thin sedimentary strata, museum quality |

Extras worth generating when needed:

**Port / vessel (future "logistics" imagery — keep generic, no flags/names):**
> A bulk carrier vessel being loaded with pale stone aggregate by conveyor at
> a dark industrial port at night, warm sodium and gold lights reflecting on
> black water, deep green-black sky, cinematic, film grain, no visible ship
> name, no text

**Truck logistics:**
> Convoy of heavy tipper trucks on an empty desert highway at dawn, headlights
> glowing warm gold, arid mountains behind, long shadows, cinematic editorial,
> dark premium grade, no logos

**OG / social share image** (1200×630): reuse `hero-clinker.jpg` center-cropped
— already wired as `/media/og.jpg`.

---

## 4 · Where everything lives

```
public/media/          ← images (jpg, ~200-400KB each after squoosh/avif)
public/media/video/    ← seedance clips (mp4, ≤8MB, -g 12)
src/data/site.js       ← contact details, form key, partner names
src/data/commodities.js← specs & copy per commodity
```
