/* 目的別ナビ（丸い写真）：押すとページを移らずに、すぐ下にそのメニューのページをまるごと展開する。
   ページは iframe（?embed=1）で読み込み、高さは中のページから知らせてもらう。同じ丸・「閉じる」でたたむ */
(function () {
  var items = document.querySelectorAll('.qnav2__item[data-qp]'); if (!items.length) return;
  var wrap = document.getElementById('qpanel');
  function close() {
    items.forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-expanded', 'false'); });
    wrap.querySelectorAll('[data-qp-panel]').forEach(function (p) { p.hidden = true; p.classList.remove('is-shown'); });
    wrap.classList.remove('is-open');
  }
  items.forEach(function (it) {
    it.addEventListener('click', function (e) {
      e.preventDefault();
      var k = it.dataset.qp, open = it.classList.contains('is-active');
      close();
      if (open) return;
      it.classList.add('is-active'); it.setAttribute('aria-expanded', 'true');
      var p = wrap.querySelector('[data-qp-panel="' + k + '"]'); p.hidden = false; wrap.classList.add('is-open');
      var fr = p.querySelector('iframe[data-src]');
      if (fr && !fr.getAttribute('src')) fr.setAttribute('src', fr.dataset.src);
      requestAnimationFrame(function () { p.classList.add('is-shown'); });
      if (it.scrollIntoView) it.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      if (window.gtag) gtag('event', 'qnav_open', { item: k });
    });
  });
  // 「閉じる」：たたんで丸の列が見える位置に戻す
  wrap.querySelectorAll('[data-qp-close]').forEach(function (a) {
    a.addEventListener('click', function () {
      close();
      var nav = document.getElementById('service');
      if (nav && a.tagName === 'BUTTON') nav.scrollIntoView({ block: 'start' });
    });
  });
  // 中のページから高さを受け取る
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || typeof d.idEmbedH !== 'number') return;
    wrap.querySelectorAll('iframe.qp__frame').forEach(function (fr) {
      if (fr.contentWindow === e.source) fr.style.height = Math.ceil(d.idEmbedH) + 'px';
    });
  });
})();

/* 展開中のカテゴリ切り替えバー（ヘッダー下に貼りつく）と、「上へ」ボタン */
(function () {
  var wrap = document.getElementById('qpanel'); if (!wrap) return;
  var nav = document.getElementById('service');
  wrap.querySelectorAll('[data-qp-go]').forEach(function (b) {
    b.addEventListener('click', function () {
      var it = document.querySelector('.qnav2__item[data-qp="' + b.dataset.qpGo + '"]');
      if (!it) return;
      if (!it.classList.contains('is-active')) it.click();
      if (nav) nav.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  });
  // バーの選択状態を、開いているパネルに合わせる
  new MutationObserver(function () {
    var open = wrap.querySelector('[data-qp-panel]:not([hidden])');
    var k = open ? open.dataset.qpPanel : '';
    wrap.querySelectorAll('[data-qp-go]').forEach(function (b) { var on = b.dataset.qpGo === k; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    wrap.classList.toggle('has-page', !!(open && open.classList.contains('qp__panel--page')));
  }).observe(wrap, { subtree: true, attributes: true, attributeFilter: ['hidden'] });

  var tt = document.getElementById('toTop'); if (!tt) return;
  function upd() { tt.classList.toggle('is-show', window.scrollY > window.innerHeight * 1.2); }
  window.addEventListener('scroll', upd, { passive: true }); upd();
  tt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
})();
