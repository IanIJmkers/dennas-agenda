/* ============================================================
   THE STORE — one source of truth for both artboards

   The print build kept shows as display strings ("26–27.09",
   "ZA–ZO", "2026"). That cannot be edited safely by hand: the
   weekday and the year are facts about the date, and typing them
   separately is three chances to contradict it.

   So a show is stored as what it actually is — a start date and an
   optional end date — and everything printed is derived: the day
   label, the date label, the year band, and which shows fall in
   the two-month window. Change the date and the artboard follows.

   Persistence is the browser's localStorage: this is a static site
   with no server, so edits live in the editor's own browser. The
   JSON export and the share link are how work leaves the machine.
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'dennas.agenda.v2';

  var DAYS = ['ZO', 'MA', 'DI', 'WO', 'DO', 'VR', 'ZA'];
  var MONTHS = ['JANUARI', 'FEBRUARI', 'MAART', 'APRIL', 'MEI', 'JUNI',
                'JULI', 'AUGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER'];
  var MONTHS_SHORT = ['JAN', 'FEB', 'MRT', 'APR', 'MEI', 'JUN',
                      'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];

  /* The supplied agenda, with the two cities that were never given
     left as markers. They render in seal red so nothing invented
     can go out unnoticed — the same guard the print system uses. */
  var DEFAULTS = {
    meta: {
      eyebrow: 'BEURZEN & EVENEMENTEN',
      heading: 'AGENDA',
      closing: 'TOT ZIENS OP DE BEURS',
      note: 'Scan de code voor alle kanalen, drops en restocks.',
      handle: '@dennastrading',
      region: 'NEDERLAND · BELGIË',
      qrUrl: 'https://linktr.ee/dennastrading',
      /* 'story' = 1080x1920, 'post' = 1080x1350. Story is the
         default: it is the only one with room for a centred lockup
         and dates that carry at arm's length on a phone. */
      format: 'story'
    },
    seasons: { '2026': 'NAJAAR', '2027': 'VOORJAAR' },
    snapshot: { from: '2026-08', eyebrow: 'DE KOMENDE TWEE MAANDEN', heading: 'AGENDA' },
    events: [
      { name: 'CON-NXT',             city: 'AMSTERDAM',  start: '2026-08-14', end: '' },
      { name: 'CON-NXT',             city: 'ALMERE',     start: '2026-08-15', end: '' },
      { name: 'TCG COLLECTORS DAY',  city: 'BRUSSEL',    start: '2026-09-12', end: '' },
      { name: 'TCG DAY',             city: 'ZOETERMEER', start: '2026-09-13', end: '' },
      { name: 'ASSEN CARDSHOW',      city: 'ASSEN',      start: '2026-09-26', end: '2026-09-27' },
      { name: 'CON-NXT',             city: 'ESSEN',      start: '2026-10-03', end: '' },
      { name: 'DRACOON COLLECTORS',  city: '‹STAD›',     start: '2026-10-04', end: '' },
      { name: 'CARDMANIA XXL',       city: 'ROSMALEN',   start: '2026-10-10', end: '2026-10-11' },
      { name: 'TCG ROYALE',          city: 'HAARLEM',    start: '2026-10-17', end: '' },
      { name: 'COLLECTOR FANATICS',  city: 'ETTEN-LEUR', start: '2026-10-25', end: '' },
      { name: 'XCLUSIVE COLLECTORS', city: 'TILBURG',    start: '2026-10-31', end: '2026-11-01' },
      { name: 'MASTER PULLZ',        city: 'ASSEN',      start: '2027-01-10', end: '' },
      { name: 'MASTER PULLZ',        city: 'LEIDEN',     start: '2027-02-07', end: '' },
      { name: 'VELUWE TCG EXPO',     city: '‹STAD›',     start: '2027-02-27', end: '' },
      { name: 'MASTER PULLZ',        city: 'ALKMAAR',    start: '2027-03-14', end: '' }
    ]
  };

  /* ---------- dates ----------
     Parsed as UTC on purpose. A local-time Date built from
     'YYYY-MM-DD' lands at midnight and any negative offset rolls it
     back a day, which would silently print the wrong weekday. */
  function parse(iso) {
    if (!iso) return null;
    var p = String(iso).split('-');
    if (p.length !== 3) return null;
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    return isNaN(d.getTime()) ? null : d;
  }
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  function yearOf(e) { var d = parse(e.start); return d ? String(d.getUTCFullYear()) : ''; }
  function monthKey(iso) { var d = parse(iso); return d ? d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) : ''; }

  /* One day: 14.08. A weekend inside one month: 26–27.09. A weekend
     that straddles the turn of a month: 31.10–01.11. */
  function dateLabel(e) {
    var a = parse(e.start), b = parse(e.end);
    if (!a) return '';
    var A = pad(a.getUTCDate()) + '.' + pad(a.getUTCMonth() + 1);
    if (!b || b.getTime() <= a.getTime()) return A;
    if (b.getUTCMonth() === a.getUTCMonth() && b.getUTCFullYear() === a.getUTCFullYear()) {
      return pad(a.getUTCDate()) + '–' + pad(b.getUTCDate()) + '.' + pad(a.getUTCMonth() + 1);
    }
    return A + '–' + pad(b.getUTCDate()) + '.' + pad(b.getUTCMonth() + 1);
  }
  function dayLabel(e) {
    var a = parse(e.start), b = parse(e.end);
    if (!a) return '';
    if (!b || b.getTime() <= a.getTime()) return DAYS[a.getUTCDay()];
    return DAYS[a.getUTCDay()] + '–' + DAYS[b.getUTCDay()];
  }

  function seasonFor(state, year, firstEvent) {
    if (state.seasons && state.seasons[year]) return state.seasons[year];
    var d = firstEvent && parse(firstEvent.start);
    return d && d.getUTCMonth() < 6 ? 'VOORJAAR' : 'NAJAAR';
  }

  /* The header's span line, e.g. AUG ’26 — MRT ’27 */
  function rangeLabel(events) {
    if (!events.length) return '';
    var a = parse(events[0].start), b = parse(events[events.length - 1].end || events[events.length - 1].start);
    if (!a || !b) return '';
    var f = function (d) {
      return MONTHS_SHORT[d.getUTCMonth()] + ' ’' + String(d.getUTCFullYear()).slice(2);
    };
    return f(a) === f(b) ? f(a) : f(a) + ' — ' + f(b);
  }

  /* ---------- state ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function normalise(s) {
    var out = clone(DEFAULTS);
    if (s && typeof s === 'object') {
      if (s.meta) for (var k in s.meta) if (k in out.meta) out.meta[k] = s.meta[k];
      if (s.snapshot) for (var j in s.snapshot) if (j in out.snapshot) out.snapshot[j] = s.snapshot[j];
      if (s.seasons) out.seasons = s.seasons;
      if (Array.isArray(s.events)) {
        out.events = s.events.map(function (e) {
          return {
            name: String(e.name || ''), city: String(e.city || ''),
            start: String(e.start || ''), end: String(e.end || '')
          };
        });
      }
    }
    /* A stable handle per show, assigned on read and never exported.
       The panel and the artboard both key off it, so a re-sort after
       a date change can put the cursor back where it was. */
    out.events.forEach(function (e, i) { e._id = 'e' + i + '_' + Math.random().toString(36).slice(2, 7); });
    return out;
  }

  function stripped() {
    var c = clone(state);
    c.events.forEach(function (e) { delete e._id; });
    return c;
  }

  /* Shows always print in date order. Sorting on read rather than on
     write means a corrected date re-files itself and there is no
     drag-to-reorder to get wrong. */
  function sorted(events) {
    return events.slice().sort(function (a, b) {
      return String(a.start).localeCompare(String(b.start));
    });
  }

  var state = null, subs = [];

  function load() {
    if (state) return state;
    var fromHash = readHash();
    if (fromHash) { state = normalise(fromHash); persist(); return state; }
    try { state = normalise(JSON.parse(localStorage.getItem(KEY))); }
    catch (e) { state = clone(DEFAULTS); }
    return state;
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function commit() { persist(); subs.forEach(function (f) { f(state); }); }
  function subscribe(fn) { subs.push(fn); }
  function reset() { state = clone(DEFAULTS); commit(); }

  /* `silent` persists without telling the renderers. Typing uses it:
     the DOM already shows the new character, and rebuilding the
     artboard mid-word would throw the caret to the end of the line. */
  function setPath(path, value, silent) {
    var parts = path.split('.'), o = state, i;
    for (i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
    if (silent) persist(); else commit();
  }

  function addEvent(after) {
    var base = after || state.events[state.events.length - 1];
    var d = base ? parse(base.start) : new Date();
    if (d) d.setUTCDate(d.getUTCDate() + 7);
    var iso = d ? d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) : '';
    state.events.push({ name: 'NIEUWE BEURS', city: '‹STAD›', start: iso, end: '',
                        _id: 'e' + Date.now().toString(36) });
    commit();
  }
  function removeEvent(i) { state.events.splice(i, 1); commit(); }
  function updateEvent(i, patch) {
    for (var k in patch) state.events[i][k] = patch[k];
    commit();
  }

  /* ---------- getting work off the machine ---------- */
  function toJSON() { return JSON.stringify(stripped(), null, 2); }
  function fromJSON(text) { state = normalise(JSON.parse(text)); commit(); }

  function b64encode(str) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64decode(str) {
    var s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }
  function readHash() {
    var m = /[#&]d=([^&]+)/.exec(global.location.hash || '');
    if (!m) return null;
    try { return JSON.parse(b64decode(m[1])); } catch (e) { return null; }
  }
  function shareLink() {
    var base = global.location.href.split('#')[0];
    return base + '#d=' + b64encode(JSON.stringify(stripped()));
  }

  global.Store = {
    load: load, save: commit, persist: persist, reset: reset, subscribe: subscribe, setPath: setPath,
    addEvent: addEvent, removeEvent: removeEvent, updateEvent: updateEvent,
    toJSON: toJSON, fromJSON: fromJSON, shareLink: shareLink,
    sorted: sorted, dateLabel: dateLabel, dayLabel: dayLabel, yearOf: yearOf,
    monthKey: monthKey, seasonFor: seasonFor, rangeLabel: rangeLabel, parse: parse,
    MONTHS: MONTHS, MONTHS_SHORT: MONTHS_SHORT, DEFAULTS: DEFAULTS
  };
})(window);
