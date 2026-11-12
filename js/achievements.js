// Achievements: each card slowly cycles through its photos (one every 4.5s, cards staggered so they don't all change at once).
// The small arrows on a card step through its photos by hand. Hovering pauses it.
// Clicking a photo opens it big; Prev / Next / arrow keys go through that award's photos.
const viewer = document.querySelector('.viewer');
const STEP = 4500;

document.querySelectorAll('.award').forEach((award, n) => {
  const shots = [...award.querySelectorAll('.shot')];
  if (shots.length < 2) return;
  const box = award.querySelector('.shots');
  const dots = document.createElement('div');
  dots.className = 'dots';
  dots.append(...shots.map((s, i) => { const d = document.createElement('i'); if (!i) d.className = 'on'; return d; }));
  const arrow = (cls, label, text, by) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'arrow-btn ' + cls; b.textContent = text;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => { set(at + by); restart(); });
    return b;
  };
  box.append(dots, arrow('prev', 'Previous photo', '‹', -1), arrow('next', 'Next photo', '›', 1));

  let at = 0, paused = false, timer = null;
  function set(i) {
    shots[at].classList.remove('on'); dots.children[at].classList.remove('on');
    at = (i + shots.length) % shots.length;
    shots[at].classList.add('on'); dots.children[at].classList.add('on');
  }
  const tick = () => { if (!paused && !document.hidden && !(viewer && viewer.open)) set(at + 1); };
  const restart = () => { clearInterval(timer); timer = setInterval(tick, STEP); };
  box.addEventListener('mouseenter', () => paused = true);
  box.addEventListener('mouseleave', () => paused = false);
  setTimeout(() => { tick(); restart(); }, 2500 + n * 550);
});

if (viewer) {
  const img = viewer.querySelector('.v-single img');
  const cap = viewer.querySelector('.v-cap');
  const title = viewer.querySelector('.v-title');
  const note = viewer.querySelector('.v-note');
  const prev = viewer.querySelector('.v-prev');
  const next = viewer.querySelector('.v-next');
  let shots = [], at = 0, opener = null;

  function show(i) {
    at = (i + shots.length) % shots.length;
    const s = shots[at];
    img.src = s.dataset.full;
    img.alt = s.querySelector('img').alt;
    cap.textContent = s.dataset.caption || img.alt;
  }

  document.querySelectorAll('.shot').forEach(btn => btn.addEventListener('click', () => {
    const award = btn.closest('.award');
    shots = [...award.querySelectorAll('.shot')];
    title.textContent = award.dataset.title;
    note.textContent = award.dataset.note || '';
    prev.hidden = next.hidden = shots.length < 2;
    opener = btn;
    show(shots.indexOf(btn));
    viewer.showModal();
    viewer.querySelector('.v-close').focus();
  }));

  prev.addEventListener('click', () => show(at - 1));
  next.addEventListener('click', () => show(at + 1));
  viewer.querySelector('.v-close').addEventListener('click', () => viewer.close());
  // clicking the dark area closes it
  viewer.addEventListener('click', e => { if (e.target === viewer || e.target.tagName === 'FIGURE') viewer.close(); });
  document.addEventListener('keydown', e => {
    if (!viewer.open) return;
    if (e.key === 'ArrowLeft') show(at - 1);
    if (e.key === 'ArrowRight') show(at + 1);
  });
  viewer.addEventListener('close', () => opener && opener.focus());
}
