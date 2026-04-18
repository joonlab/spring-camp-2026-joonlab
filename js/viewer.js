(function () {
  const TOTAL = (window.SLIDES && window.SLIDES.length) || 29;
  const IDLE_MS = 3000;

  const iframe = document.getElementById('deckFrame');
  const overlayTop = document.getElementById('overlayTop');
  const overlayBottom = document.getElementById('overlayBottom');
  const counterEl = document.getElementById('counter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const fsBtn = document.getElementById('fsBtn');
  const loadingEl = document.getElementById('loading');

  const pad = (n) => String(n).padStart(2, '0');

  function parseInitialSlide() {
    const params = new URLSearchParams(window.location.search);
    const qs = parseInt(params.get('slide'), 10);
    if (!isNaN(qs) && qs >= 1 && qs <= TOTAL) return qs;
    const hash = window.location.hash.match(/slide-(\d+)/);
    if (hash) {
      const n = parseInt(hash[1], 10);
      if (n >= 1 && n <= TOTAL) return n;
    }
    return 1;
  }

  let current = parseInitialSlide();
  let deckReady = false;

  function updateCounter(n) {
    current = n;
    counterEl.innerHTML = `${pad(n)}<span class="sep">/</span>${pad(TOTAL)}`;
    prevBtn.toggleAttribute('disabled', n <= 1);
    nextBtn.toggleAttribute('disabled', n >= TOTAL);
    const url = new URL(window.location.href);
    url.searchParams.set('slide', String(n));
    window.history.replaceState(null, '', url.toString());
  }

  function getDeckStage() {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return null;
      return doc.querySelector('deck-stage');
    } catch (e) {
      return null;
    }
  }

  function jumpTo(n) {
    const clamped = Math.max(1, Math.min(TOTAL, n));
    const stage = getDeckStage();
    if (stage && typeof stage.goTo === 'function') {
      stage.goTo(clamped - 1);
      updateCounter(clamped);
      return;
    }
    if (stage) {
      const currentIdx = typeof stage.index === 'number' ? stage.index : 0;
      const diff = (clamped - 1) - currentIdx;
      const steps = Math.abs(diff);
      for (let i = 0; i < steps; i++) {
        if (diff > 0) stage.next(); else stage.prev();
      }
      updateCounter(clamped);
    }
  }

  function nextSlide() {
    if (current < TOTAL) jumpTo(current + 1);
  }

  function prevSlide() {
    if (current > 1) jumpTo(current - 1);
  }

  let idleTimer = null;
  function showOverlay() {
    overlayTop.setAttribute('data-hidden', 'false');
    overlayBottom.setAttribute('data-hidden', 'false');
    overlayTop.removeAttribute('data-hidden');
    overlayBottom.removeAttribute('data-hidden');
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      overlayTop.setAttribute('data-hidden', 'true');
      overlayBottom.setAttribute('data-hidden', 'true');
    }, IDLE_MS);
  }

  ['mousemove', 'touchstart', 'touchmove', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, showOverlay, { passive: true });
  });

  function bindStage(stage) {
    const target = current;
    // 리스너를 sync보다 먼저 붙여야 slidechange init 이벤트를 놓치지 않음
    let locked = true;
    setTimeout(() => { locked = false; }, 1200);
    try {
      stage.addEventListener('slidechange', (e) => {
        const d = e.detail || {};
        const idx = typeof d.index === 'number' ? d.index : null;
        if (idx === null) return;
        if (locked && idx !== target - 1) {
          stage.goTo(target - 1);
          updateCounter(target);
          return;
        }
        updateCounter(idx + 1);
      });
    } catch (e) {}

    const sync = () => {
      if (stage.index !== target - 1) stage.goTo(target - 1);
      updateCounter(target);
    };
    const waitReady = () => {
      if (stage._slides && stage._slides.length) { sync(); return; }
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (stage._slides && stage._slides.length) {
          clearInterval(poll);
          sync();
        } else if (tries > 40) {
          clearInterval(poll);
        }
      }, 50);
    };
    waitReady();
    // 보험: 로드 중 비동기 갱신이 덮어쓰는 경우를 대비해 반복 확인
    setTimeout(sync, 200);
    setTimeout(sync, 600);
    setTimeout(sync, 1200);
  }

  // iframe이 로드되기 전에 deck 페이지의 localStorage에 원하는 슬라이드를
  // 심어둔다. deck-stage._restoreIndex()가 이 값을 읽어 초기 슬라이드로 사용.
  try {
    const deckPath = new URL(iframe.src, window.location.href).pathname;
    const key = 'deck-stage:slide:' + deckPath;
    window.localStorage.setItem(key, String(current - 1));
  } catch (e) {}

  iframe.addEventListener('load', () => {
    deckReady = true;
    if (loadingEl) loadingEl.setAttribute('data-done', 'true');
    setTimeout(() => { if (loadingEl) loadingEl.remove(); }, 400);

    let tries = 0;
    const findStage = setInterval(() => {
      tries++;
      const s = getDeckStage();
      if (s) {
        clearInterval(findStage);
        bindStage(s);
      } else if (tries > 60) {
        clearInterval(findStage);
      }
    }, 50);
    showOverlay();
  });

  window.addEventListener('message', (e) => {
    const data = e.data;
    if (data && typeof data === 'object' && typeof data.slideIndexChanged === 'number') {
      updateCounter(data.slideIndexChanged + 1);
    }
  });

  prevBtn.addEventListener('click', (e) => { e.preventDefault(); prevSlide(); });
  nextBtn.addEventListener('click', (e) => { e.preventDefault(); nextSlide(); });

  fsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const doc = document;
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      const el = doc.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
    } else {
      (doc.exitFullscreen || doc.webkitExitFullscreen || (() => {})).call(doc);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape') {
      window.location.href = 'index.html';
    } else if (e.key === 'f' || e.key === 'F') {
      fsBtn.click();
    } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prevSlide();
    }
  });

  updateCounter(current);
  showOverlay();
})();
