/* ============================================================
   ARTBOARD 2 — THE TWO-MONTH SNAPSHOT

   The same list machinery as the full agenda, pointed at two months.
   It reads the same shows, so the two cards cannot disagree; what
   differs is that an empty month still gets its band and says so —
   an empty month is information, it tells a collector not to wait.
   ============================================================ */
(function (global) {
  'use strict';

  var S = global.Store, E = global.Editor, K = global.Card;
  var page = null, pageIndex = 0, pageCount = 1;

  function monthsOf(from) {
    var p = String(from || '').split('-'), y = +p[0], m = +p[1] - 1;
    if (!y || isNaN(m)) { var d = new Date(); y = d.getFullYear(); m = d.getMonth(); }
    var out = [];
    for (var i = 0; i < 2; i++) {
      var yy = y + Math.floor((m + i) / 12), mm = (m + i) % 12;
      out.push({ y: yy, m: mm, key: yy + '-' + (mm + 1 < 10 ? '0' : '') + (mm + 1) });
    }
    return out;
  }

  /* both months, always, in window order — empty ones included */
  function groupsFor(months) {
    return function (rows) {
      return months.map(function (mo) {
        return { key: mo.key, label: S.MONTHS[mo.m], sub: String(mo.y),
                 events: rows.filter(function (e) { return S.monthKey(e.start) === mo.key; }) };
      });
    };
  }

  function build() {
    var st = S.load(), F = K.formatOf(st);
    K.useTheme(st);
    var months = monthsOf(st.snapshot.from);
    var keys = months.map(function (x) { return x.key; });
    var rows = S.sorted(st.events).filter(function (e) {
      return keys.indexOf(S.monthKey(e.start)) >= 0 ||
             (e.end && keys.indexOf(S.monthKey(e.end)) >= 0);
    });
    var groupFn = groupsFor(months);

    var scale = st.meta.pages === 'one'
      ? K.headerScale(F, K.unitsOf(groupFn(rows)))
      : K.HEAD_MAX;
    var pagesAll = K.paginate(rows, groupFn, F, F.footRule - 28 - K.headerDepth(F, scale),
                              K.CW, st.meta.pages);
    pageCount = pagesAll.length;
    if (pageIndex >= pageCount) pageIndex = pageCount - 1;
    var pageRows = pagesAll[pageIndex] || [];

    var span = S.MONTHS_SHORT[months[0].m] + ' — ' + S.MONTHS_SHORT[months[1].m] +
               ' ’' + String(months[1].y).slice(2);
    if (pageCount > 1) span += '   ·   ' + (pageIndex + 1) + '/' + pageCount;
    var head = K.header(st, F, {
      eyebrow: st.snapshot.eyebrow, eyebrowPath: 'snapshot.eyebrow',
      heading: st.snapshot.heading, headingPath: 'snapshot.heading',
      range: span
    }, scale);

    var avail = F.footRule - 28 - head.bodyTop;
    /* when paginated, a page carries only its own months; an empty
       month is shown once, on the last page, so it is still said */
    var last = pageIndex === pageCount - 1;
    var groups = pageCount > 1
      ? groupFn(pageRows).filter(function (g) {
          return g.events.length || (last && !rows.some(function (e) { return S.monthKey(e.start) === g.key; }));
        })
      : groupFn(pageRows);
    var P = K.plan(pageRows, groups, F, avail, K.CW);
    var list = K.drawList(K.SIDE, head.bodyTop, K.CW, groups, P);

    var html = K.ground(F, head.logoCx, head.logoCy) +
      '<div class="plane-3">' + head.html + list.html + K.footer(st, F) + '</div>';
    return { html: html, hits: list.hits, F: F,
             layout: { pitch: P.pitch, shape: P.shape, name: P.sizes.fn,
                       pages: pageCount, page: pageIndex, count: rows.length } };
  }

  function render() {
    var out = build();
    E.setSize(K.W, out.F.h);
    page.innerHTML = out.html;
    page.setAttribute('data-shape', out.layout.shape);
    page.setAttribute('data-pages', out.layout.pages);
    page.setAttribute('data-page', out.layout.page + 1);
    out.hits.forEach(function (h) {
      var d = document.createElement('div');
      d.className = 'chrome row-hit';
      d.style.cssText = 'left:' + h.x + 'px;top:' + h.y.toFixed(1) + 'px;width:' + h.w +
        'px;height:' + h.h.toFixed(1) + 'px';
      d.title = 'Bewerk deze beurs';
      d.onclick = function () { global.AgendaPanel.focus(h.id); };
      page.appendChild(d);
    });
    E.bindEditables(page, null);
    E.bindEventFields(page, render);
    E.fitStage();
    E.pager(pageCount, pageIndex);
    global.AgendaPanel.refresh(out.layout);
  }

  global.Snapshot = {
    init: function () { page = document.querySelector('.page'); render(); },
    render: render, monthsOf: monthsOf,
    pages: function () { return pageCount; },
    page: function () { return pageIndex; },
    setPage: function (i) { pageIndex = Math.max(0, Math.min(pageCount - 1, i)); render(); }
  };
})(window);
