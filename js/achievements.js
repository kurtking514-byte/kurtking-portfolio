// Achievements: every card shows one photo at a time, and all cards change together every 4.5s.
// Hovering a card keeps it still.
// Clicking a photo opens it big; Prev / Next / arrow keys go through that award's photos.
const viewer = document.querySelector('.viewer');
const STEP = 4500;
const cards = [];

document.querySelectorAll('.award').forEach(award => {
  const shots = [...award.querySelectorAll('.shot')];
  if (shots.length < 2) return;
  const box = award.querySelector('.shots');
  const dots = document.createElement('div');
  dots.className = 'dots';
  dots.append(...shots.map((s, i) => { const d = document.createElement('i'); if (!i) d.className = 'on'; return d; }));
  const card = { at: 0, paused: false };
  card.set = i => {
    shots[card.at].classList.remove('on'); dots.children[card.at].classList.remove('on');
    card.at = (i + shots.length) % shots.length;
    shots[card.at].classList.add('on'); dots.children[card.at].classList.add('on');
  };
  box.append(dots);
  box.addEventListener('mouseenter', () => card.paused = true);
  box.addEventListener('mouseleave', () => card.paused = false);
  cards.push(card);
});

// one clock for the whole page, so every card changes at the same moment
setInterval(() => {
  if (document.hidden || (viewer && viewer.open)) return;
  cards.forEach(c => { if (!c.paused) c.set(c.at + 1); });
}, STEP);

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
