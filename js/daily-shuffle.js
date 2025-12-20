// =============================
// Daily stable shuffle (per day)
// =============================
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todaysKey() {
  const d = new Date(); // берёт день по времени пользователя (Хельсинки)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // например 2025-12-20
}

function dailyShuffleIsoBoxes(wrapperSelector = ".iso-box-wrapper", fixedFirst = 0) {
  const wrapper = document.querySelector(wrapperSelector);
  if (!wrapper) return;

  // чтобы не делать лишнюю работу 10 раз (если вдруг init вызывается повторно)
  const key = todaysKey();
  if (wrapper.dataset.shuffled === key) return;
  wrapper.dataset.shuffled = key;

  // берём только .iso-box (grid-sizer/gutter-sizer не трогаем)
  const items = Array.from(wrapper.children).filter(el => el.classList.contains("iso-box"));

  // первые fixedFirst оставляем как “витрину”
  const head = items.slice(0, fixedFirst);
  const tail = items.slice(fixedFirst);

  const seed = xmur3(key)();
  const rnd = mulberry32(seed);

  // Fisher–Yates shuffle (стабильный, т.к. rnd seeded)
  for (let i = tail.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [tail[i], tail[j]] = [tail[j], tail[i]];
  }

  // удаляем старые .iso-box и вставляем в новом порядке
  items.forEach(el => el.remove());

  const frag = document.createDocumentFragment();
  head.concat(tail).forEach(el => frag.appendChild(el));
  wrapper.appendChild(frag);
}