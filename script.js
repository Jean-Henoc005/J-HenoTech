/* J-HenoTech · script commun à toutes les pages (version 3)
   Chaque partie tourne dans safe() : si une partie plante, les autres continuent de marcher. */
(function () {
  'use strict';
  var root = document.documentElement, K = 'jh-atelier-';
  function get(k) { try { return localStorage.getItem(K + k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(K + k, v); } catch (e) {} }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.error('[J-HenoTech] ' + name + ' :', e); } }

  var drawer = $('#drawer'), scrim = $('#scrim'), lb = $('#lightbox');
  function openMenu(v) {
    if (drawer) drawer.classList.toggle('open', v);
    if (scrim) scrim.classList.toggle('open', v);
  }

  /* ---------- Paramètres : ambiance et son ---------- */
  safe('paramètres', function () {
    function apply() {
      var m = get('mode') || 'jour', s = get('sound') || '1';
      root.setAttribute('data-mode', m);
      $$('#mode button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === m); });
      $$('#sound button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === s); });
    }
    $$('#mode button').forEach(function (b) { b.addEventListener('click', function () { set('mode', b.getAttribute('data-v')); apply(); }); });
    $$('#sound button').forEach(function (b) { b.addEventListener('click', function () { set('sound', b.getAttribute('data-v')); apply(); }); });
    apply();
  });

  /* ---------- Menu (tiroir) ---------- */
  safe('menu', function () {
    $$('[data-open-menu]').forEach(function (b) { b.addEventListener('click', function () { openMenu(true); }); });
    var close = $('#close');
    if (close) close.addEventListener('click', function () { openMenu(false); });
    if (scrim) scrim.addEventListener('click', function () { openMenu(false); });
    if (drawer) $$('nav a', drawer).forEach(function (a) { a.addEventListener('click', function () { openMenu(false); }); });
  });

  /* ---------- Barre de navigation : page active ---------- */
  safe('navigation', function () {
    var page = document.body.getAttribute('data-page');
    $$('.dock a[data-p]').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-p') === page); });
    $$('.drawer nav a[data-p]').forEach(function (a) { if (a.getAttribute('data-p') === page) a.setAttribute('aria-current', 'page'); });
  });

  /* ---------- Agrandissement des images ---------- */
  safe('images', function () {
    if (!lb) return;
    var group = [], idx = 0, img = $('img', lb), cap = $('p', lb);
    function show(i) {
      if (!group.length) return;
      idx = (i + group.length) % group.length;
      var a = group[idx], c = a.getAttribute('data-caption') || '';
      img.src = a.getAttribute('href'); img.alt = c; cap.textContent = c;
    }
    $$('[data-lightbox]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        group = $$('[data-lightbox="' + a.getAttribute('data-lightbox') + '"]');
        show(group.indexOf(a)); lb.classList.add('open');
      });
    });
    var x = $('.x', lb), prev = $('.prev', lb), next = $('.next', lb);
    if (x) x.addEventListener('click', function () { lb.classList.remove('open'); });
    if (prev) prev.addEventListener('click', function () { show(idx - 1); });
    if (next) next.addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.classList.remove('open'); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  });

  /* ---------- Zone de dessin (accueil) ---------- */
  safe('dessin', function () {
    var cv = $('#sketch');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), hint = $('#hint'), drawing = false, last = null;
    function size() {
      var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      if (!r.width || !r.height) return;
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3;
    }
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener('pointerdown', function (e) {
      drawing = true; last = pos(e);
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      if (hint) hint.style.opacity = 0;
    });
    cv.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.strokeStyle = getComputedStyle(root).getPropertyValue('--draw').trim() || '#ff6b35';
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { cv.addEventListener(t, function () { drawing = false; }); });
    var clear = $('#clear');
    if (clear) clear.addEventListener('click', function () { ctx.clearRect(0, 0, cv.width, cv.height); if (hint) hint.style.opacity = 1; });
    size(); window.addEventListener('resize', size);
  });

  /* ---------- Code qui s'écrit (accueil) ----------
     L'écriture elle-même est faite en CSS (style.css, « .code .ln »), comme la barre jaune de l'écran 02 :
     elle marche donc même si le JavaScript est bloqué. Ici, on la relance toutes les 14 s pour qu'elle tourne en boucle. */
  safe('code', function () {
    if (!$('#code')) return;
    setInterval(function () {
      var el = $('#code');
      if (!el || document.hidden) return;
      el.parentNode.replaceChild(el.cloneNode(true), el);
    }, 14000);
  });

  /* ---------- Batterie (sons synthétisés, aucun fichier audio) ---------- */
  safe('batterie', function () {
    var padsEl = $('#pads');
    if (!padsEl) return;
    var ac = null;
    function audio() {
      if (!ac) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    }
    function noise(a, dur) {
      var b = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0);
      for (var k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1;
      var s = a.createBufferSource(); s.buffer = b; return s;
    }
    function env(a, g, v, dur) { var t = a.currentTime; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); }
    function out(a, nodes) { for (var k = 0; k < nodes.length - 1; k++) nodes[k].connect(nodes[k + 1]); nodes[nodes.length - 1].connect(a.destination); }
    var sounds = {
      kick: function (a) { var o = a.createOscillator(), g = a.createGain(), t = a.currentTime; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.45); env(a, g, 1, 0.5); out(a, [o, g]); o.start(); o.stop(t + 0.5); },
      snare: function (a) {
        var n = noise(a, 0.25), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'highpass'; f.frequency.value = 1200; env(a, g, 0.7, 0.22); out(a, [n, f, g]); n.start();
        var o = a.createOscillator(), g2 = a.createGain(); o.type = 'triangle'; o.frequency.value = 190; env(a, g2, 0.5, 0.1); out(a, [o, g2]); o.start(); o.stop(a.currentTime + 0.12);
      },
      hat: function (a) { var n = noise(a, 0.08), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'highpass'; f.frequency.value = 7500; env(a, g, 0.35, 0.06); out(a, [n, f, g]); n.start(); },
      tom: function (a) { var o = a.createOscillator(), g = a.createGain(), t = a.currentTime; o.frequency.setValueAtTime(230, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.3); env(a, g, 0.8, 0.35); out(a, [o, g]); o.start(); o.stop(t + 0.36); }
    };
    var btns = {};
    $$('button', padsEl).forEach(function (b) {
      btns[b.getAttribute('data-s')] = b;
      b.addEventListener('pointerdown', function () { hit(b.getAttribute('data-s')); });
    });
    function hit(s) {
      var b = btns[s]; if (!b) return;
      b.classList.add('hit'); setTimeout(function () { b.classList.remove('hit'); }, 110);
      if ((get('sound') || '1') === '1') { try { var a = audio(); if (a) sounds[s](a); } catch (e) {} }
    }
    var keys = { q: 'kick', s: 'snare', d: 'hat', f: 'tom' };
    document.addEventListener('keydown', function (e) {
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !e.key) return;
      var s = keys[e.key.toLowerCase()]; if (s) hit(s);
    });
    var pattern = [['kick', 'hat'], ['hat'], ['snare', 'hat'], ['hat'], ['kick', 'hat'], ['kick', 'hat'], ['snare', 'hat'], ['hat', 'tom']];
    var steps = $$('#steps i'), timer = null, st = 0, play = $('#play');
    if (!play) return;
    play.addEventListener('click', function () {
      if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Rythme'; steps.forEach(function (x) { x.classList.remove('on'); }); return; }
      st = 0; play.textContent = '■ Stop';
      timer = setInterval(function () {
        steps.forEach(function (x, k) { x.classList.toggle('on', k === st); });
        pattern[st].forEach(hit); st = (st + 1) % 8;
      }, 280);
    });
  });

  /* ---------- Disponibilités : statut en direct (heure de Paris) ---------- */
  safe('disponibilités', function () {
    var statusEl = $('#status');
    if (!statusEl) return;
    /* HORAIRES : modifier ici. Jours : 1 = lundi … 7 = dimanche. Heures au format 24 h. */
    var HORAIRES = { 1: [17, 21], 2: [17, 21], 3: [17, 21], 4: [17, 21], 5: [17, 21] };
    var NOMS = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    function parisNow() {
      try {
        var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
        var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
        var map = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
        return { d: map[o.weekday] || 1, h: parseInt(o.hour, 10) % 24, m: parseInt(o.minute, 10) };
      } catch (e) {
        var n = new Date(); return { d: n.getDay() || 7, h: n.getHours(), m: n.getMinutes() };
      }
    }
    function update() {
      var n = parisNow(), t = n.h + n.m / 60, today = HORAIRES[n.d], txt, sub, on = false;
      if (today && t >= today[0] && t < today[1]) { on = true; txt = 'Disponible en ce moment'; sub = "jusqu'à " + today[1] + ' h, écrivez-moi !'; }
      else {
        var found = null;
        for (var k = 0; k < 8 && !found; k++) {
          var dd = ((n.d - 1 + k) % 7) + 1, h = HORAIRES[dd];
          if (h && (k > 0 || t < h[0])) found = { d: dd, h: h[0], k: k };
        }
        txt = 'Pas disponible pour le moment';
        sub = found ? 'Retour ' + (found.k === 0 ? "aujourd'hui" : found.k === 1 ? 'demain' : NOMS[found.d]) + ' à ' + found.h + ' h' : '';
      }
      statusEl.className = 'status ' + (on ? 'on' : 'off');
      var b = $('b', statusEl), m = $('.muted', statusEl);
      if (b) b.textContent = txt;
      if (m) m.textContent = sub;
      $$('.day').forEach(function (el) { el.classList.toggle('today', +el.getAttribute('data-d') === n.d); });
    }
    update(); setInterval(update, 60000);
  });

  /* ---------- Divers ---------- */
  safe('divers', function () {
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { openMenu(false); if (lb) lb.classList.remove('open'); } });
    $$('.year').forEach(function (y) { y.textContent = new Date().getFullYear(); });
    $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
  });
})();
