/* ============================================================
   BRAND KIT (browser build)

   The motifs, the logo lockup and the QR, ported from src/ so the
   editable artboards draw from the same geometry as the printed
   collateral. Every constant below was measured off the supplied
   master; none of it is re-derived here. If the print system's
   numbers change, they change here too.
   ============================================================ */
(function (global) {
  'use strict';

  var C = {
    inkNavy: '#1B3A5C', deepInk: '#10233A',
    gold: '#C3A063', paleGold: '#E3D2AC',
    paper: '#F4F1EA', sealRed: '#B5372B',
    steelOnPaper: '#40587A', steelOnNavy: '#A8BBD0'
  };

  /* ---------- SEIGAIHA — overlapping wave crests ----------
     Concentric upper-half arcs on a half-offset lattice, so the
     crests interlock. Tile is 2r wide by r tall. */
  function seigaiha(o) {
    o = o || {};
    var id = o.id || 'seigaiha', r = o.r || 60,
        stroke = o.stroke || C.inkNavy, sw = o.sw || 2.2, rings = o.rings || 5;
    function arcs(cx) {
      var out = '';
      for (var i = 0; i < rings; i++) {
        var rr = r * (1 - i / rings);
        if (rr < sw) continue;
        out += '<path d="M ' + (cx - rr) + ' ' + r + ' A ' + rr + ' ' + rr +
               ' 0 0 1 ' + (cx + rr) + ' ' + r + '"/>';
      }
      return out;
    }
    return '<pattern id="' + id + '" width="' + (2 * r) + '" height="' + r +
           '" patternUnits="userSpaceOnUse">' +
           '<g fill="none" stroke="' + stroke + '" stroke-width="' + sw +
           '" stroke-linecap="round">' +
           arcs(0) + arcs(r) + arcs(2 * r) +
           '<g transform="translate(0 ' + (-r) + ')">' +
           arcs(r / 2) + arcs(r * 1.5) + arcs(-r / 2) + '</g></g></pattern>';
  }

  /* ---------- ENSO — brush-drawn circle ----------
     A filled envelope: the outer edge sampled at R+w(t), the inner
     at R-w(t), where w tapers to nothing at both ends and carries a
     low-frequency wobble so the edge reads as bristle, not vector.
     This is the plane-2 "oversized graphic gesture". */
  function enso(o) {
    o = o || {};
    var R = o.R || 500, gap = o.gap == null ? 0.42 : o.gap,
        thick = o.thick || 62, start = o.start == null ? -0.35 : o.start,
        fill = o.fill || C.inkNavy, seed = o.seed || 1,
        steps = o.steps || 300, drag = o.drag || 1;
    var TAU = Math.PI * 2, sweep = TAU - gap, ph = seed * 1.7;

    /* Sums of a few sines, not hash noise — at this step count noise
       resolves into a sawtooth rather than into bristle. */
    function mod(t, a1, f1, a2, f2, off) {
      return a1 * Math.sin(f1 * t * TAU + ph + off) +
             a2 * Math.sin(f2 * t * TAU + ph * 1.9 + off);
    }
    /* Width envelope: the brush lands hard, loads, then lifts dry. */
    function wAt(t) {
      var entry = Math.pow(Math.min(1, t / 0.045), 0.85);
      var exit = Math.pow(Math.min(1, (1 - t) / 0.30), 1.25);
      var belly = 0.80 + 0.32 * Math.sin(Math.PI * Math.pow(t, 0.92));
      return thick * belly * entry * exit * (1 + mod(t, 0.11, 2.3, 0.05, 5.1, 0)) * drag;
    }

    var outer = [], inner = [], i, t, a, w, rr, ca, sa, oJit, iJit;
    for (i = 0; i <= steps; i++) {
      t = i / steps; a = start + sweep * t; w = wAt(t);
      rr = R * (1 + mod(t, 0.014, 1.4, 0.006, 2.9, 0.6));
      ca = Math.cos(a); sa = Math.sin(a);
      oJit = w * mod(t, 0.055, 11, 0.03, 19, 1.3);
      iJit = w * mod(t, 0.022, 13, 0.012, 23, 2.7);
      outer.push([(rr + w / 2 + oJit) * ca, (rr + w / 2 + oJit) * sa]);
      inner.push([(rr - w / 2 + iJit) * ca, (rr - w / 2 + iJit) * sa]);
    }
    function fmt(p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
    var d = 'M ' + fmt(outer[0]);
    for (i = 1; i < outer.length; i++) d += ' L ' + fmt(outer[i]);
    for (i = inner.length - 1; i >= 0; i--) d += ' L ' + fmt(inner[i]);
    d += ' Z';
    return '<path d="' + d + '" fill="' + fill + '" stroke="' + fill +
           '" stroke-width="' + (thick * 0.02) + '" stroke-linejoin="round"/>';
  }

  /* ---------- CORNER BRACKET — the esports frame, gold hairline ---------- */
  function bracket(o) {
    o = o || {};
    var len = o.len || 40, sw = o.sw || 1.4,
        color = o.color || C.gold, corner = o.corner || 'tl';
    var fx = corner.indexOf('r') >= 0 ? -1 : 1;
    var fy = corner.indexOf('b') >= 0 ? -1 : 1;
    return '<g transform="scale(' + fx + ' ' + fy + ')">' +
           '<path d="M0 ' + len + ' L0 0 L' + len + ' 0" fill="none" stroke="' +
           color + '" stroke-width="' + sw + '"/></g>';
  }

  /* ---------- REGISTRATION MARK — small gold crosshair ---------- */
  function regmark(o) {
    o = o || {};
    var r = o.r || 9, sw = o.sw || 1, color = o.color || C.gold;
    return '<g fill="none" stroke="' + color + '" stroke-width="' + sw + '">' +
           '<circle cx="0" cy="0" r="' + r + '"/>' +
           '<path d="M' + (-r * 1.85) + ' 0 H' + (-r * 0.35) + ' M' + (r * 0.35) +
           ' 0 H' + (r * 1.85) + ' M0 ' + (-r * 1.85) + ' V' + (-r * 0.35) +
           ' M0 ' + (r * 0.35) + ' V' + (r * 1.85) + '"/></g>';
  }

  /* ============================================================
     THE LOGO
     ------------------------------------------------------------
     Measured from the supplied 1254x1254 master: the artwork fills
     only the middle ~55% of the artboard, so sizing against the
     artboard overstates the mark by ~1.8x. Every fraction below is
     against the measured ARTWORK box, and `w` means the mark.

     The emblem is cropped out of the master untouched; the wordmark
     is re-set in Anton. That is a client-directed change to the
     supplied lockup and it is the only one.
     ============================================================ */
  var EMB = { x: 0.32217, y: 0.20415, w: 0.35407, h: 0.36364 };
  var EMB_RATIO = 1.02703;
  var EMB_FRAC = 1 / 1.55;         // the wordmark is 1.55x the emblem width
  var LOGO_RATIO = EMB_FRAC * EMB_RATIO + 0.072 * EMB_FRAC + 0.246 + 0.2;

  /* The TRADING row. Both rules stay flush with the lockup edge and
     only their inner ends retreat, so the silhouette is unchanged
     while the word is set at 2x the size it was supplied at. */
  var RULE_LEN = 0.1253, RULE_THICK = 0.021, TRA_SIZE = 0.164, TRA_TRACK = 0.15;

  function logoHeight(w) { return w * LOGO_RATIO; }

  function logo(opts) {
    opts = opts || {};
    var w = opts.w || 200, x = opts.x, y = opts.y, src = opts.src || 'assets/logo-master-alpha.png';
    var embW = w * EMB_FRAC, embH = embW * EMB_RATIO, imgW = embW / EMB.w;
    var gut = embW * 0.072, fDen = w * 0.300, fTra = w * TRA_SIZE;
    var ruleCSS = 'width:' + (RULE_LEN * 100).toFixed(3) + '%;flex:none;height:' +
                  Math.max(0.5, w * RULE_THICK).toFixed(2) + 'px;background:' + C.gold;
    var pos = (x == null && y == null) ? 'position:relative;'
            : 'position:absolute;left:' + x + 'px;top:' + y + 'px;';
    return '<div class="logo-slot" style="' + pos + 'width:' + w +
      'px;display:flex;flex-direction:column;align-items:center">' +
      '<div style="position:relative;width:' + embW.toFixed(2) + 'px;height:' +
        embH.toFixed(2) + 'px;overflow:hidden">' +
        '<img src="' + src + '" alt="Denna’s Trading" style="position:absolute;width:' +
          imgW.toFixed(2) + 'px;height:auto;display:block;left:' +
          (-EMB.x * imgW).toFixed(2) + 'px;top:' + (-EMB.y * imgW).toFixed(2) + 'px"/>' +
      '</div>' +
      '<div class="display" style="margin-top:' + gut.toFixed(2) + 'px;font-size:' +
        fDen.toFixed(2) + 'px;color:' + C.inkNavy +
        ';line-height:0.78;letter-spacing:0.005em">DENNA’S</div>' +
      '<div style="display:flex;align-items:center;width:100%;margin-top:' +
        (w * 0.045).toFixed(2) + 'px">' +
        '<span style="' + ruleCSS + '"></span>' +
        '<span class="display" style="flex:1;text-align:center;font-size:' +
          fTra.toFixed(2) + 'px;color:' + C.gold + ';line-height:1;letter-spacing:' +
          TRA_TRACK + 'em;text-indent:' + TRA_TRACK + 'em">TRADING</span>' +
        '<span style="' + ruleCSS + '"></span>' +
      '</div></div>';
  }

  /* ============================================================
     THE QR
     ------------------------------------------------------------
     Navy modules on paper — never reversed, never gold: scanners
     need the dark-on-light polarity and the contrast ratio. No
     quiet zone is baked in; the layout adds it as padding so it
     stays measurable.

     Error correction M, auto version. Keep the target short: the
     31-byte Linktree URL fits a version-3 code at 29 modules, the
     coarsest grid that holds it. Past 42 bytes it steps to version
     4 and every module shrinks by 14%.
     ============================================================ */
  function qrSVG(text, o) {
    o = o || {};
    var dark = o.dark || C.inkNavy, light = o.light || C.paper;
    var qr = global.qrcode(0, 'M');
    qr.addData(String(text || ''));
    qr.make();
    var n = qr.getModuleCount(), d = '', r, c;
    for (r = 0; r < n; r++) {
      for (c = 0; c < n; c++) {
        if (qr.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n +
           '" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges" ' +
           'style="width:100%;height:100%;display:block">' +
           '<rect width="' + n + '" height="' + n + '" fill="' + light + '"/>' +
           '<path d="' + d + '" fill="' + dark + '"/></svg>';
  }
  function qrModuleCount(text) {
    var qr = global.qrcode(0, 'M');
    qr.addData(String(text || '')); qr.make();
    return qr.getModuleCount();
  }

  global.Brand = {
    C: C, seigaiha: seigaiha, enso: enso, bracket: bracket, regmark: regmark,
    logo: logo, logoHeight: logoHeight, qrSVG: qrSVG, qrModuleCount: qrModuleCount
  };
})(window);
