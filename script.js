/* J-HenoTech · script commun à toutes les pages */
(function () {
  var root = document.documentElement, K = 'jh-atelier-';
  function get(k) { try { return localStorage.getItem(K + k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(K + k, v); } catch (e) {} }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }

  /* ---------- Paramètres : ambiance et son ---------- */
  function apply() {
    var m = get('mode') || 'jour', s = get('sound') || '1';
    root.dataset.mode = m;
    $$('#mode button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === m); });
    $$('#sound button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === s); });
  }
  $$('#mode button').forEach(function (b) { b.onclick = function () { set('mode', b.dataset.v); apply(); }; });
  $$('#sound button').forEach(function (b) { b.onclick = function () { set('sound', b.dataset.v); apply(); }; });
  apply();

  /* ---------- Menu (tiroir) ---------- */
  var drawer = $('#drawer'), scrim = $('#scrim');
  function openMenu(v) { if (!drawer) return; drawer.classList.toggle('open', v); scrim.classList.toggle('open', v); }
  $$('[data-open-menu]').forEach(function (b) { b.onclick = function () { openMenu(true); }; });
  if ($('#close')) $('#close').onclick = function () { openMenu(false); };
  if (scrim) scrim.onclick = function () { openMenu(false); };
  if (drawer) $$('nav a', drawer).forEach(function (a) { a.addEventListener('click', function () { openMenu(false); }); });

  /* ---------- Barre de navigation : page active ---------- */
  var page = document.body.dataset.page;
  $$('.dock a[data-p]').forEach(function (a) { a.classList.toggle('on', a.dataset.p === page); });
  $$('.drawer nav a[data-p]').forEach(function (a) { if (a.dataset.p === page) a.setAttribute('aria-current', 'page'); });

  /* ---------- Agrandissement des images ---------- */
  var lb = $('#lightbox');
  if (lb) {
    var group = [], idx = 0, img = $('img', lb), cap = $('p', lb);
    function show(i) { idx = (i + group.length) % group.length; var a = group[idx]; img.src = a.href; img.alt = a.dataset.caption || ''; cap.textContent = a.dataset.caption || ''; }
    $$('[data-lightbox]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        group = $$('[data-lightbox="' + a.dataset.lightbox + '"]');
        show(group.indexOf(a)); lb.classList.add('open');
      });
    });
    $('.x', lb).onclick = function () { lb.classList.remove('open'); };
    $('.prev', lb).onclick = function () { show(idx - 1); };
    $('.next', lb).onclick = function () { show(idx + 1); };
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.classList.remove('open'); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------- Zone de dessin (accueil) ---------- */
  var cv = $('#sketch');
  if (cv) {
    var ctx = cv.getContext('2d'), hint = $('#hint'), drawing = false, last = null;
    function size() {
      var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.scale(dpr, dpr);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3;
    }
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener('pointerdown', function (e) { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); hint.style.opacity = 0; });
    cv.addEventListener('pointermove', function (e) {
      if (!drawing) return; var p = pos(e);
      ctx.strokeStyle = getComputedStyle(root).getPropertyValue('--draw');
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p;
    });
    ['pointerup', 'pointercancel'].forEach(function (t) { cv.addEventListener(t, function () { drawing = false; }); });
    $('#clear').onclick = function () { ctx.clearRect(0, 0, cv.width, cv.height); hint.style.opacity = 1; };
    size(); window.addEventListener('resize', size);
  }

  /* ---------- Code qui s'écrit (accueil) ---------- */
  var codeEl = $('#code');
  if (codeEl) {
    var full = ['<span class="tg">&lt;section</span> <span class="at">class</span>=<span class="tx">"atelier"</span><span class="tg">&gt;</span>',
      '  <span class="tg">&lt;h1&gt;</span><span class="tx">Jhenoc Akpa</span><span class="tg">&lt;/h1&gt;</span>',
      '  <span class="tg">&lt;p&gt;</span><span class="tx">dessin + réparation</span>',
      '     <span class="tx">+ code + batterie</span><span class="tg">&lt;/p&gt;</span>',
      '<span class="tg">&lt;/section&gt;</span>'].join('\n');
    var total = full.replace(/<[^>]+>/g, '').replace(/&lt;|&gt;/g, 'x').length, i = 0;
    function slice(html, n) {
      var out = '', count = 0, inTag = false;
      for (var k = 0; k < html.length && count < n; k++) {
        var c = html[k];
        if (c === '<') inTag = true;
        if (inTag) { out += c; if (c === '>') inTag = false; continue; }
        if (c === '&') { var semi = html.indexOf(';', k); out += html.slice(k, semi + 1); k = semi; count++; continue; }
        out += c; count++;
      }
      var open = (out.match(/<span[^>]*>/g) || []).length - (out.match(/<\/span>/g) || []).length;
      while (open-- > 0) out += '</span>';
      return out;
    }
    (function tick() { codeEl.innerHTML = slice(full, i) + '<span class="cur"></span>'; i++; if (i > total + 25) i = 0; setTimeout(tick, i > total ? 90 : 55); })();
  }

  /* ---------- Batterie (sons synthétisés, aucun fichier audio) ---------- */
  var padsEl = $('#pads');
  if (padsEl) {
    var ac = null;
    function audio() { if (!ac) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); } if (ac.state === 'suspended') ac.resume(); return ac; }
    function noise(a, dur) { var b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = b.getChannelData(0); for (var k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1; var s = a.createBufferSource(); s.buffer = b; return s; }
    function env(a, g, v, dur) { var t = a.currentTime; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); }
    var sounds = {
      kick: function (a) { var o = a.createOscillator(), g = a.createGain(), t = a.currentTime; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + .45); env(a, g, 1, .5); o.connect(g).connect(a.destination); o.start(); o.stop(t + .5); },
      snare: function (a) { var n = noise(a, .25), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'highpass'; f.frequency.value = 1200; env(a, g, .7, .22); n.connect(f).connect(g).connect(a.destination); n.start();
        var o = a.createOscillator(), g2 = a.createGain(); o.type = 'triangle'; o.frequency.value = 190; env(a, g2, .5, .1); o.connect(g2).connect(a.destination); o.start(); o.stop(a.currentTime + .12); },
      hat: function (a) { var n = noise(a, .08), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'highpass'; f.frequency.value = 7500; env(a, g, .35, .06); n.connect(f).connect(g).connect(a.destination); n.start(); },
      tom: function (a) { var o = a.createOscillator(), g = a.createGain(), t = a.currentTime; o.frequency.setValueAtTime(230, t); o.frequency.exponentialRampToValueAtTime(110, t + .3); env(a, g, .8, .35); o.connect(g).connect(a.destination); o.start(); o.stop(t + .36); }
    };
    var btns = {};
    $$('button', padsEl).forEach(function (b) { btns[b.dataset.s] = b; b.addEventListener('pointerdown', function () { hit(b.dataset.s); }); });
    function hit(s) { var b = btns[s]; b.classList.add('hit'); setTimeout(function () { b.classList.remove('hit'); }, 110); if ((get('sound') || '1') === '1') { var a = audio(); if (a) sounds[s](a); } }
    var keys = { q: 'kick', s: 'snare', d: 'hat', f: 'tom' };
    document.addEventListener('keydown', function (e) { if (e.target.tagName === 'INPUT' || e.repeat || e.ctrlKey || e.metaKey) return; var s = keys[e.key.toLowerCase()]; if (s) hit(s); });
    var pattern = [['kick', 'hat'], ['hat'], ['snare', 'hat'], ['hat'], ['kick', 'hat'], ['kick', 'hat'], ['snare', 'hat'], ['hat', 'tom']];
    var steps = $$('#steps i'), timer = null, st = 0, play = $('#play');
    play.onclick = function () {
      if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Rythme'; steps.forEach(function (x) { x.classList.remove('on'); }); return; }
      st = 0; play.textContent = '■ Stop';
      timer = setInterval(function () { steps.forEach(function (x, k) { x.classList.toggle('on', k === st); }); pattern[st].forEach(hit); st = (st + 1) % 8; }, 280);
    };
  }

  /* ---------- Disponibilités : statut en direct (heure de Paris) ---------- */
  var statusEl = $('#status');
  if (statusEl) {
    /* HORAIRES : modifier ici. Jours : 1 = lundi … 7 = dimanche. Heures au format 24 h. */
    var HORAIRES = { 1: [17, 21], 2: [17, 21], 3: [17, 21], 4: [17, 21], 5: [17, 21] };
    var NOMS = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    function parisNow() {
      var p = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
      var map = { 'lun.': 1, 'mar.': 2, 'mer.': 3, 'jeu.': 4, 'ven.': 5, 'sam.': 6, 'dim.': 7 };
      return { d: map[o.weekday] || 1, h: parseInt(o.hour, 10) % 24, m: parseInt(o.minute, 10) };
    }
    function update() {
      var n = parisNow(), t = n.h + n.m / 60, today = HORAIRES[n.d], txt, sub, on = false;
      if (today && t >= today[0] && t < today[1]) { on = true; txt = 'Disponible en ce moment'; sub = "jusqu'à " + today[1] + ' h, écrivez-moi !'; }
      else {
        var d = n.d, found = null;
        for (var k = 0; k < 8 && !found; k++) {
          var dd = ((n.d - 1 + k) % 7) + 1, h = HORAIRES[dd];
          if (h && (k > 0 || t < h[0])) found = { d: dd, h: h[0], k: k };
        }
        txt = 'Pas disponible pour le moment';
        sub = found ? 'Retour ' + (found.k === 0 ? "aujourd'hui" : found.k === 1 ? 'demain' : NOMS[found.d]) + ' à ' + found.h + ' h' : '';
      }
      statusEl.className = 'status ' + (on ? 'on' : 'off');
      $('b', statusEl).textContent = txt; $('.muted', statusEl).textContent = sub;
      $$('.day').forEach(function (el) { el.classList.toggle('today', +el.dataset.d === n.d); });
    }
    update(); setInterval(update, 60000);
  }

  /* ---------- Divers ---------- */
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { openMenu(false); if (lb) lb.classList.remove('open'); } });
  $$('.year').forEach(function (y) { y.textContent = new Date().getFullYear(); });
  $$('[data-print]').forEach(function (b) { b.onclick = function () { window.print(); }; });
})();
