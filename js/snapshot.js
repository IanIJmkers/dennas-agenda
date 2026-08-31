/* ============================================================
   ARTBOARD 2 — THE TWO-MONTH SNAPSHOT

   The same piece with a shorter horizon. It is not a second agenda
   to keep up to date: it reads the same shows as the full agenda
   and shows the two months you point it at, so there is only ever
   one list to maintain and the two artboards cannot contradict
   each other.

   What changes is the treatment, not the content. With four or
   five shows instead of fifteen the two columns would be stubby,
   so this one runs a single full-width column and spends the space
   it saves on size — the date sets nearly twice as large as it
   does on the full agenda, which is what makes this the one to
   post when a fair is actually coming up.

   A month with nothing in it still gets its band, and says so. An
   empty month is information: it tells a collector not to wait.
   ============================================================ */
(function (global) {
  'use strict';

  var B = global.Brand, S = global.Store, E = global.Editor;
  var W = 1080, H = 1350, SIDE = 72, CW = W - SIDE * 2;
  var HEAD_RULE = 302, BODY_TOP = 336, FOOT_RULE = 1124, QR_BOX = 152;
  var AVAIL = FOOT_RULE - 28 - BODY_TOP;      /* 760 */
  var BAND_RATIO = 56 / 88, PITCH_REF = 88;
  var PITCH_MAX = 128;

  /* Same rule as the full agenda: the row height sets the type, and
     the second line plus its air has to fit inside the pitch. */
  function scaleFor(pitch) {
    return Math.max(0.35, Math.min(1.45, Math.min(pitch / PITCH_REF, (pitch - 4) / 70)));
  }

  var page = null;

  /* ---------- the window ---------- */
  function monthsOf(from) {
    var p = String(from || '').split('-');
    var y = +p[0], m = +p[1] - 1;
    if (!y || isNaN(m)) { var d = new Date(); y = d.getFullYear(); m = d.getMonth(); }
    var out = [];
    for (var i = 0; i < 2; i++) {
      var yy = y + Math.floor((m + i) / 12), mm = (m + i) % 12;
      out.push({ y: yy, m: mm, key: yy + '-' + (mm + 1 < 10 ? '0' : '') + (mm + 1) });
    }
    return out;
  }

  /* A show belongs to the window if either of its days does — a
     weekend that straddles the turn of a month must not fall out. */
  function inWindow(e, months) {
    var keys = months.map(function (x) { return x.key; });
    return keys.indexOf(S.monthKey(e.start)) >= 0 ||
           (e.end && keys.indexOf(S.monthKey(e.end)) >= 0);
  }

  function blocksOf(rows, months) {
    return months.map(function (mo) {
      return {
        month: mo,
        events: rows.filter(function (e) { return S.monthKey(e.start) === mo.key; })
      };
    });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }
  function marker(v) {
    return /^‹/.test(String(v))
      ? '<span style="color:' + B.C.sealRed + '">' + esc(v) + '</span>' : esc(v);
  }
  function rule(x, y, w, color, h) {
    return '<div style="position:absolute;left:' + x + 'px;top:' + y.toFixed(1) +
      'px;width:' + w + 'px;height:' + (h || 1.5) + 'px;background:' + (color || B.C.gold) + '"></div>';
  }
  function ed(p) { return ' data-edit="' + p + '"'; }
  function evf(e, f) { return ' data-ev="' + e._id + '" data-field="' + f + '"'; }

  function eventRow(y, e, k) {
    return rule(SIDE, y, CW) +
      '<div style="position:absolute;left:' + SIDE + 'px;top:' + (y + 15 * k).toFixed(1) +
        'px;width:' + CW + 'px;display:flex;justify-content:space-between;align-items:baseline;gap:24px">' +
        '<span class="label-narrow"' + evf(e, 'name') + ' style="font-size:' + (26 * k).toFixed(1) +
          'px;color:' + B.C.inkNavy + ';letter-spacing:0.03em;white-space:nowrap;overflow:hidden">' +
          esc(e.name) + '</span>' +
        '<span class="display" style="font-size:' + (30 * k).toFixed(1) + 'px;color:' +
          B.C.inkNavy + ';white-space:nowrap;flex:none">' + esc(S.dateLabel(e)) + '</span></div>' +
      '<div style="position:absolute;left:' + SIDE + 'px;top:' + (y + 53 * k).toFixed(1) +
        'px;width:' + CW + 'px;display:flex;justify-content:space-between;align-items:baseline;gap:24px">' +
        '<span class="label"' + evf(e, 'city') + ' style="font-size:' + (17 * k).toFixed(1) +
          'px;color:' + B.C.steelOnPaper + ';letter-spacing:0.16em;white-space:nowrap;overflow:hidden">' +
          marker(e.city) + '</span>' +
        '<span class="label" style="font-size:' + (17 * k).toFixed(1) + 'px;color:' +
          B.C.steelOnPaper + ';letter-spacing:0.16em;white-space:nowrap;flex:none">' +
          esc(S.dayLabel(e)) + '</span></div>';
  }

  function monthBand(y, mo, k, first) {
    return rule(SIDE, y, CW, B.C.gold, 3) +
      (first ? '<div style="position:absolute;left:' + (SIDE - 14) + 'px;top:' + (y + 12 * k).toFixed(1) +
        'px;width:5px;height:' + (34 * k).toFixed(0) + 'px;background:' + B.C.sealRed + '"></div>' : '') +
      '<div style="position:absolute;left:' + SIDE + 'px;top:' + (y + 14 * k).toFixed(1) +
        'px;width:' + CW + 'px;display:flex;justify-content:space-between;align-items:baseline">' +
        '<span class="display" style="font-size:' + (38 * k).toFixed(1) + 'px;color:' +
          B.C.inkNavy + ';letter-spacing:0.01em">' + S.MONTHS[mo.m] + '</span>' +
        '<span class="label" style="font-size:' + (17 * k).toFixed(1) + 'px;color:' +
          B.C.steelOnPaper + ';letter-spacing:0.18em">' + mo.y + '</span></div>';
  }

  function emptyRow(y, k) {
    return rule(SIDE, y, CW) +
      '<div class="label" style="position:absolute;left:' + SIDE + 'px;top:' + (y + 24 * k).toFixed(1) +
      'px;width:' + CW + 'px;font-size:' + (17 * k).toFixed(1) + 'px;color:' + B.C.steelOnPaper +
      ';letter-spacing:0.16em">GEEN BEURZEN DEZE MAAND</div>';
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

  function build() {
    var st = S.load();
    var months = monthsOf(st.snapshot.from);
    var rows = S.sorted(st.events).filter(function (e) { return inWindow(e, months); });
    var blocks = blocksOf(rows, months);

    var units = blocks.reduce(function (n, b) {
      return n + BAND_RATIO + Math.max(b.events.length, 1);
    }, 0);
    var pitch = Math.min(PITCH_MAX, AVAIL / units);
    var k = scaleFor(pitch);
    var bandH = pitch * BAND_RATIO;
    var hits = [];

    var span = S.MONTHS_SHORT[months[0].m] + ' — ' + S.MONTHS_SHORT[months[1].m] +
               ' ’' + String(months[1].y).slice(2);

    var html = '';
    html += '<div class="plane-1" style="background:' + B.C.paper + '">' +
      '<svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<defs>' + B.seigaiha({ id: 'pat', r: 32, stroke: B.C.inkNavy, sw: 1.6 }) + '</defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#pat)" opacity="0.075"/></svg></div>';

    html += '<div class="plane-2" style="overflow:hidden">' +
      '<svg style="position:absolute;left:' + (W - 250) + 'px;top:-430px;width:780px;height:780px" ' +
      'viewBox="-450 -450 900 900"><g opacity="0.06">' +
      B.enso({ R: 375, thick: 60, gap: 0.45, start: -1.2, fill: B.C.inkNavy, seed: 6 }) +
      '</g></svg></div>';

    html += '<div class="plane-3">';
    html += B.logo({ w: 186, x: SIDE, y: 56 });
    html += '<div style="position:absolute;left:' + SIDE + 'px;top:80px;width:' + CW + 'px;text-align:right">' +
      '<div class="label"' + ed('snapshot.eyebrow') + ' style="font-size:21px;color:' +
        B.C.steelOnPaper + '">' + esc(st.snapshot.eyebrow) + '</div>' +
      '<div class="display"' + ed('snapshot.heading') + ' style="font-size:96px;color:' +
        B.C.inkNavy + ';margin-top:18px">' + esc(st.snapshot.heading) + '</div>' +
      '<div class="label" style="font-size:21px;color:' + B.C.steelOnPaper +
        ';margin-top:20px">' + span + '</div></div>';
    html += rule(SIDE, HEAD_RULE, CW);

    var y = BODY_TOP;
    blocks.forEach(function (b, bi) {
      html += monthBand(y, b.month, k, bi === 0);
      y += bandH;
      if (!b.events.length) { html += emptyRow(y, k); y += pitch; return; }
      b.events.forEach(function (e) {
        html += eventRow(y, e, k);
        hits.push({ id: e._id, x: SIDE, y: y, w: CW, h: pitch });
        y += pitch;
      });
    });
    html += rule(SIDE, y, CW);

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
          B.C.steelOnPaper + '">' + esc(st.meta.region) + '</span></div></div>';
    html += qrBlock(qrX, qrY, QR_BOX, st.meta.qrUrl);
    html += '</div>';

    html += '<div class="plane-4"><svg style="position:absolute;left:' + (SIDE - 4) +
      'px;top:' + (HEAD_RULE - 12) + 'px;width:26px;height:26px" viewBox="-13 -13 26 26">' +
      B.regmark({ r: 7, sw: 1.4 }) + '</svg></div>';

    return { html: html, hits: hits, layout: { pitch: pitch, mode: 'one', count: rows.length } };
  }

  function render() {
    var out = build();
    page.innerHTML = out.html;
    out.hits.forEach(function (h) {
      var d = document.createElement('div');
      d.className = 'chrome row-hit';
      d.style.cssText = 'left:' + h.x + 'px;top:' + h.y + 'px;width:' + h.w + 'px;height:' + h.h + 'px';
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

  global.Snapshot = {
    init: function () { page = document.querySelector('.page'); render(); },
    render: render, monthsOf: monthsOf
  };
})(window);
