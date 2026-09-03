/* ============================================================
   THE CARD — shared furniture for both artboards

   WHY THE LIST WAS REBUILT
   The client's live card carried 23 shows in two columns of
   three-line rows: date / name / city + weekday. Measured on a
   phone that put the name at 8pt and the city at 4.6pt. No
   arrangement of one 1080×1920 field fixes that — the depth simply
   is not there — so the list changed in three ways at once:

   · ONE LINE PER SHOW when the list is dense. Date, weekday, name,
     city on a single baseline in aligned columns. There is no
     "small line" any more: the smallest thing on the row is 0.76
     of the name, not 0.56.
   · MONTHS, NOT YEARS, as the bands. A month band is what a
     collector scans for; a year band was a typographic gesture.
   · PAGES. When even one-line rows would set the name under 30px,
     the list is split across cards — a carousel, which is how
     every organiser on Instagram already posts an agenda. Two
     lines per show stay for a quiet card, where they read larger.

   WHY THE SMALL TEXT GREW
   The eyebrow, the period line, the band year and the footer note
   were 21–24px: 7–8pt on a phone. They are 30px now, and the band
   year is a third of the row rather than a sixth.

   WHY TYPE IS A FRACTION OF THE ROW, AND MEASURED
   Every size is a fraction of the row pitch and then measured
   against the real strings on a canvas, so a row can never outgrow
   its height and a name can never run past its column.

   WHY NO COLOUR IS HARD-CODED HERE
   Every element reads its colour from the theme in the store, set
   once per draw by `useTheme`. The lockup is the one thing that
   cannot be themed: it is the supplied master as a PNG.
   ============================================================ */
