/* ============================================================
   EDITOR RUNTIME — shared by both artboards

   Three things worth knowing about how this behaves:

   1. TYPING NEVER RE-RENDERS THE ARTBOARD. Rebuilding the DOM under
      a caret throws it to the end of the field on every keystroke,
      so text edits write to the store silently and the artboard is
      only rebuilt when something structural changes — a date, a new
      show, a deletion.

   2. THE EXPORT IS THE ARTBOARD AT 1:1. On screen the page is
      scaled to fit the window; the writer is told to ignore that
      transform, so the PNG is always exactly 1080x1350 regardless
      of the window it was made in.

   3. NOTHING IN `.chrome` LEAVES. The export filter drops it and
      `body.exporting` kills the hover affordances first, so a
      cursor resting on a field cannot print a highlight.
   ============================================================ */
(function (global) {
  'use strict';

  /* The artboard is 1080 wide always; its height is the chosen
     format. Both are set from one place so the on-screen fit, the
     PNG writer and the print page box can never disagree. */
  var PAGE_W = 1080, PAGE_H = 1920;

  function setSize(w, h) {
    PAGE_W = w; PAGE_H = h;
    var page = document.querySelector('.page');
    if (page) { page.style.width = w + 'px'; page.style.height = h + 'px'; }
    var st = document.getElementById('pagesize') ||
             document.head.appendChild(Object.assign(document.createElement('style'), { id: 'pagesize' }));
    st.textContent = '@media print{@page{size:' + w + 'px ' + h + 'px;margin:0}}';
  }

  /* ---------- scale the artboard to the window ---------- */
  function fitStage() {
    var stage = document.querySelector('.stage');
    var inner = document.querySelector('.stage-inner');
    var page = document.querySelector('.page');
    if (!stage || !page || !inner) return;
    var pad = 56;
    var s = Math.min((stage.clientWidth - pad) / PAGE_W, (stage.clientHeight - pad) / PAGE_H, 1);
    s = Math.max(s, 0.2);
    page.style.transform = 'scale(' + s + ')';
    inner.style.width = (PAGE_W * s) + 'px';
    inner.style.height = (PAGE_H * s) + 'px';
  }

  /* ---------- in-place text editing ----------
     Any node carrying data-edit="path.to.value" becomes typeable and
     writes straight back to the store. Paste is forced to plain text:
     pasting from Word into a contenteditable otherwise drags a font
     stack and a colour in with it and quietly breaks the system. */
  function bindEditables(root, onStructural) {
    var nodes = root.querySelectorAll('[data-edit]');
    Array.prototype.forEach.call(nodes, function (n) {
      n.setAttribute('contenteditable', 'plaintext-only');
      n.setAttribute('spellcheck', 'false');
      n.addEventListener('input', function () {
        Store.setPath(n.getAttribute('data-edit'), n.textContent.trim(), true);
      });
      n.addEventListener('paste', function (ev) {
        ev.preventDefault();
        var t = (ev.clipboardData || global.clipboardData).getData('text');
        document.execCommand('insertText', false, String(t).replace(/\s+/g, ' ').trim());
      });
      n.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); n.blur(); }
      });
      n.addEventListener('blur', function () {
        if (onStructural) onStructural();
      });
    });
  }

  /* A show's name and city are typed onto the artboard itself. They
     are fields of a show rather than store paths, so they bind by
     id — and they persist without redrawing, because the caret is
     inside the node that a redraw would replace. */
  function bindEventFields(root, rerender) {
    Array.prototype.forEach.call(root.querySelectorAll('[data-ev]'), function (n) {
      n.setAttribute('contenteditable', 'plaintext-only');
      n.setAttribute('spellcheck', 'false');
      var id = n.getAttribute('data-ev'), f = n.getAttribute('data-field');
      n.addEventListener('input', function () {
        var st = Store.load();
        for (var i = 0; i < st.events.length; i++) {
          if (st.events[i]._id === id) { st.events[i][f] = n.textContent.trim(); break; }
        }
        Store.persist();
      });
      n.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); n.blur(); }
      });
      n.addEventListener('blur', function () { rerender(); });
    });
  }

  /* ---------- export ---------- */
  function withCleanPage(fn) {
    document.body.classList.add('exporting');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    return Promise.resolve()
      .then(function () { return global.document.fonts ? global.document.fonts.ready : null; })
      .then(fn)
      .then(function (r) { document.body.classList.remove('exporting'); return r; },
            function (e) { document.body.classList.remove('exporting'); throw e; });
  }

  function exportPNG(filename, btn) {
    var page = document.querySelector('.page');
    var label = btn && btn.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Bezig…'; }
    return withCleanPage(function () {
      return global.htmlToImage.toPng(page, {
        width: PAGE_W, height: PAGE_H, pixelRatio: 1, cacheBust: false,
        style: { transform: 'none', transformOrigin: 'top left', boxShadow: 'none' },
        filter: function (node) {
          return !(node.classList && node.classList.contains('chrome'));
        }
      });
    }).then(function (url) {
      var a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      if (btn) { btn.disabled = false; btn.textContent = label; }
    }).catch(function (err) {
      if (btn) { btn.disabled = false; btn.textContent = label; }
      alert('Exporteren mislukt: ' + err.message +
            '\n\nGebruik anders “PDF / Print” — die werkt altijd.');
    });
  }

  /* ---------- hand-off ---------- */
  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function importJSON(onDone) {
    var i = document.createElement('input');
    i.type = 'file'; i.accept = 'application/json,.json';
    i.onchange = function () {
      var f = i.files && i.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try { Store.fromJSON(r.result); if (onDone) onDone(); }
        catch (e) { alert('Dit bestand kon niet gelezen worden: ' + e.message); }
      };
      r.readAsText(f);
    };
    i.click();
  }
  function copyShareLink(btn) {
    var url = Store.shareLink();
    var done = function () {
      var t = btn.textContent; btn.textContent = 'Gekopieerd ✓';
      setTimeout(function () { btn.textContent = t; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { prompt('Kopieer deze link:', url); });
    } else { prompt('Kopieer deze link:', url); }
  }

  /* ---------- small DOM helper ---------- */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  /* ---------- pages ----------
     The renderer reports how many cards the list needs and which one
     is showing; the stepper only appears when there is more than one.
     "Alle pagina's" walks them and exports each in turn. */
  var renderer = function () { return global.Agenda || global.Snapshot; };
  function pager(count, index) {
    var box = document.querySelector('#pages');
    if (!box) return;
    box.hidden = count <= 1;
    var lab = box.querySelector('[data-page-label]');
    if (lab) lab.textContent = (index + 1) + ' / ' + count;
    var all = document.querySelector('#pngall');
    if (all) all.hidden = count <= 1;
  }
  function exportAll(base, btn) {
    var R = renderer(), n = R.pages(), start = R.page(), label = btn && btn.textContent;
    if (btn) { btn.disabled = true; }
    var i = 0;
    var step = function () {
      if (i >= n) { R.setPage(start); if (btn) { btn.disabled = false; btn.textContent = label; } return; }
      if (btn) btn.textContent = 'Pagina ' + (i + 1) + ' van ' + n + '…';
      R.setPage(i);
      exportPNG(base.replace(/\.png$/, '') + '-' + (i + 1) + '.png').then(function () { i++; setTimeout(step, 400); });
    };
    step();
  }

  /* ---------- wire the toolbar every page shares ---------- */
  function wireBar(opts) {
    var q = function (s) { return document.querySelector(s); };
    var b;
    if ((b = q('#png'))) b.onclick = function () {
      var R = renderer(), n = R.pages();
      var name = n > 1 ? opts.filename.replace(/\.png$/, '') + '-' + (R.page() + 1) + '.png' : opts.filename;
      exportPNG(name, b);
    };
    if ((b = q('#pngall'))) b.onclick = function () { exportAll(opts.filename, b); };
    if ((b = q('#prev'))) b.onclick = function () { var R = renderer(); R.setPage(R.page() - 1); };
    if ((b = q('#next'))) b.onclick = function () { var R = renderer(); R.setPage(R.page() + 1); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-pages]'), function (n) {
      n.onclick = function () {
        Store.setPath('meta.pages', n.getAttribute('data-pages'), true);
        opts.onData(); markPages();
      };
    });
    markPages();
    if ((b = q('#pdf'))) b.onclick = function () { global.print(); };
    if ((b = q('#save'))) b.onclick = function () { download('dennas-agenda.json', Store.toJSON()); };
    if ((b = q('#open'))) b.onclick = function () { importJSON(opts.onData); };
    if ((b = q('#share'))) b.onclick = function () { copyShareLink(b); };
    if ((b = q('#reset'))) b.onclick = function () {
      if (confirm('Alles terugzetten naar de originele agenda? Je eigen wijzigingen gaan verloren.')) {
        Store.reset(); opts.onData();
      }
    };
    Array.prototype.forEach.call(document.querySelectorAll('[data-format]'), function (n) {
      n.onclick = function () {
        Store.setPath('meta.format', n.getAttribute('data-format'), true);
        opts.onData();
        markFormat();
      };
    });
    markFormat();
    if ((b = q('#preview'))) b.onclick = function () {
      var on = document.body.classList.toggle('preview');
      b.textContent = on ? 'Bewerken' : 'Voorbeeld';
      b.classList.toggle('primary', on);
    };
    global.addEventListener('resize', fitStage);

    /* The layout is chosen from measured text, and text measured
       against a fallback face measures wrong. Draw once more when the
       real fonts have landed. */
    if (global.document.fonts && global.document.fonts.ready) {
      global.document.fonts.ready.then(function () { opts.onData(); });
    }
  }

  function markPages() {
    var cur = Store.load().meta.pages || 'auto';
    Array.prototype.forEach.call(document.querySelectorAll('[data-pages]'), function (n) {
      n.classList.toggle('on', n.getAttribute('data-pages') === cur);
    });
  }
  function markFormat() {
    var cur = Store.load().meta.format;
    Array.prototype.forEach.call(document.querySelectorAll('[data-format]'), function (n) {
      n.classList.toggle('on', n.getAttribute('data-format') === cur);
    });
  }

  global.Editor = {
    setSize: setSize, bindEventFields: bindEventFields, pager: pager, exportAll: exportAll,
    fitStage: fitStage, bindEditables: bindEditables, exportPNG: exportPNG,
    download: download, importJSON: importJSON, copyShareLink: copyShareLink,
    el: el, wireBar: wireBar
  };
})(window);
