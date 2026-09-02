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

  /* Type and the baselines it sits on, both as fractions of the row.
     Two sets, because the two measures hold different amounts.

     The narrow numbers are the ones that were got wrong first: at
     0.40/0.29/0.175 the three lines came to 0.83 of the row and left
     2px between the city and the next hairline, so the list read as
     one grey mass instead of as rows. Dropping to 0.355/0.265/0.16
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
      ? '<span style="color:' + B.C.sealRed + '">' + esc(v) + '</span>' : esc(v);
  }
  function ed(p) { return ' data-edit="' + p + '"'; }
  function evf(e, f) { return ' data-ev="' + e._id + '" data-field="' + f + '"'; }
  function rule(x, y, w, color, h) {
    return '<div style="position:absolute;left:' + x + 'px;top:' + y.toFixed(1) +
      'px;width:' + w + 'px;height:' + (h || 1.5) + 'px;background:' +
      (color || B.C.gold) + '"></div>';
  }

  /* ---------- planes 1 and 2 ----------
     The gesture is now centred on the lockup rather than thrown into
     the top-right corner. The mark is itself an enso, so a large
     faint one behind it reads as a halo around the focal point —
     the same move the story-sale artboard makes in the print set —
     instead of as an unrelated smudge beside it. */
  function ground(F, logoCx, logoCy) {
    /* The halo is sized to the lockup, not to the page: at 840px it
       swept straight through the headline and read as a grey ring
       drawn over the type. At 660 it closes just outside the mark,
       and the brush gap is rotated to the foot of the circle so the
       stroke opens downward and the headline sits in the opening
       rather than under the stroke. */
    var D = 660;
    return '<div class="plane-1" style="background:' + B.C.paper + '">' +
      '<svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 ' + W + ' ' + F.h + '">' +
      '<defs>' + B.seigaiha({ id: 'pat', r: 32, stroke: B.C.inkNavy, sw: 1.6 }) + '</defs>' +
      '<rect width="' + W + '" height="' + F.h + '" fill="url(#pat)" opacity="0.075"/></svg></div>' +
      '<div class="plane-2" style="overflow:hidden">' +
      '<svg style="position:absolute;left:' + (logoCx - D / 2) + 'px;top:' + (logoCy - D / 2) +
      'px;width:' + D + 'px;height:' + D + 'px" viewBox="-450 -450 900 900"><g opacity="0.06">' +
      B.enso({ R: 372, thick: 58, gap: 0.62, start: 1.88, fill: B.C.inkNavy, seed: 4 }) +
      '</g></svg></div>';
  }

  /* ---------- the header ----------
     Centred: lockup, then the line that says what this is, then the
     word, then the span it covers. Returns where the body starts so
     no caller has to know the header's internal spacing. */
  function header(st, F, copy) {
    var logoH = B.logoHeight(F.logoW);
    var y = F.top;
    var h = B.logo({ w: F.logoW, x: (W - F.logoW) / 2, y: y });
    var cx = W / 2, cy = y + logoH / 2;
    y += logoH + 26;

    h += '<div class="label"' + ed(copy.eyebrowPath) + ' style="position:absolute;left:' + SIDE +
      'px;top:' + px(y) + ';width:' + CW + 'px;text-align:center;font-size:' + F.small +
      'px;color:' + B.C.steelOnPaper + '">' + esc(copy.eyebrow) + '</div>';
    y += F.small + 14;

    h += '<div class="display"' + ed(copy.headingPath) + ' style="position:absolute;left:' + SIDE +
      'px;top:' + px(y) + ';width:' + CW + 'px;text-align:center;font-size:' + F.head +
      'px;color:' + B.C.inkNavy + '">' + esc(copy.heading) + '</div>';
    y += F.head * 0.92 + 16;

    h += '<div class="label" style="position:absolute;left:' + SIDE + 'px;top:' + px(y) +
      ';width:' + CW + 'px;text-align:center;font-size:' + F.small + 'px;color:' +
      B.C.steelOnPaper + '">' + esc(copy.range) + '</div>';
    y += F.small + 28;

    h += rule(SIDE, y, CW);
    h += '<svg style="position:absolute;left:' + (SIDE - 4) + 'px;top:' + px(y - 12) +
      ';width:26px;height:26px" viewBox="-13 -13 26 26">' + B.regmark({ r: 7, sw: 1.4 }) + '</svg>';

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
    var date = '<span class="display" style="font-size:' + px(fd) + ';color:' + B.C.inkNavy +
      ';white-space:nowrap">' + esc(S.dateLabel(e)) + '</span>';
    var day = '<span class="label" style="font-size:' + px(fc) + ';color:' + B.C.steelOnPaper +
      ';letter-spacing:0.16em;white-space:nowrap;flex:none">' + esc(S.dayLabel(e)) + '</span>';
    var name = '<span class="label-narrow"' + evf(e, 'name') + ' style="font-size:' + px(fn) +
      ';color:' + B.C.inkNavy + ';letter-spacing:0.03em;white-space:nowrap;overflow:hidden">' +
      esc(e.name) + '</span>';
    var city = '<span class="label"' + evf(e, 'city') + ' style="font-size:' + px(fc) +
      ';color:' + B.C.steelOnPaper + ';letter-spacing:0.16em;white-space:nowrap;' +
      (wide ? 'flex:none' : 'overflow:hidden') + '">' + marker(e.city) + '</span>';

    return rule(x, y, w) + (wide
      ? row(Z.dateTop, date, day) + row(Z.nameTop, name, city)
      : row(Z.dateTop, date) + row(Z.nameTop, name) + row(Z.cityTop, city, day));
  }

  function band(x, y, w, o, pitch, textW) {
    var h = pitch * BAND_RATIO;
    var fy = cap(pitch * SZ.bandYear, CAP.bandYear), fs = cap(pitch * SZ.bandSub, CAP.city);
    return rule(x, y, w, B.C.gold, 3) +
      (o.tick ? '<div style="position:absolute;left:' + (x - 16) + 'px;top:' + px(y + h * 0.20) +
        ';width:6px;height:' + px(h * 0.55) + ';background:' + B.C.sealRed + '"></div>' : '') +
      '<div style="position:absolute;left:' + x + 'px;top:' + px(y + h * 0.20) + ';width:' +
      (textW || w) + 'px;display:flex;justify-content:space-between;align-items:baseline">' +
      '<span class="display" style="font-size:' + px(fy) + ';color:' + B.C.inkNavy +
      ';letter-spacing:0.01em">' + esc(o.label) + '</span>' +
      '<span class="label"' + (o.subPath ? ed(o.subPath) : '') + ' style="font-size:' + px(fs) +
      ';color:' + B.C.steelOnPaper + ';letter-spacing:0.18em">' + esc(o.sub) + '</span></div>';
  }
  function bandHeight(pitch) { return pitch * BAND_RATIO; }

  function qrBlock(x, y, box, url) {
    var quiet = Math.round(box * 0.11), code = box - quiet * 2;
    return '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + box +
      'px;height:' + box + 'px;background:' + B.C.paper + ';border:2px solid ' + B.C.gold +
      ';display:flex;align-items:center;justify-content:center">' +
      '<div style="width:' + code + 'px;height:' + code + 'px">' + B.qrSVG(url) + '</div></div>' +
      '<svg style="position:absolute;left:' + (x - 10) + 'px;top:' + (y - 10) +
      'px;width:38px;height:38px" viewBox="0 0 60 60"><g transform="translate(3 3)">' +
      B.bracket({ len: 40, sw: 3.2 }) + '</g></svg>' +
      '<svg style="position:absolute;left:' + (x + box - 28) + 'px;top:' + (y + box - 28) +
      'px;width:38px;height:38px" viewBox="-60 -60 60 60"><g transform="translate(-3 -3)">' +
      B.bracket({ len: 40, sw: 3.2, corner: 'br' }) + '</g></svg>';
  }

  function footer(st, F) {
    var qrX = W - SIDE - F.qr, qrY = F.footRule + 22;
    return rule(SIDE, F.footRule, CW) +
      '<div style="position:absolute;left:' + SIDE + 'px;top:' + (F.footRule + 34) +
      'px;width:' + (CW - F.qr - 56) + 'px">' +
      '<div class="display"' + ed('meta.closing') + ' style="font-size:' + F.closing +
      'px;color:' + B.C.inkNavy + ';line-height:1.02">' + esc(st.meta.closing) + '</div>' +
      '<div class="body"' + ed('meta.note') + ' style="font-size:' + F.note + 'px;color:' +
      B.C.steelOnPaper + ';margin-top:16px">' + esc(st.meta.note) + '</div>' +
      '<div style="display:flex;gap:22px;align-items:baseline;margin-top:26px">' +
      '<span class="label"' + ed('meta.handle') + ' style="font-size:' + F.sign + 'px;color:' +
      B.C.inkNavy + '">' + esc(st.meta.handle) + '</span>' +
      '<span class="label"' + ed('meta.region') + ' style="font-size:' + F.sign + 'px;color:' +
      B.C.steelOnPaper + '">' + esc(st.meta.region) + '</span></div></div>' +
      qrBlock(qrX, qrY, F.qr, st.meta.qrUrl);
  }

  global.Card = {
    W: W, SIDE: SIDE, CW: CW, FORMATS: FORMATS, formatOf: formatOf,
    BAND_RATIO: BAND_RATIO, WIDE: WIDE,
    esc: esc, marker: marker, ed: ed, evf: evf, rule: rule,
    ground: ground, header: header, eventRow: eventRow, band: band,
    bandHeight: bandHeight, footer: footer, qrBlock: qrBlock
  };
})(window);