(function (global) {
  'use strict';

  var B = global.Brand, S = global.Store;
  var W = 1080, SIDE = 72, CW = W - SIDE * 2;

  var FORMATS = {
    story: { key: 'story', h: 1920, logoW: 280, top: 70, head: 130, small: 30,
             footRule: 1640, closing: 56, note: 28, sign: 26, qr: 180,
             pitchMax: 176, minName: 30, wideMin: 40 },
    post:  { key: 'post',  h: 1350, logoW: 200, top: 52, head: 92,  small: 24,
             footRule: 1130, closing: 44, note: 23, sign: 22, qr: 152,
             pitchMax: 150, minName: 24, wideMin: 32 }
  };
  function formatOf(st) { return FORMATS[st.meta.format] || FORMATS.story; }

  var T = S.DEFAULTS ? JSON.parse(JSON.stringify(S.DEFAULTS.theme)) : {};
  function useTheme(st) { T = st.theme; return T; }

  /* ---------- type, as fractions of the row ----------
     'wide' is two lines — date | weekday over name | city — and is
     used while it still sets the name at F.wideMin or better.
     'line' is one line and takes over below that. */
  var SZ = {
    wide: { date: 0.40, name: 0.29, city: 0.175, dateTop: 0.13, nameTop: 0.56 },
    /* one line: the name's share of the row height, and the other
       three cells as ratios OF THE NAME — because on one line the
       four cells compete for width, and they have to shrink together
       or the name is what loses. */
    line: { name: 0.56, dateOf: 1.15, cityOf: 0.76 },
    bandYear: 0.55, bandSub: 0.34
  };
  var CAP = { date: 92, name: 66, city: 34, lineDate: 72, lineName: 60, lineCity: 40,
              bandYear: 64, bandSub: 34 };
  var BAND_RATIO = 0.74;         /* a band, in row-heights */
  var GAP = 22;

  function px(n) { return n.toFixed(1) + 'px'; }
  function cap(v, m) { return Math.min(v, m); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }
  function marker(v) {
    return /^‹/.test(String(v))
      ? '<span style="color:' + T.marker + '">' + esc(v) + '</span>' : esc(v);
  }
  function ed(p) { return ' data-edit="' + p + '"'; }
  function dp(part) { return part ? ' data-part="' + part + '"' : ''; }
  function evf(e, f) { return ' data-ev="' + e._id + '" data-field="' + f + '"'; }
  function rule(x, y, w, color, h, part) {
    return '<div' + dp(part) + ' style="position:absolute;left:' + x + 'px;top:' + y.toFixed(1) +
      'px;width:' + w + 'px;height:' + (h || 1.5) + 'px;background:' +
      (color || T.rowRule) + '"></div>';
  }

  /* ---------- measuring ----------
     Width scales linearly with size, so one measurement at 100px
     gives the exact largest size that fits any width. */
  var FACE = {
    date:  ['Anton', 400, -0.015],
    name:  ['Archivo Narrow', 600, 0.03],
    small: ['Inter', 600, 0.16]
  };
  var _mctx = null;
  function mctx() {
    if (!_mctx) _mctx = document.createElement('canvas').getContext('2d');
    return _mctx;
  }
  function widthAt100(text, face) {
    if (!text) return 0;
    var c2 = mctx(), extra = 0;
    c2.font = face[1] + ' 100px "' + face[0] + '", sans-serif';
    if ('letterSpacing' in c2) c2.letterSpacing = face[2] + 'em';
    else extra = face[2] * 100 * String(text).length;
    var w = c2.measureText(String(text)).width + extra;
    if ('letterSpacing' in c2) c2.letterSpacing = '0px';
    return w;
  }
  function widest(rows, pick, face) {
    var m = 0;
    for (var i = 0; i < rows.length; i++) m = Math.max(m, widthAt100(pick(rows[i]), face));
    return m;
  }
  function fitTo(text, face, room, ceiling) {
    var w = widthAt100(text, face);
    return w > 0 ? Math.min(ceiling, room * 100 / w) : ceiling;
  }

  /* The sizes a row of this height gets, given the strings that
     have to fit in the width. Returns the cell widths too, so the
     one-line row can align its columns across the whole list. */
  function sizesFor(pitch, w, shape, rows) {
    if (!rows.length) return { fd: 10, fn: 10, fc: 10, dateCell: 0, dayCell: 0 };
    var dateW = widest(rows, function (e) { return S.dateLabel(e); }, FACE.date);
    var nameW = widest(rows, function (e) { return e.name; }, FACE.name);
    var cityW = widest(rows, function (e) { return e.city; }, FACE.small);
    var dayW  = widest(rows, function (e) { return S.dayLabel(e); }, FACE.small);

    if (shape === 'wide') {
      var Z = SZ.wide;
      var fc = cap(pitch * Z.city, CAP.city);
      var fd = cap(pitch * Z.date, CAP.date);
      var fn = cap(pitch * Z.name, CAP.name);
      if (dateW > 0) fd = Math.min(fd, (w - GAP - dayW * fc / 100) * 100 / dateW);
      if (nameW > 0) fn = Math.min(fn, (w - GAP - cityW * fc / 100) * 100 / nameW);
      return { fd: Math.max(fd, 6), fn: Math.max(fn, 6), fc: Math.max(fc, 6) };
    }

    /* one line: [date][day][name ........][city]
       The height allows name = 0.56 × pitch. The width allows what
       is left when the four widest strings, at their linked sizes,
       have to sit on one line with three gaps between them. Both
       are solved for the name and the smaller wins; the other three
       cells then follow it at fixed ratios, so the smallest thing on
       the row is always 0.76 of the name — there is no small line. */
    var L = SZ.line;
    var perName = dateW * L.dateOf + dayW * L.cityOf + nameW + cityW * L.cityOf;   /* width at name = 100 */
    var byHeight = pitch * L.name;
    var byWidth = perName > 0 ? (w - GAP * 3) * 100 / perName : byHeight;
    var ln = cap(Math.min(byHeight, byWidth), CAP.lineName);
    var ld = cap(ln * L.dateOf, CAP.lineDate), lc = cap(ln * L.cityOf, CAP.lineCity);
    return { fd: Math.max(ld, 6), fn: Math.max(ln, 6), fc: Math.max(lc, 6),
             dateCell: dateW * ld / 100, dayCell: dayW * lc / 100 };
  }

  /* ---------- planes 1 and 2 ---------- */
  function ground(F, logoCx, logoCy) {
    var D = 660;
    return '<div class="plane-1"' + dp('bg') + ' style="background:' + T.bg + '">' +
      '<svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 ' + W + ' ' + F.h + '">' +
      '<defs>' + B.seigaiha({ id: 'pat', r: 32, stroke: T.pattern, sw: 1.6 }) + '</defs>' +
      '<rect width="' + W + '" height="' + F.h + '" fill="url(#pat)" opacity="0.075"/></svg></div>' +
      '<div class="plane-2" style="overflow:hidden">' +
      '<svg' + dp('halo') + ' style="position:absolute;left:' + (logoCx - D / 2) + 'px;top:' + (logoCy - D / 2) +
      'px;width:' + D + 'px;height:' + D + 'px" viewBox="-450 -450 900 900"><g opacity="0.06">' +
      B.enso({ R: 372, thick: 58, gap: 0.62, start: 1.88, fill: T.halo, seed: 4 }) +
      '</g></svg></div>';
  }

  /* ---------- the header ----------
     Full size is 0.88 of these numbers; it yields further, down to
     0.72, only when the list cannot otherwise breathe. Depth is
     linear in the scale, so it is solved for rather than searched. */
  var COMFORT_PITCH = 96, HEAD_MAX = 0.88, HEAD_MIN = 0.72;

  function headerDepth(F, s) {
    return (s == null ? 1 : s) *
      (F.top + B.logoHeight(F.logoW) + 26 + F.small + 14 +
       F.head * 0.92 + 16 + F.small + 28 + 28);
  }
  function headerScale(F, units) {
    var room = F.footRule - 28 - COMFORT_PITCH * Math.max(units, 1);
    return Math.max(HEAD_MIN, Math.min(HEAD_MAX, room / headerDepth(F, 1)));
  }

  function header(st, F, copy, s) {
    s = s == null ? 1 : s;
    var logoW = F.logoW * s, head = F.head * s, small = F.small * s;
    var logoH = B.logoHeight(logoW);
    var y = F.top * s;
    var h = B.logo({ w: logoW, x: (W - logoW) / 2, y: y });
    var cx = W / 2, cy = y + logoH / 2;
    y += logoH + 26 * s;

    h += '<div class="label"' + ed(copy.eyebrowPath) + dp('eyebrow') + ' style="position:absolute;left:' + SIDE +
      'px;top:' + px(y) + ';width:' + CW + 'px;text-align:center;font-size:' + px(small) +
      ';color:' + T.eyebrow + '">' + esc(copy.eyebrow) + '</div>';
    y += small + 14 * s;

    h += '<div class="display"' + ed(copy.headingPath) + dp('heading') + ' style="position:absolute;left:' + SIDE +
      'px;top:' + px(y) + ';width:' + CW + 'px;text-align:center;font-size:' + px(head) +
      ';color:' + T.heading + '">' + esc(copy.heading) + '</div>';
    y += head * 0.92 + 16 * s;

    h += '<div class="label"' + dp('span') + ' style="position:absolute;left:' + SIDE + 'px;top:' + px(y) +
      ';width:' + CW + 'px;text-align:center;font-size:' + px(small) + ';color:' +
      T.span + '">' + esc(copy.range) + '</div>';
    y += small + 28 * s;

    h += rule(SIDE, y, CW, T.headRule, null, 'headRule');
    h += '<svg' + dp('regmark') + ' style="position:absolute;left:' + (SIDE - 4) + 'px;top:' + px(y - 12) +
      ';width:26px;height:26px" viewBox="-13 -13 26 26">' +
      B.regmark({ r: 7, sw: 1.4, color: T.regmark }) + '</svg>';

    return { html: h, rule: y, bodyTop: y + 28 * s, logoCx: cx, logoCy: cy };
  }

  /* ---------- rows ---------- */
  function wideRow(x, y, w, e, pitch, sz) {
    var Z = SZ.wide;
    var row = function (top, left, right) {
      return '<div style="position:absolute;left:' + x + 'px;top:' + px(y + pitch * top) +
        ';width:' + w + 'px;display:flex;justify-content:space-between;' +
        'align-items:baseline;gap:' + GAP + 'px">' + left + (right || '') + '</div>';
    };
    var date = '<span class="display"' + dp('date') + ' style="font-size:' + px(sz.fd) + ';color:' + T.date +
      ';white-space:nowrap">' + esc(S.dateLabel(e)) + '</span>';
    var day = '<span class="label"' + dp('day') + ' style="font-size:' + px(sz.fc) + ';color:' + T.day +
      ';letter-spacing:0.16em;white-space:nowrap;flex:none">' + esc(S.dayLabel(e)) + '</span>';
    var name = '<span class="label-narrow"' + evf(e, 'name') + dp('name') + ' style="font-size:' + px(sz.fn) +
      ';color:' + T.name + ';letter-spacing:0.03em;white-space:nowrap;overflow:hidden">' + esc(e.name) + '</span>';
    var city = '<span class="label"' + evf(e, 'city') + dp('city') + ' style="font-size:' + px(sz.fc) +
      ';color:' + T.city + ';letter-spacing:0.16em;white-space:nowrap;flex:none">' + marker(e.city) + '</span>';
    return rule(x, y, w, T.rowRule, null, 'rowRule') +
      row(Z.dateTop, date, day) + row(Z.nameTop, name, city);
  }

  /* One line, four aligned columns. The date and weekday cells are
     the width of the widest date and weekday in the list, so every
     name starts on the same vertical and the eye runs down it. */
  function lineRow(x, y, w, e, pitch, sz) {
    var tall = Math.max(sz.fd * 0.92, sz.fn);
    var top = y + (pitch - tall) / 2;
    return rule(x, y, w, T.rowRule, null, 'rowRule') +
      '<div style="position:absolute;left:' + x + 'px;top:' + px(top) + ';width:' + w +
        'px;display:flex;align-items:baseline;gap:' + GAP + 'px">' +
        '<span class="display"' + dp('date') + ' style="flex:none;width:' + px(sz.dateCell) +
          ';font-size:' + px(sz.fd) + ';color:' + T.date + ';white-space:nowrap">' +
          esc(S.dateLabel(e)) + '</span>' +
        '<span class="label"' + dp('day') + ' style="flex:none;width:' + px(sz.dayCell) +
          ';font-size:' + px(sz.fc) + ';color:' + T.day + ';letter-spacing:0.16em;white-space:nowrap">' +
          esc(S.dayLabel(e)) + '</span>' +
        '<span class="label-narrow"' + evf(e, 'name') + dp('name') + ' style="flex:1;min-width:0;font-size:' +
          px(sz.fn) + ';color:' + T.name + ';letter-spacing:0.03em;white-space:nowrap;overflow:hidden">' +
          esc(e.name) + '</span>' +
        '<span class="label"' + evf(e, 'city') + dp('city') + ' style="flex:none;font-size:' + px(sz.fc) +
          ';color:' + T.city + ';letter-spacing:0.16em;white-space:nowrap;text-align:right">' +
          marker(e.city) + '</span>' +
      '</div>';
  }

  function band(x, y, w, o, pitch) {
    var h = pitch * BAND_RATIO;
    var fy = cap(pitch * SZ.bandYear, CAP.bandYear), fs = cap(pitch * SZ.bandSub, CAP.bandSub);
    return rule(x, y, w, T.bandRule, 3, 'bandRule') +
      (o.tick ? '<div' + dp('bandTick') + ' style="position:absolute;left:' + (x - 16) + 'px;top:' + px(y + h * 0.18) +
        ';width:6px;height:' + px(h * 0.6) + ';background:' + T.bandTick + '"></div>' : '') +
      '<div style="position:absolute;left:' + x + 'px;top:' + px(y + h * 0.18) + ';width:' + w +
      'px;display:flex;justify-content:space-between;align-items:baseline">' +
      '<span class="display"' + dp('bandYear') + ' style="font-size:' + px(fy) + ';color:' + T.bandYear +
      ';letter-spacing:0.01em">' + esc(o.label) + '</span>' +
      '<span class="label"' + dp('bandLabel') + ' style="font-size:' + px(fs) + ';color:' + T.bandLabel +
      ';letter-spacing:0.18em">' + esc(o.sub) + '</span></div>';
  }
  function bandHeight(pitch) { return pitch * BAND_RATIO; }

  function emptyRow(y, pitch, x, w) {
    var fc = cap(pitch * 0.30, CAP.lineCity);
    var text = 'GEEN BEURZEN DEZE MAAND';
    fc = Math.min(fc, fitTo(text, FACE.small, w, fc));
    return rule(x, y, w, T.rowRule, null, 'rowRule') +
      '<div class="label"' + dp('city') + ' style="position:absolute;left:' + x + 'px;top:' +
      px(y + (pitch - fc) / 2) + ';width:' + w + 'px;font-size:' + px(fc) + ';color:' + T.city +
      ';letter-spacing:0.16em">' + text + '</div>';
  }

  /* ---------- the list: groups → plan → pages ---------- */
  function groupByMonth(rows) {
    var out = [], last = null;
    rows.forEach(function (e) {
      var k = S.monthKey(e.start), d = S.parse(e.start);
      if (!last || last.key !== k) {
        last = { key: k, label: d ? S.MONTHS[d.getUTCMonth()] : '', sub: d ? String(d.getUTCFullYear()) : '', events: [] };
        out.push(last);
      }
      last.events.push(e);
    });
    return out;
  }
  function unitsOf(groups) {
    return groups.reduce(function (n, g) { return n + BAND_RATIO + Math.max(g.events.length, 1); }, 0);
  }

  /* Two lines while they still read; one line when they would not.
     Both shapes share the pitch — the row count is the row count —
     so this is purely about how the height is spent. */
  function plan(rows, groups, F, avail, w) {
    var pitch = Math.min(F.pitchMax, avail / Math.max(unitsOf(groups), 1));
    var wide = sizesFor(pitch, w, 'wide', rows);
    if (wide.fn >= F.wideMin) return { shape: 'wide', pitch: pitch, sizes: wide };
    return { shape: 'line', pitch: pitch, sizes: sizesFor(pitch, w, 'line', rows) };
  }

  /* Split into the fewest pages on which every page sets the name at
     F.minName or better. Page breaks snap to a month boundary when
     one is within two rows, so a month is not cut for the sake of
     an even count. */
  function paginate(rows, groupFn, F, avail, w, mode) {
    if (mode === 'one' || rows.length <= 1) return [rows];
    for (var n = 1; n <= 6; n++) {
      var pages = splitBalanced(rows, n);
      var ok = pages.every(function (pg) {
        return plan(pg, groupFn(pg), F, avail, w).sizes.fn >= F.minName;
      });
      if (ok) return pages;
    }
    return splitBalanced(rows, 6);
  }
  function splitBalanced(rows, n) {
    if (n <= 1) return [rows];
    var per = Math.ceil(rows.length / n), pages = [], i = 0;
    while (i < rows.length) {
      var end = Math.min(rows.length, i + per);
      for (var d = 0; d <= 2 && end - d > i + 1 && end - d < rows.length; d++) {
        if (S.monthKey(rows[end - d].start) !== S.monthKey(rows[end - d - 1].start)) { end -= d; break; }
      }
      pages.push(rows.slice(i, end)); i = end;
    }
    return pages;
  }

  function drawList(x, y, w, groups, P) {
    var html = '', hits = [], first = true;
    groups.forEach(function (g) {
      html += band(x, y, w, { label: g.label, sub: g.sub, tick: first }, P.pitch);
      first = false;
      y += bandHeight(P.pitch);
      if (!g.events.length) { html += emptyRow(y, P.pitch, x, w); y += P.pitch; return; }
      g.events.forEach(function (e) {
        html += P.shape === 'line' ? lineRow(x, y, w, e, P.pitch, P.sizes)
                                   : wideRow(x, y, w, e, P.pitch, P.sizes);
        hits.push({ id: e._id, x: x, y: y, w: w, h: P.pitch });
        y += P.pitch;
      });
    });
    html += rule(x, y, w, T.rowRule, null, 'rowRule');
    return { html: html, hits: hits, bottom: y };
  }

  /* ---------- the footer ----------
     The closing line is fitted to one line: the client's own copy
     ("WIJ KOPEN IN! DM OM VOORAF EEN DEAL TE MAKEN!") wrapped at the
     fixed size and pushed the signoff off the card. */
  function qrBlock(x, y, box, url) {
    var quiet = Math.round(box * 0.11), code = box - quiet * 2;
    return '<div' + dp('qrFrame') + ' style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + box +
      'px;height:' + box + 'px;background:' + T.qrLight + ';border:2px solid ' + T.qrFrame +
      ';display:flex;align-items:center;justify-content:center">' +
      '<div' + dp('qrDark') + ' style="width:' + code + 'px;height:' + code + 'px">' +
      B.qrSVG(url, { dark: T.qrDark, light: T.qrLight }) + '</div></div>' +
      '<svg style="position:absolute;left:' + (x - 10) + 'px;top:' + (y - 10) +
      'px;width:38px;height:38px" viewBox="0 0 60 60"><g transform="translate(3 3)">' +
      B.bracket({ len: 40, sw: 3.2, color: T.qrFrame }) + '</g></svg>' +
      '<svg style="position:absolute;left:' + (x + box - 28) + 'px;top:' + (y + box - 28) +
      'px;width:38px;height:38px" viewBox="-60 -60 60 60"><g transform="translate(-3 -3)">' +
      B.bracket({ len: 40, sw: 3.2, corner: 'br', color: T.qrFrame }) + '</g></svg>';
  }

  function footer(st, F) {
    var qrX = W - SIDE - F.qr, qrY = F.footRule + 22;
    var textW = CW - F.qr - 56;
    var fClose = Math.max(34, fitTo(st.meta.closing, FACE.date, textW, F.closing));
    return rule(SIDE, F.footRule, CW, T.footRule, null, 'footRule') +
      '<div style="position:absolute;left:' + SIDE + 'px;top:' + (F.footRule + 34) +
      'px;width:' + textW + 'px">' +
      '<div class="display"' + ed('meta.closing') + dp('closing') + ' style="font-size:' + px(fClose) +
      ';color:' + T.closing + ';line-height:1.02;white-space:nowrap;overflow:hidden">' + esc(st.meta.closing) + '</div>' +
      '<div class="body"' + ed('meta.note') + dp('note') + ' style="font-size:' + F.note + 'px;color:' +
      T.note + ';margin-top:14px">' + esc(st.meta.note) + '</div>' +
      '<div style="display:flex;gap:22px;align-items:baseline;margin-top:22px">' +
      '<span class="label"' + ed('meta.handle') + dp('handle') + ' style="font-size:' + F.sign + 'px;color:' +
      T.handle + '">' + esc(st.meta.handle) + '</span>' +
      '<span class="label"' + ed('meta.region') + dp('region') + ' style="font-size:' + F.sign + 'px;color:' +
      T.region + '">' + esc(st.meta.region) + '</span></div></div>' +
      qrBlock(qrX, qrY, F.qr, st.meta.qrUrl);
  }

  global.Card = {
    W: W, SIDE: SIDE, CW: CW, FORMATS: FORMATS, formatOf: formatOf, useTheme: useTheme,
    BAND_RATIO: BAND_RATIO, esc: esc, rule: rule,
    ground: ground, header: header, headerScale: headerScale, headerDepth: headerDepth, HEAD_MAX: HEAD_MAX,
    footer: footer, groupByMonth: groupByMonth, unitsOf: unitsOf,
    plan: plan, paginate: paginate, drawList: drawList, sizesFor: sizesFor
  };
})(window);
