// AEVUM: motion engine.
//
// Motion (the vanilla build of Framer Motion, motion.dev) owns every discrete
// change of state: the preloader dismissal, the arrival of a page, and the
// exit and entrance around a navigation. GSAP ScrollTrigger stays for the
// scroll-scrubbed effects only, where its scrub-with-lag has no equivalent.
// Lenis owns smooth scrolling. The 3D world is driven separately by world.js;
// this module tells it which camera stop each page and section wants.

import Lenis from 'lenis';
import { animate, stagger } from 'motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { World } from './world.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = [0.16, 1, 0.3, 1]; // the --ease-out curve, in Motion's terms
// Copy settles on a rounder curve. The exponential one above puts nine tenths
// of a move into its first fifth, which on a 21px rise read as a pop; measured
// at 91% done after 218ms of a 620ms reveal.
const EASE_COPY = [0.33, 1, 0.68, 1];
// A deliberate wipe: slow off the mark, fast through the middle, slow to rest.
// For things that are cut open rather than lifted into place.
const EASE_CUT = [0.7, 0, 0.2, 1];
let lenis = null;
let revealIO = null;

/* ---------------------------------------------------------------- scrolling */
// One Lenis for the whole session. Tearing it down around a view transition
// churns scrollbar state mid-snapshot and aborts the morph.
function initLenis() {
  if (reduced || lenis) return;
  lenis = new Lenis({ lerp: 0.11 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Same-page targets glide; cross-page links fall through to the view transition.
// Lenis needs `easing` alongside `duration`. Given duration alone it falls
// back to the instance's lerp and snaps to the target in one frame.
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
function scrollTo(target) {
  if (lenis) lenis.scrollTo(target, { duration: 1.1, easing: easeOut });
  else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}

// Capture phase, and stop propagation: Astro's ClientRouter also listens for
// link clicks and jumps same-page hashes instantly. We have to claim the event
// before it does, or the glide is replaced by a snap.
function onAnchorClick(e) {
  const a = e.target.closest?.('a[href*="#"]');
  if (!a || a.origin !== location.origin || a.pathname !== location.pathname) return;
  const el = a.hash && document.querySelector(a.hash);
  if (!el) return;
  e.preventDefault();
  e.stopPropagation();
  history.replaceState(null, '', a.hash);
  scrollTo(el);
}

// A new page starts at the top, or at its hash, instantly and before paint.
// Animating this while the view transition is still running looks like a
// glitch; the transition itself is the movement.
function placeScroll() {
  const el = location.hash && document.querySelector(location.hash);
  const y = el ? el.getBoundingClientRect().top + scrollY : 0;
  window.scrollTo(0, y);
  lenis?.scrollTo(y, { immediate: true, force: true });
}

/* --------------------------------------------------------------- preloader */
// The page is held behind the mark until the world can be shown, so the copy
// and the quarry arrive in the same moment. First load only: a client-side
// navigation strips the incoming document's loader before the swap.
const shown = (() => {
  const el = document.getElementById('loader');
  if (!el) return Promise.resolve();

  // `is-live` switches the bar from its indeterminate sweep to real progress.
  // Before the bundle has finished downloading there is nothing honest to
  // measure, and a bar frozen at zero reads as a broken page.
  const set = (p) => {
    el.classList.add('is-live');
    el.style.setProperty('--p', p.toFixed(3));
  };
  // Benches, not liquid: the seam steps up in fifths the way the pit does.
  World.progress = (p) => set(Math.floor(p * 5) / 5);

  const done = async () => {
    set(1);
    // let the seam top out before the mark leaves
    await new Promise((r) => setTimeout(r, 380));
    document.documentElement.classList.remove('is-loading');
    lenis?.start();
    // The world arrives as a move, not a cut, and the copy rises into it: the
    // camera flight and the mark's exit start on the same frame.
    World.intro();
    if (reduced) { el.remove(); return; }
    // Explicit start values: from `transform: none` Motion interpolates a
    // zero matrix, which collapsed the full-screen mark to a point and grew
    // it back as a box while it faded.
    animate(el, { opacity: [1, 0], transform: ['scale(1)', 'scale(1.04)'] }, { duration: 0.7, ease: EASE })
      .finished.then(() => el.remove());
    // Hand back before the mark has finished fading, so the content is already
    // rising through it rather than waiting for a blank screen to clear.
    await new Promise((r) => setTimeout(r, 180));
  };

  return Promise.all([
    // Never hostage to the network: show the site regardless after 8s.
    Promise.race([World.whenReady, new Promise((r) => setTimeout(r, 8000))]),
    // ...and never a flash: hold the mark long enough to read as intentional.
    new Promise((r) => setTimeout(r, 600)),
  ]).then(done);
})();

/* ----------------------------------------------------------------- reveals */
// CSS holds the hidden state of every reveal so the page is correct before
// this script runs and if it never does. Motion drives the entrance, which is
// what lets a page change stagger its content instead of flashing it in.
// The element that actually moves, where it moves to, and how, per variant.
function shownState(el) {
  const kind = el.dataset.reveal;
  if (el.classList.contains('split-line')) {
    // the same rounder curve as every other heading: on the exponential one
    // the hero's lines were two thirds up within 120ms, which reads as a cut
    return [el.querySelector('.split-inner') || el, { transform: 'translateY(0%)' }, 1.0, EASE_COPY];
  }
  // a section's ground fades up as its own layer, so the band arrives rather
  // than snapping in behind the words that sit on it
  if (kind === 'plate') return [el, { '--plate': 1 }, 1.1, EASE];
  // shade breathes in behind its copy, ahead of the words
  if (kind === 'shade') return [el, { '--shade': [0, 1] }, 1.0, EASE];
  if (kind === 'rule') return [el, { opacity: 1, transform: 'scaleX(1)' }, 1.4, EASE_CUT];
  // translateY(0px), never `none`: Motion interpolates the target numerically,
  // and `none` resolves to a zero matrix that collapses the element outright.
  return [el, { opacity: 1, transform: 'translateY(0px)' }, 0.8, EASE_COPY];
}

// Play one element's entrance. `delay` staggers a group on page arrival.
// `.in` is added at the END: it carries the same final state in CSS, and
// setting it first would leave Motion animating from the finished position.
function reveal(el, delay = 0) {
  if (el.dataset.shown) return;
  el.dataset.shown = '1';
  // An authored --reveal-delay wins over the generic cascade, so a hero can
  // still time its own lines. Read off the inline style, not the computed
  // one, to avoid forcing a style flush per element.
  const authored = parseFloat(el.style.getPropertyValue('--reveal-delay'));
  const at = authored >= 0 ? authored : delay;
  const done = () => el.classList.add('in');

  // Headings rise line by line out of a clipped box, the hero's cut, on a
  // rounder curve than the exponential one (two thirds up in 120ms reads as
  // a cut). Split at reveal time, when the fonts are in, because where a
  // line breaks depends on the viewport; reverted once shown so a resize
  // afterwards rewraps plain text. Everything else on the page takes the
  // plain rise: the two pinned chapters are where the motion is, and a
  // flourish on every block was what made the page feel crowded.
  if (!el.dataset.reveal && el.matches('h1, h2, h3')) {
    const split = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
    // The lines take the hidden state in the same synchronous step the
    // heading gives it up, so no frame can paint the finished heading first.
    for (const l of split.lines) l.style.transform = 'translateY(105%)';
    el.style.cssText += ';opacity:1;transform:none;filter:none';
    animate(split.lines, { transform: 'translateY(0%)' },
      { duration: 0.9, delay: stagger(0.08, { startDelay: at }), ease: EASE_COPY })
      .finished.then(() => { done(); split.revert(); });
    return;
  }

  // An image is cut open from its foot upward, the way a bench face is
  // exposed, while the photograph inside settles from a slight push. The cut
  // is on the frame's inner layer and the frame itself is what the observer
  // watches (Chrome intersects a target through its own clip-path).
  if (el.dataset.reveal === 'strata') {
    const inner = el.querySelector('.media__inner') || el;
    // `scale`, the individual property, not `transform`: the parallax owns
    // the image's transform and the two would overwrite each other.
    inner.querySelector('img')?.animate([{ scale: 1.1 }, { scale: 1 }],
      { duration: 1600, delay: at * 1000, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    animate(inner, { clipPath: 'inset(0% 0% 0% 0%)' }, { duration: 1.2, delay: at, ease: EASE_CUT })
      .finished.then(done);
    return;
  }

  // A survey line (Survey.astro) is drawn across its items (down them on a
  // phone), and each surfaces as the line reaches it: its marker, then its
  // name and copy. The line runs at a constant rate, so where it is at any
  // moment is simply how far through its duration it is.
  if (el.dataset.reveal === 'survey') {
    const items = [...el.querySelectorAll('.survey__item')];
    const across = matchMedia('(min-width: 861px)').matches; // the phone layout runs it down
    const LINE = 1.5, start = at + 0.2;
    animate(el, { '--shade': [0, 1] }, { duration: 0.9, delay: at, ease: EASE });
    animate(el, { '--draw': [0, 1] }, { duration: LINE, delay: start, ease: 'linear' });
    const runs = items.map((it) => {
      const f = across ? it.offsetLeft / el.offsetWidth : it.offsetTop / el.offsetHeight;
      const t = start + LINE * f;
      animate(it.querySelector('.survey__node'), { transform: ['scale(0)', 'scale(1)'] }, { duration: 0.5, delay: t, ease: EASE });
      const text = [it.querySelector('.survey__name'), it.querySelector('.survey__copy')];
      return animate(text, { opacity: [0, 1], transform: ['translateY(1.1rem)', 'translateY(0px)'] },
        { duration: 0.9, delay: stagger(0.1, { startDelay: t + 0.08 }), ease: EASE_COPY }).finished;
    });
    Promise.all(runs).then(done);
    return;
  }

  // A chain row is laid down left to right, the way the route beside it
  // draws: its name, then its copy. The children carry the clip, not the row,
  // which is the observer's target (see the CSS note).
  if (el.dataset.reveal === 'row') {
    animate([...el.children], { clipPath: 'inset(0 0% 0 0)' },
      { duration: 1.1, delay: stagger(0.12, { startDelay: at }), ease: EASE_CUT })
      // let go of the clip once laid: left inline it also cut off anything
      // drawn outside the children, the hover's accent rule included
      .finished.then(() => { for (const c of el.children) c.style.clipPath = ''; done(); });
    return;
  }

  const [target, to, duration, ease] = shownState(el);
  animate(target, to, { duration, delay: at, ease }).finished.then(done);
}

// Only the page's own content. The nav drawer's links are .split-line too,
// sitting in the DOM BEFORE #main: swept into this cascade they took the first
// stagger slots and pushed every real heading back by 165ms. The drawer
// animates itself when it opens.
const TARGETS = '#main [data-reveal], #main .split-line, footer [data-reveal], footer .split-line';

function initReveals() {
  const targets = [...document.querySelectorAll(TARGETS)].filter((el) => !el.dataset.shown);
  if (reduced) {
    targets.forEach((el) => { el.dataset.shown = '1'; el.classList.add('in'); });
    return;
  }
  revealIO?.disconnect();

  // Anything already on screen belongs to this page's arrival, so it is
  // staggered as one movement. Everything below the fold waits for the scroll.
  const onScreen = [];
  const below = [];
  for (const el of targets) {
    const r = el.getBoundingClientRect();
    (r.top < innerHeight && r.bottom > 0 ? onScreen : below).push(el);
  }
  // Explicit index rather than Motion's stagger(): the cascade is capped so a
  // dense first screen still finishes promptly instead of trailing for seconds.
  onScreen.forEach((el, i) => reveal(el, Math.min(i * 0.055, 0.44)));

  revealIO = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target, 0);
        revealIO.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -14% 0px', threshold: 0.05 }
  );
  below.forEach((el) => revealIO.observe(el));
}

/* ------------------------------------------------------- page transitions */
// A navigation is one continuous movement: the current page leaves, the camera
// flies to the new page's stop while it is leaving, and the new page's content
// rises into the vantage the camera has arrived at. Astro's own crossfade is
// switched off in CSS so these are the only animations running.
// The outgoing page dissolves in place. It used to slide as it faded, which
// was one more movement on the text before the next page's text moved in.
const PAGE_OUT = { opacity: [1, 0] };
const pageParts = () => [document.getElementById('main'), document.querySelector('footer')].filter(Boolean);

function exitPage() {
  if (reduced) return Promise.resolve();
  const parts = pageParts();
  if (!parts.length) return Promise.resolve();
  return animate(parts, PAGE_OUT, { duration: 0.3, ease: [0.4, 0, 1, 1] }).finished;
}

// The incoming page's text moves exactly once: each block rises into place
// on its own reveal, in one tightly staggered beat. There is no container fade
// on top any more. Everything in a first screen carries its own reveal (the
// plates included), and fading the whole page as well was a second animation
// on every line of text, which is what read as the text arriving twice.
let entered = false;
function enterPage() {
  entered = true;
  for (const el of pageParts()) { el.style.transform = ''; el.style.opacity = ''; }
  initReveals();
}

/* ------------------------------------------------------------ scrubbed DOM */
function initScrub() {
  if (reduced) return;

  // framed media drift. Overscan grows with strength so edges never show
  document.querySelectorAll('[data-parallax]').forEach((frame) => {
    const inner = frame.querySelector('img, video');
    if (!inner) return;
    const strength = parseFloat(frame.dataset.parallax) || 0.12;
    inner.style.height = `${100 + Math.ceil(strength * 220)}%`;
    gsap.fromTo(
      inner,
      { yPercent: -strength * 100 },
      {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.4 },
      }
    );
  });

  // The cargo route draws with the scroll. A scaled element, not an SVG
  // stroke-dash: the line lives in a viewBox stretched non-uniformly, where a
  // dash pattern computed from getTotalLength() renders as broken fragments.
  document.querySelectorAll('[data-draw]').forEach((line) => {
    gsap.fromTo(
      line,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        transformOrigin: 'top',
        scrollTrigger: {
          trigger: line.closest('section') || line,
          start: 'top 70%',
          end: 'bottom 55%',
          scrub: 0.4,
        },
      }
    );
  });

  document.querySelectorAll('[data-station]').forEach((row) => {
    ScrollTrigger.create({
      trigger: row,
      start: 'top 62%',
      onEnter: () => row.classList.add('passed'),
      onLeaveBack: () => row.classList.remove('passed'),
    });
  });

  // Photographs recede as they leave through the top: a few percent smaller
  // and dimmer, scrubbed, so scrolling back brings them straight back. Text
  // never fades on the way out; that made copy unreadable while it was
  // still being read.
  document.querySelectorAll('#main .media').forEach((fig) => {
    gsap.fromTo(fig, { '--recede': 0 }, {
      '--recede': 1,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: { trigger: fig, start: 'bottom 38%', end: 'bottom top', scrub: true },
    });
  });

  // The pinned chapter's copy runs on the same scroll as its clip, so the
  // two cannot drift apart: in from the first number of data-scene, out from
  // the second, both fractions of the pin. Each line of copy rises out of a
  // cut (a clip-path opening from its foot) as the hull forms, holds while
  // the vessel completes, and is drawn up out of the top as it comes apart:
  // the same direction as the hatches lifting off. No lag (scrub: true)
  // because the world's playhead takes none either; Lenis smooths both.
  document.querySelectorAll('[data-scene]').forEach((scene) => {
    const pin = scene.closest('.interlude');
    if (!pin) return;
    const [inAt, outAt] = scene.dataset.scene.split(' ').map(Number);
    // the clip's stage is measured by the world every frame, so it never moves
    const parts = [...scene.children].filter((c) => !c.hasAttribute('data-clip-stage'));
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: pin, start: 'top top', end: 'bottom bottom', scrub: true },
    });
    tl.set({}, {}, 1); // the timeline spans the whole pin, 0 to 1
    // The clip inset always equals the distance moved, so the cut line stays
    // put: in, the block rises through a line at its own foot, top first;
    // out, it is drawn up through a line at its own head.
    tl.fromTo(parts,
      { opacity: 0, yPercent: 100, clipPath: 'inset(0% 0% 100% 0%)' },
      { opacity: 1, yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.16, stagger: 0.05, ease: 'power3.out' }, inAt);
    tl.to(parts,
      { opacity: 0, yPercent: -100, clipPath: 'inset(100% 0% 0% 0%)', duration: 0.14, stagger: 0.03, ease: 'power2.in' }, outAt);
  });
}

