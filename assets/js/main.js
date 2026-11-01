// Kurt Magastino — portfolio behavior: themes, screens, ladders, photo viewer

const root = document.documentElement;
const wipe = document.getElementById('wipe');
const toast = document.getElementById('toast');

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
const order = ['home', 'education', 'experience', 'projects', 'skills', 'contact'];
const titles = { home: 'Home', education: 'Education', experience: 'Experience', projects: 'Projects', skills: 'Skills', contact: 'Contact' };
const built = new Set([...document.querySelectorAll('.panel')].map(p => p.dataset.screen));
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
  document.body.classList.remove('ready');
  void document.body.offsetWidth;
  document.body.classList.add('ready');
}

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
      { src: 'assets/images/proj-norman-1.jpg', caption: 'Staff admin dashboard' },
      { src: 'assets/images/proj-norman-2.jpg', caption: 'Admin sign-in' },
      { src: 'assets/images/proj-norman-3.jpg', caption: "The shop's Facebook page, where the Messenger bot runs" },
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

// Opening wipe reveals the page
requestAnimationFrame(() => wipe.classList.add('leave'));
