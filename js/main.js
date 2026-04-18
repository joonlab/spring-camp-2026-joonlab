(function () {
  const grid = document.getElementById('slideGrid');
  if (!grid) return;

  const pad = (n) => String(n).padStart(2, '0');

  const cards = window.SLIDES.map((s) => {
    const href = `viewer.html?slide=${s.n}`;
    const thumb = `thumbnails/slide-${pad(s.n)}.png`;
    return `
      <a class="card" href="${href}" aria-label="Slide ${pad(s.n)} — ${s.label}">
        <div class="card-thumb">
          <div class="card-thumb-fallback" aria-hidden="true">${pad(s.n)}</div>
          <img src="${thumb}" alt="" loading="lazy" onload="this.previousElementSibling.style.display='none'" onerror="this.style.display='none'">
        </div>
        <div class="card-body">
          <span class="card-num">${pad(s.n)}</span>
          <span class="card-label">${s.label}</span>
        </div>
      </a>
    `;
  }).join('');

  grid.innerHTML = cards;

  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.matches('input, textarea, select'))) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key;
    if (/^[1-9]$/.test(key)) {
      const n = parseInt(key, 10);
      if (n >= 1 && n <= window.SLIDES.length) {
        window.location.href = `viewer.html?slide=${n}`;
      }
    }
  });
})();
