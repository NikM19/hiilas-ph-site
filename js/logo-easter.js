(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Лого-ссылка (обёртка)
  const logoLink = document.querySelector('.brand a');
  if (!logoLink) return;

  // --- ЭФФЕКТЫ (вспышка + звёздочки) ---

  function triggerEffect(x, y) {
    if (reduce) {
      // Мягкий пульс вместо салюта
      try {
        logoLink.animate(
          [
            { filter: 'brightness(1)' },
            { filter: 'brightness(1.35)' },
            { filter: 'brightness(1)' }
          ],
          { duration: 400, easing: 'ease-out' }
        );
      } catch (_) {}
      return;
    }

    const rect = logoLink.getBoundingClientRect();
    const cx = x ?? (rect.left + rect.width / 2);
    const cy = y ?? (rect.top + rect.height / 2);

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

  // --- ОДИН / ДВОЙНОЙ КЛИК (desktop) ---

  let clickTimer = null;
  const DOUBLE_DELAY = 260; // мс — окно для "двойного клика"

  // --- LONG PRESS для тача (mobile/tablet) ---

  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const LONG_MS = 600; // сколько держать палец
  let longTimer = null;
  let didLongTouch = false;

  if (hasTouch) {
    logoLink.addEventListener(
      'touchstart',
      function (e) {
        if (longTimer) clearTimeout(longTimer);

        const t = e.touches[0] || e.changedTouches[0];
        const startX = t.clientX + window.scrollX;
        const startY = t.clientY + window.scrollY;

        longTimer = setTimeout(function () {
          longTimer = null;
          didLongTouch = true;
          triggerEffect(startX, startY);
        }, LONG_MS);
      },
      { passive: true }
    );

    const cancelLong = () => {
      if (longTimer) {
        clearTimeout(longTimer);
        longTimer = null;
      }
    };

    logoLink.addEventListener('touchend', cancelLong);
    logoLink.addEventListener('touchcancel', cancelLong);
  }

  // --- Общий click (и для мыши, и после тача) ---

  logoLink.addEventListener('click', function (e) {
    e.preventDefault();

    const pageX = e.clientX + window.scrollX;
    const pageY = e.clientY + window.scrollY;

    // 1) Если только что был long press на таче — НИЧЕГО не делаем
    if (didLongTouch) {
      didLongTouch = false;
      return;
    }

    // 2) Если уже ждём второй клик — значит это второй → двойной
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;

      // ДВОЙНОЙ КЛИК: только пасхалка, без перехода
      triggerEffect(
        pageX || window.innerWidth / 2,
        pageY || window.innerHeight / 2
      );
      return;
    }

    // 3) Первый клик: ждём чуть-чуть — вдруг будет второй
    clickTimer = setTimeout(function () {
      clickTimer = null;
      // Если второго клика не было → обычный переход на главную
      window.location.href = logoLink.href;
    }, DOUBLE_DELAY);
  });
})();