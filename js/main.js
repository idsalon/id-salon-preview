/* トップの丸から埋め込まれたとき（?embed=1）：ヘッダー・フッター等を隠し、リンクはトップ画面ごと移動、高さを親へ知らせる */
(function () {
  var embed = /[?&]embed=1/.test(location.search) && window.parent !== window;
  if (!embed) return;
  var h = document.documentElement; h.classList.add('is-embed');
  function send() { try { window.parent.postMessage({ idEmbedH: document.documentElement.scrollHeight }, '*'); } catch (e) {} }
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href]').forEach(function (a) { if (!a.target) a.target = '_top'; });
    send();
    if ('ResizeObserver' in window) new ResizeObserver(send).observe(document.body);
  });
  window.addEventListener('load', send);
})();

/* ページ遷移時は常に先頭から表示（#アンカー指定時を除く） */
(function () {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function toTop() {
    if (location.hash || document.documentElement.classList.contains('is-embed')) return;
    window.scrollTo(0, 0);
    var top = document.getElementById('header') || document.body;
    try { top.scrollIntoView({ block: 'start' }); } catch (e) {}
  }
  toTop();
  window.addEventListener('load', toTop);
  window.addEventListener('pageshow', function (e) { if (e.persisted) toTop(); });
})();

/* Id | Salon Official Site - main.js
   ハンバーガーメニュー / ヘッダーのスクロール状態 / 固定予約バー / 出現アニメーション */
(function () {
  'use strict';

  var header = document.getElementById('header');
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('menuToggle');
  var fixedBar = document.getElementById('fixedBar');

  // 年号
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ハンバーガーメニュー
  function closeNav() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
    document.body.style.overflow = '';
  }
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });

  // スクロール状態（ヘッダーの下線・固定バーの表示）
  function onScroll() {
    var sc = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('is-scrolled', sc > 10);
    // ヒーロー通過後に予約バーを表示。予約セクションが見えている間は隠す
    var reserve = document.getElementById('reserve');
    var reserveVisible = false;
    if (reserve) {
      var r = reserve.getBoundingClientRect();
      reserveVisible = r.top < window.innerHeight && r.bottom > 0;
    }
    fixedBar.classList.toggle('is-visible', sc > window.innerHeight * 0.6 && !reserveVisible);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 出現アニメーション
  var targets = document.querySelectorAll('.sec-row, .section__head, .concept__grid, .feature, .menu__group, .gallery__item, .access__grid, .reserve__inner, .pcard, .worries__list li, .voice__card, .step, .flow__step, .price-teaser__card, .proof, .detail, .ticket__block');
  targets.forEach(function (el) { el.classList.add('reveal'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  }

  // 性別タブ（レディース／メンズ）
  document.querySelectorAll('[data-gtabs]').forEach(function (box) {
    var tabs = box.querySelectorAll('.gtab'); var panels = box.querySelectorAll('[data-gpanel]');
    function show(g) {
      tabs.forEach(function (t) { t.classList.toggle('is-active', t.dataset.g === g); t.setAttribute('aria-selected', t.dataset.g === g); });
      panels.forEach(function (p) { p.hidden = p.dataset.gpanel !== g; });
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.dataset.g); }); });
    show(box.dataset.first || 'f');
  });

  // クリック計測（GA4 が有効なときだけ送信）: ホットペッパー／LINE／Id Prime 加入
  document.querySelectorAll('a[href]').forEach(function (a) {
    var h = a.getAttribute('href') || ''; var name = '';
    if (h.indexOf('beauty.hotpepper.jp') > -1) name = 'click_hotpepper';
    else if (h.indexOf('line.me') > -1) name = 'click_line';
    else if (h.indexOf('square.link') > -1) name = 'click_prime_join';
    else if (h.indexOf('instagram.com') > -1) name = 'click_instagram';
    if (!name) return;
    a.addEventListener('click', function () {
      if (typeof window.gtag !== 'function') return;
      var sec = a.closest('section[id]');
      var where = a.closest('.fixed-bar') ? 'fixed_bar' : a.closest('.header') ? 'header' : a.closest('.footer') ? 'footer' : (sec ? sec.id : 'other');
      window.gtag('event', name, { page: location.pathname, section: where, label: (a.textContent || '').trim().slice(0, 40) });
      // お悩みマップからの予約・相談（悩み別に率を見る）
      if (a.hasAttribute('data-map-reserve') || a.hasAttribute('data-map-line')) {
        window.gtag('event', a.hasAttribute('data-map-reserve') ? 'map_reserve_click' : 'map_line_click', { concern: a.dataset.concern, gender: a.dataset.gender, area: a.dataset.area });
      }
    });
  });

  // 予約先が未設定（href="#"）のボタンは、クリック時に案内を出す（本番では自動的に無効化されます）
  document.querySelectorAll('[data-reserve]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (a.getAttribute('href') === '#') {
        e.preventDefault();
        console.log('[Id] 予約先URLが未設定です: ' + a.dataset.reserve);
      }
    });
  });
})();

