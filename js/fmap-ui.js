/* =========================================================
   お悩みマップ 追加UI（main.js の [data-fmap] → show() はそのまま使う）
   1) カード上部の絞り込み「すべて｜フェイシャル｜小顔｜脱毛…」（カードにあるカテゴリだけ表示）
   2) 顔マップ：ラベルを写真の左右の列に置き、点まで細い引き出し線を引く
      - 600px 以上：左右の列に、点の高さに近い位置で重ならないよう並べる
      - 600px 未満：写真の下にラベル一覧（点とラベルは番号で対応）→ 線は引かない
   ========================================================= */
(function () {
  var root = document.querySelector('[data-fmap-root]'); if (!root) return;
  var NS = 'http://www.w3.org/2000/svg';
  var side = window.matchMedia('(min-width: 600px)');

  /* 1) 絞り込み：カードの中にある施術カテゴリだけをボタンにする（すべて＋カテゴリ） */
  var CATS = [['facial', 'フェイシャル'], ['kogao', '小顔'], ['hair', '脱毛'], ['white', 'ホワイトニング'], ['slim', '痩身'], ['body', 'ボディケア']];
  root.querySelectorAll('.kseg').forEach(function (seg) {
    var card = seg.closest('[data-kfilter]');
    var html = '<button type="button" class="kseg__btn is-active" data-kfilter="all" aria-pressed="true">すべて</button>';
    CATS.forEach(function (c) {
      if (card.querySelector('[data-kind="' + c[0] + '"]')) html += '<button type="button" class="kseg__btn kseg__btn--' + c[0] + '" data-kfilter="' + c[0] + '" aria-pressed="false"><i aria-hidden="true"></i>' + c[1] + '</button>';
    });
    seg.innerHTML = html;
    seg.querySelectorAll('[data-kfilter]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.dataset.kfilter;
        card.dataset.kfilter = v;
        seg.querySelectorAll('[data-kfilter]').forEach(function (x) {
          var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        card.querySelectorAll('[data-kind]').forEach(function (el) { el.classList.toggle('is-kout', v !== 'all' && el.dataset.kind !== v); });
        schedule();
      });
    });
  });

  /* 1b) 写真つきタブ（女性の顔／女性のからだ／男性の顔／男性のからだ）。切替は main.js の元ボタンを押して行う */
  var vbtns = document.querySelectorAll('[data-fview]');
  vbtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.fview.split('-');
      var g = document.querySelector('[data-fmap-gender="' + v[0] + '"]'), a = document.querySelector('[data-fmap-area="' + v[1] + '"]');
      if (g) g.click(); if (a) a.click();
      vbtns.forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    });
  });

  /* 2) 顔マップの配置と引き出し線 */
  function visible(el) { return el && el.offsetParent !== null; }
  function layoutCard(card) {
    var body = card.querySelector('.fc__body'); if (!body) return;
    var svg = body.querySelector('.fc__lines');
    var cols = body.querySelectorAll('.fc__col');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!side.matches) {
      cols.forEach(function (c) { c.removeAttribute('data-placed'); c.querySelectorAll('.fc__lab').forEach(function (l) { l.style.removeProperty('--ly'); }); });
      return;
    }
    var br = body.getBoundingClientRect();
    if (!br.width) return;
    svg.setAttribute('viewBox', '0 0 ' + br.width + ' ' + br.height);
    cols.forEach(function (col) {
      var labs = Array.prototype.filter.call(col.querySelectorAll('.fc__lab'), visible);
      var cr = col.getBoundingClientRect(), gap = 10;
      var items = labs.map(function (l) {
        var d = body.querySelector('.fc__dot[data-fmap="' + l.dataset.fmap + '"]');
        var dr = d.getBoundingClientRect();
        var h = l.offsetHeight;
        return { l: l, d: d, h: h, cy: dr.top + dr.height / 2 - cr.top, want: dr.top + dr.height / 2 - cr.top - h / 2 };
      }).sort(function (a, b) { return a.want - b.want; });
      // 上から順に重ならないよう押し下げ → はみ出したら下から押し上げ
      for (var i = 0; i < items.length; i++) {
        var y = Math.max(items[i].want, 0);
        if (i) y = Math.max(y, items[i - 1].y + items[i - 1].h + gap);
        items[i].y = y;
      }
      for (var j = items.length - 1; j >= 0; j--) {
        var lim = j === items.length - 1 ? cr.height - items[j].h : items[j + 1].y - gap - items[j].h;
        items[j].y = Math.max(0, Math.min(items[j].y, lim));
      }
      col.setAttribute('data-placed', '');
      items.forEach(function (it) { it.l.style.setProperty('--ly', it.y + 'px'); });
      // 線：ラベルの内側の端 → 少し水平 → 点
      var isL = col.classList.contains('fc__col--L');
      items.forEach(function (it) {
        var lr = it.l.getBoundingClientRect(), dr = it.d.getBoundingClientRect();
        var ax = (isL ? lr.right : lr.left) - br.left, ay = lr.top + lr.height / 2 - br.top;
        var kx = ax + (isL ? 10 : -10);
        var dx = dr.left + dr.width / 2 - br.left, dy = dr.top + dr.height / 2 - br.top;
        var pts = ax + ',' + ay + ' ' + kx + ',' + ay + ' ' + dx + ',' + dy;
        var active = it.l.classList.contains('is-active');
        ['fc__ln-halo', 'fc__ln'].forEach(function (cls) {
          var p = document.createElementNS(NS, 'polyline');
          p.setAttribute('points', pts);
          p.setAttribute('class', cls + (active ? ' is-active' : ''));
          svg.appendChild(p);
        });
      });
    });
  }
  var raf = null;
  function run() { raf = null; root.querySelectorAll('.fc').forEach(function (c) { if (visible(c)) layoutCard(c); }); }
  function schedule() { if (!raf) raf = requestAnimationFrame(run); }

  // 切替（性別・顔/からだ）・選択・画像読み込み・画面幅の変化で引き直す
  new MutationObserver(schedule).observe(root, { subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
  root.querySelectorAll('.fc__img').forEach(function (img) { if (!img.complete) img.addEventListener('load', schedule); });
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(root); else window.addEventListener('resize', schedule);
  if (side.addEventListener) side.addEventListener('change', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  schedule();
})();
