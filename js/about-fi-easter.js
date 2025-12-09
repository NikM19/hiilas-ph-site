document.addEventListener('DOMContentLoaded', function () {
  var sig = document.getElementById('aboutfi-signature');
  if (!sig) return;

  var strip = document.getElementById('aboutfi-secret-strip');
  if (!strip) return;

  function toggleStrip() {
    var isOpen = strip.classList.toggle('is-open');
    sig.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    strip.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  }

  // Клик по подписи
  sig.addEventListener('click', function () {
    toggleStrip();
  });

  // Клавиатура: Enter / Space
  sig.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleStrip();
    }
  });
});