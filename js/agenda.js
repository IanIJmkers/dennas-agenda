/* ============================================================
   ARTBOARD 1 — THE FULL AGENDA

   Every show, grouped by month, one column, as many cards as it
   takes to keep the name at F.minName. Everything drawn lives in
   card.js; this file only decides which rows are on which page and
   asks for the header scale the page needs.

   The two-column layout is gone. Halving the width to save height
   forced three lines per show, which spent the height straight back
   and left the city at 4.6pt on a phone. One column of one-line rows
   keeps every item on the row at one size, and pages carry what one
   card cannot.
   ============================================================ */
(function (global) {
  'use strict';

  var S = global.Store, E = global.Editor, K = global.Card;
  var page = null, pageIndex = 0, pageCount = 1;

  /* The header holds its full size while pages absorb the density —
     every slide of a carousel should carry the same header. It yields
     only when the client has forced everything onto one card. */
  function headerScaleFor(st, F, rows) {
    if (st.meta.pages !== 'one') return K.HEAD_MAX;
    var avail = F.footRule - 28 - K.headerDepth(F, K.HEAD_MAX);
    return K.headerScale(F, K.unitsOf(K.groupByMonth(rows)));
  }

  function build() {
    var st = S.load(), F = K.formatOf(st);
    K.useTheme(st);
    var rows = S.sorted(st.events).filter(function (e) { return e.start; });

    var scale = headerScaleFor(st, F, rows);
    var pagesAll = K.paginate(rows, K.groupByMonth, F, F.footRule - 28 - K.headerDepth(F, scale),
                              K.CW, st.meta.pages);
    pageCount = pagesAll.length;
    if (pageIndex >= pageCount) pageIndex = pageCount - 1;
    var pageRows = pagesAll[pageIndex] || [];

    var range = S.rangeLabel(rows);
    if (pageCount > 1) range += '   ·   ' + (pageIndex + 1) + '/' + pageCount;
    var head = K.header(st, F, {
      eyebrow: st.meta.eyebrow, eyebrowPath: 'meta.eyebrow',
      heading: st.meta.heading, headingPath: 'meta.heading',
      range: range
    }, scale);

    var avail = F.footRule - 28 - head.bodyTop;
    var groups = K.groupByMonth(pageRows);
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

  global.Agenda = {
    init: function () { page = document.querySelector('.page'); render(); },
    render: render,
    pages: function () { return pageCount; },
    page: function () { return pageIndex; },
    setPage: function (i) { pageIndex = Math.max(0, Math.min(pageCount - 1, i)); render(); }
  };
})(window);
