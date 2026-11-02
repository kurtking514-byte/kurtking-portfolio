// Kurt Magastino — portfolio behavior: themes, screens, ladders, photo viewer

const root = document.documentElement;
const wipe = document.getElementById('wipe');
const toast = document.getElementById('toast');

// Safety switch, part 1: a computer drawing without its graphics chip (acceleration
// off, or an old laptop the browser doesn't trust) is known before the first frame,
// so it starts light, opening entrance included
function softwareDrawing() {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return true;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|llvmpipe|software|basic render/i.test(name);
  } catch (e) { return false; }
}
// Part 2: otherwise time the first couple of seconds of frames. If this computer
// can't keep up (typical frame slower than ~45 per second), switch to lighter
// effects. Add ?lite to the address to see the light version on any computer.
if (/[?&]lite\b/.test(location.search) || softwareDrawing()) root.classList.add('lite', 'lite-start');
else (function checkSpeed() {
  if (document.hidden) {                 // background tabs don't draw frames; wait until it's shown
    document.addEventListener('visibilitychange', checkSpeed, { once: true });
    return;
  }
  const gaps = [];
  let last = performance.now();
  const end = last + 2200;
  requestAnimationFrame(function frame(t) {
    gaps.push(t - last); last = t;
    if (t < end) return requestAnimationFrame(frame);
    gaps.sort((a, b) => a - b);
    if (gaps[gaps.length >> 1] > 22) root.classList.add('lite');   // the middle frame ignores one-off hiccups
  });
})();

// One-screen layout: always start at the top
history.scrollRestoration = 'manual';
scrollTo(0, 0);

