/* ============================================================
   THE PANEL — where shows are added, dated and deleted

   Copy is typed onto the artboard itself; the data lives here.
   The split is deliberate: a headline is a thing you judge by
   looking at it, and a date is a thing you judge by reading it.

   Two rules keep the caret where the client put it:

   · A name or a city typed in here updates the store silently and
     redraws only the artboard. Redrawing this list under an active
     input would send the cursor to the end of the word.
   · A date redraws everything, because a date can re-file the show
     — the list is date-ordered, so the row may move. The row that
     moved is then re-focused by id, so the client is left where
     they were rather than where the row used to be.
   ============================================================ */
(function (global) {
  'use strict';

  var S = global.Store, E = global.Editor, el = null;
  var mount = null, typing = false, activeId = null, extra = null;

  function init(opts) {
    el = E.el;
    mount = document.querySelector(opts.mount);
    extra = opts.extra || null;
  }

  function iso(e, f) { return e[f] || ''; }

  function showCard(e, i) {
    var isMarkerCity = /^‹/.test(String(e.city || ''));
    var noDate = !e.start;

    var name = el('input', {
      class: 'name', type: 'text', value: e.name, 'aria-label': 'Naam',
      oninput: function () { silent(e._id, { name: this.value }); }
    });
    var city = el('input', {
      type: 'text', value: e.city, 'aria-label': 'Plaats',
      oninput: function () { silent(e._id, { city: this.value }); }
    });
    var start = el('input', {
      type: 'date', value: iso(e, 'start'), 'aria-label': 'Startdatum',
      onchange: function () { structural(e._id, { start: this.value }); }
    });
    var end = el('input', {
      type: 'date', value: iso(e, 'end'), 'aria-label': 'Einddatum',
      title: 'Alleen invullen bij een beurs van twee dagen',
      onchange: function () { structural(e._id, { end: this.value }); }
    });

    var stamp = noDate ? 'GEEN DATUM'
      : S.dayLabel(e) + ' · ' + S.dateLabel(e) + '.' + S.yearOf(e);

    var card = el('div', { class: 'show' + (e._id === activeId ? ' active' : '') }, [
      el('div', { class: 'row' }, [name]),
      el('div', { class: 'row' }, [city]),
      el('div', { class: 'row' }, [start, end]),
      el('div', { class: 'meta' }, [
        el('span', { class: noDate || isMarkerCity ? 'marker' : '', text: stamp }),
        el('button', {
          class: 'kill', text: 'Verwijder',
          onclick: function () {
            if (!confirm('“' + (e.name || 'deze beurs') + '” verwijderen?')) return;
            var st = S.load(), j = indexOf(st, e._id);
            if (j >= 0) S.removeEvent(j);
            activeId = null; redrawAll();
          }
        })
      ])
    ]);
    card.setAttribute('data-card', e._id);
    card._focus = function () { name.focus(); name.select(); };
    return card;
  }

  function indexOf(st, id) {
    for (var i = 0; i < st.events.length; i++) if (st.events[i]._id === id) return i;
    return -1;
  }
  function renderer() { return global.Agenda || global.Snapshot; }

  /* Typing here redraws the artboard but not this list — `typing` is
     set while a text input holds focus, and refresh() honours it. */
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

  /* ---------- warnings ----------
     The markers are the print system's guard carried over: a city
     nobody supplied prints in seal red rather than being guessed
     at, and it is called out here until it is filled in. */
  function warnings(layout) {
    var st = S.load(), out = [];
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
    var n = global.Brand.qrModuleCount(st.meta.qrUrl);
    out.push(['QR: ' + n + ' modules',
      n <= 29 ? 'Scherpe code. Houd de link kort — boven 42 tekens wordt elk blokje 14% kleiner.'
              : 'De link is lang, dus de code is fijnmaziger en scant lastiger van een scherm.', n <= 29]);
    return out;
  }

  function refresh(layout) {
    if (typing) { paintWarnings(layout); return; }
    paint(layout);
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

  function paint(layout) {
    var st = S.load();
    mount.innerHTML = '';

    if (extra) extra(mount, st);

    mount.appendChild(el('h2', { text: 'Beurzen' }));
    mount.appendChild(el('p', {
      class: 'hint',
      text: 'De volgorde en de weekdag komen uit de datum — je hoeft ze niet zelf te typen. ' +
            'Vul een einddatum alleen in bij een beurs van twee dagen.'
    }));

    var list = el('div', {});
    S.sorted(st.events).forEach(function (e, i) { list.appendChild(showCard(e, i)); });
    mount.appendChild(list);

    mount.appendChild(el('button', {
      class: 'btn primary', style: 'width:100%;margin-top:6px',
      text: '+ Beurs toevoegen',
      onclick: function () {
        S.addEvent();
        var st2 = S.load();
        activeId = st2.events[st2.events.length - 1]._id;
        redrawAll(true);
        var c = mount.querySelector('[data-card="' + activeId + '"]');
        if (c && c._focus) c._focus();
      }
    }));

    mount.appendChild(el('h2', { text: 'Link achter de QR' }));
    mount.appendChild(el('div', { class: 'field' }, [
      el('label', { text: 'Adres' }),
      el('input', {
        type: 'url', value: st.meta.qrUrl, spellcheck: 'false',
        onchange: function () { S.setPath('meta.qrUrl', this.value.trim(), true); redrawAll(); }
      })
    ]));

    var box = el('div', {});
    box.setAttribute('data-warnings', '1');
    mount.appendChild(el('h2', { text: 'Controle' }));
    mount.appendChild(box);
    paintWarnings(layout);

    /* Typing in a text input here must not rebuild this list. */
    Array.prototype.forEach.call(mount.querySelectorAll('input[type="text"],input[type="url"]'),
      function (n) {
        n.addEventListener('focus', function () { typing = true; });
        n.addEventListener('blur', function () { typing = false; });
      });
  }

  function focus(id) {
    activeId = id;
    paint(null);
    var c = mount.querySelector('[data-card="' + id + '"]');
    if (c) { c.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (c._focus) c._focus(); }
  }

  global.AgendaPanel = { init: init, refresh: refresh, focus: focus, redrawAll: redrawAll };
})(window);
