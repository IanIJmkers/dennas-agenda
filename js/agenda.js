/* ============================================================
   ARTBOARD 1 — THE FULL AGENDA

   The printed layout, made elastic. The original was set for
   exactly fifteen shows; this one is edited by someone who will
   add a show the week before a fair and delete one when a date
   falls through, so every measurement that was a constant is now
   derived from how many shows there are.

   Three behaviours carry the weight:

   ONE COLUMN OR TWO. Up to eight shows the list runs full width at
   a larger size, which is what a short agenda wants. Past that it
   splits into the two columns of the printed piece.

   THE SPLIT FOLLOWS THE HEIGHTS, NOT THE COUNT. Column one takes
   whatever balances the two, counting a year band as its own
   height — and a band is never left as the last thing in column
   one, where it would head a column it does not belong to.

   THE PITCH ABSORBS THE REST. Row height is whatever divides the
   available depth, floored at 54px. Type scales with it, so the
   artboard stays legible rather than staying on its grid.
   ============================================================ */
(function (global) {
  'use strict';

  var B = global.Brand, S = global.Store, E = global.Editor;
  var W = 1080, H = 1350, SIDE = 72, CW = W - SIDE * 2, GUT = 60;
  var COL_W2 = (CW - GUT) / 2, COL_X2 = [SIDE, SIDE + COL_W2 + GUT];

  var HEAD_RULE = 302, BAND_Y = 336, BODY_TOP = 392;
  var FOOT_RULE = 1124, QR_BOX = 152;
  var AVAIL = FOOT_RULE - 28 - BODY_TOP;      /* 704 — the depth a column may use */
  var BAND_RATIO = 56 / 88;                    /* a band, in row-heights */
  var PITCH_MAX = 118, PITCH_REF = 88;

  /* Type scale for a given row height. Two limits, and the tighter
     one wins. The first keeps the printed proportions: at the
     reference 88px pitch this returns exactly 1, so a fifteen-show
     agenda is pixel-identical to the press artboard. The second is
     what stops the rows colliding — a row's second line sits at 53k
     and is 17k tall, so 70k plus a little air has to fit inside the
     pitch. Without it a crowded agenda kept printing full-size type
     into half-size rows and the hairlines struck through the city. */
  function scaleFor(pitch) {
    return Math.max(0.35, Math.min(1.45, Math.min(pitch / PITCH_REF, (pitch - 4) / 70)));
  }

  var page = null;

  /* ---------- geometry ---------- */
  function groupsOf(rows) {
    var out = [], last = null;
    rows.forEach(function (e) {
      var y = S.yearOf(e);
      if (!last || last.year !== y) { last = { year: y, events: [] }; out.push(last); }
      last.events.push(e);
    });
    return out;
  }

  /* Cells are what a column actually stacks: the shows, plus a band
     wherever the year turns. The first year's band is not in here —
     it spans both columns above the list. */
  function cellsOf(groups) {
    var cells = [];
    groups.forEach(function (g, i) {
      if (i > 0) cells.push({ kind: 'band', year: g.year, events: g.events });
      g.events.forEach(function (e) { cells.push({ kind: 'row', event: e }); });
    });
    return cells;
  }

  function unitsOf(cells) {
    return cells.reduce(function (n, c) { return n + (c.kind === 'band' ? BAND_RATIO : 1); }, 0);
  }

  function layout(rows) {
    var groups = groupsOf(rows);
    var cells = cellsOf(groups);
    var total = unitsOf(cells);

    /* Short agendas read better full width than as two stubby columns. */
    if (rows.length <= 8) {
      return { mode: 'one', groups: groups, cols: [cells], colW: CW, colX: [SIDE],
               pitch: Math.min(PITCH_MAX, AVAIL / Math.max(total, 1)) };
    }

    /* Walk the split and keep the one that balances best. A band may
       not close column one: it would sit at the foot of a column
       whose shows all belong to the year above it. */
    var best = null, run = 0, i;
    for (i = 1; i < cells.length; i++) {
      run += cells[i - 1].kind === 'band' ? BAND_RATIO : 1;
      if (cells[i - 1].kind === 'band') continue;
      var diff = Math.abs(run - (total - run));
      if (!best || diff < best.diff) best = { at: i, diff: diff, a: run, b: total - run };
    }
    if (!best) best = { at: cells.length, a: total, b: 0 };
    /* No floor on the pitch. A floor would let a long agenda run past
       the footer rule; letting it shrink keeps the artboard intact and
       the panel raises a warning long before it gets unreadable. */
    var maxUnits = Math.max(best.a, best.b);
    var pitch = Math.min(PITCH_REF, AVAIL / maxUnits);
    return {
      mode: 'two', groups: groups,
      cols: [cells.slice(0, best.at), cells.slice(best.at)],
      colW: COL_W2, colX: COL_X2, pitch: pitch
    };
  }

  /* ---------- pieces ---------- */
  function rule(x, y, w, color, h) {
    return '<div style="position:absolute;left:' + x + 'px;top:' + y.toFixed(1) +
      'px;width:' + w + 'px;height:' + (h || 1.5) + 'px;background:' + (color || B.C.gold) + '"></div>';
  }
  function marker(v) {
    return /^‹/.test(String(v))
      ? '<span style="color:' + B.C.sealRed + '">' + esc(v) + '</span>' : esc(v);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }
  function ed(path) { return ' data-edit="' + path + '"'; }
  function evf(e, f) { return ' data-ev="' + e._id + '" data-field="' + f + '"'; }

  /* One show: name and date on a baseline, city and weekday half a
     step down and half a step quieter — the spec-row idiom the rest
     of the system uses, because an agenda is a spec table. */
  function eventRow(x, y, w, e, k) {
    return rule(x, y, w) +
      '<div style="position:absolute;left:' + x + 'px;top:' + (y + 15 * k).toFixed(1) +
        'px;width:' + w + 'px;display:flex;justify-content:space-between;' +
        'align-items:baseline;gap:' + (16 * k).toFixed(0) + 'px">' +
        '<span class="label-narrow"' + evf(e, 'name') + ' style="font-size:' + (26 * k).toFixed(1) +
          'px;color:' + B.C.inkNavy + ';letter-spacing:0.03em;white-space:nowrap;overflow:hidden">' +
          esc(e.name) + '</span>' +
        '<span class="display" style="font-size:' + (30 * k).toFixed(1) + 'px;color:' +
          B.C.inkNavy + ';white-space:nowrap;flex:none">' + esc(S.dateLabel(e)) + '</span>' +
      '</div>' +
      '<div style="position:absolute;left:' + x + 'px;top:' + (y + 53 * k).toFixed(1) +
        'px;width:' + w + 'px;display:flex;justify-content:space-between;' +
        'align-items:baseline;gap:' + (16 * k).toFixed(0) + 'px">' +
        '<span class="label"' + evf(e, 'city') + ' style="font-size:' + (17 * k).toFixed(1) +
          'px;color:' + B.C.steelOnPaper + ';letter-spacing:0.16em;white-space:nowrap;overflow:hidden">' +
          marker(e.city) + '</span>' +
        '<span class="label" style="font-size:' + (17 * k).toFixed(1) + 'px;color:' +
          B.C.steelOnPaper + ';letter-spacing:0.16em;white-space:nowrap;flex:none">' +
          esc(S.dayLabel(e)) + '</span>' +
      '</div>';
  }

  /* The year band. A heavier rule than a show gets, so the break
     registers before the number is read. `textW` differs from `w`
     exactly once: the first band spans both columns but hangs its
     season off column one, because flushed to the far margin the
     word reads as a heading for column two instead. */
  function yearBand(x, y, w, o, k, textW) {
    return rule(x, y, w, B.C.gold, 3) +
      '<div style="position:absolute;left:' + x + 'px;top:' + (y + 14 * k).toFixed(1) +
        'px;width:' + (textW || w) + 'px;display:flex;justify-content:space-between;align-items:baseline">' +
        '<span class="display" style="font-size:' + (38 * k).toFixed(1) + 'px;color:' +
          B.C.inkNavy + ';letter-spacing:0.01em">' + esc(o.year) + '</span>' +
        '<span class="label"' + ed('seasons.' + o.year) + ' style="font-size:' + (17 * k).toFixed(1) +
          'px;color:' + B.C.steelOnPaper + ';letter-spacing:0.18em">' + esc(o.season) + '</span>' +
      '</div>' +
      (o.tick ? '<div style="position:absolute;left:' + (x - 14) + 'px;top:' + (y + 12 * k).toFixed(1) +
        'px;width:5px;height:' + (34 * k).toFixed(0) + 'px;background:' + B.C.sealRed + '"></div>' : '');
  }

  function qrBlock(x, y, box, url) {
    var quiet = Math.round(box * 0.11), code = box - quiet * 2;
    return '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + box +
        'px;height:' + box + 'px;background:' + B.C.paper + ';border:2px solid ' + B.C.gold +
        ';display:flex;align-items:center;justify-content:center">' +
        '<div style="width:' + code + 'px;height:' + code + 'px">' + B.qrSVG(url) + '</div></div>' +
      '<svg style="position:absolute;left:' + (x - 9) + 'px;top:' + (y - 9) +
        'px;width:34px;height:34px" viewBox="0 0 60 60"><g transform="translate(3 3)">' +
        B.bracket({ len: 40, sw: 3.2 }) + '</g></svg>' +
      '<svg style="position:absolute;left:' + (x + box - 25) + 'px;top:' + (y + box - 25) +
        'px;width:34px;height:34px" viewBox="-60 -60 60 60"><g transform="translate(-3 -3)">' +
        B.bracket({ len: 40, sw: 3.2, corner: 'br' }) + '</g></svg>';
  }

  /* ---------- the artboard ---------- */
  function build() {
    var st = S.load();
    var rows = S.sorted(st.events);
    var L = layout(rows);
    var k = scaleFor(L.pitch);
    var bandH = L.pitch * BAND_RATIO;
    var hits = [];

    var g0 = L.groups[0];
    var html = '';

    /* plane 1 — the field */
    html += '<div class="plane-1" style="background:' + B.C.paper + '">' +
      '<svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<defs>' + B.seigaiha({ id: 'pat', r: 32, stroke: B.C.inkNavy, sw: 1.6 }) + '</defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#pat)" opacity="0.075"/></svg></div>';

    /* plane 2 — the one oversized gesture, pushed far enough off the
       top-right that only the near arc lands, and stopping above the
       header rule: a brush stroke crossing a column of dates reads
       as a smudge, not as depth. */
    html += '<div class="plane-2" style="overflow:hidden">' +
      '<svg style="position:absolute;left:' + (W - 250) + 'px;top:-430px;width:780px;height:780px" ' +
      'viewBox="-450 -450 900 900"><g opacity="0.06">' +
      B.enso({ R: 375, thick: 60, gap: 0.45, start: -1.2, fill: B.C.inkNavy, seed: 6 }) +
      '</g></svg></div>';

    html += '<div class="plane-3">';
    html += B.logo({ w: 186, x: SIDE, y: 56 });

    html += '<div style="position:absolute;left:' + SIDE + 'px;top:80px;width:' + CW + 'px;text-align:right">' +
      '<div class="label"' + ed('meta.eyebrow') + ' style="font-size:21px;color:' +
        B.C.steelOnPaper + '">' + esc(st.meta.eyebrow) + '</div>' +
      '<div class="display"' + ed('meta.heading') + ' style="font-size:96px;color:' +
        B.C.inkNavy + ';margin-top:18px">' + esc(st.meta.heading) + '</div>' +
      '<div class="label" style="font-size:21px;color:' + B.C.steelOnPaper +
        ';margin-top:20px">' + esc(S.rangeLabel(rows)) + '</div></div>';

    html += rule(SIDE, HEAD_RULE, CW);

    /* the first year, banded across the whole width */
    if (g0) {
      html += yearBand(SIDE, BAND_Y, CW,
        { year: g0.year, season: S.seasonFor(st, g0.year, g0.events[0]) }, 1,
        L.mode === 'two' ? COL_W2 : CW);
    }

    /* the columns */
    L.cols.forEach(function (cells, ci) {
      var x = L.colX[ci], y = BODY_TOP;
      cells.forEach(function (c) {
        if (c.kind === 'band') {
          html += yearBand(x, y, L.colW,
            { year: c.year, season: S.seasonFor(st, c.year, c.events[0]), tick: true }, k);
          y += bandH;
        } else {
          html += eventRow(x, y, L.colW, c.event, k);
          hits.push({ id: c.event._id, x: x, y: y, w: L.colW, h: L.pitch });
          y += L.pitch;
        }
      });
      html += rule(x, y, L.colW);   /* each column closes on its own hairline */
    });

    /* the footer */
    var qrX = W - SIDE - QR_BOX, qrY = FOOT_RULE + 18;
    html += rule(SIDE, FOOT_RULE, CW);
    html += '<div style="position:absolute;left:' + SIDE + 'px;top:' + (FOOT_RULE + 30) +
      'px;width:' + (CW - QR_BOX - 60) + 'px">' +
      '<div class="display"' + ed('meta.closing') + ' style="font-size:44px;color:' +
        B.C.inkNavy + ';line-height:1.02">' + esc(st.meta.closing) + '</div>' +
      '<div class="body"' + ed('meta.note') + ' style="font-size:21px;color:' +
        B.C.steelOnPaper + ';margin-top:16px">' + esc(st.meta.note) + '</div>' +
      '<div style="display:flex;gap:22px;align-items:baseline;margin-top:26px">' +
        '<span class="label"' + ed('meta.handle') + ' style="font-size:20px;color:' +
          B.C.inkNavy + '">' + esc(st.meta.handle) + '</span>' +
        '<span class="label"' + ed('meta.region') + ' style="font-size:20px;color:' +
          B.C.steelOnPaper + '">' + esc(st.meta.region) + '</span>' +
      '</div></div>';
    html += qrBlock(qrX, qrY, QR_BOX, st.meta.qrUrl);
    html += '</div>';

    html += '<div class="plane-4"><svg style="position:absolute;left:' + (SIDE - 4) +
      'px;top:' + (HEAD_RULE - 12) + 'px;width:26px;height:26px" viewBox="-13 -13 26 26">' +
      B.regmark({ r: 7, sw: 1.4 }) + '</svg></div>';

    return { html: html, hits: hits, layout: L };
  }

  function render() {
    var out = build();
    page.innerHTML = out.html;

    /* click targets over each show — editor only, dropped on export */
    out.hits.forEach(function (h) {
      var d = document.createElement('div');
      d.className = 'chrome row-hit';
      d.style.cssText = 'left:' + h.x + 'px;top:' + h.y + 'px;width:' + h.w +
        'px;height:' + h.h + 'px';
      d.setAttribute('data-hit', h.id);
      d.title = 'Bewerk deze beurs';
      d.onclick = function () { global.AgendaPanel.focus(h.id); };
      page.appendChild(d);
    });

    E.bindEditables(page, null);
    bindEventFields();
    E.fitStage();
    global.AgendaPanel.refresh(out.layout);
  }

  /* Name and city are typed straight onto the artboard. They are not
     store paths but fields of a show, so they bind by id. */
  function bindEventFields() {
    var nodes = page.querySelectorAll('[data-ev]');
    Array.prototype.forEach.call(nodes, function (n) {
      n.setAttribute('contenteditable', 'plaintext-only');
      n.setAttribute('spellcheck', 'false');
      var id = n.getAttribute('data-ev'), f = n.getAttribute('data-field');
      n.addEventListener('input', function () {
        var st = S.load(), i = idx(st, id);
        if (i < 0) return;
        st.events[i][f] = n.textContent.trim();
        S.persist();          /* no redraw: the caret is in this node */
      });
      n.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); n.blur(); }
      });
      n.addEventListener('blur', function () { render(); });
    });
  }
  function idx(st, id) {
    for (var i = 0; i < st.events.length; i++) if (st.events[i]._id === id) return i;
    return -1;
  }

  global.Agenda = {
    init: function () { page = document.querySelector('.page'); render(); },
    render: render
  };
})(window);
