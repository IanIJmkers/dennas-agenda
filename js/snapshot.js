/* ============================================================
   ARTBOARD 2 — THE TWO-MONTH SNAPSHOT

   The same card with a shorter horizon. It is not a second agenda
   to maintain: it reads the same shows and shows the two months it
   is pointed at, so the two artboards cannot contradict each other.

   With four or five shows instead of fifteen it never needs the
   second column, which is the whole point — the single full-width
   measure is where the date sets largest. This is the one to post
   when a fair is actually coming up.

   A month with nothing in it still gets its band and says so. An
   empty month is information: it tells a collector not to wait.
   ============================================================ */
(function (global) {
  'use strict';

  var S = global.Store, E = global.Editor, K = global.Card;
  var page = null;

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

  function build() {
    var st = S.load(), F = K.formatOf(st);
    K.useTheme(st);
    var months = monthsOf(st.snapshot.from);
    var keys = months.map(function (x) { return x.key; });
    var rows = S.sorted(st.events).filter(function (e) {
      /* either day may land in the window — a weekend across the turn
         of a month must not fall out of it */
      return keys.indexOf(S.monthKey(e.start)) >= 0 ||
             (e.end && keys.indexOf(S.monthKey(e.end)) >= 0);
    });
    var blocks = months.map(function (mo) {
      return { month: mo, events: rows.filter(function (e) { return S.monthKey(e.start) === mo.key; }) };
    });

    var span = S.MONTHS_SHORT[months[0].m] + ' — ' + S.MONTHS_SHORT[months[1].m] +
               ' ’' + String(months[1].y).slice(2);
    /* the cheaper of the two shapes decides how much the header
       has to give back, if anything */
    var uOne = blocks.reduce(function (n, b) {
      return n + K.BAND_RATIO + Math.max(b.events.length, 1); }, 0);
    var uTwo = Math.max(
      K.BAND_RATIO + Math.max(blocks[0].events.length, 1),
      K.BAND_RATIO + Math.max(blocks[1].events.length, 1));
    var head = K.header(st, F, {
      eyebrow: st.snapshot.eyebrow, eyebrowPath: 'snapshot.eyebrow',
      heading: st.snapshot.heading, headingPath: 'snapshot.heading',
      range: span
    }, K.headerScale(F, Math.min(uOne, uTwo)));

    /* One column, or a month per column? Ten shows over two months is
       the case that settles it: stacked in one column they set at
       24px, side by side at 36px, because halving the rows per column
       more than pays back halving the width. So both are costed and
       the one that sets the larger show name wins — which for a quiet
       two months is still the single full-width column. */
    var avail = F.footRule - 28 - head.bodyTop;
    var unitsOf = function (bs) {
      return bs.reduce(function (n, b) {
        return n + K.BAND_RATIO + Math.max(b.events.length, 1);
      }, 0);
    };
    var p1 = Math.min(F.pitchMax1, avail / Math.max(unitsOf(blocks), 1));
    var one = { cols: [blocks], colW: K.CW, colX: [K.SIDE], pitch: p1,
                sizes: K.sizesFor(p1, K.CW, true, rows) };

    var COL_W2 = (K.CW - 60) / 2;
    var p2 = Math.min(F.pitchMax2, avail /
      Math.max(unitsOf([blocks[0]]), unitsOf([blocks[1]]), 1));
    var two = { cols: [[blocks[0]], [blocks[1]]], colW: COL_W2,
                colX: [K.SIDE, K.SIDE + COL_W2 + 60], pitch: p2,
                sizes: K.sizesFor(p2, COL_W2, false, rows) };

    var L = K.betterPlan(one, two);
    var pitch = L.pitch;

    var hits = [], html = K.ground(F, head.logoCx, head.logoCy) + '<div class="plane-3">' + head.html;
    var bottom = head.bodyTop;

    L.cols.forEach(function (col, ci) {
      var x = L.colX[ci], y = head.bodyTop;
      col.forEach(function (b, bi) {
        html += K.band(x, y, L.colW,
          { label: S.MONTHS[b.month.m], sub: String(b.month.y),
            tick: ci === 0 && bi === 0 }, pitch);
        y += K.bandHeight(pitch);
        if (!b.events.length) {
          html += K.emptyRow(y, pitch, x, L.colW);
          y += pitch;
          return;
        }
        b.events.forEach(function (e) {
          html += K.eventRow(x, y, L.colW, e, pitch, L.sizes);
          hits.push({ id: e._id, x: x, y: y, w: L.colW, h: pitch });
          y += pitch;
        });
      });
      html += K.rule(x, y, L.colW, null, null, 'rowRule');
      bottom = Math.max(bottom, y);
    });

    html += K.footer(st, F) + '</div>';

    return { html: html, hits: hits, F: F,
             layout: { pitch: pitch, mode: L.cols.length > 1 ? 'two' : 'one',
                       count: rows.length } };
  }

  function render() {
    var out = build();
    E.setSize(K.W, out.F.h);
    page.innerHTML = out.html;
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
    global.AgendaPanel.refresh(out.layout);
  }

  global.Snapshot = {
    init: function () { page = document.querySelector('.page'); render(); },
    render: render, monthsOf: monthsOf
  };
})(window);
