// custom.js — мобильное меню + Isotope (masonry, imagesLoaded, resize)
(function($){

 // ==== Preloader ==== (class-based + min/max timing + safe remove)
(function(){
  var pre = document.querySelector('.preloader');
  if (!pre) return;

  var MIN = 800;   // минимальная видимость (мс), чтобы не «мигало»
  var MAX = 3500;  // максимум ожидания на очень медленных соединениях
  var start = Date.now();
  var doneCalled = false;

  function finish(){
    if (doneCalled) return;
    doneCalled = true;
    var wait = Math.max(0, MIN - (Date.now() - start));
    setTimeout(function(){
      pre.classList.add('is-done'); // плавная CSS-прозрачность
      pre.addEventListener('transitionend', function(){ pre.remove(); }, { once:true });
    }, wait);
  }

  // 1) обычная «полная загрузка»
  window.addEventListener('load', finish, { once:true });

  // 2) шрифты (убираем рывок заголовка, когда TAN/Motter догружаются)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function(){ /* no-op, просто даём браузеру догрузить */ });
  }

  // 3) предохранитель по времени
  setTimeout(finish, MAX);
})();

  // ==== WOW (если подключён) ====
  try { new WOW().init(); } catch(e){}

// ==== Isotope + фильтры ====
$(window).on('load', function(){

  var $grid = $('.iso-box-wrapper');
  if(!$grid.length || !$.fn.isotope) return;

  var currentFilter = '*'; // All
  var lastInteractive = 0;
  var didInitialReveal = false;

  function currentSelector(){
    // В All показываем только .is-visible, в категориях — всю категорию
    return currentFilter === '*' ? '.is-visible' : currentFilter;
  }

  // Временное отключение анимации на время одного arrange/layout
  var DEFAULT_TD = '0.22s', silencing = false;
  function silent(fn){
    if (silencing) { fn(); return; }
    silencing = true;
    var iso  = $grid.data('isotope');
    var prev = (iso && iso.options.transitionDuration) || DEFAULT_TD;
    $grid.isotope('option', { transitionDuration: 0 });
    fn();
    // вернём анимацию, когда Isotope закончит раскладку
    $grid.one('arrangeComplete layoutComplete', function(){
      $grid.isotope('option', { transitionDuration: prev });
      silencing = false;
    });
  }

  // Мягко показать список карточек (волной)
  function softReveal(elems){
    if (!elems || !elems.length) return;

    elems.forEach(function(el, i){
      el.classList.remove('iso-soft-in');
      el.classList.add('iso-soft-start');
      el.style.setProperty('--st', (i * 20) + 'ms'); // шаг «волны»
    });

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        elems.forEach(function(el){
          el.classList.add('iso-soft-in');
          el.classList.remove('iso-soft-start');
        });
      });
    });
  }

  // Автоподстройка числа колонок
  function autoCols(){
    var cols = 3;
    if (window.matchMedia('(max-width:600px)').matches) cols = 1;
    else if (window.matchMedia('(max-width:900px)').matches) cols = 2;
    else {
      var iso = $grid.data('isotope');
      if (iso){
        var vis = iso.filteredItems.length; // сколько реально видно
        if (vis <= 2) cols = 1;
        else if (vis <= 6) cols = 2;
        else cols = 3;
      }
    }
    if ($grid[0]) {
      $grid[0].style.setProperty('--cols', cols);
    }
  }

  function initIso(){
    // добавим сайзеры, если их нет
    if(!$grid.find('.grid-sizer').length){
      $grid.prepend('<div class="grid-sizer"></div><div class="gutter-sizer"></div>');
    }

    // показываем первые 9 карточек в "All" при загрузке
    $grid.find('.iso-box').slice(0, 12).addClass('is-visible');

    $grid.isotope({
      itemSelector: '.iso-box',
      layoutMode: 'masonry',
      percentPosition: true,
      transitionDuration: '0.18s',
      stagger: 0,
      masonry: {
        columnWidth: '.grid-sizer',
        gutter: '.gutter-sizer',
        horizontalOrder: false
      },
      hiddenStyle:  { opacity: 0 },
      visibleStyle: { opacity: 1 },
      filter: currentSelector()
    });

    $grid.on('transitionend', '.iso-box img', function(e){
      if (e.propertyName !== 'opacity' && e.propertyName !== 'transform') return;
      var box = this.closest('.iso-box');
      if (box) box.classList.remove('iso-soft-in','iso-soft-start');
    });

    $grid.one('arrangeComplete.softInit', function(e, items){
      if (!items || !items.length) return;
      didInitialReveal = true;
      softReveal(items.map(function(it){ return it.element; }));
    });

    // после раскладки (фильтр/перекладка) — мягко «вплываем»
    $grid.off('arrangeComplete.soft').on('arrangeComplete.soft', function(e, items){
      if (didInitialReveal){
        didInitialReveal = false;
        return;
      }
      if (currentFilter === '*' && Date.now() - lastInteractive < 400) return;
      if (!items || !items.length) return;
      var domElems = items
        .filter(function(it){ return it.isVisible && it.element && it.element.parentNode; })
        .map(function(it){ return it.element; });
      softReveal(domElems);
    });

    // перекладываем по мере загрузки каждого изображения + ставим .is-loaded
    if (window.imagesLoaded) {
      $grid.find('img').each(function () {
        if (this.complete && this.naturalWidth) this.classList.add('is-loaded');
      });

      var il = imagesLoaded($grid.find('img').get());

      il.on('progress', function (_, image) {
        if (image && image.img) image.img.classList.add('is-loaded');
        requestAnimationFrame(function () {
          silent(function () { $grid.isotope('layout'); });
        });
      });

      il.on('always', function () {
        silent(function () { $grid.isotope('layout'); });
      });
    }

    autoCols();
    requestAnimationFrame(function(){ $grid.isotope('layout'); });
  }

  function boot(){ initIso(); }
  boot(); // запускаем сразу

  // ——— когда карточке ДОБАВИЛИ .is-visible (infinite scroll / инициализация)
  var obsPaused = false;
  var arrangeScheduled = false;

  function scheduleArrange(){
    var iso = $grid.data('isotope');
    if (!iso) return;
    if (arrangeScheduled) return;

    arrangeScheduled = true;
    requestAnimationFrame(function(){
      arrangeScheduled = false;
      lastInteractive = Date.now();
      obsPaused = true;
      $grid.isotope('arrange', { filter: currentSelector() });
      autoCols();
      requestAnimationFrame(function(){ $grid.isotope('layout'); });
    });
  }

  var observer = new MutationObserver(function(list){
    if (obsPaused) return;
    for (var i = 0; i < list.length; i++){
      var m = list[i];
      if (m.type !== 'attributes' || m.attributeName !== 'class') continue;
      var t = m.target;
      if (!t.classList || !t.classList.contains('iso-box')) continue;

      var old = m.oldValue || '';
      var wasVisible = old.indexOf('is-visible') !== -1;
      var nowVisible = t.classList.contains('is-visible');
      if (!wasVisible && nowVisible){
        t.classList.remove('iso-soft-in','iso-soft-start');
        softReveal([t]);
        scheduleArrange();
      }
    }
  });

  if ($grid[0]) {
    observer.observe($grid[0], {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true
    });
  }

  // на время самой раскладки — не реагируем на внутренние классы Isotope
  $grid.on('arrangeComplete layoutComplete', function(){ obsPaused = false; });
  $grid.on('arrange', function(){ obsPaused = true; });

  // ——— переключение фильтров
  $(document).on('click', '.filter-wrapper a', function(e){
    e.preventDefault();
    currentFilter = $(this).data('filter') || '*';

    if (currentFilter === '*') {
      $('body').removeClass('mode-cat');
    } else {
      $('body').addClass('mode-cat');
    }

    if (!$grid.data('isotope')) return;

    $grid.isotope('arrange', { filter: currentSelector() });
    autoCols();

    if (currentFilter === '*') {
      silent(function(){ $grid.isotope('shuffle'); });
    }
    lastInteractive = Date.now();
    requestAnimationFrame(function(){ $grid.isotope('layout'); });

    var $chips = $('.filter-wrapper a');
    $chips.removeClass('selected is-checked active').attr('aria-pressed','false');
    $(this).addClass('selected is-checked').attr('aria-pressed','true');
  });

  // ——— ресайз (с дебаунсом)
  var rAF;
  $(window).on('resize', function(){
    cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(function(){
      autoCols();
      silent(function(){ $grid.isotope('layout'); });
    });
  });

  // === INFINITE SCROLL: грузим по 9 карточек при доскролле до sentinel ===
  (function(){
    var sentinel = document.querySelector('.js-portfolio-sentinel');
    if (!sentinel || !('IntersectionObserver' in window)) return;

    var BATCH   = 15;
    var loading = false;

    var io = new IntersectionObserver(function(entries){
      if (!entries.some(function(e){ return e.isIntersecting; })) return;
      if (loading) return;

      // Бесконечный скролл только в режиме "All"
      if (currentFilter !== '*') return;

      var $items = $grid.find('.iso-box:not(.is-visible)').slice(0, BATCH);
      if (!$items.length){
        io.disconnect();
        return;
      }

      loading = true;
      lastInteractive = Date.now();

      // 1) показать новые карточки мягкой волной
      $items
        .addClass('is-visible')
        .each(function(){ this.classList.remove('iso-soft-in','iso-soft-start'); });
      softReveal($items.toArray());

      // 2) пометить уже загруженные картинки
      $items.find('img').each(function(){
        if (this.complete && this.naturalWidth) this.classList.add('is-loaded');
      });

      // 3) переложить сетку
      silent(function(){ $grid.isotope('arrange', { filter: currentSelector() }); });
      autoCols();
      requestAnimationFrame(function(){ $grid.isotope('layout'); });

      // 4) когда новые изображения догрузятся — ещё раз переложить
      if (window.imagesLoaded){
        var ilNew = imagesLoaded($items.get());
        ilNew.on('progress', function(){
          silent(function(){ $grid.isotope('layout'); });
        });
        ilNew.on('always', function(){
          silent(function(){ $grid.isotope('layout'); });
          loading = false;
        });
      } else {
        loading = false;
      }

      // 5) если скрытых карточек больше нет — выключаем наблюдатель
      if ($grid.find('.iso-box:not(.is-visible)').length === 0){
        io.disconnect();
      }
    }, {
      rootMargin: '0px 0px 100% 0px'
    });

    io.observe(sentinel);
  })();

});
})(jQuery);

