/* ============================================================
   ARTBOARD 1 — THE FULL AGENDA

   Column logic only; everything drawn lives in card.js so the two
   artboards cannot drift apart visually.

   ONE COLUMN OR TWO. Up to eight shows the list runs full width,
   where a row fits on two lines and the type is at its largest.
   Past that it splits, and the row stacks to three lines because a
   438px column will not hold a date and a name side by side at a
   size worth reading.

   THE SPLIT FOLLOWS THE HEIGHTS, NOT THE COUNT — counting a year
   band as its own height, and never leaving a band as the last
   thing in column one where it would head a column it does not
   belong to.

   THE PITCH ABSORBS THE REST, and the type is a fraction of the
   pitch, so a crowded agenda gets smaller rather than overflowing.
   ============================================================ */
(function (global) {
  'use strict';

  var B = global.Brand, S = global.Store, E = global.Editor, K = global.Card;
  var page = null;

  function groupsOf(rows) {
    var out = [], last = null;
    rows.forEach(function (e) {
      var y = S.yearOf(e);
      if (!last || last.year !== y) { last = { year: y, events: [] }; out.push(last); }
      last.events.push(e);
    });
    return out;
  }

  /* What a column stacks: the shows, plus a band wherever the year
     turns. The first year's band is not in here — it spans the full
     width above the list. */
  function cellsOf(groups) {
    var cells = [];
    groups.forEach(function (g, i) {
      if (i > 0) cells.push({ kind: 'band', year: g.year, events: g.events });
      g.events.forEach(function (e) { cells.push({ kind: 'row', event: e }); });
    });
    return cells;
  }
  function unitsOf(cells) {
    return cells.reduce(function (n, c) {
      return n + (c.kind === 'band' ? K.BAND_RATIO : 1);
    }, 0);
  }

  function layout(rows, F, avail) {
    var groups = groupsOf(rows), cells = cellsOf(groups), total = unitsOf(cells);
    var COL_W2 = (K.CW - 60) / 2;

    if (rows.length <= 8) {
      return { mode: 'one', groups: groups, cols: [cells], colW: K.CW, colX: [K.SIDE],
               pitch: Math.min(F.pitchMax1, avail / Math.max(total, 1)) };
    }

    var best = null, run = 0, i;
    for (i = 1; i < cells.length; i++) {
      run += cells[i - 1].kind === 'band' ? K.BAND_RATIO : 1;
      if (cells[i - 1].kind === 'band') continue;       /* no orphan band */
      var diff = Math.abs(run - (total - run));
      if (!best || diff < best.diff) best = { at: i, diff: diff, a: run, b: total - run };
    }
    if (!best) best = { at: cells.length, a: total, b: 0 };

    /* No floor on the pitch: a floor would let a long agenda run
       past the footer rule. Shrinking keeps the artboard intact and
       the panel warns long before it stops being readable. */
    return {
      mode: 'two', groups: groups,
      cols: [cells.slice(0, best.at), cells.slice(best.at)],
      colW: COL_W2, colX: [K.SIDE, K.SIDE + COL_W2 + 60],
      pitch: Math.min(F.pitchMax2, avail / Math.max(best.a, best.b))
    };
  }

  function build() {
    var st = S.load(), F = K.formatOf(st);
    var rows = S.sorted(st.events);
    var head = K.header(st, F, {
      eyebrow: st.meta.eyebrow, eyebrowPath: 'meta.eyebrow',
      heading: st.meta.heading, headingPath: 'meta.heading',
      range: S.rangeLabel(rows)
    });

    var g0 = rows.length ? groupsOf(rows)[0] : null;
    var bandTop = head.bodyTop;
    /* the first year is banded across the full width, above both columns */
    var probe = layout(rows, F, F.footRule - 28 - bandTop);
    var bodyTop = bandTop + K.bandHeight(probe.pitch);
    var L = layout(rows, F, F.footRule - 28 - bodyTop);

    var hits = [], html = '';
    html += K.ground(F, head.logoCx, head.logoCy);
    html += '<div class="plane-3">' + head.html;

    if (g0) {
      html += K.band(K.SIDE, bandTop, K.CW, {
        label: g0.year, sub: S.seasonFor(st, g0.year, g0.events[0]),
        subPath: 'seasons.' + g0.year
      }, L.pitch, L.mode === 'two' ? L.colW : K.CW);
    }

    L.cols.forEach(function (cells, ci) {
      var x = L.colX[ci], y = bodyTop;
      cells.forEach(function (c) {
        if (c.kind === 'band') {
          html += K.band(x, y, L.colW, {
            label: c.year, sub: S.seasonFor(st, c.year, c.events[0]),
            subPath: 'seasons.' + c.year, tick: true
          }, L.pitch);
          y += K.bandHeight(L.pitch);
        } else {
          html += K.eventRow(x, y, L.colW, c.event, L.pitch);
          hits.push({ id: c.event._id, x: x, y: y, w: L.colW, h: L.pitch });
          y += L.pitch;
        }
      });
      html += K.rule(x, y, L.colW);      /* each column closes on its own hairline */
    });

    html += K.footer(st, F) + '</div>';
    return { html: html, hits: hits, layout: L, F: F };
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

  global.Agenda = { init: function () { page = document.querySelector('.page'); render(); }, render: render };
})(window);
