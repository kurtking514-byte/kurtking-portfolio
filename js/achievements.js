// Achievements: "See proof" shows all of that award's photos at once.
// Click one to see it big; Prev / Next / arrow keys go through them, "All photos" or Esc goes back.
const viewer = document.querySelector('.viewer');

if (viewer) {
  const grid = viewer.querySelector('.v-grid');
  const img = viewer.querySelector('.v-single img');
  const cap = viewer.querySelector('.v-cap');
  const title = viewer.querySelector('.v-title');
  const note = viewer.querySelector('.v-note');
  const prev = viewer.querySelector('.v-prev');
  const next = viewer.querySelector('.v-next');
  let shots = [], at = 0, opener = null;

  const single = () => viewer.dataset.mode === 'one';

  function showAll() {
    viewer.dataset.mode = 'all';
    const tile = grid.children[at];
    if (tile) tile.focus();
  }

  function showOne(i) {
    at = (i + shots.length) % shots.length;
    const s = shots[at];
    img.src = s.dataset.full;
    img.alt = s.querySelector('img').alt;
    cap.textContent = s.dataset.caption || img.alt;
    if (!single()) {
      viewer.dataset.mode = 'one';
      viewer.querySelector('.v-back').focus();   // keep focus inside the viewer so the keys work
    }
  }

  document.querySelectorAll('.proof').forEach(btn => btn.addEventListener('click', () => {
    const award = btn.closest('.award');
    shots = [...award.querySelectorAll('.shot')];
    title.textContent = award.querySelector('h2').textContent;
    note.textContent = award.dataset.note || '';
    grid.dataset.count = shots.length;
    grid.replaceChildren(...shots.map((s, i) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'v-tile';
      const t = s.querySelector('img').cloneNode();
      t.loading = 'eager';
      tile.append(t, s.querySelector('span').cloneNode(true));
      tile.addEventListener('click', () => showOne(i));
      return tile;
    }));
    prev.hidden = next.hidden = shots.length < 2;
    opener = btn;
    at = 0;
    viewer.dataset.mode = 'all';
    viewer.showModal();
    grid.firstChild.focus();
  }));

  prev.addEventListener('click', () => showOne(at - 1));
  next.addEventListener('click', () => showOne(at + 1));
  viewer.querySelector('.v-back').addEventListener('click', showAll);
  viewer.querySelector('.v-close').addEventListener('click', () => viewer.close());
  // Esc on a single photo goes back to all of them, not out of the viewer
  viewer.addEventListener('cancel', e => { if (single()) { e.preventDefault(); showAll(); } });
  // clicking the dark area closes it
  viewer.addEventListener('click', e => { if (e.target === viewer || e.target === grid) viewer.close(); });
  document.addEventListener('keydown', e => {
    if (!viewer.open || !single()) return;
    if (e.key === 'Escape') { e.preventDefault(); showAll(); }
    if (e.key === 'ArrowLeft') showOne(at - 1);
    if (e.key === 'ArrowRight') showOne(at + 1);
  });
  viewer.addEventListener('close', () => opener && opener.focus());
}