/* ---------------------------------------------------------------- hovers */
// The inspection light. One light per GROUP of surfaces (a collage, a list
// of rows), not one per surface: every surface in the group is lit from the
// same point on screen, so the light reads as one lamp moving across them
// and there is no edge to cross. Per surface, crossing from one row or frame
// to the next killed one light and started another, which was the snap.
// The position glides (registered properties, transitioned in CSS), and is
// re-aimed while the page scrolls under a still pointer.
let rakeGroup = null;
let rakeX = 0, rakeY = 0;

const surfacesOf = (group) =>
  group.matches('.media') ? [group] : [...group.querySelectorAll('.media')];

function aimRake() {
  if (!rakeGroup) return;
  for (const el of surfacesOf(rakeGroup)) {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${(rakeX - r.left).toFixed(1)}px`);
    el.style.setProperty('--my', `${(rakeY - r.top).toFixed(1)}px`);
  }
}

function initHover() {
  if (!matchMedia('(hover: hover)').matches) return;
  const groups = new Set();
  document.querySelectorAll('#main .media').forEach((el) => {
    groups.add(el.closest('[data-rake]') || el);
  });
  for (const group of groups) {
    group.addEventListener('pointerenter', (e) => {
      rakeGroup = group;
      rakeX = e.clientX; rakeY = e.clientY;
      // Appear AT the pointer: the glide is for following it, not for
      // travelling in from wherever it last left.
      for (const el of surfacesOf(group)) el.classList.add('rake-jump');
      aimRake();
      requestAnimationFrame(() => { for (const el of surfacesOf(group)) el.classList.remove('rake-jump'); });
      group.classList.add('is-lit');
    });
    group.addEventListener('pointermove', (e) => { rakeX = e.clientX; rakeY = e.clientY; aimRake(); }, { passive: true });
    group.addEventListener('pointerleave', () => {
      group.classList.remove('is-lit');
      if (rakeGroup === group) rakeGroup = null;
    });
  }
}
addEventListener('scroll', aimRake, { passive: true });

// No hover while the page moves under a still pointer. Otherwise every photo
// and ledger row that scrolls under the cursor lights, leans in and fades out
// in turn (measured: five lamps, two images and all four service rows on one
// pass down the home page), which reads as the page flickering. The class
// holds until the scroll, Lenis' glide included, has been still for 160ms.
let scrollIdle = 0;
addEventListener('scroll', () => {
  const root = document.documentElement;
  if (!root.classList.contains('is-scrolling')) root.classList.add('is-scrolling');
  clearTimeout(scrollIdle);
  scrollIdle = setTimeout(() => root.classList.remove('is-scrolling'), 160);
}, { passive: true });

/* -------------------------------------------------------------- the world */
// Every [data-cam] element is a camera anchor. By default the anchor is the
// scroll offset where the element sits centred, so scrolling spans between
// those vantages. `data-cam-at="0.1"` pins it instead to where the element's
// TOP edge sits 10% down the viewport: how a stop is tied to the moment a
// section has arrived, or a mark to the moment its edge reaches a line,
// rather than only to centres.
function measureAnchors() {
  if (!World.ready) return;
  const els = [...document.querySelectorAll('#main [data-cam]')];
  if (!els.length) return;
  const vh = innerHeight;
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  // Layout position, not the painted rect: the exits translate whole blocks
  // as they leave, and a measure taken mid-exit would move every mark inside
  // them.
  const docTop = (el) => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };
  const anchors = els.map((el) => {
    const top = docTop(el);
    const at = parseFloat(el.dataset.camAt);
    const y = Number.isFinite(at) ? top - at * vh : top + el.offsetHeight / 2 - vh / 2;
    return { y: Math.min(max, Math.max(0, y)), stop: el.dataset.cam };
  });
  for (let i = 1; i < anchors.length; i++) {
    if (anchors[i].y <= anchors[i - 1].y) anchors[i].y = anchors[i - 1].y + 1;
  }
  World.setAnchors(anchors);
}

// The clips live in the persisted layout, so they are handed over once and the
// world grades them from then on.
function initClips() {
  const v = document.getElementById('clip-vessel');
  if (!v) return;
  // Same rule as the model: a Save-Data visitor gets neither. preload stays
  // off until we know the device will actually use it.
  if (!World.wantsMedia) {
    v.closest('.backdrop')?.remove();
    return;
  }
  // Wait for the world before pulling the clip: on a slow connection it
  // otherwise competes with the model for bandwidth and holds the preloader.
  World.setClips([v]);
  World.whenReady.then(() => { v.preload = 'auto'; v.load(); });
}

function initWorld() {
  const canvas = document.getElementById('world-canvas');
  if (!canvas) return;
  if (World.ready) {
    if (!reduced) World.flight(); // a page change re-aims the camera
  } else {
    try {
      World.init(canvas, { reduced });
    } catch {
      canvas.closest('.world')?.remove(); // no WebGL, content stands alone
      return;
    }
  }
  measureAnchors();
  initClips();
}

/* ---------------------------------------------------------- the section rail */
// Bench markers down the right edge: one per camera section, labelled on hover
// and clickable as a table of contents.
function initRail() {
  const rail = document.getElementById('depth-rail');
  if (!rail) return;
  rail.replaceChildren();

  const sections = [...document.querySelectorAll('#main [data-depth]')];
  if (sections.length < 2) return;

  sections.forEach((section) => {
    const name = section.dataset.depth;
    const tick = document.createElement('button');
    tick.type = 'button';
    tick.className = 'rail__tick';
    tick.innerHTML = `<span class="rail__label">${name}</span>`;
    tick.setAttribute('aria-label', `Jump to ${name}`);
    tick.addEventListener('click', () => scrollTo(section));
    rail.append(tick);

    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        tick.classList.toggle('is-active', self.isActive);
        if (self.isActive) tick.setAttribute('aria-current', 'true');
        else tick.removeAttribute('aria-current');
      },
    });
  });
}

/* -------------------------------------------------------------------- nav */
function closeDrawer() {
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('nav-drawer');
  if (!drawer?.classList.contains('is-open')) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  toggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  lenis?.start();
}

// The header is NOT persisted: each page renders its own, so the active link
// is right from the server. So it is rebound per page, and the scroll handler
// looks the header up rather than holding one; bound once, it kept driving
// the first page's header after it had been swapped out, and the menu button
// on every later page did nothing.
let lastY = 0;
function onNavScroll() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  const y = scrollY;
  nav.classList.toggle('is-solid', y > 40);
  const open = document.getElementById('nav-drawer')?.classList.contains('is-open');
  if (y > 200 && y > lastY + 6 && !open) nav.classList.add('is-hidden');
  else if (y < lastY - 6 || y < 200) nav.classList.remove('is-hidden');
  lastY = y;
}
addEventListener('scroll', onNavScroll, { passive: true });

function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('nav-drawer');
  lastY = scrollY;
  if (!toggle || !drawer || toggle.dataset.bound) return;
  toggle.dataset.bound = '1';
  toggle.addEventListener('click', () => {
    const open = drawer.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    open ? lenis?.stop() : lenis?.start();
  });
}

/* -------------------------------------------------------------- lifecycle */
let scrubTimer = 0;

function boot() {
  initLenis();
  initWorld();
  initNav();
  onNavScroll(); // the new page's header takes the current scroll state

  const first = document.documentElement.classList.contains('is-loading');
  if (first) lenis?.stop();
  clearTimeout(scrubTimer);

  // Nothing is revealed or measured until the page is in its final state: on
  // first load that means after the preloader lifts, since the scrollbar comes
  // back with it and every trigger position moves with the scrollbar.
  (first ? shown : Promise.resolve()).then(() => {
    if (!entered) enterPage(); // first load: nothing swapped, so nothing entered
    scrubTimer = setTimeout(() => {
      initScrub();
      initRail();
      initHover();
      ScrollTrigger.refresh();
      measureAnchors();
    }, 0);
  });
}

function teardown() {
  closeDrawer();
  rakeGroup = null;
  revealIO?.disconnect();
  revealIO = null;
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

let resizeTimer = 0;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(measureAnchors, 160);
}, { passive: true });

document.addEventListener('click', onAnchorClick, true);
document.addEventListener('astro:page-load', boot);

// The exit runs alongside the fetch rather than before it, so a fast network
// costs nothing and a slow one is covered by the animation.
document.addEventListener('astro:before-preparation', (e) => {
  // Stop sampling the outgoing page's anchors. Without this the scroll reset
  // below is read against stale anchors for a few frames and the camera
  // twitches toward the wrong stop before setting off for the right one.
  World.hold();
  entered = false;
  const load = e.loader;
  e.loader = () => Promise.all([exitPage(), load()]);
});

document.addEventListener('astro:before-swap', (e) => {
  teardown();
  const doc = e.newDocument;
  if (!doc) return;
  // Lenis' classes are runtime-only; the incoming document needs them stamped
  // before the swap or smooth scrolling drops for a frame.
  if (lenis) doc.documentElement.classList.add('lenis', 'lenis-smooth');
  // The preloader is a first-visit device and every served page carries one.
  doc.documentElement.classList.remove('is-loading');
  doc.getElementById('loader')?.remove();

  // Aim the camera at the destination now, from the incoming document, so it
  // is already flying while the new page's content is still rising in. The
  // real per-section anchors take over on page-load.
  const stop = doc.querySelector('#main [data-cam]')?.dataset.cam;
  if (stop) {
    World.flight();
    World.aim(stop);
  }
});

// after-swap runs synchronously against the new DOM, before it is painted, so
// the entrance starts on the same frame the page appears.
document.addEventListener('astro:after-swap', () => {
  placeScroll();
  enterPage();
});
