(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  form.addEventListener('submit', (e) => {
    // Если у тебя появится реальная отправка — убери preventDefault
    if (form.checkValidity()) {
      if (!reduce) burstFromButton();
      e.preventDefault();
    }
  });

  function burstFromButton() {
    const btn = form.querySelector('.contact-submit input[type="submit"]');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const N = 24;

    for (let i = 0; i < N; i++) {
      const el = document.createElement('span');
      el.className = 'heart-cf';
      el.textContent = '❤';

      const angle = (i / N) * Math.PI * 2;
      const dist = 40 + Math.random() * 60;

      el.style.left = cx + 'px';
      el.style.top = cy + 'px';
      el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      el.style.setProperty('--dy', Math.sin(angle) * dist - (80 + Math.random() * 80) + 'px');
      el.style.fontSize = (14 + Math.random() * 16) + 'px';
      el.style.animationDuration = (700 + Math.random() * 500) + 'ms';

      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
  }
})();