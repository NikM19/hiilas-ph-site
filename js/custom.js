// custom.js — мобильное меню + Isotope (masonry, imagesLoaded, resize)
(function($){

  // ==== Preloader ====
  $(window).on('load', function(){
    $('.preloader').fadeOut(600);
  });

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
    // В All показываем только .is-visible (кнопка «Показать ещё»), в категориях — всю категорию
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

// NEW: мягко показать список карточек (волной)
function softReveal(elems){
  if (!elems || !elems.length) return;

  elems.forEach(function(el, i){
    el.classList.remove('iso-soft-in');
    el.classList.add('iso-soft-start');
    el.style.setProperty('--st', (i * 25) + 'ms'); // шаг «волны»
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

  // Автоподстройка числа колонок (на десктопе уменьшаем, если мало карточек)
  function autoCols(){
    var cols = 3;
    if (window.matchMedia('(max-width:600px)').matches) cols = 1;
    else if (window.matchMedia('(max-width:900px)').matches) cols = 2;
    else {
      var iso = $grid.data('isotope');
      if (iso){
        var vis = iso.filteredItems.length; // сколько реально видно
        if (vis <= 2) cols = 1;
        else if (vis <= 6) cols = 2;       // порог подправь по вкусу: 9–12
        else cols = 3;
      }
    }
    $grid[0].style.setProperty('--cols', cols); // локально, только для этой сетки
  }

  function initIso(){
    // добавим сайзеры, если их нет
    if(!$grid.find('.grid-sizer').length){
      $grid.prepend('<div class="grid-sizer"></div><div class="gutter-sizer"></div>');
    }

// показываем первые 9 карточек в "All" при загрузке
$grid.find('.iso-box').slice(0, 9).addClass('is-visible');

if ($grid.find('.iso-box:not(.is-visible)').length === 0) {
  $('#load-more').hide();
} else {
  $('#load-more').show();
}
$grid.isotope({
  itemSelector: '.iso-box',
  layoutMode: 'masonry',
  percentPosition: true,
  transitionDuration: '0.26s',   // чутка длиннее
  stagger: 0,                   // волна мягче (можно 45–60)
  masonry: {
    columnWidth: '.grid-sizer',
    gutter: '.gutter-sizer',
    horizontalOrder: false
  },
  hiddenStyle:  { opacity: 0 },  // <— только фейд, без scale/сжатия
  visibleStyle: { opacity: 1 },
  filter: currentSelector()
});

$grid.on('transitionend', '.iso-box img', function(e){
  // интересуют только opacity/transform
  if (e.propertyName !== 'opacity' && e.propertyName !== 'transform') return;
  var box = this.closest('.iso-box');
  if (box) box.classList.remove('iso-soft-in','iso-soft-start');
});

$grid.one('arrangeComplete.softInit', function(e, items){
  if (!items || !items.length) return;
  didInitialReveal = true;
  softReveal(items.map(function(it){ return it.element; }));
});

// NEW: после раскладки (фильтр/перекладка) — мягко «вплываем»
$grid.off('arrangeComplete.soft').on('arrangeComplete.soft', function(e, items){
  if (didInitialReveal){                   // ← пропускаем самую первую волну
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
  // всё, что уже в кэше — сразу помечаем
  $grid.find('img').each(function () {
    if (this.complete && this.naturalWidth) this.classList.add('is-loaded');
  });

  // ВАЖНО: используем ванильный конструктор imagesLoaded, а не цепочку $grid.imagesLoaded()
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
    $('#load-more').show(); // стартуем в All
  }

  function boot(){ initIso(); }

boot(); // запускаем сразу, без ожидания lazy-изображений

  // ——— когда карточке ДОБАВИЛИ .is-visible (кнопка «Показать ещё»)
var obsPaused = false;
var arrangeScheduled = false;

function scheduleArrange(){
  var iso = $grid.data('isotope');
  if (!iso) return;                 // <— защита: если isotope не инициализирован
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
    // обрабатываем только .iso-box, у которой .is-visible ТОЛЬКО ЧТО появился
    if (!t.classList || !t.classList.contains('iso-box')) continue;

    var old = m.oldValue || '';
    var wasVisible = old.indexOf('is-visible') !== -1;
    var nowVisible = t.classList.contains('is-visible');
    if (!wasVisible && nowVisible){
      t.classList.remove('iso-soft-in','iso-soft-start');
      // мягко показать ЭТУ карточку и один раз перестроить сетку
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
    attributeOldValue: true   // <— важно, чтобы видеть "до/после"
  });
}

// на время самой раскладки — не реагируем на внутренние классы Isotope
$grid.on('arrangeComplete layoutComplete', function(){ obsPaused = false; });
$grid.on('arrange', function(){ obsPaused = true; });

  // ——— переключение фильтров
$(document).on('click', '.filter-wrapper a', function(e){
  e.preventDefault();
  currentFilter = $(this).data('filter') || '*';

  if (currentFilter === '*') { $('body').removeClass('mode-cat'); $('#load-more').show(); }
  else { $('body').addClass('mode-cat'); $('#load-more').hide(); }

  // если isotope ещё не готов — выходим тихо
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

// === LOAD MORE: стабильный, без наслаиваний ===
$('#load-more').on('click', function(e){
  e.preventDefault();
  if (!$grid.length || !$grid.data('isotope')) return;

  var BATCH = 9;
  var $items = $grid.find('.iso-box:not(.is-visible)').slice(0, BATCH);

  if (!$items.length){
    $(this).attr('disabled', true).hide();
    return;
  }

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

  // 4) когда догрузятся новые изображения — ещё раз переложить
  if (window.imagesLoaded){
    var ilNew = imagesLoaded($items.get());
    ilNew.on('progress', function(){
      silent(function(){ $grid.isotope('layout'); });
    });
    ilNew.on('always', function(){
      silent(function(){ $grid.isotope('layout'); });
    });
  }

  // 5) если скрытых больше нет — прячем кнопку
  if ($grid.find('.iso-box:not(.is-visible)').length === 0){
    $(this).attr('disabled', true).hide();
  }
});
});

// ==== Мобильное меню ====
$(function () {
  // Гарантируем, что элементы есть (ставим id/aria, если забыты в HTML)
  let $menu = $('#site-menu');
  if (!$menu.length) {
    $menu = $('.navicon .list-menu').first().attr({
      id: 'site-menu',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-hidden': 'true'
    });
  }

  let $burger = $('.navicon .circle').first();
  if (!$burger.is('[aria-controls]')) {
    $burger.attr({
      'aria-controls': 'site-menu',
      'aria-expanded': 'false',
      'aria-label': 'Open menu'
    });
  }

  if ($menu[0]) { $menu[0].inert = true; } // по умолчанию меню нефокусируемо

  function openMenu() {
    if ($menu[0]) { $menu[0].inert = false; }
    $menu.addClass('reveal-modal').attr('aria-hidden', 'false');
    $burger.attr('aria-expanded', 'true');
    // ВАЖНО: совпадаем с CSS
    $('html,body').addClass('no-scroll');

    const $first = $menu
      .find('a, button, [tabindex]:not([tabindex="-1"])')
      .filter(':visible')
      .first();
    setTimeout(() => { ($first[0] || $menu[0]).focus(); }, 0);
  }

  function closeMenu() {
    $burger.focus();
    if ($menu[0]) { $menu[0].inert = true; }
    $menu.removeClass('reveal-modal').attr('aria-hidden', 'true');
    $burger.attr('aria-expanded', 'false');
    $('html,body').removeClass('no-scroll');
  }

  // Открыть
  $(document)
    .off('click.openMenu')
    .on('click.openMenu', '.navicon .circle, .navicon .ion-navicon', function (e) {
      e.preventDefault(); e.stopPropagation();
      openMenu();
    });

  // Закрыть по X
  $(document)
    .off('click.closeMenu')
    .on('click.closeMenu', '.close-iframe, #site-menu .ion-close-round', function (e) {
      e.preventDefault(); e.stopPropagation();
      closeMenu();
    });

  // Закрыть по клику на фон
  $(document)
    .off('click.bgClose')
    .on('click.bgClose', '#site-menu', function (e) {
      if (e.target === this) closeMenu();
    });

  // Закрыть по клику на пункт меню (и перейти по ссылке)
  $(document)
    .off('click.linkClose')
    .on('click.linkClose', '#site-menu a', function (e) {
      const href = $(this).attr('href') || '';
      closeMenu();
      if (href && href !== '#') {
        e.preventDefault();
        window.location.href = href;
      } else {
        e.preventDefault();
      }
    });

  // ESC
  $(document).on('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  // iOS tap hack
  $(document).on('touchstart', '.close-iframe, #site-menu .ion-close-round, #site-menu a', function () { });
});

})(jQuery);

// === 3D Tilt с инерцией + совместим с "zoomout" ===
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

// === Lazy + Blur-up для изображений в .iso-box ===
(function(){
  var imgs = document.querySelectorAll('.iso-box img');
  if (!imgs.length) return;

  imgs.forEach(function(img, i){
    if (i < 12) {                      // верх страницы грузим сразу
      img.removeAttribute('loading');
      img.setAttribute('fetchpriority','high'); // хинт браузеру
    } else {
      if (!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
    }
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding','async');

    img.classList.add('img-blur');
    if (img.complete) {
      img.classList.add('is-loaded');
    } else {
      img.addEventListener('load', function(){ img.classList.add('is-loaded'); }, {once:true});
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

