/*!
 * Floating Music Widget v1.0.0
 * Vanilla JS, tanpa dependensi. Memuat music-player.css otomatis.
 *
 * Pasang:
 *   <script src="https://cdn.jsdelivr.net/gh/USER/REPO@v1.0.0/music-player.js"
 *           data-src="https://example.com/lagu.mp3"
 *           data-title="Judul Lagu" data-artist="Nama Artis" defer></script>
 */
(function (window, document) {
  'use strict';

  // Cegah widget dibuat dua kali kalau script ter-load berulang
  if (window.__FMW_LOADED__ || document.getElementById('fmw-host')) { return; }
  window.__FMW_LOADED__ = true;

  var VERSION = '1.0.0';
  var STORE_KEY = 'fmw:v1';

  // document.currentScript harus dibaca sinkron (sebelum ada callback async)
  var scriptEl = document.currentScript || findScript();

  function findScript() {
    var list = document.getElementsByTagName('script');
    for (var i = list.length - 1; i >= 0; i--) {
      if (/music-player(\.min)?\.js(\?|#|$)/i.test(list[i].src || '')) { return list[i]; }
    }
    return null;
  }

  /* ------------------------------------------------------------------ *
   * Konfigurasi
   * Prioritas: data-attribute pada <script>  >  window.FMWConfig  >  default
   * ------------------------------------------------------------------ */
  var DEFAULTS = {
    src: '',
    title: 'Untitled',
    artist: '',
    cover: '',
    position: 'bottom-right',   // bottom-right | bottom-left | top-right | top-left
    offsetX: null,              // jarak dari tepi, mis. 20 atau "1.5rem"
    offsetY: null,
    zIndex: null,
    width: null,                // lebar card, default 300px
    volume: 0.35,               // 0 - 1
    autoplay: true,
    loop: true,
    initialState: 'open',       // open | minimized | closed
    mobileState: null,          // state awal khusus layar <= 480px (opsional)
    closeBehavior: 'launcher',  // launcher = tampil ikon kecil | remove = hapus total
    playOnReopen: true,         // putar lagi saat ikon musik ditekan setelah Close
    remember: 'session',        // session | local | none  (ingat minimize/close/pause)
    delay: 350,                 // jeda (ms) sebelum widget slide-in
    preload: 'metadata',
    css: 'auto',                // auto | none | URL stylesheet
    labels: {
      region: 'Pemutar musik',
      play: 'Putar',
      pause: 'Jeda',
      minimize: 'Kecilkan',
      expand: 'Perbesar',
      close: 'Tutup pemutar',
      open: 'Buka pemutar musik',
      mute: 'Matikan suara',
      unmute: 'Nyalakan suara',
      volume: 'Volume',
      seek: 'Posisi lagu',
      blocked: 'Ketuk Putar untuk mulai',
      loading: 'Memuat…',
      error: 'Musik gagal dimuat',
      playing: 'Sedang diputar',
      paused: 'Dijeda'
    }
  };

  function toBool(v, d) {
    if (v === undefined || v === null || v === '') { return d; }
    if (typeof v === 'boolean') { return v; }
    return !/^(false|0|no|off)$/i.test(String(v));
  }
  function toNum(v, d) {
    var n = parseFloat(v);
    return isNaN(n) ? d : n;
  }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function toLen(v) {
    if (v === null || v === undefined || v === '') { return null; }
    return /^-?\d+(\.\d+)?$/.test(String(v)) ? v + 'px' : String(v);
  }
  function normState(s) {
    s = String(s || '').toLowerCase();
    if (s === 'min' || s === 'minimized' || s === 'minimize') { return 'min'; }
    if (s === 'closed' || s === 'close' || s === 'hidden') { return 'closed'; }
    return 'open';
  }

  function buildConfig() {
    var c = {}, k;
    for (k in DEFAULTS) { c[k] = DEFAULTS[k]; }

    var user = window.FMWConfig;
    if (user && typeof user === 'object') {
      for (k in user) { if (k !== 'labels' && k !== 'accent') { c[k] = user[k]; } }
    }
    c.labels = {};
    for (k in DEFAULTS.labels) { c.labels[k] = DEFAULTS.labels[k]; }
    if (user && user.labels) { for (k in user.labels) { c.labels[k] = user.labels[k]; } }

    var d = (scriptEl && scriptEl.dataset) || {};
    var textKeys = ['src', 'title', 'artist', 'cover', 'position', 'initialState',
      'mobileState', 'closeBehavior', 'remember', 'css', 'preload', 'offsetX', 'offsetY', 'zIndex', 'width'];
    textKeys.forEach(function (key) {
      if (d[key] !== undefined && d[key] !== '') { c[key] = d[key]; }
    });
    if (d.volume !== undefined) { c.volume = d.volume; }
    if (d.delay !== undefined) { c.delay = d.delay; }
    ['autoplay', 'loop', 'playOnReopen'].forEach(function (key) {
      if (d[key] !== undefined) { c[key] = d[key]; }
    });

    // Normalisasi
    c.volume = clamp(toNum(c.volume, 0.35), 0, 1);
    c.delay = Math.max(0, toNum(c.delay, 350));
    c.autoplay = toBool(c.autoplay, true);
    c.loop = toBool(c.loop, true);
    c.playOnReopen = toBool(c.playOnReopen, true);
    c.closeBehavior = String(c.closeBehavior).toLowerCase() === 'remove' ? 'remove' : 'launcher';
    c.remember = /^(local|none)$/i.test(c.remember) ? String(c.remember).toLowerCase() : 'session';
    c.initialState = normState(c.initialState);
    c.mobileState = c.mobileState ? normState(c.mobileState) : null;

    var parts = String(c.position).toLowerCase().split('-');
    c.y = parts.indexOf('top') > -1 ? 'top' : 'bottom';
    c.x = parts.indexOf('left') > -1 ? 'left' : 'right';
    return c;
  }

  var cfg = buildConfig();

  if (!cfg.src) {
    console.error('[FMW] Atribut data-src (URL musik) belum diisi. Widget tidak dibuat.');
    window.__FMW_LOADED__ = false;
    return;
  }

  /* ------------------------------------------------------------------ *
   * Penyimpanan preferensi (opsional, aman jika storage diblokir)
   * ------------------------------------------------------------------ */
  function getStore() {
    try {
      if (cfg.remember === 'local') { return window.localStorage; }
      if (cfg.remember === 'session') { return window.sessionStorage; }
    } catch (e) { /* diblokir */ }
    return null;
  }
  function loadPrefs() {
    try {
      var s = getStore();
      return s ? (JSON.parse(s.getItem(STORE_KEY) || '{}') || {}) : {};
    } catch (e) { return {}; }
  }
  function savePrefs(patch) {
    try {
      var s = getStore();
      if (!s) { return; }
      var p = loadPrefs();
      for (var k in patch) { p[k] = patch[k]; }
      s.setItem(STORE_KEY, JSON.stringify(p));
    } catch (e) { /* abaikan */ }
  }

  /* ------------------------------------------------------------------ *
   * Memuat stylesheet
   * ------------------------------------------------------------------ */
  function resolveCssUrl() {
    var css = String(cfg.css || 'auto');
    if (/^(none|false)$/i.test(css)) {
      var manualLink = document.querySelector('link[data-fmw-css], link[rel~="stylesheet"][href*="music-player.css"]');
      return manualLink ? manualLink.href : null;
    }
    if (css !== 'auto') { return css; }
    if (scriptEl && scriptEl.src) {
      try {
        var u = new URL(scriptEl.src, window.location.href);
        u.pathname = u.pathname.replace(/\.js$/i, '.css');
        u.hash = '';
        return u.href;
      } catch (e) { /* lanjut ke null */ }
    }
    return null;
  }

  function ensureCss(scope, done) {
    var href = resolveCssUrl();
    if (!href) { done(true); return; }

    var link = scope.querySelector('link[data-fmw-css]');
    if (link && link.sheet) { done(true); return; }
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-fmw-css', '');
    link.addEventListener('load', function () { done(true); }, { once: true });
    link.addEventListener('error', function () {
      console.error('[FMW] Gagal memuat stylesheet: ' + href + ' (atau set data-css="none" jika CSS dipasang manual).');
      done(false);
    }, { once: true });
    scope.appendChild(link);
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else { fn(); }
  }

  onReady(init);

  /* ------------------------------------------------------------------ *
   * Util
   * ------------------------------------------------------------------ */
  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) { sec = 0; }
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function resolveRGB(color) {
    try {
      var t = document.createElement('span');
      t.style.color = color;
      if (!t.style.color) { return null; }
      t.style.display = 'none';
      document.body.appendChild(t);
      var c = getComputedStyle(t).color;
      document.body.removeChild(t);
      var m = c.match(/\d+(\.\d+)?/g);
      if (!m || m.length < 3) { return null; }
      return [Math.round(m[0]), Math.round(m[1]), Math.round(m[2])];
    } catch (e) { return null; }
  }

  var ICONS = {
    play: '<svg class="fmw-i-play" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14z"/></svg>',
    pause: '<svg class="fmw-i-pause" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="4.5" width="4" height="15" rx="1.3" fill="currentColor"/><rect x="14" y="4.5" width="4" height="15" rx="1.3" fill="currentColor"/></svg>',
    minimize: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 18h12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    expand: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    note: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="17" cy="16" r="3" fill="currentColor"/></svg>',
    vol: '<svg class="fmw-i-vol" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    muted: '<svg class="fmw-i-muted" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor"/><path d="m16 9 6 6M22 9l-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };
  var EQ = '<span class="fmw-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';

  /* ------------------------------------------------------------------ *
   * Inisialisasi
   * ------------------------------------------------------------------ */
  function init() {
    if (document.getElementById('fmw-host')) { window.__FMW_LOADED__ = true; return; }

    var prefs = loadPrefs();
    if (prefs.state === 'removed') { return; } // pengunjung pernah menutup total

    var isSmall = !!(window.matchMedia && window.matchMedia('(max-width: 480px)').matches);
    var start = (isSmall && cfg.mobileState) ? cfg.mobileState : cfg.initialState;
    if (prefs.state === 'min' || prefs.state === 'closed' || prefs.state === 'open') { start = prefs.state; }

    if (!document.body || !document.createElement('div').attachShadow) {
      console.error('[FMW] Browser ini tidak mendukung Shadow DOM; widget tidak dibuat.');
      window.__FMW_LOADED__ = false;
      return;
    }
    var host = document.createElement('div');
    host.id = 'fmw-host';
    host.style.setProperty('all', 'initial', 'important');
    host.style.setProperty('position', 'fixed', 'important');
    host.style.setProperty('inset', '0', 'important');
    host.style.setProperty('z-index', cfg.zIndex === null ? '2147483000' : String(cfg.zIndex), 'important');
    host.style.setProperty('pointer-events', 'none', 'important');
    document.body.appendChild(host);
    var shadowRoot = host.attachShadow({ mode: 'closed' });

    ensureCss(shadowRoot, function (ok) {
      if (!ok) {
        if (host.parentNode) { host.parentNode.removeChild(host); }
        window.__FMW_LOADED__ = false;
        return;
      }
      buildWidget(start, prefs, shadowRoot, host);
    });
  }

  function buildWidget(start, prefs, shadowRoot, host) {
    var L = cfg.labels;

    /* ---------- DOM ---------- */
    var root = document.createElement('div');
    root.id = 'fmw-root';
    root.className = 'fmw-root';
    root.setAttribute('data-x', cfg.x);
    root.setAttribute('data-y', cfg.y);
    root.setAttribute('data-state', 'init');
    root.setAttribute('data-playing', 'false');
    root.setAttribute('data-status', 'idle');

    root.innerHTML =
      '<div class="fmw-sr" role="status" aria-live="polite"></div>' +

      '<section class="fmw-card fmw-glass" role="region" aria-label="' + esc(L.region) + '">' +
        '<div class="fmw-top">' +
          '<div class="fmw-cover" aria-hidden="true">' + EQ + '</div>' +
          '<div class="fmw-meta">' +
            '<div class="fmw-title"></div>' +
            '<div class="fmw-sub"><span class="fmw-dot"></span><span class="fmw-subtext"></span></div>' +
          '</div>' +
          '<div class="fmw-actions">' +
            btn('fmw-ico', 'min', L.minimize, ICONS.minimize) +
            btn('fmw-ico', 'close', L.close, ICONS.close) +
          '</div>' +
        '</div>' +
        '<div class="fmw-bottom">' +
          btn('fmw-play', 'toggle', L.play, ICONS.play + ICONS.pause) +
          '<div class="fmw-prog">' +
            '<input class="fmw-range fmw-seek" type="range" min="0" max="1000" step="1" value="0" disabled aria-label="' + esc(L.seek) + '">' +
            '<div class="fmw-times"><span class="fmw-cur">0:00</span><span class="fmw-dur">-:--</span></div>' +
          '</div>' +
          '<div class="fmw-vol">' +
            btn('fmw-ico', 'mute', L.mute, ICONS.vol + ICONS.muted) +
            '<input class="fmw-range fmw-volume" type="range" min="0" max="100" step="1" value="35" aria-label="' + esc(L.volume) + '">' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<div class="fmw-mini fmw-glass" role="region" aria-label="' + esc(L.region) + '">' +
        btn('fmw-play', 'toggle', L.play, ICONS.play + ICONS.pause) +
        EQ +
        btn('fmw-ico', 'expand', L.expand, ICONS.expand) +
        btn('fmw-ico', 'close', L.close, ICONS.close) +
      '</div>' +

      '<button type="button" class="fmw-launch fmw-glass" data-fmw="open" aria-label="' + esc(L.open) + '" title="' + esc(L.open) + '">' + ICONS.note + '</button>';

    function esc(s) {
      return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function btn(cls, action, label, inner) {
      return '<button type="button" class="fmw-btn ' + cls + '" data-fmw="' + action + '" aria-label="' + esc(label) + '" title="' + esc(label) + '">' + inner + '</button>';
    }

    // Referensi elemen
    var $ = function (sel) { return root.querySelector(sel); };
    var srEl = $('.fmw-sr');
    var titleEl = $('.fmw-title');
    var subTextEl = $('.fmw-subtext');
    var coverEl = $('.fmw-cover');
    var seek = $('.fmw-seek');
    var volEl = $('.fmw-volume');
    var curEl = $('.fmw-cur');
    var durEl = $('.fmw-dur');
    var toggles = root.querySelectorAll('[data-fmw="toggle"]');
    var muteBtn = $('[data-fmw="mute"]');

    titleEl.textContent = cfg.title;
    titleEl.title = cfg.title;
    applyCover(cfg.cover);

    /* ---------- Kontras & posisi ---------- */
    shadowRoot.appendChild(root);
    var accent = getComputedStyle(root).getPropertyValue('--fmw-accent').trim();
    var rgb = resolveRGB(accent);
    if (rgb) {
      var lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
      root.style.setProperty('--fmw-ink', lum > 0.55 ? '#17141f' : '#ffffff');
    }
    var ox = toLen(cfg.offsetX), oy = toLen(cfg.offsetY), zi = toLen(cfg.zIndex), w = toLen(cfg.width);
    if (ox) { root.style.setProperty('--fmw-ox', ox); }
    if (oy) { root.style.setProperty('--fmw-oy', oy); }
    if (zi) { root.style.setProperty('--fmw-z', String(cfg.zIndex)); }
    if (w) { root.style.setProperty('--fmw-w', w); }

    /* ---------- Audio ---------- */
    var audio = new Audio();
    audio.preload = cfg.preload;
    audio.loop = cfg.loop;
    audio.volume = cfg.volume;
    audio.src = cfg.src;

    // iOS Safari mengabaikan audio.volume → sembunyikan slider volume bila tidak didukung
    if (Math.abs(audio.volume - cfg.volume) > 0.01) { root.setAttribute('data-novol', 'true'); }

    var state = 'init';
    var playing = false;
    var status = 'idle';
    var dragging = false;
    var destroyed = false;
    var timers = [];

    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

    /* ---------- Render ---------- */
    function announce(msg) { srEl.textContent = ''; later(function () { srEl.textContent = msg; }, 30); }

    function renderSub() {
      var text;
      if (status === 'blocked') { text = L.blocked; }
      else if (status === 'loading') { text = L.loading; }
      else if (status === 'error') { text = L.error; }
      else { text = cfg.artist || (playing ? L.playing : L.paused); }
      subTextEl.textContent = text;
    }
    function setStatus(s) {
      status = s;
      root.setAttribute('data-status', s);
      root.setAttribute('data-attn', s === 'blocked' ? 'true' : 'false');
      renderSub();
    }
    function renderPlaying() {
      root.setAttribute('data-playing', playing ? 'true' : 'false');
      var label = playing ? L.pause : L.play;
      for (var i = 0; i < toggles.length; i++) {
        toggles[i].setAttribute('aria-label', label);
        toggles[i].title = label;
      }
      renderSub();
    }
    function setFill(r) {
      var min = parseFloat(r.min) || 0, max = parseFloat(r.max) || 100;
      r.style.setProperty('--fmw-fill', ((r.value - min) / (max - min)) * 100 + '%');
    }
    function renderTime() {
      if (dragging) { return; }
      var d = audio.duration, t = audio.currentTime || 0;
      curEl.textContent = fmt(t);
      seek.value = (isFinite(d) && d > 0) ? Math.round((t / d) * 1000) : 0;
      setFill(seek);
    }
    function renderDuration() {
      var d = audio.duration;
      if (isFinite(d) && d > 0) { durEl.textContent = fmt(d); seek.disabled = false; }
      else if (d === Infinity) { durEl.textContent = 'LIVE'; seek.disabled = true; }
      else { durEl.textContent = '-:--'; seek.disabled = true; }
    }
    function renderVolume() {
      var silent = audio.muted || audio.volume === 0;
      volEl.value = Math.round((audio.muted ? 0 : audio.volume) * 100);
      setFill(volEl);
      root.setAttribute('data-muted', silent ? 'true' : 'false');
      var lbl = silent ? L.unmute : L.mute;
      muteBtn.setAttribute('aria-label', lbl);
      muteBtn.title = lbl;
    }
    function applyCover(url) {
      if (url) { coverEl.style.backgroundImage = 'url("' + String(url).replace(/(["\\])/g, '\\$1') + '")'; }
      else { coverEl.style.backgroundImage = ''; }
    }

    /* ---------- State tampilan: open | min | closed ---------- */
    function setState(next, focusSel, silent) {
      state = next;
      root.setAttribute('data-state', next);
      if (!silent && (next === 'open' || next === 'min' || next === 'closed')) { savePrefs({ state: next }); }
      if (focusSel) {
        var el = $(focusSel);
        if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } }
      }
    }

    /* ---------- Kontrol audio ---------- */
    function play(byUser) {
      if (destroyed) { return; }
      if (byUser) { savePrefs({ paused: false }); }
      if (audio.error) { audio.load(); } // coba muat ulang setelah error
      var p;
      try { p = audio.play(); } catch (e) { p = Promise.reject(e); }
      if (p && typeof p.then === 'function') {
        p.then(function () { /* status diurus event "playing" */ }, function (err) {
          if (destroyed) { return; }
          var name = err && err.name;
          if (name === 'AbortError') { return; }               // dibatalkan oleh pause()/load()
          if (name === 'NotAllowedError') {                      // autoplay diblokir browser
            setStatus('blocked');
            announce(L.blocked);
          } else {
            setStatus('error');
            announce(L.error);
          }
        });
      }
    }
    function pause(byUser) {
      if (byUser) { savePrefs({ paused: true }); }
      try { audio.pause(); } catch (e) { /* abaikan */ }
    }
    function toggle() {
      if (audio.paused || audio.ended) { play(true); } else { pause(true); }
    }

    function minimize() { setState('min', '.fmw-mini [data-fmw="expand"]'); }
    function expand() { setState('open', '.fmw-card [data-fmw="toggle"]'); }

    // Close = musik BERHENTI. Minimize = musik tetap jalan.
    function close() {
      try { audio.pause(); audio.currentTime = 0; } catch (e) { /* abaikan */ }
      setStatus('idle');
      renderTime();
      clearMediaSession();
      if (cfg.closeBehavior === 'remove') {
        savePrefs({ state: 'removed' });
        setState('gone', null, true);
        later(destroy, 800);
      } else {
        setState('closed', '.fmw-launch');
      }
    }
    function open() {
      setState('open', '.fmw-card [data-fmw="toggle"]');
      if (cfg.playOnReopen) { play(true); }
    }

    function destroy() {
      if (destroyed) { return; }
      destroyed = true;
      timers.forEach(clearTimeout);
      try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch (e) { /* abaikan */ }
      clearMediaSession();
      if (host.parentNode) { host.parentNode.removeChild(host); }
      delete window.FloatingMusicWidget;
      window.__FMW_LOADED__ = false;
    }

    function setTrack(t) {
      t = t || {};
      var wasPlaying = playing;
      if (t.title !== undefined) { cfg.title = t.title; titleEl.textContent = t.title; titleEl.title = t.title; }
      if (t.artist !== undefined) { cfg.artist = t.artist; }
      if (t.cover !== undefined) { cfg.cover = t.cover; applyCover(t.cover); }
      if (t.src) {
        cfg.src = t.src;
        setStatus('idle');
        audio.src = t.src;
        audio.load();
        renderDuration();
        renderTime();
        if (wasPlaying) { play(false); }
      }
      renderSub();
    }

    /* ---------- Media Session (kontrol dari lock-screen / keyboard media) ---------- */
    function setupMediaSession() {
      if (!('mediaSession' in navigator)) { return; }
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: cfg.title,
          artist: cfg.artist,
          artwork: cfg.cover ? [{ src: cfg.cover }] : []
        });
        navigator.mediaSession.setActionHandler('play', function () { play(true); });
        navigator.mediaSession.setActionHandler('pause', function () { pause(true); });
      } catch (e) { /* abaikan */ }
    }
    function clearMediaSession() {
      if (!('mediaSession' in navigator)) { return; }
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
      } catch (e) { /* abaikan */ }
    }

    /* ---------- Event audio ---------- */
    audio.addEventListener('playing', function () {
      playing = true;
      setStatus('idle');
      renderPlaying();
      setupMediaSession();
      announce(L.playing + ': ' + cfg.title);
    });
    audio.addEventListener('pause', function () {
      playing = false;
      renderPlaying();
      if (state !== 'closed' && state !== 'gone') { announce(L.paused); }
    });
    audio.addEventListener('waiting', function () { if (!audio.paused) { setStatus('loading'); } });
    audio.addEventListener('canplay', function () { if (status === 'loading') { setStatus('idle'); } });
    audio.addEventListener('timeupdate', renderTime);
    audio.addEventListener('loadedmetadata', renderDuration);
    audio.addEventListener('durationchange', renderDuration);
    audio.addEventListener('volumechange', renderVolume);
    audio.addEventListener('ended', function () { playing = false; renderPlaying(); renderTime(); });
    audio.addEventListener('error', function () {
      playing = false;
      renderPlaying();
      setStatus('error');
      announce(L.error);
    });

    /* ---------- Event UI ---------- */
    root.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-fmw]') : null;
      if (!t || !root.contains(t)) { return; }
      switch (t.getAttribute('data-fmw')) {
        case 'toggle': toggle(); break;
        case 'min': minimize(); break;
        case 'expand': expand(); break;
        case 'close': close(); break;
        case 'open': open(); break;
        case 'mute':
          if (audio.muted || audio.volume === 0) {
            audio.muted = false;
            if (audio.volume === 0) { audio.volume = cfg.volume > 0 ? cfg.volume : 0.35; }
          } else { audio.muted = true; }
          break;
      }
    });

    seek.addEventListener('input', function () {
      dragging = true;
      var d = audio.duration;
      if (isFinite(d) && d > 0) { curEl.textContent = fmt((seek.value / 1000) * d); }
      setFill(seek);
    });
    seek.addEventListener('change', function () {
      var d = audio.duration;
      if (isFinite(d) && d > 0) { audio.currentTime = (seek.value / 1000) * d; }
      dragging = false;
    });
    volEl.addEventListener('input', function () {
      var v = volEl.value / 100;
      audio.volume = v;
      audio.muted = v === 0;
    });

    /* ---------- Pasang ke halaman ---------- */
    renderPlaying();
    renderDuration();
    renderTime();
    renderVolume();
    renderSub();

    // Tampil dengan animasi slide-in (setelah style awal terbaca browser)
    var shown = false;
    function reveal() {
      if (shown || destroyed) { return; }
      shown = true;
      setState(start, null, true);
    }
    later(function () {
      window.requestAnimationFrame(function () { window.requestAnimationFrame(reveal); });
      later(reveal, 200); // cadangan jika tab di background (rAF ditahan)
    }, cfg.delay);

    // Coba autoplay (tanpa trik; kalau diblokir, widget siap dengan tombol Play)
    if (start !== 'closed' && cfg.autoplay && !prefs.paused) {
      play(false);
    }

    /* ---------- API publik ---------- */
    window.FloatingMusicWidget = {
      version: VERSION,
      play: function () { play(true); },
      pause: function () { pause(true); },
      toggle: toggle,
      minimize: minimize,
      expand: expand,
      open: open,
      close: close,
      destroy: destroy,
      setTrack: setTrack,
      get isPlaying() { return playing; },
      get state() { return state; }
    };
  }

})(window, document);
