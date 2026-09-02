/* ============================================================
   THE CARD — shared furniture for both artboards

   Rewritten around two things the client asked for after seeing a
   competitor's story: the mark should be the focal point, and the
   dates should carry at arm's length on a phone.

   WHY THE FORMAT CHANGED
   Both cannot happen at 4:5. A centred lockup large enough to be
   the focal point costs ~490px of depth, and fifteen shows in what
   is left of a 1350px card forces the type back down to where it
   started. At 9:16 there are 570 more pixels to spend, which is
   exactly what the reference is — a story. So story is the
   default, and 4:5 stays available for the feed, where the layout
   simply gets tighter and says so.

   WHY TYPE IS A FRACTION OF THE ROW
   Every size here is a fraction of the row pitch rather than a
   fixed number scaled by a factor. It means the row can never
   outgrow its own height — the bug that used to let hairlines cut
   through the city line — and it means "bigger type" and "fewer
   shows" are the same lever, which is the honest relationship.

   WHY THE DATE LEADS
   On the old card the show name led and the date was flushed
   right. Nobody reads an agenda that way: they scan for when, then
   read what. The date now opens every row, set in Anton at the
   largest size in the list.

   WHY NO COLOUR IS HARD-CODED HERE
   Every element reads its colour from the theme in the store, so
   the client can set any of them. `useTheme` is called once at the
   top of a build and the rest of the file draws from `T`. The one
   thing that cannot be themed is the lockup: it is the supplied
   master as a PNG, and the brief forbids recolouring it.
   ============================================================ */
