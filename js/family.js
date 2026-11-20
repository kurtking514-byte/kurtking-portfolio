// Family & Friends: clicking a photo opens it in a small window, not full screen.
// Close with the button, Esc, or a click outside the photo.
const view = document.querySelector('.fam-view');
if (view) {
  const big = view.querySelector('img');
  const who = view.querySelector('.fv-who');
  const note = view.querySelector('.fv-note');
  let opener = null;
  const open = img => {
    const card = img.closest('.fam-card');
    big.src = img.dataset.full;
    big.alt = img.alt;
    who.textContent = card.querySelector('.who').textContent;
    note.textContent = card.querySelector('figcaption').textContent;
    opener = img;
    view.showModal();
  };
  document.querySelectorAll('.fam-card img').forEach(img => {
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
  });
  view.querySelector('.fv-close').addEventListener('click', () => view.close());
  view.addEventListener('click', e => { if (e.target === view) view.close(); });
  view.addEventListener('close', () => opener && opener.focus());
}
