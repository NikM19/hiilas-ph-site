// js/loader.js (надёжная версия)
(function () {
  var isDev = location.protocol === 'file:' || /localhost/.test(location.host);
  var v = isDev ? Date.now() : '1'; // на проде меняй '1' при релизах

  function inject() {
    // 1) Уже вставлен через <script id="custom-js"> ?
    if (document.getElementById('custom-js')) return;

    // 2) Уже есть любой <script> с путём на custom.js (учтём параметр ?v=...)
    var already = Array.prototype.some.call(document.scripts, function (s) {
      if (!s.src) return false;
      try {
        var p = new URL(s.src, location.href).pathname.replace(/\/+$/, '');
        return p.endsWith('/js/custom.js');
      } catch (e) {
        return /\/js\/custom\.js(\?|$)/.test(s.src);
      }
    });
    if (already) return;

    // 3) Вставляем скрипт один раз и помечаем id
    var s = document.createElement('script');
    s.id = 'custom-js';
    s.src = 'js/custom.js?v=' + v;
    // s.defer = true; // опционально
    document.body.appendChild(s);
  }

  function waitForjQuery(cb) {
    if (window.jQuery) return cb();
    setTimeout(function () { waitForjQuery(cb); }, 40);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      waitForjQuery(inject);
    });
  } else {
    waitForjQuery(inject);
  }
})();