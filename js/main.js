// mobile menu toggle
const menuBtn = document.querySelector('.menu-btn');
const nav = document.getElementById('nav');

if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? 'Close' : 'Menu';
  });
}

// light / dark switch (remembered between visits)
const themeBtn = document.querySelector('.theme-btn');
const root = document.documentElement;
const isDark = () => root.dataset.theme
  ? root.dataset.theme === 'dark'
  : matchMedia('(prefers-color-scheme: dark)').matches;

function labelThemeBtn() {
  themeBtn.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
}

if (themeBtn) {
  labelThemeBtn();
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    labelThemeBtn();
  });
}

// portrait glide between pages (home <-> about).
// The whole glide runs on the page you are leaving: the text fades out while the
// portrait slides to exactly where the next page draws it, then the page changes.
// The next page then opens with the portrait already in place, so nothing jumps.
const portrait = document.querySelector('.portrait, .about-portrait');
const RATIO = 1054 / 1500;   // portrait.webp width / height
let leaving = [];

// Where each page draws the portrait (viewport coords). Keep in sync with style.css.
function portraitSpot(page) {
  const W = document.body.clientWidth, H = innerHeight;   // body: excludes the reserved scrollbar space
  const stacked = W <= 860 || W / H <= 1;        // the phone / tablet layout
  const pad = Math.min(Math.max(16, W * .03), 44);
  let h, x, y;
  if (page === 'about') {
    if (stacked) { h = Math.min(H * .58, 560); x = (W - h * RATIO) / 2; y = 96; }
    else { h = Math.min(H * .88, W * .54); x = pad; y = H - h; }
  } else {
    if (stacked) { h = Math.min(H * .6, 640); x = (W - h * RATIO) / 2; y = 96; }
    else { h = H * .92; x = W * .66 - h * RATIO / 2; y = H - h; }
  }
  return { x, y: y - scrollY, h };
}

function pageOf(url) {
  const name = new URL(url, location.href).pathname.split('/').pop();
  return name === '' || name === 'index.html' ? 'home' : name === 'about.html' ? 'about' : null;
}

// slide the nav underline from this page's tab to the next one, in time with the glide
let underlineFrom = null;
function slideUnderline(dest, duration) {
  if (!nav || getComputedStyle(menuBtn).display !== 'none') return;   // phone menu: nothing to slide
  const from = nav.querySelector('a.on');
  const to = [...nav.querySelectorAll('a')].find(a => pageOf(a.href) === dest);
  if (!from || !to || from === to) return;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  underlineFrom = from;
  from.classList.remove('on');
  to.classList.add('on');
  to.animate([
    { transformOrigin: 'left', transform: `translateX(${a.left - b.left}px) scaleX(${a.width / b.width})` },
    { transformOrigin: 'left', transform: 'none' }
  ], { duration, easing: 'cubic-bezier(.65, 0, .25, 1)', pseudoElement: '::after' });
}

const fileOf = url => new URL(url, location.href).pathname.split('/').pop() || 'index.html';
let gliding = false;
document.addEventListener('click', e => {
  const link = e.target.closest('a[href$=".html"]');
  if (!link || link.target || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
  // already on that page, or already gliding: do nothing (no reload, no restart)
  if (gliding || fileOf(link.href) === fileOf(location.href)) { e.preventDefault(); return; }
  // the portrait glide only runs between home and about; other links open normally
  const dest = pageOf(link.href);
  if (!portrait || !dest) return;
  e.preventDefault();
  gliding = true;
  if (nav && nav.classList.contains('open')) menuBtn.click();   // close the phone menu first

  const duration = 450;
  const r = portrait.getBoundingClientRect();
  const to = portraitSpot(dest);
  // scale around the portrait's visible top-left corner (home shifts it left by half its width)
  const m = new DOMMatrix(getComputedStyle(portrait).transform);
  portrait.getAnimations().forEach(a => a.finish());
  portrait.style.transformOrigin = `${m.m41}px ${m.m42}px`;
  // fade the rest out. Done here, not in CSS, because the entrance
  // animations would otherwise hold their opacity and make them vanish at once
  leaving = [...portrait.parentElement.children]
    .filter(el => el !== portrait)
    .map(el => el.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -10px' }],
      { duration: duration * .55, easing: 'ease', fill: 'forwards' }));
  slideUnderline(dest, duration);
  const glide = portrait.animate([
    { translate: '0 0', scale: '1' },
    { translate: `${to.x - r.left}px ${to.y - r.top}px`, scale: `${to.h / r.height}` }
  ], { duration, easing: 'cubic-bezier(.65, 0, .25, 1)', fill: 'forwards' });
  glide.onfinish = () => {
    try { sessionStorage.setItem('glide', '1'); } catch (err) {}
    location.href = link.href;
  };
});

// arrived by a glide: the head script already skipped the portrait's entrance
try { sessionStorage.removeItem('glide'); } catch (err) {}

// coming back with the Back button restores the page as we left it; reset it
addEventListener('pageshow', e => {
  if (!e.persisted || !portrait) return;
  gliding = false;
  leaving.forEach(a => a.cancel());
  portrait.getAnimations().forEach(a => a.cancel());
  if (underlineFrom) {   // put the underline back on this page's tab
    nav.querySelector('a.on').classList.remove('on');
    underlineFrom.classList.add('on');
    underlineFrom = null;
  }
});
