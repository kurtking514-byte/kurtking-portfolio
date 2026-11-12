// Achievements: each award shows its main photo on the page.
// Clicking it opens it big; Prev / Next / arrow keys go through that award's photos, Esc or Close goes back.
const viewer = document.querySelector('.viewer');

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
