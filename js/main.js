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

// age on the About page, worked out from the birthday so it stays right every year
function setAge() {
  const ageEl = document.querySelector('[data-born]');
  if (!ageEl) return;
  const born = new Date(ageEl.dataset.born + 'T00:00'), now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) age--;
  ageEl.textContent = age;
}
setAge();

// light / dark switch (remembered between visits)
const themeBtn = document.querySelector('.theme-btn');
const root = document.documentElement;
const isDark = () => root.dataset.theme === 'dark';   // light unless the visitor picked dark

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

// portrait glide between Home and About.
// The text fades out while the portrait slides to exactly where the other page
// draws it. Then the other page's content is swapped in without loading a new
// page, so even a slow browser shows no pause between the two.
let portrait = document.querySelector('.portrait, .about-portrait');
const RATIO = 1054 / 1500;   // portrait.webp width / height

// Where each page draws the portrait (viewport coords). Keep in sync with style.css.
function portraitSpot(page) {
  const W = document.body.clientWidth, H = innerHeight;   // body: excludes the reserved scrollbar space
  const stacked = W <= 860 || W / H <= 1;        // the phone / tablet layout
  const pad = Math.min(Math.max(16, W * .03), 44);
  let h, x, y;
  if (page === 'about') {
    if (stacked) { h = Math.min(H * .58, 560); x = (W - h * RATIO) / 2; y = 96; }
    else { h = Math.min(H * .88, W * .54, (W - 600 - 2 * pad - W * .045) / RATIO); x = pad; y = H - h; }
  } else {
    if (stacked) { h = Math.min(H * .6, 640); x = (W - h * RATIO) / 2; y = 96; }
    else { h = H * .92; x = W * .66 - h * RATIO / 2; y = H - h; }
  }
  return { x, y: y - scrollY, h };
}

// page name from a url: "about.html", "/about" (Cloudflare drops .html) and "/" all work
const fileOf = url => new URL(url, location.href).pathname.split('/').pop().replace(/\.html$/, '') || 'index';

function pageOf(url) {
  const name = fileOf(url);
  return name === 'index' ? 'home' : name === 'about' ? 'about' : null;
}

// the address the live site really uses: Cloudflare redirects "about.html" to "/about"
// (and "index.html" to "/"), so going straight there skips a slow extra round trip
const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
const realUrl = url => isLocal ? url : url.replace(/index\.html$/, '').replace(/\.html$/, '');
const urlOf = page => realUrl(new URL(page === 'home' ? 'index.html' : 'about.html', location.href).href);

// slide the nav underline from this page's tab to the next one, in time with the glide
function slideUnderline(dest, duration) {
  if (!nav || getComputedStyle(menuBtn).display !== 'none') return;   // phone menu: nothing to slide
  const from = nav.querySelector('a.on');
  const to = [...nav.querySelectorAll('a')].find(a => pageOf(a.href) === dest);
  if (!from || !to || from === to) return;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  from.classList.remove('on');
  to.classList.add('on');
  to.animate([
    { transformOrigin: 'left', transform: `translateX(${a.left - b.left}px) scaleX(${a.width / b.width})` },
    { transformOrigin: 'left', transform: 'none' }
  ], { duration, easing: 'cubic-bezier(.65, 0, .25, 1)', pseudoElement: '::after' });
}

// the other page, fetched once and kept, with its photo decoded ahead of time
const loaded = {};
function load(url) {
  if (!loaded[url]) {
    loaded[url] = fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(async html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const img = doc.querySelector('main img');
        if (img) {
          const pre = new Image();
          pre.src = new URL(img.getAttribute('src'), url).href;
          await pre.decode().catch(() => {});
        }
        return doc;
      })
      .catch(err => { delete loaded[url]; throw err; });
  }
  return loaded[url];
}

// put the other page's content in place of this one's (no page load)
function swapIn(url, doc) {
  root.classList.add('vt');   // arriving by a glide: the portrait is already in place
  document.title = doc.title;
  const desc = document.querySelector('meta[name="description"]');
  const newDesc = doc.querySelector('meta[name="description"]');
  if (desc && newDesc) desc.content = newDesc.content;
  document.body.className = doc.body.className;
  nav.querySelectorAll('a').forEach(a => {
    const on = fileOf(a.href) === fileOf(url);
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.querySelector('main').replaceWith(document.importNode(doc.querySelector('main'), true));
  portrait = document.querySelector('.portrait, .about-portrait');
  setAge();
  scrollTo(0, 0);
}

let gliding = false;
async function glideTo(dest, push) {
  const url = urlOf(dest);
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
  [...portrait.parentElement.children]
    .filter(el => el !== portrait)
    .forEach(el => el.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -10px' }],
      { duration: duration * .55, easing: 'ease', fill: 'forwards' }));
  slideUnderline(dest, duration);
  const glide = portrait.animate([
    { translate: '0 0', scale: '1' },
    { translate: `${to.x - r.left}px ${to.y - r.top}px`, scale: `${to.h / r.height}` }
  ], { duration, easing: 'cubic-bezier(.65, 0, .25, 1)', fill: 'forwards' });

  try {
    const [doc] = await Promise.all([load(url), glide.finished]);
    swapIn(url, doc);
    if (push) history.pushState(null, '', url);
  } catch (err) {
    location.href = url;   // could not fetch it: open the page the normal way
    return;
  }
  gliding = false;
  load(urlOf(dest === 'home' ? 'about' : 'home'));   // get the next one ready
}

// get the other page ready as soon as this one opens
if (portrait) load(urlOf(pageOf(location.href) === 'home' ? 'about' : 'home'));

document.addEventListener('click', e => {
  const link = e.target.closest('a[href$=".html"]');
  if (!link || link.target || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
  // already on that page, or already gliding: do nothing (no reload, no restart)
  if (gliding || fileOf(link.href) === fileOf(location.href)) { e.preventDefault(); return; }
  // the portrait glide only runs between home and about; other links open normally
  const dest = pageOf(link.href);
  if (!portrait || !dest) return;
  e.preventDefault();
  glideTo(dest, true);
});

// Back / Forward between Home and About: glide there too
addEventListener('popstate', () => {
  const dest = pageOf(location.href);
  const shown = document.body.classList.contains('about') ? 'about' : 'home';
  if (!portrait || !dest || dest === shown) return;
  if (gliding) { location.reload(); return; }
  glideTo(dest, false);
});

// coming back from another page with the Back button: make sure clicks work again
addEventListener('pageshow', e => { if (e.persisted) gliding = false; });
