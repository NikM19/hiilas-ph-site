(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Берём сам логотип (картинку). Если её нет — берём ссылку-обёртку.
  const logo = document.querySelector('.brand .site-logo') || document.querySelector('.brand a');
  if (!logo) return;

  const HOLD_MS = 600;          // сколько держать для срабатывания
  let holdTimer = null;
  let keyTimer = null;
  let pressing = false;
  let didLong = false;

  function triggerEffect() {
    if (reduce) {
      // Мягкий пульс вместо эффектов
      try {
        logo.animate(
          [{ filter: 'brightness(1)' }, { filter: 'brightness(1.35)' }, { filter: 'brightness(1)' }],
          { duration: 400, easing: 'ease-out' }
        );
      } catch (_) {}
      return;
    }

    const rect = logo.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;  // fixed-позиционирование использует viewport, scroll не нужен

    sparkleBurst(cx, cy);
    flashOverlay();
  }

  function sparkleBurst(x, y) {
    const N = 22; // количество звёзд
    for (let i = 0; i < N; i++) {
      const el = document.createElement('div');
      el.className = 'sparkle';
      el.textContent = Math.random() < 0.5 ? '✦' : '✧';

      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 140;

      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      el.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      el.style.setProperty('--rot', (Math.random() * 90 - 45) + 'deg');
      el.style.setProperty('--rotEnd', (Math.random() * 180 - 90) + 'deg');
      el.style.setProperty('--fs', (14 + Math.random() * 20) + 'px');

      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    }
  }

  function flashOverlay() {
    const f = document.createElement('div');
    f.className = 'flash-overlay';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 520);
  }

  // ---- Pointer (мышь/тач/перо) длинное нажатие ----
  const onDown = () => {
    pressing = true;
    didLong = false;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => { didLong = true; triggerEffect(); }, HOLD_MS);
  };
  const onUpCancel = (e) => {
    pressing = false;
    clearTimeout(holdTimer);
    // Если был «лонг-тап» по ссылке — отменим одноразово переход
    if (didLong) {
      const a = logo.closest('a');
      if (a && e && typeof e.preventDefault === 'function') e.preventDefault();
      didLong = false;
    }
  };

  logo.addEventListener('pointerdown', onDown, { passive: true });
  logo.addEventListener('pointerup', onUpCancel);
  logo.addEventListener('pointercancel', onUpCancel);

  // На таче во время удержания подавим контекст-меню
  logo.addEventListener('contextmenu', (e) => { if (pressing) e.preventDefault(); });

  // ---- Клавиатура: удержание Enter/Space ----
  // (у тебя логотип внутри <a>, он уже фокусируемый)
  logo.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(keyTimer);
      keyTimer = setTimeout(() => triggerEffect(), HOLD_MS);
    }
  });
  logo.addEventListener('keyup', () => { clearTimeout(keyTimer); });
  
  // На всякий случай отменим переход при клике, если сработал лонг-пресс
  const anchor = logo.closest('a');
  if (anchor) {
    anchor.addEventListener('click', function (e) {
      if (didLong) { e.preventDefault(); didLong = false; }
    });
  }
})();