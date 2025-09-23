// js/loader.js (надёжная версия)
(function () {
  var isDev = location.protocol === 'file:' || /localhost/.test(location.host);
  var v = isDev ? Date.now() : '1';  // на проде можно менять '1' при релизах

  function inject() {
    var s = document.createElement('script');
    s.src = 'js/custom.js?v=' + v;
    document.body.appendChild(s);
  }

  function waitForjQuery(cb){
    if (window.jQuery) return cb();
    setTimeout(function(){ waitForjQuery(cb); }, 40);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      waitForjQuery(inject);
    });
  } else {
    waitForjQuery(inject);
  }
})();