/* 3D Id マーク：マウス／タッチでゆるく傾く（視差） */
(function () {
  var box = document.querySelector('[data-id3d]');
  if (!box || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var tilt = box.querySelector('.id3d__tilt');
  var section = box.closest('section') || box;
  var raf = null, tx = 0, ty = -10;
  function apply() { tilt.style.setProperty('--tx', tx + 'deg'); tilt.style.setProperty('--ty', ty + 'deg'); raf = null; }
  section.addEventListener('mousemove', function (e) {
    var r = box.getBoundingClientRect();
    var x = (e.clientX - (r.left + r.width / 2)) / r.width;
    var y = (e.clientY - (r.top + r.height / 2)) / r.height;
    tx = Math.max(-22, Math.min(22, x * 28));
    ty = Math.max(-26, Math.min(10, -10 - y * 22));
    if (!raf) raf = requestAnimationFrame(apply);
  });
  section.addEventListener('mouseleave', function () { tx = 0; ty = -10; if (!raf) raf = requestAnimationFrame(apply); });
})();

/* 汎用：マウスで傾く3Dカード（data-tilt） */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach(function (stage) {
    var card = stage.firstElementChild; if (!card) return;
    var raf = null, tx = 0, ty = 0;
    function apply() { card.style.setProperty('--tx', tx + 'deg'); card.style.setProperty('--ty', ty + 'deg'); raf = null; }
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect();
      tx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 16;
      ty = -((e.clientY - (r.top + r.height / 2)) / r.height) * 12;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    stage.addEventListener('mouseleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(apply); });
  });
})();

/* お悩みマップ：顔/からだ × 性別 の切替と、点タップでの表示（SPは下から出るシート） */
(function () {
  var root = document.querySelector('[data-fmap-root]'); if (!root) return;
  var sheet = document.getElementById('fmapSheet');
  var cards = root.querySelectorAll('[data-fmap-card]');
  var panels = root.querySelectorAll('[data-fmap-panel]');
  var gbtns = document.querySelectorAll('[data-fmap-gender]');
  var abtns = document.querySelectorAll('[data-fmap-area]');
  var current = { face: 'tzone', body: 'belly' };
  var fallback = { face: 'tzone', body: 'belly' };
  var mq = window.matchMedia('(max-width: 899px)');
  var lastSpot = null;
  function state() { return { g: root.dataset.gender || 'f', a: root.dataset.area || 'face' }; }
  function openSheet() {
    if (!mq.matches) return;
    document.body.classList.add('fmap-sheet-open');
    // 後ろのページは動かさない（オーナー指示 10/31）
    // iPhone の Safari ではフォーカスでページが動くことがあるため、シートでは見出しにフォーカスしない
  }
  function closeSheet() {
    if (!document.body.classList.contains('fmap-sheet-open')) return;
    document.body.classList.remove('fmap-sheet-open');
    // 閉じるときも後ろのページを動かさない（フォーカスを戻さない）
  }
  function show(key, byUser) {
    var st = state();
    var exists = root.querySelector('[data-fmap-card="' + st.g + '-' + st.a + '"] [data-fmap="' + key + '"]');
    if (!exists) key = fallback[st.a];
    current[st.a] = key;
    cards.forEach(function (c) {
      var on = c.dataset.fmapCard === st.g + '-' + st.a; c.hidden = !on;
      c.querySelectorAll('[data-fmap]').forEach(function (b) {
        var sel = on && b.dataset.fmap === key;
        b.classList.toggle('is-active', sel); b.setAttribute('aria-pressed', sel ? 'true' : 'false');
      });
    });
    panels.forEach(function (p) {
      var on = p.dataset.fmapPanel === key && p.dataset.fmapG === st.g && p.dataset.fmapArea === st.a;
      p.hidden = !on; p.classList.toggle('is-active', on);
    });
    // 計測はタップしたときだけ（表示・切替では送らない）
    if (byUser) {
      if (window.gtag) gtag('event', 'concern_map', { concern: key, gender: st.g, area: st.a });
      openSheet();
    }
  }
  root.querySelectorAll('[data-fmap]').forEach(function (b) { b.addEventListener('click', function () { lastSpot = b; show(b.dataset.fmap, true); }); });
  function setBtns(list, attr, val) { list.forEach(function (x) { var on = x.dataset[attr] === val; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
  gbtns.forEach(function (b) { b.addEventListener('click', function () { root.dataset.gender = b.dataset.fmapGender; setBtns(gbtns, 'fmapGender', b.dataset.fmapGender); closeSheet(); show(current[state().a], false); }); });
  abtns.forEach(function (b) { b.addEventListener('click', function () { root.dataset.area = b.dataset.fmapArea; setBtns(abtns, 'fmapArea', b.dataset.fmapArea); closeSheet(); show(current[state().a], false); }); });
  if (sheet) {
    var x = sheet.querySelector('.fmap__sheet-close'); if (x) x.addEventListener('click', closeSheet);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
    // マップが画面から外れたら閉じる
    var sec = root.closest('section');
    if (sec && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (en) { if (!en.isIntersecting) closeSheet(); }); }, { threshold: 0 }).observe(sec);
    }
    mq.addEventListener && mq.addEventListener('change', function () { if (!mq.matches) closeSheet(); });
  }
  show('tzone', false);
})();

/* 光が毛根に届く断面：準備なし／後 の切替（操作されるまで自動で交互に） */
(function () {
  var root = document.querySelector('[data-ledmech-root]'); if (!root) return;
  var btns = document.querySelectorAll('[data-ledmech]');
  var auto = null, states = ['before', 'after'], idx = 1;
  function set(state) {
    root.dataset.state = state;
    btns.forEach(function (b) { var on = b.dataset.ledmech === state; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { clearInterval(auto); auto = null; set(b.dataset.ledmech); }); });
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !auto) { auto = setInterval(function () { idx = (idx + 1) % 2; set(states[idx]); }, 3600); }
        else if (!en.isIntersecting && auto) { clearInterval(auto); auto = null; }
      });
    }, { threshold: .4 });
    io.observe(root);
  }
})();

