(() => {
  const KEY = 'cookie_consent_v1';
  const GA_ID = 'G-4RZS2TK0FB';

  const I18N = {
    en: {
      text: 'We use cookies for analytics (Google Analytics) to improve the website.',
      accept: 'Accept',
      decline: 'Decline',
    },
    fi: {
      text: 'Käytämme evästeitä analytiikkaan (Google Analytics) sivuston parantamiseksi.',
      accept: 'Hyväksy',
      decline: 'Hylkää',
    },
    ru: {
      text: 'Мы используем cookies для аналитики (Google Analytics), чтобы улучшать сайт.',
      accept: 'Принять',
      decline: 'Отказать',
    }
  };

  // ✅ ВСТАВЛЕНО: функция “жвачки/червяка”
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

      const speed = Math.abs(dy) / dt;
      const target = Math.min(MAX, speed * K);

      smooth += (target - smooth) * SMOOTHING;
      phase += dt * (0.006 + smooth * 0.010);

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

    const banner = document.getElementById('cookieBanner');
    const textEl = document.getElementById('cookieText');
    const acceptBtn = document.getElementById('cookieAccept');
    const declineBtn = document.getElementById('cookieDecline');

    if (!banner || !acceptBtn || !declineBtn) {
      console.warn('[cookie] Banner elements not found', { banner, textEl, acceptBtn, declineBtn });
      return;
    }

    const saved = localStorage.getItem(KEY);

    if (saved === 'yes') { loadGA(); banner.hidden = true; return; }
    if (saved === 'no')  { banner.hidden = true; return; }

    if (textEl) textEl.textContent = t.text;
    acceptBtn.textContent = t.accept;
    declineBtn.textContent = t.decline;

    banner.hidden = false;

    // ✅ запускаем анимацию и получаем stop()
    const stopElastic = setupBannerElasticity(banner);

    acceptBtn.addEventListener('click', () => {
      localStorage.setItem(KEY, 'yes');
      banner.hidden = true;
      stopElastic();
      loadGA();
    }, { once: true });

    declineBtn.addEventListener('click', () => {
      localStorage.setItem(KEY, 'no');
      banner.hidden = true;
      stopElastic();
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieBanner);
  } else {
    initCookieBanner();
  }
})();