(function (global) {
  'use strict';

  var B = global.Brand, S = global.Store;
  var W = 1080, SIDE = 72, CW = W - SIDE * 2;

  var FORMATS = {
    story: { key: 'story', h: 1920, logoW: 280, top: 70, head: 130, small: 24,
             footRule: 1640, closing: 56, note: 24, sign: 22, qr: 180,
             pitchMax1: 170, pitchMax2: 132 },
    post:  { key: 'post',  h: 1350, logoW: 200, top: 52, head: 92,  small: 20,
             footRule: 1130, closing: 44, note: 21, sign: 20, qr: 152,
             pitchMax1: 150, pitchMax2: 118 }
  };
  function formatOf(st) { return FORMATS[st.meta.format] || FORMATS.story; }

  /* The live palette for the current draw. Set by useTheme so no
     drawing function has to be handed a colour it does not choose. */
  var T = S.DEFAULTS ? JSON.parse(JSON.stringify(S.DEFAULTS.theme)) : {};
  function useTheme(st) { T = st.theme; return T; }

  /* Type and the baselines it sits on, both as fractions of the row.
     Two sets, because the two measures hold different amounts.

     The narrow numbers are the ones that were got wrong first: at
     0.40/0.29/0.175 the three lines came to 0.83 of the row and left
     2px between the city and the next hairline, so the list read as
     one grey mass instead of as rows. Dropping to 0.355/0.275/0.155
     brings the glyphs to 0.75 and leaves a quarter of the row as
     air — enough for the block to group and the rule to separate. */
  var SZ = {
    wide:   { date: 0.40,  name: 0.29,  city: 0.175,
              dateTop: 0.13, nameTop: 0.56 },
    narrow: { date: 0.355, name: 0.275, city: 0.155,
              dateTop: 0.07, nameTop: 0.447, cityTop: 0.762 },
    bandYear: 0.42, bandSub: 0.165
  };
  var CAP = { date: 68, name: 50, city: 27, bandYear: 70 };
  var BAND_RATIO = 0.64;
  /* A column narrower than this cannot hold a date and a name side
     by side at these sizes, so the row stacks to three lines. */
  var WIDE = 700;

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
  /* Names the theme key an element is painted with, so hovering a
     swatch in the panel can outline the thing it changes. Editor
     furniture only — the export strips the outline, not the tag. */
  function dp(part) { return part ? ' data-part="' + part + '"' : ''; }
  function evf(e, f) { return ' data-ev="' + e._id + '" data-field="' + f + '"'; }
  function rule(x, y, w, color, h, part) {
    return '<div' + dp(part) + ' style="position:absolute;left:' + x + 'px;top:' + y.toFixed(1) +
      'px;width:' + w + 'px;height:' + (h || 1.5) + 'px;background:' +
      (color || T.rowRule) + '"></div>';
  }

  /* ---------- planes 1 and 2 ----------
     The gesture is centred on the lockup rather than thrown into the
     top-right corner. The mark is itself an enso, so a large faint
     one behind it reads as a halo around the focal point — the same
     move the story-sale artboard makes in the print set — instead of
     as an unrelated smudge beside it. Sized to the lockup: at 840px
     it swept through the headline and read as a ring drawn over the
     type. At 660 it closes just outside the mark, and the brush gap
     is rotated to the foot of the circle so the stroke opens
     downward and the headline sits in the opening. */
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
     Centred: lockup, then the line that says what this is, then the
     word, then the span it covers. Returns where the body starts so
     no caller has to know the header's internal spacing. Every gap
     here is paid for fifteen times over in the list below it. */
  function header(st, F, copy) {
    var logoH = B.logoHeight(F.logoW);
    var y = F.top;
    var h = B.logo({ w: F.logoW, x: (W - F.logoW) / 2, y: y });
    var cx = W / 2, cy = y + logoH / 2;
    y += logoH + 26;

    h += '<div class="label"' + ed(copy.eyebrowPath) + dp('eyebrow') + ' style="position:absolute;left:' + SIDE +
      'px;top:' + px(y) + ';width:' + CW + 'px;text-align:center;font-size:' + F.small +
      'px;color:' + T.eyebrow + '">' + esc(copy.eyebrow) + '</div>';
    y += F.small + 14;

    h += '<div class="display"' + ed(copy.headingPath) + dp('heading') + ' style="position:absolute;left:' + SIDE +
      'px;top:' + px(y) + ';width:' + CW + 'px;text-align:center;font-size:' + F.head +
      'px;color:' + T.heading + '">' + esc(copy.heading) + '</div>';
    y += F.head * 0.92 + 16;

    h += '<div class="label"' + dp('span') + ' style="position:absolute;left:' + SIDE + 'px;top:' + px(y) +
      ';width:' + CW + 'px;text-align:center;font-size:' + F.small + 'px;color:' +
      T.span + '">' + esc(copy.range) + '</div>';
    y += F.small + 28;

    h += rule(SIDE, y, CW, T.headRule, null, 'headRule');
    h += '<svg' + dp('regmark') + ' style="position:absolute;left:' + (SIDE - 4) + 'px;top:' + px(y - 12) +
      ';width:26px;height:26px" viewBox="-13 -13 26 26">' +
      B.regmark({ r: 7, sw: 1.4, color: T.regmark }) + '</svg>';

    return { html: h, rule: y, bodyTop: y + 28, logoCx: cx, logoCy: cy };
  }

  /* ---------- one show ----------
     Wide measure: the date opens the row and the weekday closes it;
     name and city sit on the line below, left and right.

     Narrow measure: the date takes a line to itself and the two
     quiet items pair up underneath. Flushing the weekday right of
     the date instead leaves it stranded 300px from the number it
     belongs to, with nothing between them; parking it beside the
     city gives both small items a partner and lets the date own
     its line, which is the point of leading with it. */
  function eventRow(x, y, w, e, pitch) {
    var wide = w >= WIDE, Z = wide ? SZ.wide : SZ.narrow;
    var fd = cap(pitch * Z.date, CAP.date),
        fn = cap(pitch * Z.name, CAP.name),
        fc = cap(pitch * Z.city, CAP.city);
    var row = function (top, left, right) {
      return '<div style="position:absolute;left:' + x + 'px;top:' + px(y + pitch * top) +
        ';width:' + w + 'px;display:flex;justify-content:space-between;' +
        'align-items:baseline;gap:18px">' + left + (right || '') + '</div>';
    };
    var date = '<span class="display"' + dp('date') + ' style="font-size:' + px(fd) + ';color:' + T.date +
      ';white-space:nowrap">' + esc(S.dateLabel(e)) + '</span>';
    var day = '<span class="label"' + dp('day') + ' style="font-size:' + px(fc) + ';color:' + T.day +
      ';letter-spacing:0.16em;white-space:nowrap;flex:none">' + esc(S.dayLabel(e)) + '</span>';
    var name = '<span class="label-narrow"' + evf(e, 'name') + dp('name') + ' style="font-size:' + px(fn) +
      ';color:' + T.name + ';letter-spacing:0.03em;white-space:nowrap;overflow:hidden">' +
      esc(e.name) + '</span>';
    var city = '<span class="label"' + evf(e, 'city') + dp('city') + ' style="font-size:' + px(fc) +
      ';color:' + T.city + ';letter-spacing:0.16em;white-space:nowrap;' +
      (wide ? 'flex:none' : 'overflow:hidden') + '">' + marker(e.city) + '</span>';

    return rule(x, y, w, T.rowRule, null, 'rowRule') + (wide
      ? row(Z.dateTop, date, day) + row(Z.nameTop, name, city)
      : row(Z.dateTop, date) + row(Z.nameTop, name) + row(Z.cityTop, city, day));
  }

  function band(x, y, w, o, pitch, textW) {
    var h = pitch * BAND_RATIO;
    var fy = cap(pitch * SZ.bandYear, CAP.bandYear), fs = cap(pitch * SZ.bandSub, CAP.city);
    return rule(x, y, w, T.bandRule, 3, 'bandRule') +
      (o.tick ? '<div' + dp('bandTick') + ' style="position:absolute;left:' + (x - 16) + 'px;top:' + px(y + h * 0.20) +
        ';width:6px;height:' + px(h * 0.55) + ';background:' + T.bandTick + '"></div>' : '') +
      '<div style="position:absolute;left:' + x + 'px;top:' + px(y + h * 0.20) + ';width:' +
      (textW || w) + 'px;display:flex;justify-content:space-between;align-items:baseline">' +
      '<span class="display"' + dp('bandYear') + ' style="font-size:' + px(fy) + ';color:' + T.bandYear +
      ';letter-spacing:0.01em">' + esc(o.label) + '</span>' +
      '<span class="label"' + (o.subPath ? ed(o.subPath) : '') + dp('bandLabel') + ' style="font-size:' + px(fs) +
      ';color:' + T.bandLabel + ';letter-spacing:0.18em">' + esc(o.sub) + '</span></div>';
  }
  function bandHeight(pitch) { return pitch * BAND_RATIO; }

  /* The quiet zone is the well's own padding rather than baked into
     the SVG, so it stays measurable — same rule as on the banner. */
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
    return rule(SIDE, F.footRule, CW, T.footRule, null, 'footRule') +
      '<div style="position:absolute;left:' + SIDE + 'px;top:' + (F.footRule + 34) +
      'px;width:' + (CW - F.qr - 56) + 'px">' +
      '<div class="display"' + ed('meta.closing') + dp('closing') + ' style="font-size:' + F.closing +
      'px;color:' + T.closing + ';line-height:1.02">' + esc(st.meta.closing) + '</div>' +
      '<div class="body"' + ed('meta.note') + dp('note') + ' style="font-size:' + F.note + 'px;color:' +
      T.note + ';margin-top:16px">' + esc(st.meta.note) + '</div>' +
      '<div style="display:flex;gap:22px;align-items:baseline;margin-top:26px">' +
      '<span class="label"' + ed('meta.handle') + dp('handle') + ' style="font-size:' + F.sign + 'px;color:' +
      T.handle + '">' + esc(st.meta.handle) + '</span>' +
      '<span class="label"' + ed('meta.region') + dp('region') + ' style="font-size:' + F.sign + 'px;color:' +
      T.region + '">' + esc(st.meta.region) + '</span></div></div>' +
      qrBlock(qrX, qrY, F.qr, st.meta.qrUrl);
  }

  /* A quiet line for a month with nothing in it. An empty month is
     information: it tells a collector not to wait. */
  function emptyRow(y, pitch) {
    return rule(SIDE, y, CW, T.rowRule, null, 'rowRule') +
      '<div class="label"' + dp('city') + ' style="position:absolute;left:' + SIDE + 'px;top:' +
      px(y + pitch * 0.30) + ';width:' + CW + 'px;font-size:' +
      px(cap(pitch * 0.175, CAP.city)) + ';color:' + T.city +
      ';letter-spacing:0.16em">GEEN BEURZEN DEZE MAAND</div>';
  }

  global.Card = {
    W: W, SIDE: SIDE, CW: CW, FORMATS: FORMATS, formatOf: formatOf,
    BAND_RATIO: BAND_RATIO, WIDE: WIDE, useTheme: useTheme,
    esc: esc, marker: marker, ed: ed, evf: evf, rule: rule,
    ground: ground, header: header, eventRow: eventRow, band: band,
    bandHeight: bandHeight, footer: footer, qrBlock: qrBlock, emptyRow: emptyRow
  };
})(window);
