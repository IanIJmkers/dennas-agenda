/* ============================================================
   THE PANEL

   Restructured after the client asked twice for something that was
   already there. That is a discoverability failure, not a missing
   feature: the colour controls sat in a fold below eighteen show
   cards, so reaching them meant scrolling past everything else.

   So the panel is now three named sections behind a switcher, and
   only one is on screen at a time:

     BEURZEN    the shows — add, date, delete
     KLEUREN    every colour on the card
     TEKST      the fixed copy, the QR link, the format

   Nothing is more than one click deep, and no section dilutes the
   one next to it.

   Two other things came out of the same note — "understandable at
   a glance":

   · EVERY FIELD IS LABELLED. Four bare inputs in a box is a puzzle:
     you had to type into one to learn what it was. Each now says
     what it holds, and the ones that are optional say so.
   · HOVERING A SWATCH OUTLINES WHAT IT PAINTS. Twenty-six colour
     names cannot all be self-evident — "Balklijn" means nothing
     until you see the line light up on the card. Hover shows you.

   The caret rules from before still hold: typing a name updates the
   store and redraws only the artboard; changing a date redraws both,
   because a date re-files the show in a date-ordered list.
   ============================================================ */
(function (global) {
  'use strict';

  var S = global.Store, E = global.Editor, el = null;
  var mount = null, typing = false, activeId = null, extra = null, lastLayout = null;
  var section = 'beurzen';

  function init(opts) {
    el = E.el;
    mount = document.querySelector(opts.mount);
    extra = opts.extra || null;
  }

  function renderer() { return global.Agenda || global.Snapshot; }
  function indexOf(st, id) {
    for (var i = 0; i < st.events.length; i++) if (st.events[i]._id === id) return i;
    return -1;
  }

  /* ---------- writes ----------
     `silent` redraws the artboard but not this list, because the
     caret is in a field this list owns. `structural` redraws both:
     a changed date can move the row. */
  function silent(id, patch) {
    var st = S.load(), i = indexOf(st, id);
    if (i < 0) return;
    for (var k in patch) st.events[i][k] = patch[k];
    S.persist();
    renderer().render();
  }
  function structural(id, patch) {
    activeId = id;
    var st = S.load(), i = indexOf(st, id);
    if (i < 0) return;
    for (var k in patch) st.events[i][k] = patch[k];
    S.persist();
    redrawAll(true);
  }
  function redrawAll(refocus) {
    typing = false;
    renderer().render();
    if (refocus && activeId) {
      var c = mount.querySelector('[data-card="' + activeId + '"]');
      if (c) c.scrollIntoView({ block: 'nearest' });
    }
  }

  /* ---------- small builders ---------- */
  function field(labelText, input, note) {
    return el('label', { class: 'f' }, [
      el('span', { class: 'f-l', text: labelText }),
      input,
      note ? el('span', { class: 'f-n', text: note }) : null
    ]);
  }
  function textField(labelText, path, value, note) {
    return field(labelText, el('input', {
      type: 'text', value: value, spellcheck: 'false',
      oninput: function () { S.setPath(path, this.value, true); renderer().render(); }
    }), note);
  }

  /* ---------- BEURZEN ---------- */
  function showCard(e, i) {
    var noDate = !e.start;
    var openCity = /^‹/.test(String(e.city || ''));

    var name = el('input', {
      class: 'name', type: 'text', value: e.name,
      oninput: function () { silent(e._id, { name: this.value }); }
    });
    var city = el('input', {
      type: 'text', value: e.city,
      oninput: function () { silent(e._id, { city: this.value }); }
    });
    var start = el('input', {
      type: 'date', value: e.start || '',
      onchange: function () { structural(e._id, { start: this.value }); }
    });
    var end = el('input', {
      type: 'date', value: e.end || '',
      onchange: function () { structural(e._id, { end: this.value }); }
    });

    var stamp = noDate ? 'Nog geen datum'
      : S.dayLabel(e) + ' · ' + S.dateLabel(e) + '.' + S.yearOf(e);

    var card = el('div', { class: 'show' + (e._id === activeId ? ' active' : '') }, [
      el('div', { class: 'show-h' }, [
        el('span', { class: 'num', text: String(i + 1) }),
        el('span', { class: 'stamp' + (noDate ? ' marker' : ''), text: stamp }),
        el('button', {
          class: 'kill', title: 'Verwijder deze beurs', text: '✕',
          onclick: function () {
            if (!confirm('“' + (e.name || 'deze beurs') + '” verwijderen?')) return;
            var st = S.load(), j = indexOf(st, e._id);
            if (j >= 0) S.removeEvent(j);
            activeId = null; redrawAll();
          }
        })
      ]),
      field('Naam van de beurs', name),
      field('Plaats', city, openCity ? 'Staat nog open — drukt rood af' : ''),
      el('div', { class: 'pair' }, [
        field('Datum', start),
        field('T/m', end, 'alleen bij 2 dagen')
      ])
    ]);
    card.setAttribute('data-card', e._id);
    card._focus = function () { name.focus(); name.select(); };
    return card;
  }

  function beurzenSection(st) {
    var box = el('div', {});
    if (extra) extra(box, st);
    box.appendChild(el('p', { class: 'hint', text:
      'De volgorde en de weekdag komen uit de datum — die typ je niet zelf. ' +
      'Klik een beurs op de kaart om hem hier te openen.' }));
    S.sorted(st.events).forEach(function (e, i) { box.appendChild(showCard(e, i)); });
    box.appendChild(el('button', {
      class: 'btn primary wide', text: '+ Beurs toevoegen',
      onclick: function () {
        S.addEvent();
        var st2 = S.load();
        activeId = st2.events[st2.events.length - 1]._id;
        redrawAll(true);
        var c = mount.querySelector('[data-card="' + activeId + '"]');
        if (c && c._focus) c._focus();
      }
    }));
    return box;
  }

  /* ---------- KLEUREN ----------
     Grouped the way the card is read — field, header, list, footer —
     rather than alphabetically, so a change is made where the eye
     already is. Nothing is forbidden; everything is measured. */
  var GROUPS = [
    ['Vlak', [
      ['bg', 'Achtergrond'], ['pattern', 'Golfpatroon'], ['halo', 'Cirkel achter logo']
    ]],
    ['Kop bovenaan', [
      ['eyebrow', 'Bovenregel'], ['heading', 'Kop (AGENDA)'], ['span', 'Periode'],
      ['headRule', 'Lijn onder de kop'], ['regmark', 'Richtkruis']
    ]],
    ['De lijst', [
      ['date', 'Datum'], ['name', 'Naam beurs'], ['city', 'Plaats'], ['day', 'Weekdag'],
      ['rowRule', 'Lijn tussen beurzen'], ['bandYear', 'Jaar / maand'],
      ['bandLabel', 'Seizoen / jaartal'], ['bandRule', 'Lijn van de balk'],
      ['bandTick', 'Rood streepje'], ['marker', 'Nog invullen (‹STAD›)']
    ]],
    ['Onderaan', [
      ['closing', 'Slotregel'], ['note', 'Uitleg'], ['handle', 'Instagram-naam'],
      ['region', 'Regio'], ['footRule', 'Lijn erboven'],
      ['qrFrame', 'QR-kader'], ['qrDark', 'QR-blokjes'], ['qrLight', 'QR-ondergrond']
    ]]
  ];

  var TEXT_PARTS = [
    ['heading', 'Kop'], ['eyebrow', 'Bovenregel'], ['span', 'Periode'],
    ['bandYear', 'Jaar / maand'], ['bandLabel', 'Seizoen'], ['date', 'Datum'],
    ['name', 'Naam beurs'], ['city', 'Plaats'], ['day', 'Weekdag'],
    ['marker', 'Nog invullen'], ['closing', 'Slotregel'], ['note', 'Uitleg'],
    ['handle', 'Instagram-naam'], ['region', 'Regio']
  ];

  function lum(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return 0;
    var n = parseInt(m[1], 16);
    var c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) {
    var A = lum(a), B2 = lum(b);
    return (Math.max(A, B2) + 0.05) / (Math.min(A, B2) + 0.05);
  }

  /* Outline what a swatch paints, so a colour name nobody could
     guess ("Balklijn") explains itself by lighting up on the card. */
  function spotlight(part, on) {
    var page = document.querySelector('.page');
    if (!page) return;
    Array.prototype.forEach.call(page.querySelectorAll('[data-part="' + part + '"]'),
      function (n) { n.classList.toggle('spot', on); });
  }

  var pending = null;
  /* A colour input fires continuously while the picker is dragged, and
     a redraw re-encodes the QR and re-walks 300 steps of brush edge.
     One frame per paint keeps that from stacking up. */
  function setColour(key, value, hexOut) {
    S.load().theme[key] = value;
    if (hexOut) hexOut.value = value.toUpperCase();
    S.persist();
    if (pending) return;
    pending = global.requestAnimationFrame(function () {
      pending = null;
      renderer().render();
      spotlight(key, true);
    });
  }

  function swatch(key, label) {
    var th = S.load().theme;
    var dot = el('input', {
      type: 'color', value: th[key], 'aria-label': label,
      oninput: function () { setColour(key, this.value, hex); }
    });
    var hex = el('input', {
      class: 'hex', type: 'text', value: String(th[key]).toUpperCase(), spellcheck: 'false',
      'aria-label': label + ' hex',
      onchange: function () {
        var v = this.value.trim();
        if (!/^#/.test(v)) v = '#' + v;
        if (!/^#[0-9a-f]{6}$/i.test(v)) { this.value = String(S.load().theme[key]).toUpperCase(); return; }
        dot.value = v; setColour(key, v, this);
      }
    });
    var back = el('button', {
      class: 'undo', title: 'Terug naar de huisstijlkleur', text: '↺',
      onclick: function () {
        var d = S.DEFAULTS.theme[key];
        dot.value = d; setColour(key, d, hex);
        paint(lastLayout);
      }
    });
    if (String(th[key]).toUpperCase() === S.DEFAULTS.theme[key].toUpperCase()) back.disabled = true;

    var row = el('div', { class: 'crow' }, [el('span', { text: label }), hex, dot, back]);
    row.addEventListener('mouseenter', function () { spotlight(key, true); });
    row.addEventListener('mouseleave', function () { spotlight(key, false); });
    return row;
  }

  function kleurenSection() {
    var box = el('div', {});
    box.appendChild(el('p', { class: 'hint', text:
      'Ga met de muis over een regel om te zien welk onderdeel het is. ' +
      'Met ↺ zet je er één terug, onderaan zet je alles terug.' }));
    GROUPS.forEach(function (g) {
      box.appendChild(el('h3', { text: g[0] }));
      g[1].forEach(function (r) { box.appendChild(swatch(r[0], r[1])); });
    });
    box.appendChild(el('button', {
      class: 'btn wide ghost', text: 'Herstel huisstijlkleuren',
      onclick: function () {
        var th = S.load().theme;
        for (var k in S.DEFAULTS.theme) th[k] = S.DEFAULTS.theme[k];
        S.persist(); redrawAll();
      }
    }));
    box.appendChild(el('p', { class: 'hint', style: 'margin:10px 0 0', text:
      'Het logo krijgt geen kleurkeuze: dat is het aangeleverde bestand en dat ' +
      'wordt niet hertint.' }));
    return box;
  }

  /* ---------- TEKST ---------- */
  function tekstSection(st) {
    var box = el('div', {});
    var snap = renderer() === global.Snapshot;

    box.appendChild(el('h3', { text: 'Bovenaan' }));
    box.appendChild(snap
      ? textField('Bovenregel', 'snapshot.eyebrow', st.snapshot.eyebrow)
      : textField('Bovenregel', 'meta.eyebrow', st.meta.eyebrow));
    box.appendChild(snap
      ? textField('Kop', 'snapshot.heading', st.snapshot.heading)
      : textField('Kop', 'meta.heading', st.meta.heading));
    box.appendChild(el('p', { class: 'hint', text:
      'De periode eronder wordt zelf berekend uit de datums.' }));

    box.appendChild(el('h3', { text: 'Onderaan' }));
    box.appendChild(textField('Slotregel', 'meta.closing', st.meta.closing));
    box.appendChild(textField('Uitleg', 'meta.note', st.meta.note));
    box.appendChild(textField('Instagram-naam', 'meta.handle', st.meta.handle));
    box.appendChild(textField('Regio', 'meta.region', st.meta.region));

    box.appendChild(el('h3', { text: 'Link achter de QR' }));
    box.appendChild(field('Adres', el('input', {
      type: 'url', value: st.meta.qrUrl, spellcheck: 'false',
      onchange: function () { S.setPath('meta.qrUrl', this.value.trim(), true); redrawAll(); }
    }), 'Kort houden — dat scant het best'));
    return box;
  }

  /* ---------- warnings ---------- */
  function warnings(layout) {
    var st = S.load(), th = st.theme, out = [];
    var open = st.events.filter(function (e) { return /^‹/.test(String(e.city || '')); });
    var undated = st.events.filter(function (e) { return !e.start; });

    if (undated.length) {
      out.push(['Zonder datum',
        undated.length + ' beurs(en) hebben nog geen datum en staan niet op de kaart.', false]);
    }
    if (open.length) {
      out.push(['Nog invullen',
        open.length + ' plaats(en) staan nog als ‹STAD› en drukken rood af: ' +
        open.map(function (e) { return e.name; }).join(', ') + '.', false]);
    }
    if (layout && layout.pitch < 62 && layout.mode === 'two') {
      out.push(['Vol',
        'De agenda zit vol. Nog meer beurzen worden kleiner gezet dan prettig leest — ' +
        'overweeg de 2-maanden versie voor de korte termijn.', false]);
    }

    var weak = TEXT_PARTS.filter(function (p) { return ratio(th[p[0]], th.bg) < 4.5; });
    if (weak.length) {
      out.push(['Te weinig contrast',
        weak.map(function (p) {
          return p[1] + ' (' + ratio(th[p[0]], th.bg).toFixed(1) + ':1)';
        }).join(', ') + ' — onder 4,5:1 tegen de achtergrond. Van een afstandje valt dat weg.',
        false]);
    }

    /* The lockup is a supplied PNG in navy ink and the brief forbids
       recolouring it, so it is the one element a dark field cannot
       fix by being edited. */
    var LOGO_INK = '#1B3A5C';
    if (ratio(LOGO_INK, th.bg) < 3) {
      out.push(['Logo valt weg',
        'Het logo is aangeleverd in donkerblauwe inkt en mag niet hertint worden. ' +
        'Tegen deze achtergrond is dat ' + ratio(LOGO_INK, th.bg).toFixed(1) + ':1 — ' +
        'voor een donkere kaart is een lichte versie van het logo nodig.', false]);
    }

    var qr = ratio(th.qrDark, th.qrLight);
    if (lum(th.qrDark) >= lum(th.qrLight)) {
      out.push(['QR scant niet',
        'De blokjes zijn lichter dan hun ondergrond. Scanners lezen alleen ' +
        'donker-op-licht — draai de twee om.', false]);
    } else if (qr < 4.5) {
      out.push(['QR scant slecht',
        'Blokjes tegen ondergrond is ' + qr.toFixed(1) + ':1. Onder 4,5:1 haakt een ' +
        'camera af, zeker vanaf een scherm.', false]);
    }

    var n = global.Brand.qrModuleCount(st.meta.qrUrl);
    out.push(['QR: ' + n + ' modules',
      n <= 29 ? 'Scherpe code. Houd de link kort — boven 42 tekens wordt elk blokje 14% kleiner.'
              : 'De link is lang, dus de code is fijnmaziger en scant lastiger van een scherm.',
      n <= 29]);
    return out;
  }

  function paintWarnings(layout) {
    var box = mount.querySelector('[data-warnings]');
    if (!box) return;
    box.innerHTML = '';
    warnings(layout).forEach(function (w) {
      box.appendChild(el('div', { class: 'warn' + (w[2] ? ' ok' : '') }, [
        el('strong', { text: w[0] }), el('span', { text: w[1] })
      ]));
    });
  }

  /* ---------- assembly ---------- */
  var TABS = [['beurzen', 'Beurzen'], ['kleuren', 'Kleuren'], ['tekst', 'Tekst']];

  function paint(layout) {
    var st = S.load();
    mount.innerHTML = '';

    var nav = el('div', { class: 'pnav' });
    TABS.forEach(function (t) {
      nav.appendChild(el('button', {
        class: 'pnav-b' + (section === t[0] ? ' on' : ''), text: t[1],
        onclick: function () { section = t[0]; paint(lastLayout); }
      }));
    });
    mount.appendChild(nav);

    mount.appendChild(
      section === 'kleuren' ? kleurenSection() :
      section === 'tekst' ? tekstSection(st) : beurzenSection(st));

    var box = el('div', {});
    box.setAttribute('data-warnings', '1');
    mount.appendChild(el('h2', { text: 'Controle' }));
    mount.appendChild(box);
    paintWarnings(layout);

    /* Typing in a field here must not rebuild this list under the caret. */
    Array.prototype.forEach.call(
      mount.querySelectorAll('input[type="text"],input[type="url"],input[type="color"]'),
      function (n) {
        n.addEventListener('focus', function () { typing = true; });
        n.addEventListener('blur', function () { typing = false; });
      });
  }

  function refresh(layout) {
    lastLayout = layout;
    if (typing) { paintWarnings(layout); return; }
    paint(layout);
  }

  function focus(id) {
    activeId = id;
    section = 'beurzen';
    paint(lastLayout);
    var c = mount.querySelector('[data-card="' + id + '"]');
    if (c) { c.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (c._focus) c._focus(); }
  }

  global.AgendaPanel = { init: init, refresh: refresh, focus: focus, redrawAll: redrawAll };
})(window);