// === 3D Tilt + ЕДИНЫЙ zoom без рывков ===
(function(){
  if (!matchMedia('(hover:hover)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var fx = document.body.getAttribute('data-fx') || '';
  if (!/\btilt\b/.test(fx)) return;

  var zoomOut = /\bzoomout\b/.test(fx);
  var zoomIn  = /\bzoomin\b/.test(fx);

  // Режимы: выбирай в <body data-fx="tilt zoomout"> или "tilt zoomin"
  var BASE   = zoomOut ? 1.08 : 1.00;  // старт: чуть крупнее для zoomout
  var TARGET = zoomOut ? 1.00 : 1.06;  // цель при ховере

  var MAX   = 12;    // сила наклона
  var EASE  = 0.16;  // инерция углов
  var EASES = 0.12;  // инерция масштаба

  document.querySelectorAll('.iso-box').forEach(function(box){
    var img = box.querySelector('img');
    if (!img) return;

    var over=false, raf=0, rx=0, ry=0, tx=0, ty=0, sc=BASE, scT=BASE;

    function tick(){
      rx += (tx - rx) * EASE;
      ry += (ty - ry) * EASE;
      sc += (scT - sc) * EASES;
      img.style.transform = 'scale('+sc.toFixed(4)+') rotateX('+rx.toFixed(3)+'deg) rotateY('+ry.toFixed(3)+'deg)';
      if (over || Math.abs(tx-rx)>0.01 || Math.abs(ty-ry)>0.01 || Math.abs(scT-sc)>0.002){
        raf = requestAnimationFrame(tick);
      }
    }

    function setOriginFromEvent(e){
      var r = box.getBoundingClientRect();
      var px = (e.clientX - r.left)/r.width  - 0.5;
      var py = (e.clientY - r.top) /r.height - 0.5;
      box.style.setProperty('--ox', ((px+0.5)*100)+'%');
      box.style.setProperty('--oy', ((py+0.5)*100)+'%');
      box.style.setProperty('--x',  ((px+0.5)*100)+'%');
      box.style.setProperty('--y',  ((py+0.5)*100)+'%');
      box.style.setProperty('--dx', px);
      box.style.setProperty('--dy', py);
      tx = -py * MAX;
      ty =  px * MAX;
    }

    function onEnter(e){
      over = true;
      scT = TARGET;                        // масштаб едет к цели
      img.style.willChange = 'transform, filter';
      img.style.transition = 'filter .18s ease-out';
      setOriginFromEvent(e);               // СРАЗУ центр по курсору — убираем «прыжок»
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function onMove(e){ setOriginFromEvent(e); }

    function onLeave(){
      over = false;
      tx = ty = 0;                         // наклон на ноль
      scT = BASE;                          // масштаб назад
      img.style.transition = 'filter .22s ease-out';
      if (!raf) raf = requestAnimationFrame(tick);
      setTimeout(function(){ if (!over) img.style.willChange=''; }, 300);
    }

    box.addEventListener('mouseenter', onEnter, {passive:true});
    box.addEventListener('mousemove',  onMove,  {passive:true});
    box.addEventListener('mouseleave', onLeave, {passive:true});
  });
})();

// === Lazy + Blur-up для изображений в .iso-box + пересборка Isotope ===
(function(){
  var imgs = document.querySelectorAll('.iso-box img');
  if (!imgs.length) return;

  var gridEl = null;

  function relayoutIso(){
    if (!window.jQuery) return;
    if (!gridEl) gridEl = document.querySelector('.iso-box-wrapper');
    if (!gridEl) return;

    var $g = window.jQuery(gridEl);
    if ($g.data('isotope')) {
      // чуть мягче, через rAF
      requestAnimationFrame(function(){
        $g.isotope('layout');
      });
    }
  }

  imgs.forEach(function(img, i){
    // первые ~24 кадра грузим сразу, остальные — lazy
    if (i < 24) {
      img.removeAttribute('loading');
      img.setAttribute('fetchpriority','high');
    } else {
      if (!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
    }
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding','async');

    img.classList.add('img-blur');

    if (img.complete && img.naturalWidth) {
      // уже загружено (из кэша) — пометили и переложили сетку
      img.classList.add('is-loaded');
      relayoutIso();
    } else {
      // когда ДОгрузится — пометить и переложить сетку
      img.addEventListener('load', function(){
        img.classList.add('is-loaded');
        relayoutIso();
      }, { once:true });
    }
  });
})();

/* --- Isotope: дополнительные relayout-подстраховки --- */
(function($){
  var $grid = $('.iso-box-wrapper');
  if (!$grid.length) return;

  function relayout(){
    if ($grid.data('isotope')) {
      $grid.isotope('arrange');
      $grid.isotope('layout');
    }
  }

  // футер попал в зону видимости — перестроиться
  var footer = document.querySelector('footer');
  if (footer && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      if (entries.some(e => e.isIntersecting)) relayout();
    }, { rootMargin: '400px' });
    io.observe(footer);
  }

  // ресайз / смена ориентации
  var debId;
  function debounced(){ clearTimeout(debId); debId = setTimeout(relayout, 150); }
  window.addEventListener('resize', debounced);
  window.addEventListener('orientationchange', function(){ setTimeout(relayout, 200); });

  // небольшая отложенная подстраховка
  if ('requestIdleCallback' in window){
    requestIdleCallback(relayout, { timeout: 800 });
  } else {
    setTimeout(relayout, 800);
  }
})(jQuery);

// Autopopulate package from ?pkg=... into the Contact form
(function pkgAutoFill(){
  document.addEventListener('DOMContentLoaded', function(){
    var form = document.getElementById('contact-form');
    if (!form) return;

    var params = new URLSearchParams(window.location.search);
    var pkg = params.get('pkg');
    if (!pkg) return;

    var message = form.querySelector('#message');
    if (!message) return;

    var lang = (document.documentElement.lang || 'en').toLowerCase();
    var pre = {
      en: "Package I’m interested in: ",
      fi: "Kiinnostava paketti: ",
      ru: "Интересующий пакет: "
    }[lang] || "Package I’m interested in: ";

    var addon = pre + pkg + "\n";
    message.value = message.value
      ? (addon + "\n" + message.value)
      : (addon + "\nTell me a few words about your idea");

    message.classList.add('is-highlighted');
    setTimeout(function(){ message.classList.remove('is-highlighted'); }, 1200);

    var contact = document.getElementById('contact');
    if (contact) contact.scrollIntoView({behavior:'smooth', block:'start'});
  });
})();

document.addEventListener('DOMContentLoaded', function () {
  // Чтобы код сработал только на pricing-странице
  if (!document.body.classList.contains('page-pricing')) return;

  (function () {
    var chips = [].slice.call(document.querySelectorAll('.pricing-filter a'));
    if (!chips.length) return;

    var rows = [].slice.call(document.querySelectorAll('.pricing-row'));
    var timelineItems = [].slice.call(document.querySelectorAll('.pricing-timeline-item'));

    function toggleByGroup(el, group) {
      if (!el) return;
      var g = el.getAttribute('data-group') || '';
      var tags = (el.getAttribute('data-tags') || '').split(/\s+/);
      var show =
        group === 'all' ||
        g === group ||
        (tags.length && tags.indexOf(group) !== -1);

      el.style.display = show ? '' : 'none';
    }

    function apply(group) {
      rows.forEach(function (el) { toggleByGroup(el, group); });
      timelineItems.forEach(function (el) { toggleByGroup(el, group); });
    }

    chips.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var group = this.dataset.group || 'all';

        chips.forEach(function (c) { c.classList.remove('is-checked'); });
        this.classList.add('is-checked');

        apply(group);
      });
    });

    // Стартовое состояние
    apply('all');
  })();
});


