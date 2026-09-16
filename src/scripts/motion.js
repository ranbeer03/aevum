// AEVUM: motion engine.
//
// Motion (the vanilla build of Framer Motion, motion.dev) owns every discrete
// change of state: the preloader dismissal, the arrival of a page, and the
// exit and entrance around a navigation. GSAP ScrollTrigger stays for the
// scroll-scrubbed effects only, where its scrub-with-lag has no equivalent.
// Lenis owns smooth scrolling. The 3D world is driven separately by world.js;
// this module tells it which camera stop each page and section wants.

import Lenis from 'lenis';
import { animate } from 'motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { World } from './world.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = [0.16, 1, 0.3, 1]; // the --ease-out curve, in Motion's terms
let lenis = null;
let revealIO = null;
let navBound = false;

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
    animate(el, { opacity: 0, transform: 'scale(1.04)' }, { duration: 0.7, ease: EASE })
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
// The element that actually moves, and where it moves to, per reveal variant.
function shownState(el) {
  const kind = el.dataset.reveal;
  if (el.classList.contains('split-line')) {
    return [el.querySelector('.split-inner') || el, { transform: 'translateY(0%)' }, 0.9];
  }
  // a section's ground fades up as its own layer, so the band arrives rather
  // than snapping in behind the words that sit on it
  if (kind === 'plate') return [el, { '--plate': 1 }, 0.8];
  if (kind === 'strata') return [el, { opacity: 1, clipPath: 'inset(0% 0 0 0)' }, 0.95];
  if (kind === 'rule') return [el, { opacity: 1, transform: 'scaleX(1)' }, 1.1];
  // translateY(0px), never `none`: Motion interpolates the target numerically,
  // and `none` resolves to a zero matrix that collapses the element outright.
  return [el, { opacity: 1, transform: 'translateY(0px)' }, 0.62];
}

// Play one element's entrance. `delay` staggers a group on page arrival.
// `.in` is added at the END: it carries the same final state in CSS, and
// setting it first would leave Motion animating from the finished position.
function reveal(el, delay = 0) {
  if (el.dataset.shown) return;
  el.dataset.shown = '1';
  const [target, to, duration] = shownState(el);
  // An authored --reveal-delay wins over the generic cascade, so a hero can
  // still time its own lines. Read off the inline style, not the computed
  // one, to avoid forcing a style flush per element.
  const authored = parseFloat(el.style.getPropertyValue('--reveal-delay'));
  animate(target, to, { duration, delay: authored >= 0 ? authored : delay, ease: EASE })
    .finished.then(() => el.classList.add('in'));
}

// Only the page's own content. The nav is persisted across navigations and its
// drawer links are .split-line too, sitting in the DOM BEFORE #main: swept into
// this cascade they took the first stagger slots and pushed every real heading
// back by 165ms. The drawer animates itself when it opens.
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
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  below.forEach((el) => revealIO.observe(el));
}

/* ------------------------------------------------------- page transitions */
// A navigation is one continuous movement: the current page leaves, the camera
// flies to the new page's stop while it is leaving, and the new page's content
// rises into the vantage the camera has arrived at. Astro's own crossfade is
// switched off in CSS so these are the only animations running.
const PAGE_OUT = { opacity: 0, transform: 'translateY(16px)' };
const pageParts = () => [document.getElementById('main'), document.querySelector('footer')].filter(Boolean);

function exitPage() {
  if (reduced) return Promise.resolve();
  const parts = pageParts();
  if (!parts.length) return Promise.resolve();
  return animate(parts, PAGE_OUT, { duration: 0.32, ease: [0.4, 0, 1, 1] }).finished;
}

// The incoming page arrives as a whole and then its content rises through it.
// Without the container fade the swap snapped every background, plate and
// image to full strength in one frame and only the words animated, which is
// what made a page change read as a cut with some text sliding afterwards.
let entered = false;
function enterPage() {
  entered = true;
  const parts = pageParts();
  for (const el of parts) el.style.transform = '';
  if (reduced) {
    for (const el of parts) el.style.opacity = '';
    initReveals();
    return;
  }
  // set synchronously, before the browser paints the swapped DOM
  for (const el of parts) el.style.opacity = '0';
  animate(parts, { opacity: 1 }, { duration: 0.34, ease: EASE });
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
}

/* -------------------------------------------------------------- the world */
// Every [data-cam] section is a camera anchor at the scroll offset where it
// sits centred, so scrolling spans between those vantages.
function measureAnchors() {
  if (!World.ready) return;
  const els = [...document.querySelectorAll('#main [data-cam]')];
  if (!els.length) return;
  const vh = innerHeight;
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  const anchors = els.map((el) => {
    const r = el.getBoundingClientRect();
    const centred = r.top + scrollY + r.height / 2 - vh / 2;
    return { y: Math.min(max, Math.max(0, centred)), stop: el.dataset.cam };
  });
  for (let i = 1; i < anchors.length; i++) {
    if (anchors[i].y <= anchors[i - 1].y) anchors[i].y = anchors[i - 1].y + 1;
  }
  World.setAnchors(anchors);
}

// The clips live in the persisted layout, so they are handed over once and the
// world grades them from then on.
function initClips() {
  const a = document.getElementById('clip-clinker');
  const b = document.getElementById('clip-vessel');
  if (!a || !b) return;
  // Same rule as the model: a phone gets neither. preload stays off until we
  // know the device will actually use them.
  if (!World.wantsMedia) {
    a.closest('.backdrop')?.remove();
    return;
  }
  // Wait for the world before pulling 1.6MB of clip. On a slow connection the
  // clips otherwise compete with the model for bandwidth and hold the
  // preloader up, and nothing needs them until a quarter of the way down.
  World.setClips([a, b]);
  World.whenReady.then(() => { a.preload = b.preload = 'auto'; a.load(); b.load(); });
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

  const sections = [...document.querySelectorAll('#main [data-cam][data-depth]')];
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

function initNav() {
  const nav = document.getElementById('site-nav');
  if (!nav || navBound) return;
  navBound = true;

  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('nav-drawer');

  let last = 0;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('is-solid', y > 40);
    if (y > 200 && y > last + 6 && !drawer?.classList.contains('is-open')) nav.classList.add('is-hidden');
    else if (y < last - 6 || y < 200) nav.classList.remove('is-hidden');
    last = y;
  };
  addEventListener('scroll', onScroll, { passive: true });

  toggle?.addEventListener('click', () => {
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
  dispatchEvent(new Event('scroll')); // persisted nav re-reads its state

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
      ScrollTrigger.refresh();
      measureAnchors();
    }, 0);
  });
}

function teardown() {
  closeDrawer();
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
