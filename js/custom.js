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

$grid.isotope({
  itemSelector: '.iso-box',
  layoutMode: 'masonry',
  percentPosition: true,
  transitionDuration: '0.28s',   // чутка длиннее
  stagger: 40,                   // волна мягче (можно 45–60)
  masonry: {
    columnWidth: '.grid-sizer',
    gutter: '.gutter-sizer',
    horizontalOrder: false
  },
  hiddenStyle:  { opacity: 0 },  // <— только фейд, без scale/сжатия
  visibleStyle: { opacity: 1 },
  filter: currentSelector()
});

// перекладываем по мере загрузки каждого изображения + ставим .is-loaded
if ($.fn.imagesLoaded) {
  // всё, что уже в кэше — сразу считаем загруженным
  $grid.find('img').each(function(){
    if (this.complete && this.naturalWidth) this.classList.add('is-loaded');
  });

  $grid.imagesLoaded()
    .progress(function(_, image){
      if (image && image.img) image.img.classList.add('is-loaded');

      // не перебивать свежую анимацию после клика/«показать ещё»
      if (Date.now() - lastInteractive < 450) return;
      silent(function(){ $grid.isotope('layout'); });
    })
    .always(function(){
      silent(function(){ $grid.isotope('layout'); });
    });
}

    autoCols();
    requestAnimationFrame(function(){ $grid.isotope('layout'); });
    $('#load-more').show(); // стартуем в All
  }

  if ($.fn.imagesLoaded) { $grid.imagesLoaded(initIso); }
  else { initIso(); }

  // ——— когда карточке добавили .is-visible (кнопка «Показать ещё»)
  var observer = new MutationObserver(function(list){
    for (var i=0; i<list.length; i++){
      var m = list[i];
if (m.type === 'attributes' &&
    m.attributeName === 'class' &&
    m.target.classList.contains('iso-box') &&
    m.target.classList.contains('is-visible')) {

  // анимированная перекладка
  lastInteractive = Date.now();
  $grid.isotope('arrange', { filter: currentSelector() });
  autoCols();
  requestAnimationFrame(function(){ $grid.isotope('layout'); });

  // (не обязательно) можно убрать лишний imagesLoaded тут — он уже есть в initIso()
  break;
}
    }
  });
  if ($grid[0]) {
    observer.observe($grid[0], { subtree:true, attributes:true, attributeFilter:['class'] });
  }

  // ——— переключение фильтров
$(document).on('click', '.filter-wrapper a', function(e){
  e.preventDefault();
  currentFilter = $(this).data('filter') || '*';

  // режим All / категория — показываем/прячем кнопку
  if (currentFilter === '*') {
    $('body').removeClass('mode-cat');
    $('#load-more').show();
  } else {
    $('body').addClass('mode-cat');
    $('#load-more').hide();
  }

  // 1) применяем фильтр и пересчитываем колонки
  $grid.isotope('arrange', { filter: currentSelector() });
  autoCols();

  // 2) только в режиме All чуть перемешаем — ТИХО, без анимации
  if (currentFilter === '*') {
    silent(function(){ $grid.isotope('shuffle'); });
  }

  // 3) сам layout — с анимацией
  lastInteractive = Date.now();
  requestAnimationFrame(function(){ $grid.isotope('layout'); });

  // активная кнопка фильтра
  $('.filter-wrapper a').removeClass('selected');
  $(this).addClass('selected');
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
  // ——— мелкая оптимизация загрузки
  $('.iso-box img').attr({ loading:'lazy', decoding:'async' });

});

  // ==== Мобильное меню ====
  $(function(){
    function $menus(){ return $('.list-menu'); }

    function openMenu(){
      $menus().addClass('reveal-modal');
      $('html,body').addClass('no-scroll');
    }
    function closeMenu(){
      $menus().removeClass('reveal-modal');
      $('html,body').removeClass('no-scroll');
    }

    // Открыть по бургеру
    $(document)
      .off('click.openMenu')
      .on('click.openMenu', '.navicon, .navicon .circle, .navicon .ion-navicon', function(e){
        e.preventDefault(); e.stopPropagation();
        openMenu();
      });

    // Закрыть по X
    $(document)
      .off('click.closeMenu')
      .on('click.closeMenu', '.close-iframe, .list-menu .ion-close-round', function(e){
        e.preventDefault(); e.stopPropagation();
        closeMenu();
      });

    // Закрыть по клику на фон
    $(document)
      .off('click.bgClose')
      .on('click.bgClose', '.list-menu', function(e){
        if (e.target === this) closeMenu();
      });

    // Закрыть по клику на ссылку + гарантированный переход
    $(document)
      .off('click.linkClose')
      .on('click.linkClose', '.list-menu a', function(e){
        var href = $(this).attr('href') || '';
        closeMenu();
        if (href && href !== '#') {
          e.preventDefault();
          window.location.href = href;
        } else {
          e.preventDefault();
        }
      });

    // ESC
    $(document).on('keydown', function(e){ if (e.key === 'Escape') closeMenu(); });

    // iOS хак
    $(document).on('touchstart', '.close-iframe, .list-menu .ion-close-round, .list-menu a', function(){});
  });

})(jQuery);