// === MINUSTA: открыть / закрыть верхнее меню (desktop) ===
document.addEventListener('DOMContentLoaded', function () {
  const trigger = document.querySelector('.header-page-trigger');
  const flyout  = document.querySelector('.header-flyout');

  if (!trigger || !flyout) return; // если чего-то нет — выходим тихо

  // Клик по MINUSTA — открыть / закрыть меню
  trigger.addEventListener('click', function (e) {
    e.preventDefault();

    const isOpen = document.body.classList.toggle('header-menu-open');
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Клик вне меню — закрыть
  document.addEventListener('click', function (e) {
    if (!document.body.classList.contains('header-menu-open')) return;

    // если кликнули по самому меню или по MINUSTA — не закрываем
    if (e.target.closest('.header-flyout') || e.target.closest('.header-page-trigger')) {
      return;
    }

    document.body.classList.remove('header-menu-open');
    trigger.setAttribute('aria-expanded', 'false');
  });

  // ESC — тоже закрывает
  document.addEventListener('keyup', function (e) {
    if (e.key === 'Escape') {
      document.body.classList.remove('header-menu-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
});

// Меню: линия под пунктами начинается из позиции курсора
document.addEventListener('DOMContentLoaded', function () {
  var links = document.querySelectorAll('.main-menu a, .lang-menu a');

  function setUnderlineOrigin(e) {
    var link = e.currentTarget;
    var rect = link.getBoundingClientRect();
    var x = e.clientX - rect.left;          // px от левого края ссылки
    var percent = (x / rect.width) * 100;   // в проценты

    link.style.setProperty('--ux', percent + '%');
  }

  links.forEach(function (link) {
    link.addEventListener('mouseenter', setUnderlineOrigin);
    link.addEventListener('mousemove', setUnderlineOrigin);
  });
});

// === MOBILE: HOME показывает / прячет главное меню + языки ===
document.addEventListener('DOMContentLoaded', function () {
  var pageTrigger = document.querySelector('.mobile-nav-toggle');
  var mainMenu    = document.querySelector('.main-menu');
  var langMenu    = document.querySelector('.lang-menu');

  // Если чего-то нет — тихо выходим
  if (!pageTrigger || !mainMenu || !langMenu) return;

  function isMobile() {
    return window.matchMedia('(max-width: 800px)').matches;
  }

  // Клик по HOME
  pageTrigger.addEventListener('click', function (e) {
    if (!isMobile()) return;
    e.preventDefault();
    e.stopPropagation();

    var open = document.body.classList.toggle('menu-open');
    pageTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Клик мимо – закрыть
  document.addEventListener('click', function (e) {
    if (!isMobile()) return;
    if (!document.body.classList.contains('menu-open')) return;

    if (
      e.target.closest('.mobile-nav-toggle') ||
      e.target.closest('.main-menu') ||
      e.target.closest('.lang-menu')
    ) {
      return;
    }

    document.body.classList.remove('menu-open');
    pageTrigger.setAttribute('aria-expanded', 'false');
  });

  // ESC — тоже закрыть
  document.addEventListener('keyup', function (e) {
    if (!isMobile()) return;
    if (e.key === 'Escape') {
      document.body.classList.remove('menu-open');
      pageTrigger.setAttribute('aria-expanded', 'false');
    }
  });
});

// Блокируем контекстное меню на картинках (правую кнопку)
document.addEventListener('contextmenu', function (e) {
  if (e.target.tagName === 'IMG' || e.target.closest('picture')) {
    e.preventDefault();
  }
});

// Блокируем перетаскивание картинок
document.addEventListener('dragstart', function (e) {
  if (e.target.tagName === 'IMG' || e.target.closest('picture')) {
    e.preventDefault();
  }
});

(function () {
  const banner = document.querySelector(".cookie-banner");
  if (!banner) return;

  let lastY = window.scrollY;
  let lastT = performance.now();
  let stopTimer = null;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function onScroll() {
    const y = window.scrollY;
    const t = performance.now();
    const dy = y - lastY;
    const dt = Math.max(16, t - lastT);

    // “скорость” скролла
    const v = Math.abs(dy / dt); // примерно 0..1+
    const k = clamp(v * 2.2, 0, 1); // сила эффекта 0..1

    // Сосиска: шире + ниже + круглее
    const sx = 1 + 0.10 * k;   // +10% по ширине
    const sy = 1 - 0.07 * k;   // -7% по высоте
    const r  = 18 + 10 * k;    // радиус больше

    banner.style.setProperty("--cb-sx", sx.toFixed(3));
    banner.style.setProperty("--cb-sy", sy.toFixed(3));
    banner.style.setProperty("--cb-r",  r.toFixed(1) + "px");

    banner.classList.add("is-sausage");

    // когда скролл остановился — вернуть “крепкий”
    clearTimeout(stopTimer);
    stopTimer = setTimeout(() => {
      banner.classList.remove("is-sausage");
      banner.style.setProperty("--cb-sx", "1");
      banner.style.setProperty("--cb-sy", "1");
      banner.style.setProperty("--cb-r",  "18px");
    }, 140);

    lastY = y;
    lastT = t;
  }

  window.addEventListener("scroll", onScroll, { passive: true });
})();

(function () {
  const banner = document.querySelector(".cookie-banner");
  if (!banner) return;

  let stopTimer = null;

  function onScroll() {
    banner.classList.add("is-worm");

    clearTimeout(stopTimer);
    stopTimer = setTimeout(() => {
      banner.classList.remove("is-worm");
    }, 180); // через 180мс после остановки скролла — вернуть "ровный"
  }

  window.addEventListener("scroll", onScroll, { passive: true });
})();

(function () {
  const banner = document.getElementById("cookieBanner");
  if (!banner) return;

  let lastY = window.scrollY;
  let lastT = performance.now();
  let stopTimer = null;

  function onScroll() {
    const y = window.scrollY;
    const t = performance.now();

    const dy = Math.abs(y - lastY);
    const dt = Math.max(16, t - lastT); // защита от деления на 0
    const speed = dy / dt; // px per ms

    // переводим скорость в "силу": примерно 0.2..1.8
    const worm = Math.min(1.8, Math.max(0.2, speed * 2.8));
    banner.style.setProperty("--worm", worm.toFixed(2));

    banner.classList.add("is-worm");

    clearTimeout(stopTimer);
    stopTimer = setTimeout(() => {
      banner.classList.remove("is-worm");
      banner.style.setProperty("--worm", "0.6"); // мягкий остаток, чтобы возврат был нежнее
    }, 180);

    lastY = y;
    lastT = t;
  }

  window.addEventListener("scroll", onScroll, { passive: true });
})();