// Topographic contour lines, built once as SVG images for each color
function contourImage(lines, stroke, width) {
  const W = 1600, H = 1000;
  let paths = '';
  for (let i = 0; i < lines; i++) {
    const base = (i + .5) * H / lines;
    let d = '';
    for (let x = -20; x <= W + 20; x += 20) {
      const y = base
        + 70 * Math.sin(x / 260 + i * .22)
        + 34 * Math.sin(x / 110 - i * .5)
        + 22 * Math.sin((x + i * 30) / 47) * Math.sin(i * .3);
      d += (d ? 'L' : 'M') + x + ' ' + y.toFixed(1);
    }
    paths += `<path d="${d}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">`
    + `<g fill="none" stroke="${stroke}" stroke-width="${width}">${paths}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
root.style.setProperty('--contour-dark', contourImage(26, 'rgba(245,243,238,.07)', 1.5));
root.style.setProperty('--contour-light', contourImage(26, 'rgba(35,29,22,.07)', 1.5));
root.style.setProperty('--contour-red', contourImage(34, 'rgba(245,243,238,.35)', 3));

function setTheme(t) {
  root.dataset.theme = t;
  try { localStorage.setItem('kk-theme', t); } catch (e) {}
}
try { const saved = localStorage.getItem('kk-theme'); if (saved) setTheme(saved); } catch (e) {}

// Angular wipe; runs `mid` while the screen is covered.
// Wipes always play, even when the system asks for reduced motion.
function runWipe(mid, back = false) {
  wipe.classList.remove('run', 'intro', 'leave', 'rev');
  wipe.classList.toggle('rev', back);
  void wipe.offsetWidth;
  wipe.classList.add('run');
  setTimeout(mid, 200);
}

// The panel is painted in the new theme's color; the theme changes while
// the screen is covered, so the slide never stutters
const themeBg = { dark: '#101010', light: '#DDD3C2' };
function switchTheme() {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  wipe.style.setProperty('--wipe-bg', themeBg[next]);
  runWipe(() => setTheme(next));
}

document.getElementById('themeBtn').addEventListener('click', switchTheme);

// ---------- Screens ----------
// The main link shows only the screens assigned so far; /full (or ?full) shows them all.
// To open another screen on the main link, add it to ASSIGNED.
const ASSIGNED = ['home', 'education'];
const FULL = /^\/full\/?$/.test(location.pathname) || /[?&]full\b/.test(location.search);
const ALL = { home: 'Home', education: 'Education', experience: 'Experience', projects: 'Projects', skills: 'Skills', contact: 'Contact' };
const order = Object.keys(ALL).filter(id => FULL || ASSIGNED.includes(id));
const titles = Object.fromEntries(order.map(id => [id, ALL[id]]));
document.querySelectorAll('.tab').forEach(t => {
  if (!titles[t.getAttribute('href').slice(1)]) t.closest('li').remove();
});
const built = new Set([...document.querySelectorAll('.panel')].map(p => p.dataset.screen).filter(id => titles[id]));
const jumps = document.getElementById('jumps');
const arrowPts = '10,24 182,12 176,0 268,42 192,90 190,74 22,82 36,54';
let current = null;

function jumpHTML(dir, id) {
  const word = dir === 'prev' ? 'Prev' : 'Next';
  return `<a class="jump ${dir} in" href="#${id}" aria-label="${dir === 'prev' ? 'Previous' : 'Next'}: ${titles[id]}">`
    + `<svg viewBox="0 0 270 90" aria-hidden="true"><polygon class="shadow" points="${arrowPts}" transform="translate(7 6)"/>`
    + `<polygon class="body" points="${arrowPts}"/></svg>`
    + `<span class="txt"><small>${word}</small><b>${titles[id]}</b></span></a>`;
}

function show(id) {
  current = id;
  document.querySelectorAll('.panel').forEach(p => { p.hidden = p.dataset.screen !== id; });
  document.querySelectorAll('.tab').forEach(t => {
    if (t.getAttribute('href') === '#' + id) t.setAttribute('aria-current', 'page');
    else t.removeAttribute('aria-current');
  });
  const i = order.indexOf(id);
  jumps.innerHTML = (i > 0 ? jumpHTML('prev', order[i - 1]) : '') + (i < order.length - 1 ? jumpHTML('next', order[i + 1]) : '');
  document.title = id === 'home' ? 'Kurt Magastino' : `${titles[id]} · Kurt Magastino`;
  // Small windows scroll: start each screen from the top
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  // Replay this screen's entrance
  document.querySelectorAll('.was-in').forEach(el => el.classList.replace('was-in', 'in'));
  document.body.classList.remove('ready');
  void document.body.offsetWidth;
  document.body.classList.add('ready');
}

// Once an entrance finishes, let go of it: its last frame would otherwise
// hold the element still and block hover movement (arrows, ladder, cards)
document.addEventListener('animationend', e => {
  if (e.target.classList.contains('in')) e.target.classList.replace('in', 'was-in');
});

let toastTimer;
function go(id) {
  if (id === current) return;
  wipe.style.removeProperty('--wipe-bg');
  if (!built.has(id)) {
    // Screens that aren't built yet
    runWipe(() => {}, order.indexOf(id) < order.indexOf(current));
    toast.textContent = titles[id] + ' screen — coming next';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
    return;
  }
  // Moving to an earlier screen wipes leftward, a later one rightward
  const back = order.indexOf(id) < order.indexOf(current);
  runWipe(() => { show(id); history.replaceState(null, '', '#' + id); }, back);
}

// Tabs, logo and Prev/Next arrows (arrows are re-created, so listen on the document)
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  if (!titles[id]) return;
  e.preventDefault();
  // Links can also open a specific step on the destination's ladder
  if (a.dataset.pick) pickSchool(document.getElementById(a.dataset.pick));
  if (a.classList.contains('jump')) {
    // Let the arrow's shot play for a moment before the wipe covers it
    a.classList.remove('in');
    a.classList.add('fire');
    setTimeout(() => go(id), 120);
    // If we stay on this screen (e.g. "coming next"), bring the arrow back
    setTimeout(() => a.classList.remove('fire'), 520);
    return;
  }
  go(id);
});

// Ladders (Education schools, Projects): pick a step to show its card
function pickSchool(rung) {
  if (rung.getAttribute('aria-selected') === 'true') return; // already showing: don't replay the slide-in
  const rungs = [...rung.closest('.ladder').querySelectorAll('.rung')];
  rungs.forEach(x => {
    const on = x === rung;
    x.setAttribute('aria-selected', on);
    x.tabIndex = on ? 0 : -1;
    const view = document.getElementById(x.getAttribute('aria-controls'));
    view.hidden = !on;
    if (on) { view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter'); }
  });
}
document.querySelectorAll('.rung').forEach(rung => {
  rung.addEventListener('click', () => pickSchool(rung));
  rung.addEventListener('keydown', e => {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const rungs = [...rung.closest('.ladder').querySelectorAll('.rung')];
    const next = rungs[(rungs.indexOf(rung) + step + rungs.length) % rungs.length];
    pickSchool(next);
    next.focus();
  });
});

// ---------- Photo viewer ----------
const galleries = {
  shop: {
    title: 'Norman Cellphone Center and Accessories',
    photos: [
      { src: 'assets/images/shop-1.jpg', caption: 'The shop where I worked' },
    ],
  },
  norman: {
    title: 'Norman Cellphone Center',
    photos: [
      { src: 'assets/images/proj-norman-1.jpg', caption: 'Staff dashboard: what needs attention today' },
      { src: 'assets/images/proj-norman-2.jpg', caption: 'Live chat: watching the AI chatbot and taking over when needed' },
      { src: 'assets/images/proj-norman-5.jpg', caption: 'Staff sign-in' },
      { src: 'assets/images/proj-norman-3.jpg', caption: 'Repairs: tracking each job from check-in to pickup' },
      { src: 'assets/images/proj-norman-4.jpg', caption: 'Inventory: 134 products with prices and stock' },
      { src: 'assets/images/proj-norman-6.jpg', caption: "The shop's Facebook page, where the Messenger bot runs" },
    ],
  },
  robert0: {
    title: 'ROBERT0',
    photos: [
      { video: 'assets/video/proj-robert0.mp4', poster: 'assets/images/proj-robert0-poster.jpg', caption: 'ROBERT0 in action' },
      { src: 'assets/images/proj-robert0-1.jpg', caption: 'ROBERT0 with its speakers and microphone' },
      { src: 'assets/images/proj-robert0-2.jpg', caption: 'Full setup' },
      { src: 'assets/images/proj-robert0-3.jpg', caption: 'During assembly' },
      { src: 'assets/images/proj-robert0-4.jpg', caption: 'OLED face' },
      { src: 'assets/images/proj-robert0-5.jpg', caption: 'Presenting ROBERT0' },
    ],
  },
  balong: {
    title: 'B.A.L.O.N.G',
    photos: [
      { video: 'assets/video/proj-balong.mp4', poster: 'assets/images/proj-balong-poster.jpg', caption: 'B.A.L.O.N.G in action' },
    ],
  },
  refiner: {
    title: 'Prompt Refiner',
    photos: [
      { src: 'assets/images/proj-refiner-1.png', caption: 'Step 1: describe a rough idea' },
      { src: 'assets/images/proj-refiner-2.png', caption: 'The AI reads the idea and finds what is missing' },
      { src: 'assets/images/proj-refiner-3.png', caption: 'Step 2: questions written for that idea, not a fixed checklist' },
      { src: 'assets/images/proj-refiner-4.png', caption: 'Step 3: the finished prompt, ready to copy or paste in' },
    ],
  },
  poseidon: {
    title: 'POSEIDON',
    photos: [
      { src: 'assets/images/proj-poseidon-1.jpg', caption: 'POSEIDON' },
      { src: 'assets/images/proj-poseidon-2.jpg', caption: 'High side view' },
      { src: 'assets/images/proj-poseidon-3.jpg', caption: 'Turbine housing' },
      { src: 'assets/images/proj-poseidon-4.jpg', caption: 'Low side view' },
    ],
  },
  spes: {
    title: 'Barangay Poblacion Sur · SPES',
    photos: [
      { src: 'assets/images/spes-1.jpg', caption: 'At work at the barangay office' },
      { src: 'assets/images/spes-2.jpg', caption: 'Encoding barangay documents' },
      { src: 'assets/images/spes-3.jpg', caption: 'Barangay office records' },
      { src: 'assets/images/spes-4.jpg', caption: 'Barangay office' },
    ],
  },
};
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbVid = document.getElementById('lbVid');
const lbCap = document.getElementById('lbCap');
const lbThumbs = document.getElementById('lbThumbs');
let lbList = [], lbIndex = 0, lbOpener = null;

function lbShow(i) {
  lbIndex = (i + lbList.length) % lbList.length;
  const ph = lbList[lbIndex];
  const isVid = !!ph.video;
  lbVid.pause();
  lbImg.hidden = isVid;
  lbVid.hidden = !isVid;
  if (isVid) {
    lbVid.poster = ph.poster || '';
    lbVid.src = ph.video;
    lbVid.setAttribute('aria-label', ph.caption);
    lbVid.play().catch(() => {}); // the click that opened the viewer allows playback with sound
  } else {
    lbVid.removeAttribute('src');
    lbImg.src = ph.src;
    lbImg.alt = ph.caption;
  }
  const shown = isVid ? lbVid : lbImg;
  lbCap.textContent = `${ph.caption} · ${lbIndex + 1} / ${lbList.length}`;
  shown.classList.remove('pop'); void shown.offsetWidth; shown.classList.add('pop');
  [...lbThumbs.children].forEach((t, k) => t.setAttribute('aria-current', k === lbIndex));
}
function lbOpen(key, opener) {
  const g = galleries[key];
  if (!g) return;
  lbList = g.photos;
  lbOpener = opener;
  document.getElementById('lbTitle').textContent = g.title;
  lbThumbs.innerHTML = lbList.map((ph, k) =>
    `<button type="button" class="pop${ph.video ? ' vid' : ''}" style="background-image:url('${ph.video ? ph.poster : ph.src}'); animation-delay:${.12 + k * .06}s" aria-label="${ph.video ? 'Video' : 'Photo'} ${k + 1}: ${ph.caption}"></button>`).join('');
  [...lbThumbs.children].forEach((t, k) => t.addEventListener('click', () => lbShow(k)));
  lb.classList.toggle('single', lbList.length === 1);
  lb.hidden = false;
  lbShow(0);
  lb.querySelector('.lb-close').focus();
}
function lbClose() {
  lb.hidden = true;
  lbImg.removeAttribute('src');
  lbVid.pause();
  lbVid.removeAttribute('src');
  if (lbOpener) lbOpener.focus();
}
lb.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', lbClose));
lb.querySelector('.lb-nav.prev').addEventListener('click', () => lbShow(lbIndex - 1));
lb.querySelector('.lb-nav.next').addEventListener('click', () => lbShow(lbIndex + 1));
// Clicking a card with photos (or its button) opens them; real links inside the card still work
document.addEventListener('click', e => {
  const card = e.target.closest('[data-gallery]');
  if (!card || e.target.closest('a')) return;
  lbOpen(card.dataset.gallery, card.closest('.role')?.querySelector('button[data-gallery]') || card);
});
document.addEventListener('keydown', e => {
  if (lb.hidden) return;
  if (e.key === 'Escape') lbClose();
  else if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
  else if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
  else if (e.key === 'Tab') { // keep focus inside the viewer
    const f = [...lb.querySelectorAll('button')];
    const i = f.indexOf(document.activeElement);
    e.preventDefault();
    f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  }
});

// Contact: copy the email address
document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
  let ok = true;
  try { await navigator.clipboard.writeText(btn.dataset.copy); } catch (e) { ok = false; }
  toast.textContent = ok ? 'Email copied' : btn.dataset.copy;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}));

// ← / → move between screens, using the arrows so their shot + wipe play
document.addEventListener('keydown', e => {
  if (!lb.hidden) return; // the photo viewer uses the arrow keys while open
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest('input, textarea, [role="tab"]')) return;
  const dir = e.key === 'ArrowRight' ? 'next' : e.key === 'ArrowLeft' ? 'prev' : null;
  const arrow = dir && jumps.querySelector('.jump.' + dir);
  if (!arrow) return;
  e.preventDefault();
  arrow.click();
});

const start = location.hash.slice(1);
show(built.has(start) ? start : 'home');

// ---------- Persona motion ----------
// Portrait impact (red ghost, halftone dots, stars), KK logo shuffle,
// and the photo viewer's caption bubble and gliding ribbon
(() => {
  const stage = document.querySelector('.stage');
  const inner = document.getElementById('stageInner');
  const portrait = inner.querySelector('.portrait');
  const rnd = (a, b) => a + Math.random() * (b - a);

  const dots = document.createElement('div'); dots.className = 'p5-dots';
  inner.insertBefore(dots, portrait);
  // the portrait slides in once; coming back to Home later just shows it
  portrait.addEventListener('animationend', e => {
    if (e.animationName.startsWith('portraitIn')) document.body.classList.add('portrait-done');
  });
  const ghost = portrait.cloneNode(true);
  ghost.classList.add('p5-ghost');
  ghost.setAttribute('aria-hidden', 'true');
  inner.insertBefore(ghost, portrait);

  const FILLS = ['red', 'paper', 'ink'];
  function shards() {
    const n = root.classList.contains('lite') ? 2 : Math.round(rnd(3, 5));
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = `p5-shard star ${FILLS[i % FILLS.length]}`;
      s.appendChild(document.createElement('b')).appendChild(document.createElement('i'));
      const left = Math.random() < .5;
      const w = rnd(42, 78);
      s.style.width = s.style.height = w + 'px';
      s.style.left = (left ? rnd(-4, 22) : rnd(62, 88)) + '%';
      s.style.top = rnd(8, 80) + '%';
      s.style.setProperty('--fx', (left ? -1 : 1) * rnd(80, 160) + 'px');
      s.style.setProperty('--fy', rnd(-60, 60) + 'px');
      s.style.setProperty('--r', rnd(-35, 35) + 'deg');
      s.style.animationDelay = i * 35 + 'ms';
      inner.appendChild(s);
      setTimeout(() => s.remove(), 700 + i * 35);
    }
  }
  // skip work nobody can see: another screen is open or the tab is in the background
  const seen = el => !document.hidden && el.offsetParent !== null;
  let hitEnd;
  function hit() {
    if (!seen(stage)) return;
    clearTimeout(hitEnd);            // a new hit must not be cut short by the last one's cleanup
    document.body.classList.add('portrait-done');   // a hit that lands mid slide-in finishes it, so it can't restart after
    stage.classList.remove('hit');
    void stage.offsetWidth;          // restart the CSS animations
    stage.classList.add('hit');
    shards();
    hitEnd = setTimeout(() => stage.classList.remove('hit'), 600);
  }
  function loop() { hit(); setTimeout(loop, rnd(3200, 4800)); }
  setTimeout(loop, 1500);            // after the portrait slides in
  stage.addEventListener('mouseenter', hit);


  // KK logo: letters flick through ransom-note scraps, then punch back
  const logo = document.querySelector('.logo');
  const ks = logo.querySelectorAll('.rk');
  const kb = document.createElement('div'); kb.className = 'kk-burst'; logo.prepend(kb);
  const SCRAPS = [
    { background: 'var(--paper)', color: 'var(--ink)',   fontFamily: 'Georgia, serif', fontStyle: 'italic' },
    { background: 'var(--ink)',   color: 'var(--paper)', fontFamily: '"Arial Black", sans-serif', fontStyle: 'normal' },
    { background: 'var(--red)',   color: 'var(--paper)', fontFamily: 'var(--display)', fontStyle: 'normal' },
    { background: 'var(--paper)', color: 'var(--red)',   fontFamily: '"Courier New", monospace', fontStyle: 'normal' },
    { background: 'var(--ink)',   color: 'var(--red)',   fontFamily: 'Impact, sans-serif', fontStyle: 'normal' },
  ];
  function kkFrame() {
    ks.forEach(k => {
      Object.assign(k.style, SCRAPS[Math.floor(Math.random() * SCRAPS.length)]);
      k.style.transform = `rotate(${rnd(-16, 16)}deg) translateY(${rnd(-4, 6)}px)`;
    });
  }
  let kkBusy = false;
  function kkHit() {
    if (kkBusy || !seen(logo)) return;   // let a shuffle finish before starting another
    kkBusy = true;
    for (let i = 0; i < 4; i++) setTimeout(kkFrame, i * 70);
    setTimeout(() => {
      ks.forEach(k => k.removeAttribute('style'));          // back to the real scraps
      logo.classList.remove('hit', 'punch'); void logo.offsetWidth;
      logo.classList.add('hit', 'punch');
      for (let i = 0; i < 3; i++) {
        const sh = document.createElement('div');
        sh.className = 'kk-shard' + (i === 1 ? ' red' : '');
        sh.style.left = rnd(10, 80) + '%';
        sh.style.top = rnd(-10, 90) + '%';
        sh.style.setProperty('--fx', rnd(-40, 40) + 'px');
        sh.style.setProperty('--fy', rnd(-30, 30) + 'px');
        sh.style.setProperty('--r', rnd(-60, 60) + 'deg');
        logo.appendChild(sh);
        setTimeout(() => sh.remove(), 500);
      }
      setTimeout(() => { logo.classList.remove('hit', 'punch'); kkBusy = false; }, 550);
    }, 4 * 70);
  }
  function kkLoop() { kkHit(); setTimeout(kkLoop, rnd(4500, 6500)); }
  setTimeout(kkLoop, 2600);          // offset from the portrait so they don't fire together
  logo.addEventListener('mouseenter', kkHit);

  // Pop the caption bubble each time the photo changes
  const cap = document.getElementById('lbCap');
  let lastIndex = 0;
  new MutationObserver(() => {
    cap.classList.remove('say'); void cap.offsetWidth; cap.classList.add('say');
    // glide the ribbon the way you moved (wrap-around counts as one step)
    const box = document.getElementById('lightbox');
    if (box.dataset.seen) {
      let d = lbIndex - lastIndex;
      if (Math.abs(d) > lbList.length / 2) d = -Math.sign(d);
      box.style.setProperty('--dir', d < 0 ? -1 : 1);
      box.classList.remove('pan'); void box.offsetWidth; box.classList.add('pan');
    }
    lastIndex = lbIndex;
    box.dataset.seen = '1';
  }).observe(cap, { childList: true });
  // closing resets it, so the next open gets the full slash-in again
  const lbox = document.getElementById('lightbox');
  new MutationObserver(() => {
    if (lbox.hidden) { delete lbox.dataset.seen; lbox.classList.remove('pan'); }
  }).observe(lbox, { attributes: true, attributeFilter: ['hidden'] });
})();

// "I am a ___": the word box squeezes shut, swaps the word, and pops back open
(() => {
  const WORDS = ['Full-stack developer', 'Robot builder', 'Hardware developer', 'Computer Science student'];
  const box = document.querySelector('.tagline .word'), txt = box.querySelector('strong');
  const rnd = (a, b) => a + Math.random() * (b - a);
  // jagged outline sized to the box: a spike roughly every 30px along the top and bottom
  function spike() {
    const w = txt.offsetWidth, h = txt.offsetHeight, d = 13;
    const pct = (x, y) => `${(x / w * 100).toFixed(2)}% ${(y / h * 100).toFixed(2)}%`;
    const n = Math.max(3, Math.round(w / 30)), pts = [];
    for (let i = 0; i <= n; i++) pts.push(pct(w * i / n + rnd(-3, 3), i % 2 ? d + rnd(0, 5) : rnd(0, 3)));
    pts.push(pct(w, h * .3), pct(w - d - 4, h * .5), pct(w, h * .72));
    for (let i = n; i >= 0; i--) pts.push(pct(w * i / n + rnd(-3, 3), i % 2 ? h - d - rnd(0, 5) : h - rnd(0, 3)));
    pts.push(pct(0, h * .7), pct(d + 4, h * .48), pct(0, h * .26));
    txt.style.clipPath = `polygon(${pts.join(',')})`;
  }
  spike();
  document.fonts?.ready.then(spike);
  let i = 0;
  function next() {
    const shut = box.animate(
      [{ transform: 'scale(1,1)' }, { transform: 'scale(.06,1.25)' }],
      { duration: 170, easing: 'cubic-bezier(.6,0,.9,.4)', fill: 'forwards' });
    shut.onfinish = () => {
      i = (i + 1) % WORDS.length;
      txt.textContent = WORDS[i];
      spike();
      box.animate(
        [{ transform: 'scale(.06,1.25)' }, { transform: 'scale(1.12,.88)', offset: .6 }, { transform: 'scale(1,1)' }],
        { duration: 300, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
    };
  }
  setInterval(next, 2400);
})();

// Opening wipe reveals the page
requestAnimationFrame(() => wipe.classList.add('leave'));
