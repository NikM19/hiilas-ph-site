(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heart = document.getElementById('contact-heart');
  if (!heart) return;

  // Двойной клик (десктоп)
  heart.addEventListener('dblclick', () => { if (!reduce) heartRain(); });

  // Двойной тап (мобайл fallback)
  let lastTap = 0;
  heart.addEventListener('touchend', function(){
    const now = Date.now();
    if (now - lastTap < 300) { if (!reduce) heartRain(); }
    lastTap = now;
  }, {passive: true});

  // Клавиатура: Enter или Space
  heart.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!reduce) heartRain(); }
  });

  function heartRain(){
    const N = 26; // сколько сердечек за «дождь»
    for (let i = 0; i < N; i++){
      const el = document.createElement('div');
      el.className = 'heart-drop';
      el.textContent = '❤';
      el.style.left = (Math.random() * 100) + 'vw';
      el.style.fontSize = (14 + Math.random() * 22) + 'px';
      el.style.animationDuration = (1.8 + Math.random() * 1.6) + 's';
      el.style.animationDelay = (Math.random() * 0.6) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3500); // уборка
    }
  }
})()