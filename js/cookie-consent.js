(() => {
  const KEY   = 'cookie_consent_v1';
  const GA_ID = 'G-4RZS2TK0FB';

  const I18N = {
    en: { text: 'We use cookies for analytics (Google Analytics) to improve the website.', accept: 'Accept', decline: 'Decline' },
    fi: { text: 'Käytämme evästeitä analytiikkaan (Google Analytics) sivuston parantamiseksi.', accept: 'Hyväksy', decline: 'Hylkää' },
    ru: { text: 'Мы используем cookies для аналитики (Google Analytics), чтобы улучшать сайт.', accept: 'Принять', decline: 'Отказать' }
  };

  // ✅ “жвачка/червяк” баннера при скролле
  function setupBannerElasticity(banner) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return () => {};

    let lastY = window.scrollY || 0;
    let lastT = performance.now();
    let smooth = 0;
    let phase = 0;
    let rafId = null;

    const K = 1.15;
    const SMOOTHING = 0.07;
    const MAX = 1.35;

    function tick(t) {
      if (!banner || banner.hidden) return;

      const y = window.scrollY || 0;
      const dt = Math.max(16, t - lastT);
      const dy = y - lastY;

      const speed  = Math.abs(dy) / dt;
      const target = Math.min(MAX, speed * K);

      smooth += (target - smooth) * SMOOTHING;
      phase  += dt * (0.006 + smooth * 0.010);

      const wobbleX = Math.sin(phase) * (smooth * 4.6);
      const liftY   = -smooth * 2.6;
      const sx      = 1 + smooth * 0.11;
      const sy      = 1 - smooth * 0.055;

      banner.style.transform =
        `translate3d(${wobbleX.toFixed(2)}px, ${liftY.toFixed(2)}px, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;

      const base = 18;
      const a = base + smooth * 10;
      const b = base + smooth * 6;

      banner.style.borderRadius =
        `${a.toFixed(1)}px ${b.toFixed(1)}px ${a.toFixed(1)}px ${b.toFixed(1)}px / ` +
        `${b.toFixed(1)}px ${a.toFixed(1)}px ${b.toFixed(1)}px ${a.toFixed(1)}px`;

      lastY = y;
      lastT = t;

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    const stop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (banner) {
        banner.style.transform = 'translate3d(0,0,0) scale(1,1)';
        banner.style.borderRadius = '';
      }
    };

    window.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (!banner.hidden && !rafId) rafId = requestAnimationFrame(tick);
    });

    return stop;
  }

  // 🎈 Сердечки-шарики из кнопки
  function launchHeartsFromButton(btn) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !btn) return;

    const r  = btn.getBoundingClientRect();
    const x0 = r.left + r.width  / 2;
    const y0 = r.top  + r.height / 2;

    const layer = document.createElement('div');
    layer.className = 'cookie-hearts-layer';
    document.body.appendChild(layer);

    const N = 14;
    for (let i = 0; i < N; i++) {
      const gid = 'hp_' + Math.random().toString(36).slice(2, 9); // уникальный id градиента

      const el = document.createElement('span');
      el.className = 'cookie-heart-balloon';
      el.style.left = x0 + 'px';
      el.style.top  = y0 + 'px';

      // случайные параметры “полёта”
const dx   = (Math.random() * 110 - 55);     // -55..55px
const rise = (220 + Math.random() * 260);    // 220..480px вверх
const dur  = (1400 + Math.random() * 900);   // 1.4..2.3s (дольше = более balloon)
const sc   = (0.60 + Math.random() * 0.55);  // 0.60..1.15
const rot  = (Math.random() * 18 - 9);       // -9..9deg
const delay= Math.floor(Math.random() * 120);
const sway = (8 + Math.random() * 18);       // 8..26px
const wind = (Math.random() * 100 - 70);

// ✅ заранее считаем “ступени”, чтобы в CSS НЕ было умножения
const x1 = dx * 0.70;
const x2 = dx * 0.90;
const y1 = -rise * 0.78;
const y2 = -rise * 0.93;
const y3 = -rise;

const s0 = sc * 0.72;   // старт чуть меньше
const s1 = sc;          // основной
const s2 = sc * 1.06;   // чуть больше наверху

el.style.setProperty('--dur',   `${dur.toFixed(0)}ms`);
el.style.setProperty('--delay', `${delay}ms`);
el.style.setProperty('--rot',   `${rot.toFixed(1)}deg`);

el.style.setProperty('--x1', `${x1.toFixed(1)}px`);
el.style.setProperty('--x2', `${x2.toFixed(1)}px`);
el.style.setProperty('--x3', `${dx.toFixed(1)}px`);

el.style.setProperty('--y1', `${y1.toFixed(1)}px`);
el.style.setProperty('--y2', `${y2.toFixed(1)}px`);
el.style.setProperty('--y3', `${y3.toFixed(1)}px`);

el.style.setProperty('--s0', s0.toFixed(3));
el.style.setProperty('--s1', s1.toFixed(3));
el.style.setProperty('--s2', s2.toFixed(3));

el.style.setProperty('--sway', `${sway.toFixed(1)}px`);
el.style.setProperty('--wind', `${wind.toFixed(1)}px`);

      el.innerHTML = `
        <svg viewBox="0 0 64 64" class="cookie-heart-svg" aria-hidden="true">
          <defs>
            <linearGradient id="${gid}" x1="10" y1="6" x2="54" y2="58">
              <stop offset="0"   stop-color="rgba(255,255,255,0.70)"/>
              <stop offset="0.35" stop-color="rgba(255,204,226,0.92)"/>
              <stop offset="1"   stop-color="rgba(255,105,180,0.82)"/>
            </linearGradient>
          </defs>
          <path
            d="M32 55s-18-10.8-24.3-22.6C2.7 22.5 8.2 12 18.8 12c5 0 9.2 2.7 11.2 6
               2-3.3 6.2-6 11.2-6C51.8 12 57.3 22.5 56.3 32.4 50 44.2 32 55 32 55z"
            fill="url(#${gid})"/>
          <path
            d="M20.5 20.5c3.4-4.5 9.5-5.2 12.4-2.6"
            stroke="rgba(255,255,255,0.62)"
            stroke-width="2.2"
            stroke-linecap="round"/>
        </svg>
      `;

      layer.appendChild(el);
      setTimeout(() => el.remove(), dur + delay + 120);
    }

    setTimeout(() => layer.remove(), 2300);
  }

  function loadGA() {
    if (window.__ga_loaded) return;
    window.__ga_loaded = true;

    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function initCookieBanner() {
    const lang = (document.documentElement.lang || 'en').toLowerCase();
    const t = I18N[lang] || I18N.en;

    const banner     = document.getElementById('cookieBanner');
    const textEl     = document.getElementById('cookieText');
    const acceptBtn  = document.getElementById('cookieAccept');
    const declineBtn = document.getElementById('cookieDecline');

    if (!banner || !acceptBtn || !declineBtn) return;

    const saved = localStorage.getItem(KEY);

    if (saved === 'yes') { loadGA(); banner.hidden = true; return; }
    if (saved === 'no')  { banner.hidden = true; return; }

    if (textEl) textEl.textContent = t.text;
    acceptBtn.textContent = t.accept;
    declineBtn.textContent = t.decline;

    banner.hidden = false;
    banner.classList.remove('is-visible');
    requestAnimationFrame(() => banner.classList.add('is-visible'));

    const stopElastic = setupBannerElasticity(banner);

    acceptBtn.addEventListener('click', () => {
      // 🎈 сначала запускаем сердечки (пока кнопка на месте)
      launchHeartsFromButton(acceptBtn);

      // дальше логика
      localStorage.setItem(KEY, 'yes');

      banner.classList.remove('is-visible');
      setTimeout(() => {
        banner.hidden = true;
        stopElastic();
        loadGA();
      }, 120);
    }, { once: true });

    declineBtn.addEventListener('click', () => {
      localStorage.setItem(KEY, 'no');
      banner.hidden = true;
      stopElastic();
    }, { once: true });
  }

  // удобная кнопка для теста в консоли:
  window.__cookieReset = () => {
    localStorage.removeItem(KEY);
    location.reload();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieBanner);
  } else {
    initCookieBanner();
  }
})();