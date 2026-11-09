/* Business Studio settings – clickable prototype.
   Plain JavaScript, no dependencies. Drives menus, the import panel,
   rename/delete dialogs, tabs, filtering and notifications. */
(function () {
  'use strict';

  var state = { appOpen: false, defOpen: false, menu: null, hasFile: true, selected: 'eu', val: false, sel: { gen: false, intake: false, crm: true, notif: false } };

  // ---------- state-driven visibility ----------
  function value(key) {
    switch (key) {
      case 'appOpen': return state.appOpen;
      case 'anyOpen': return state.appOpen || state.defOpen || state.menu !== null;
      case 'defOpen': return state.defOpen;
      case 'val': return state.val;
      case 'noVal': return !state.val;
      case 'hasFile': return state.hasFile && !state.uploading;
      case 'uploading': return !!state.uploading;
      case 'noFile': return !state.hasFile && !state.uploading;
      default:
        if (key.indexOf('m.') === 0) return state.menu === key.slice(2);
        return false;
    }
  }

  function render() {
    document.querySelectorAll('[data-if]').forEach(function (el) {
      el.hidden = !value(el.getAttribute('data-if'));
    });
    document.querySelectorAll('[data-expanded]').forEach(function (el) {
      el.setAttribute('aria-expanded', value(el.getAttribute('data-expanded')) ? 'true' : 'false');
    });
  }

  var handlers = {
    toggleApp: function () { state.appOpen = !state.appOpen; state.menu = null; state.defOpen = false; },
    toggleDef: function () { state.defOpen = !state.defOpen; state.appOpen = false; state.menu = null; },
    tgVal: function () { state.val = !state.val; },
    selAll: function () { var all = selCount() === 4; Object.keys(state.sel).forEach(function (k) { state.sel[k] = !all; }); syncExport(); },
    doUpdate: function () {
      if (!state.hasFile) { toast('bad', 'Choose a file', 'Add a JSON Schema file to update the definition.'); return; }
      location.href = 'settings.html?toast=' + (state.ownFile ? 'updated' : 'update-rejected');
    },
    doExport: function () {
      var n = selCount(); if (!n) return;
      location.href = 'settings.html?toast=exported';
      //
    },
    closeAll: function () { state.appOpen = false; state.menu = null; state.defOpen = false; },
    closeMenu: function () { state.menu = null; },
    removeFile: function () { clearInterval(upTimer); state.uploading = false; state.hasFile = false; },
    chooseFile: function () { pickFile(); }
  };
  ['def', 'eu', 'us'].forEach(function (k) {
    handlers['t.' + k] = function () {
      state.menu = state.menu === k ? null : k;
      state.appOpen = false;
      state.defOpen = false;
    };
  });
  ['gen', 'intake', 'crm', 'notif'].forEach(function (k) {
    handlers['tg.' + k] = function () { Object.keys(state.sel).forEach(function (x) { state.sel[x] = x === k; }); syncExport(); };
  });
  function selCount() { return Object.keys(state.sel).filter(function (k) { return state.sel[k]; }).length; }
  function syncExport() {
    var n = selCount();
    document.querySelectorAll('[data-on^="tg."]').forEach(function (b) {
      var on = state.sel[b.getAttribute('data-on').slice(3)];
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      var box = b.querySelector('span');
      box.style.background = on ? '#1F7082' : '#FFFFFF';
      box.style.boxShadow = 'inset 0 0 0 1px ' + (on ? '#1F7082' : '#D5D7DA');
    });
  }

  // ---------- helpers ----------
  var ICON = {
    check: '<path d="M7.5 12l3 3 6-6M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10Z"/>',
    alert: '<path d="M12 8v4M12 16h.01M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10Z"/>',
    trash: '<path d="M16 6v-.8c0-1.12 0-1.68-.22-2.11a2 2 0 0 0-.87-.87C14.48 2 13.92 2 12.8 2h-1.6c-1.12 0-1.68 0-2.11.22a2 2 0 0 0-.87.87C8 3.52 8 4.08 8 5.2V6M10 11.5v5M14 11.5v5M3 6h18M19 6v11.2c0 1.68 0 2.52-.33 3.16a3 3 0 0 1-1.31 1.31c-.64.33-1.48.33-3.16.33H9.8c-1.68 0-2.52 0-3.16-.33a3 3 0 0 1-1.31-1.31C5 19.72 5 18.88 5 17.2V6"/>',
    pen: '<path d="M3 21h4.5L19 9.5a3.18 3.18 0 0 0-4.5-4.5L3 16.5V21ZM13.5 6.5l4 4"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>'
  };
  function svg(name, size) {
    size = size || 20;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + '</svg>';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- notifications ----------
  function toast(kind, title, text, action) {
    var wrap = document.querySelector('.pt-toasts');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'pt-toasts';
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    var t = document.createElement('div');
    t.className = 'pt-toast ' + kind;
    t.setAttribute('role', kind === 'bad' ? 'alert' : 'status');
    t.innerHTML = '<span class="pt-ico">' + svg(kind === 'bad' ? 'alert' : 'check') + '</span>' +
      '<div style="flex:1;min-width:0"><p class="pt-tt">' + esc(title) + '</p><p class="pt-td">' + esc(text) + '</p>' +
      '<div class="pt-acts"><button type="button" class="pt-lnk g" data-dismiss>Dismiss</button>' + (action ? '<button type="button" class="pt-lnk" data-act>' + esc(action.label) + '</button>' : '') + '</div></div>' +
      '<button type="button" class="pt-x" aria-label="Close" data-dismiss>' + svg('x') + '</button>';
    wrap.appendChild(t);
    var timer = setTimeout(function () { t.remove(); }, action ? 15000 : 6000);
    t.addEventListener('click', function (e) {
      if (e.target.closest('[data-dismiss]')) { clearTimeout(timer); t.remove(); }
      if (action && e.target.closest('[data-act]')) { clearTimeout(timer); t.remove(); action.fn(); }
    });
  }

  // ---------- dialogs ----------
  var lastFocus = null;
  function openDialog(opts) {
    closeDialog();
    lastFocus = document.activeElement;
    var scrim = document.createElement('div');
    scrim.className = 'pt-scrim';
    var danger = opts.kind === 'danger';
    scrim.innerHTML =
      '<div class="pt-modal" role="' + (danger ? 'alertdialog' : 'dialog') + '" aria-modal="true" aria-labelledby="pt-mt">' +
        '<div class="pt-mh">' +
          '<span class="pt-circle ' + (danger ? 'red' : 'teal') + '">' + svg(opts.icon, 24) + '</span>' +
          '<div style="flex:1"><h2 id="pt-mt">' + esc(opts.title) + '</h2>' + (opts.text ? '<p>' + esc(opts.text) + '</p>' : '') + '</div>' +
          '<button type="button" class="pt-x" aria-label="Close" data-close>' + svg('x') + '</button>' +
        '</div>' +
        (opts.input ? '<div class="pt-mb"><label for="pt-in" class="pt-lbl">Name</label><input id="pt-in" class="pt-in" value="' + esc(opts.input) + '"></div>' : '') +
        '<div class="pt-mf"><button type="button" class="pt-btn pt-sec" data-close>Cancel</button>' +
        '<button type="button" class="pt-btn ' + (danger ? 'danger' : 'pri') + '" data-ok>' + esc(opts.ok) + '</button></div>' +
      '</div>';
    document.body.appendChild(scrim);
    var input = scrim.querySelector('#pt-in');
    (input || scrim.querySelector('[data-ok]')).focus();
    if (input) input.select();
    scrim.addEventListener('click', function (e) {
      if (e.target === scrim || e.target.closest('[data-close]')) { closeDialog(); return; }
      if (e.target.closest('[data-ok]')) {
        var v = input ? input.value.trim() : null;
        if (input && !v) { input.classList.add('err'); input.focus(); return; }
        closeDialog();
        opts.onOk(v);
      }
    });
    scrim.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && input) { e.preventDefault(); scrim.querySelector('[data-ok]').click(); }
    });
  }
  function closeDialog() {
    var s = document.querySelector('.pt-scrim');
    if (s) { s.remove(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  }

  function showRejected() {
    closeDialog();
    lastFocus = document.activeElement;
    var scrim = document.createElement('div');
    scrim.className = 'pt-scrim';
    scrim.innerHTML =
      '<div class="pt-modal" role="alertdialog" aria-modal="true" aria-labelledby="pt-mt" style="width:520px">' +
        '<div class="pt-mh"><span class="pt-circle red">' + svg('alert', 24) + '</span>' +
          '<div style="flex:1"><h2 id="pt-mt">Definition not updated</h2><p>1 of 3 instances doesn’t fit the new schema. “CRM connection” is unchanged.</p></div>' +
          '<button type="button" class="pt-x" aria-label="Close" data-close>' + svg('x') + '</button></div>' +
        '<div style="padding:20px 24px 0;font-size:14px;line-height:20px">' +
          '<div style="border-radius:12px;box-shadow:inset 0 0 0 1px #E9EAEB">' +
            '<div style="display:grid;grid-template-columns:140px minmax(0,1fr);gap:12px;padding:12px 16px;font-size:12px;line-height:18px;font-weight:500;color:#535862;background:#FAFAFA;border-radius:12px 12px 0 0;box-shadow:inset 0 -1px 0 #E9EAEB"><span>Instance</span><span>Problem</span></div>' +
            '<div style="display:grid;grid-template-columns:140px minmax(0,1fr);gap:12px;padding:16px"><span style="font-weight:500;color:#181D27">Salesforce US</span><span style="color:#535862">Timeout (minutes) is 1, but the new minimum is 5.</span></div>' +
          '</div>' +
          '<p style="margin:16px 0 0;color:#535862">Change the value in the instance, or adjust the schema, then try again.</p>' +
        '</div>' +
        '<div class="pt-mf"><button type="button" class="pt-btn pt-sec" data-close>Close</button><button type="button" class="pt-btn pri" data-again>Choose another file</button></div>' +
      '</div>';
    document.body.appendChild(scrim);
    scrim.querySelector('[data-again]').focus();
    scrim.addEventListener('click', function (e) {
      if (e.target === scrim || e.target.closest('[data-close]')) { closeDialog(); return; }
      if (e.target.closest('[data-again]')) location.href = 'update-definition.html';
    });
  }

  // ---------- instances ----------
  function rowFor(key) {
    var btn = document.querySelector('[data-on="t.' + key + '"]');
    return btn ? btn.closest('li') : null;
  }
  function nameOf(key) {
    var li = rowFor(key);
    var t = li && li.querySelector('.t1');
    return t ? t.textContent : key;
  }
  function updateCount() {
    var list = document.querySelector('[aria-labelledby="ins-title"] ul');
    var badge = document.querySelector('#ins-title + span');
    if (list && badge) badge.textContent = list.querySelectorAll('li:not([hidden])').length;
  }
  function selectInstance(key) {
    var li = rowFor(key);
    if (!li) return;
    state.selected = key;
    document.querySelectorAll('.ins2').forEach(function (r) {
      r.classList.toggle('on', r === li);
      var b = r.querySelector('.nm2');
      if (b) { if (r === li) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }
    });
    var title = document.getElementById('ws-title');
    if (title) title.textContent = nameOf(key);
  }
  function renameInstance(key) {
    openDialog({
      title: 'Rename instance', icon: 'pen', input: nameOf(key), ok: 'Rename',
      onOk: function (v) {
        var li = rowFor(key);
        li.querySelector('.t1').textContent = v;
        li.querySelectorAll('[aria-label]').forEach(function (el) {
          el.setAttribute('aria-label', el.getAttribute('aria-label').replace(/for .*$/, 'for ' + v));
        });
        if (state.selected === key) document.getElementById('ws-title').textContent = v;
        toast('ok', 'Instance renamed', '“' + v + '” is the new name.');
      }
    });
  }
  function deleteInstance(key) {
    var n = nameOf(key);
    openDialog({
      title: 'Delete “' + n + '”?', icon: 'trash', kind: 'danger', ok: 'Delete',
      text: 'Its values are removed for good. Other instances of this definition are not affected.',
      onOk: function () {
        var li = rowFor(key);
        li.hidden = true;
        updateCount();
        if (state.selected === key) {
          var next = Array.prototype.find.call(document.querySelectorAll('.ins2'), function (r) { return !r.hidden; });
          if (next) selectInstance(next.querySelector('[data-on^="t."]').getAttribute('data-on').slice(2));
        }
        toast('ok', 'Instance deleted', '“' + n + '” was deleted.');
      }
    });
  }

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var on = e.target.closest('[data-on]');

    // Menu items inside instance menus: Rename / Delete
    var item = e.target.closest('.moi');
    if (item && item.closest('[data-if^="m."]')) {
      var key = item.closest('[data-if]').getAttribute('data-if').slice(2);
      var label = item.textContent.trim();
      state.menu = null; render();
      if (label === 'Rename') renameInstance(key);
      else if (label === 'Delete') deleteInstance(key);
      return;
    }
    // App "More options" items
    if (item && item.closest('[data-if="appOpen"]')) {
      state.appOpen = false; render();
      var what = item.textContent.trim();
      if (what === 'Export') toast('ok', 'Application exported', 'The export file was downloaded.');
      else toast('ok', what, 'This step is not part of the prototype.');
      return;
    }

    if (on && handlers[on.getAttribute('data-on')]) {
      e.preventDefault();
      handlers[on.getAttribute('data-on')]();
      render();
      return;
    }

    // Import drop zone: the whole area (icon included) opens the file picker
    if (e.target.closest('[data-if="noFile"] [role="group"]')) { pickFile(); return; }

    // Header delete icon
    if (e.target.closest('.dbtn')) { deleteInstance(state.selected); return; }

    // Select instance from the list
    var nm = e.target.closest('.nm2');
    if (nm) {
      var trig = nm.parentNode.querySelector('[data-on^="t."]');
      if (trig) selectInstance(trig.getAttribute('data-on').slice(2));
      return;
    }

    // Definition tabs (visual switch)
    var tab = e.target.closest('[role="tab"]');
    if (tab) {
      tab.parentNode.querySelectorAll('[role="tab"]').forEach(function (t) {
        var sel = t === tab;
        t.classList.toggle('on', sel);
        t.setAttribute('aria-selected', sel ? 'true' : 'false');
      });
      return;
    }

    // Section links in the workspace
    var anc = e.target.closest('.anc a');
    if (anc) {
      e.preventDefault();
      anc.parentNode.querySelectorAll('a').forEach(function (a) { a.classList.toggle('on', a === anc); });
      var target = document.querySelector(anc.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Page header buttons
    var b = e.target.closest('button');
    if (b && !b.disabled) {
      var txt = b.textContent.trim();
      if (txt === 'Save') { toast('ok', 'Changes saved', 'Your settings for “' + nameOf(state.selected) + '” were saved.'); return; }
      if (txt === 'Reset changes') { toast('ok', 'Changes reset', 'All unsaved changes were discarded.'); return; }
      if (txt === 'Create instance') {
        openDialog({ title: 'Create instance', icon: 'pen', input: 'New instance', ok: 'Create',
          onOk: function (v) { toast('ok', 'Instance created', '“' + v + '” was added. (Not added to the list in this prototype.)'); } });
        return;
      }
    }
  });

  // Import panel: submit
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'imp-form') return;
    e.preventDefault();
    if (document.body.getAttribute('data-screen') === 'import-ready' && state.hasFile && state.fileOk !== false) {
      location.href = 'settings.html?toast=imported';
    } else {
      location.href = 'import-definition-errors.html';
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (document.querySelector('.pt-scrim')) { closeDialog(); return; }
    if (state.appOpen || state.menu) { handlers.closeAll(); render(); }
  });

  // Filters: "Find a setting" and "Search instances"
  document.addEventListener('input', function (e) {
    var el = e.target;
    var q = el.value.trim().toLowerCase();
    if (el.getAttribute('aria-label') === 'Find a setting') {
      document.querySelectorAll('.row').forEach(function (r) {
        r.hidden = q !== '' && r.textContent.toLowerCase().indexOf(q) === -1;
      });
    } else if (el.getAttribute('aria-label') === 'Search instances') {
      document.querySelectorAll('.ins2').forEach(function (r) {
        if (r.hidden) return;
        r.style.display = q !== '' && r.textContent.toLowerCase().indexOf(q) === -1 ? 'none' : '';
      });
    }
  });

  // ---------- real file picker + drag and drop for the import panel ----------
    // Prototype: no system file picker. Pretend the user picked the sample schema file.
  function pickFile() {
    var n = document.body.getAttribute('data-screen') === 'update' ? 14 : 12;
    var props = {};
    for (var i = 1; i <= n; i++) props['setting' + i] = { type: 'string' };
    useFile(new File([JSON.stringify({ type: 'object', properties: props })], 'crm-connection.schema.json', { type: 'application/json' }));
  }
  var upTimer = null;
  function useFile(f) {
    var card = document.querySelector('[data-if="hasFile"]');
    if (!card) return;
    var nameEl = card.querySelector('span[style*="text-overflow"]');
    var stEl = card.querySelector('span[style*="#067647"]') || card.querySelector('[data-st]');
    if (stEl) stEl.setAttribute('data-st', '');
    if (nameEl) nameEl.textContent = f.name;
    function status(ok, msg) {
      if (!stEl) return;
      stEl.style.color = ok ? '#067647' : '#B42318';
      stEl.innerHTML = '<span>' + esc(msg) + '</span>';
    }
    var up = document.querySelector('[data-up-bar]');
    var upName = document.querySelector('[data-up-name]');
    var upPct = document.querySelector('[data-up-pct]');
    var upMsg = document.querySelector('[data-up-msg]');
    if (upName) upName.textContent = f.name;
    var result = null;
    if (!/\.json$/i.test(f.name)) result = { ok: false, msg: 'Unsupported file type. Choose a .json file.' };
    else {
      var r = new FileReader();
      r.onload = function () {
        try {
          var j = JSON.parse(r.result);
          var n = j && j.properties ? Object.keys(j.properties).length : 0;
          result = { ok: true, msg: 'Valid JSON Schema' + (n ? ' · ' + n + ' settings' : '') };
        } catch (e) { result = { ok: false, msg: 'This file isn’t valid JSON.' }; }
      };
      r.readAsText(f);
    }
    state.ownFile = true;
    clearInterval(upTimer);
    state.uploading = true; state.hasFile = false; render();
    var pct = 0;
    upTimer = setInterval(function () {
      pct = Math.min(100, pct + 6);
      if (up) up.style.width = pct + '%';
      if (upPct) upPct.textContent = pct + '%';
      if (upMsg) upMsg.textContent = pct < 100 ? 'Uploading…' : 'Checking the schema…';
      if (pct >= 100 && result) {
        clearInterval(upTimer);
        setTimeout(function () {
          state.uploading = false; state.hasFile = true; state.fileOk = result.ok;
          status(result.ok, result.msg); render();
        }, 400);
      }
    }, 90);
  }
  document.addEventListener('dragover', function (e) {
    if (document.querySelector('[data-if="noFile"]')) e.preventDefault();
  });
  document.addEventListener('drop', function (e) {
    if (!document.querySelector('[data-if="noFile"]')) return;
    e.preventDefault();
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) useFile(f);
  });

  document.addEventListener('DOMContentLoaded', function () {
    render();
    document.querySelectorAll('form').forEach(function (f) { f.noValidate = true; });
    var q = new URLSearchParams(location.search);
    if (q.get('toast') === 'update-rejected') {
      toast('bad', 'Definition not updated', '1 of 3 instances doesn’t fit the new schema. “CRM connection” is unchanged.', { label: 'Read more', fn: showRejected });
      history.replaceState(null, '', location.pathname);
    }
    if (q.get('toast') === 'updated') {
      toast('ok', 'Definition updated', '“CRM connection” uses the new schema. All 3 instances still fit.');
      history.replaceState(null, '', location.pathname);
    }
    if (q.get('toast') === 'exported') {
      toast('ok', 'Definition exported', 'The JSON Schema file was downloaded.');
      history.replaceState(null, '', location.pathname);
    }
    if (/[?&]toast=imported/.test(location.search)) {
      toast('ok', 'Definition imported', '“CRM connection” is now a tab on this page.');
      history.replaceState(null, '', location.pathname);
    }
  });
})();
