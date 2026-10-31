/* 目的別ナビ（丸い写真）：押すとページを移らずに、すぐ下に概要パネルを開く。同じ丸をもう一度押すと閉じる */
(function () {
  var items = document.querySelectorAll('.qnav2__item[data-qp]'); if (!items.length) return;
  var wrap = document.getElementById('qpanel');
  function close() {
    items.forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-expanded', 'false'); });
    wrap.querySelectorAll('[data-qp-panel]').forEach(function (p) { p.hidden = true; });
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
      // 選んだ丸が見えるよう横スクロールを合わせる
      if (it.scrollIntoView) it.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      if (window.gtag) gtag('event', 'qnav_open', { item: k });
    });
  });
  wrap.querySelectorAll('[data-qp-close]').forEach(function (a) { a.addEventListener('click', close); });
})();
